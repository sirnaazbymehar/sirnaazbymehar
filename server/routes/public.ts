import { Hono } from 'hono'
import { z } from 'zod'
import { q, tx } from '../db/pool'
import { getProduct, listProducts, toApi } from '../lib/catalog'
import { getSettings } from '../lib/settings'
import { currentUser, newToken, sha256, type AppEnv } from '../lib/auth'
import { clientIp, fail, parse, rateLimit } from '../lib/http'
import { findCoupon, loadOrder, orderInputSchema, totals } from '../lib/orders'
import { sendMail } from '../lib/mailer'
import { emailEnabled } from '../env'

export const publicRoutes = new Hono<AppEnv>()

// Public store settings, plus whether self-service password reset is available (needs an email service).
publicRoutes.get('/settings', async (c) => c.json({ ...(await getSettings()), passwordResetEnabled: emailEnabled() }))

publicRoutes.get('/categories', async (c) => {
  const r = await q('SELECT slug, name, tagline FROM categories ORDER BY sort_order')
  return c.json(r.rows)
})

publicRoutes.get('/products', async (c) => {
  c.header('Cache-Control', 'no-store')
  return c.json((await listProducts()).map((p) => toApi(p)))
})

publicRoutes.get('/products/:slug', async (c) => {
  const p = await getProduct({ slug: c.req.param('slug') })
  if (!p) fail(404, 'Product not found')
  return c.json(toApi(p!))
})

publicRoutes.post('/coupons/validate', async (c) => {
  await rateLimit(`coupon:${clientIp(c)}`, 30, 60_000)
  const { code, subtotal } = parse(z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().int().min(0) }), await c.req.json())
  const coupon = await findCoupon(code)
  if (!coupon) fail(422, 'That code isn’t valid. Check the spelling and try again.')
  if (subtotal < coupon!.min_subtotal) fail(422, `Add ₹${(coupon!.min_subtotal - subtotal).toLocaleString('en-IN')} more to use ${coupon!.code}.`)
  return c.json({ code: coupon!.code, description: coupon!.description, type: coupon!.type, value: coupon!.value, minSubtotal: coupon!.min_subtotal })
})

// ───────── Place order ─────────
// Prices, sale prices, quantities, subtotal, shipping, discount and total are all computed here from the
// database. Anything else the browser sends (prices, totals, discounts) is ignored by the schema.
class DuplicateOrder extends Error {}

publicRoutes.post('/orders', async (c) => {
  await rateLimit(`order:${clientIp(c)}`, 20, 10 * 60_000)
  const input = parse(orderInputSchema, await c.req.json())
  const settings = await getSettings()
  const user = await currentUser(c)

  // Idempotency: the browser sends the same random key if it retries (double-click, lost response,
  // flaky network). The same key never creates a second order.
  const rawKey = c.req.header('idempotency-key') ?? ''
  const idemKey = /^[A-Za-z0-9-]{16,100}$/.test(rawKey) ? sha256(rawKey) : null
  const existing = async () => {
    if (!idemKey) return null
    const r = await q<{ id: string; number: string }>(`SELECT id, number FROM orders WHERE idempotency_key = $1`, [idemKey])
    if (!r.rows[0]) return null
    // Hand back a fresh private link for the same order (only the holder of the key can do this).
    const viewToken = newToken()
    await q('UPDATE orders SET view_token_hash = $2 WHERE id = $1', [r.rows[0].id, sha256(viewToken)])
    return { ...r.rows[0], viewToken, duplicate: true }
  }
  const already = await existing()
  if (already) return c.json(already, 200)

  // Merge duplicate lines, then lock stock rows in a fixed order so concurrent orders can't deadlock.
  const lines = new Map<string, { productId: string; size: string; quantity: number }>()
  for (const i of input.items) {
    const k = `${i.productId}:${i.size}`
    lines.set(k, { ...i, quantity: (lines.get(k)?.quantity ?? 0) + i.quantity })
  }
  const ordered = [...lines.values()].sort((a, b) => `${a.productId}:${a.size}`.localeCompare(`${b.productId}:${b.size}`))

  const viewToken = newToken()
  let order
  try {
    order = await tx(async (db) => {
      const items: { productId: string; variantId: string; name: string; slug: string; size: string; quantity: number; unitPrice: number; imageUrl: string | null }[] = []
      for (const l of ordered) {
        // FOR UPDATE locks this size's stock row until the transaction ends: a second shopper buying the
        // same size waits here, then sees the reduced stock.
        const r = await db.query(
          `SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.is_sold_out, v.id AS variant_id, i.quantity,
                  (SELECT COALESCE(thumb_url, url) FROM product_images im WHERE im.product_id = p.id ORDER BY im.is_primary DESC, im.position LIMIT 1) AS image_url
           FROM products p JOIN product_variants v ON v.product_id = p.id AND v.size = $2
           JOIN inventory i ON i.variant_id = v.id
           WHERE p.id = $1 AND p.is_active FOR UPDATE OF i`, [l.productId, l.size])
        const p = r.rows[0]
        if (!p) fail(409, 'One of the pieces in your bag is no longer available. Please remove it and try again.')
        if (p.is_sold_out || p.quantity === 0) fail(409, `${p.name} in size ${l.size} has just sold out. Please remove it from your bag.`)
        if (p.quantity < l.quantity) fail(409, `Only ${p.quantity} left of ${p.name} in size ${l.size}. Please reduce the quantity.`)
        items.push({ productId: p.id, variantId: p.variant_id, name: p.name, slug: p.slug, size: l.size, quantity: l.quantity, unitPrice: p.sale_price ?? p.price, imageUrl: p.image_url })
      }

      const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0)
      let coupon = null
      if (input.couponCode) {
        coupon = await findCoupon(input.couponCode, db)
        if (!coupon) fail(422, 'That promo code isn’t valid any more. Remove it and try again.')
        if (subtotal < coupon!.min_subtotal) fail(422, `${coupon!.code} needs a subtotal of at least ₹${coupon!.min_subtotal.toLocaleString('en-IN')}.`)
      }
      const t = totals(subtotal, settings, coupon)

      if (input.paymentMethod === 'cod') {
        if (!settings.codEnabled) fail(422, 'Cash on Delivery is not available right now.')
        if (t.total > settings.codMaxOrder) fail(422, `Cash on Delivery is available on orders up to ₹${settings.codMaxOrder.toLocaleString('en-IN')}.`)
      } else if (!settings.onlinePaymentsEnabled) {
        fail(422, 'Online payment is not available yet. Please choose Cash on Delivery.')
      }

      const seq = (await db.query(`SELECT nextval('order_number_seq') AS n`)).rows[0].n
      const number = `SBM-${seq}`
      const a = input.address
      const o = await db.query(
        `INSERT INTO orders (number, user_id, view_token_hash, idempotency_key, customer_name, customer_phone, customer_email, house, address, area, city, state, pincode, country,
                             subtotal, shipping, discount, total, coupon_code, payment_method, payment_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING RETURNING id`,
        [number, user?.id ?? null, sha256(viewToken), idemKey, a.fullName, a.mobile, a.email, a.house, a.address, a.area, a.city, a.state, a.pincode, a.country,
         t.subtotal, t.shipping, t.discount, t.total, coupon?.code ?? null, input.paymentMethod, input.paymentMethod === 'cod' ? 'cod-pending' : 'pending'])
      if (!o.rows[0]) throw new DuplicateOrder() // the same request finished first in parallel → roll back this one
      const orderId = o.rows[0].id

      for (const i of items) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, product_name, product_slug, image_url, size, quantity, unit_price, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [orderId, i.productId, i.variantId, i.name, i.slug, i.imageUrl, i.size, i.quantity, i.unitPrice, i.unitPrice * i.quantity])
        // Conditional decrement: can never take stock below what is there (the CHECK (quantity >= 0) is a final backstop).
        const d = await db.query('UPDATE inventory SET quantity = quantity - $2, updated_at = now() WHERE variant_id = $1 AND quantity >= $2', [i.variantId, i.quantity])
        if (d.rowCount !== 1) fail(409, `${i.name} in size ${i.size} has just sold out. Please remove it from your bag.`)
      }
      await db.query(`INSERT INTO order_status_history (order_id, status) VALUES ($1, 'pending')`, [orderId])
      await db.query('UPDATE products SET popularity = popularity + 1 WHERE id = ANY($1::uuid[])', [items.map((i) => i.productId)])

      if (user) {
        const has = await db.query('SELECT 1 FROM addresses WHERE user_id = $1 LIMIT 1', [user.id])
        if (!has.rowCount) {
          await db.query(`INSERT INTO addresses (user_id, full_name, mobile, house, address, area, city, state, pincode, country, is_default)
                          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`, [user.id, a.fullName, a.mobile, a.house, a.address, a.area, a.city, a.state, a.pincode, a.country])
        }
      }
      return { id: orderId as string, number, total: t.total, items }
    })
  } catch (e) {
    if (e instanceof DuplicateOrder) {
      const dup = await existing()
      if (dup) return c.json(dup, 200)
    }
    throw e
  }

  // Email (OPTIONAL) is sent and awaited before replying; it never fails the order.
  const viewUrl = `${new URL(c.req.url).origin}/order/${order.id}?t=${viewToken}`
  await sendMail(input.address.email, `Your ${settings.brandName} order ${order.number}`,
    `Thank you for your order!\n\nOrder ${order.number}\n${order.items.map((i) => `${i.name} (${i.size}) × ${i.quantity}`).join('\n')}\nTotal: ₹${order.total.toLocaleString('en-IN')}\n\nView your order: ${viewUrl}\n`)

  return c.json({ id: order.id, number: order.number, viewToken }, 201)
})

/** A shopper can view an order only if it belongs to their account or they hold the order's private link token. */
publicRoutes.get('/orders/:id', async (c) => {
  const id = c.req.param('id')
  if (!z.string().uuid().safeParse(id).success) fail(404, 'Order not found')
  const token = c.req.query('t')
  const user = await currentUser(c)
  const [o] = await loadOrder(
    'o.id = $1 AND (($2::text IS NOT NULL AND o.view_token_hash = $2) OR ($3::uuid IS NOT NULL AND o.user_id = $3))',
    [id, token ? sha256(token) : null, user?.id ?? null])
  if (!o) fail(404, 'Order not found')
  return c.json(o)
})
