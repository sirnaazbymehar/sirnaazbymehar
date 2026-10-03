import { Hono } from 'hono'
import { z } from 'zod'
import type pg from 'pg'
import { q, tx } from '../db/pool'
import { timingSafeEqual } from 'node:crypto'
import { checkPassword, currentAdmin, dummyCheck, endSession, hashPassword, requireAdmin, sha256, startSession, type AppEnv } from '../lib/auth'
import { env } from '../env'
import { clientIp, fail, parse, rateLimit } from '../lib/http'
import { SIZES, getProduct, listProducts, toApi } from '../lib/catalog'
import { KEY_PATTERN, newImageKeys, publicUrl, removeObjects, signUpload, verifyUploaded } from '../lib/storage'
import { STORAGE_ALLOWED_TYPES, STORAGE_MAX_BYTES } from '../lib/storage-rules'
import { loadOrder } from '../lib/orders'
import { getSettings, saveSettings, settingsSchema } from '../lib/settings'

export const adminRoutes = new Hono<AppEnv>()

// ───────── Admin sign-in (the only admin routes reachable without an admin session) ─────────
adminRoutes.post('/auth/login', async (c) => {
  const b = parse(z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) }), await c.req.json())
  await rateLimit(`admin-login:${clientIp(c)}`, 10, 15 * 60_000)
  await rateLimit(`admin-login:${b.email}`, 5, 15 * 60_000)
  const r = await q('SELECT id, email, name, password_hash FROM admin_users WHERE email = $1 AND is_active', [b.email])
  const a = r.rows[0]
  if (!a) { await dummyCheck(b.password); fail(401, 'Email or password is incorrect.') }
  if (!(await checkPassword(a.password_hash, b.password))) fail(401, 'Email or password is incorrect.')
  await q('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [a.id])
  await startSession(c, 'admin', a.id)
  return c.json({ admin: { id: a.id, email: a.email, name: a.name } })
})
// ───────── First-admin setup (one time) ─────────
// Lets the owner create the first admin from the browser, without installing anything.
// Works only if ADMIN_SETUP_TOKEN is set on the server (24+ characters) AND no admin exists yet.
const setupOpen = async () => env.adminSetupToken.length >= 24 && (await q('SELECT count(*)::int AS n FROM admin_users')).rows[0].n === 0
adminRoutes.get('/setup', async (c) => c.json({ available: await setupOpen() }))
adminRoutes.post('/setup', async (c) => {
  await rateLimit(`admin-setup:${clientIp(c)}`, 5, 60 * 60_000)
  const b = parse(z.object({
    token: z.string().min(1).max(500),
    email: z.string().trim().toLowerCase().email(),
    name: z.string().trim().min(2).max(80),
    password: z.string().min(12, 'Use at least 12 characters for the admin password').max(200),
  }), await c.req.json())
  if (!(await setupOpen())) fail(409, 'Admin setup is closed — an admin account already exists. Please sign in.')
  const a = Buffer.from(sha256(b.token)), e = Buffer.from(sha256(env.adminSetupToken))
  if (!timingSafeEqual(a, e)) fail(401, 'The setup code is not correct.')
  const created = await tx(async (db) => {
    await db.query('LOCK TABLE admin_users IN EXCLUSIVE MODE') // two simultaneous setups can't both succeed
    if ((await db.query('SELECT count(*)::int AS n FROM admin_users')).rows[0].n > 0) fail(409, 'Admin setup is closed — an admin account already exists. Please sign in.')
    return (await db.query('INSERT INTO admin_users (email, name, password_hash) VALUES ($1,$2,$3) RETURNING id, email, name', [b.email, b.name, await hashPassword(b.password)])).rows[0]
  })
  await startSession(c, 'admin', created.id)
  return c.json({ admin: created }, 201)
})

adminRoutes.get('/auth/me', async (c) => c.json({ admin: await currentAdmin(c) }))
adminRoutes.post('/auth/logout', async (c) => { await endSession(c, 'admin'); return c.json({ ok: true }) })

// Everything below requires a valid admin session — checked on the server for every request.
const secured = new Hono<AppEnv>()
secured.use('*', requireAdmin)

// ───────── Dashboard ─────────
secured.get('/stats', async (c) => {
  const s = (await q(`SELECT
      count(*)::int AS orders,
      COALESCE(sum(total) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0)::int AS revenue,
      count(*) FILTER (WHERE status = 'pending')::int AS pending
    FROM orders`)).rows[0]
  const sold = (await q(`SELECT COALESCE(sum(oi.quantity),0)::int AS n FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status NOT IN ('cancelled','refunded')`)).rows[0].n
  const low = (await q(`SELECT p.id, p.name, p.slug, v.size, i.quantity FROM inventory i
      JOIN product_variants v ON v.id = i.variant_id JOIN products p ON p.id = v.product_id
      WHERE i.quantity <= 1 AND p.is_active ORDER BY i.quantity, p.name LIMIT 12`)).rows
  const recent = await loadOrder('true ORDER BY o.created_at DESC LIMIT 6', [])
  return c.json({ totalOrders: s.orders, totalRevenue: s.revenue, pendingOrders: s.pending, productsSold: sold, lowStock: low, recentOrders: recent })
})

// ───────── Products ─────────
const sizeEnum = z.enum(SIZES)
const productSchema = z.object({
  name: z.string().trim().min(2, 'Give the product a name').max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Web address can only use lower-case letters, numbers and hyphens').max(120).optional().or(z.literal('')),
  description: z.string().trim().max(3000).default(''),
  details: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  price: z.number().int('Price must be a whole number of rupees').positive('Price must be more than ₹0').max(1_000_000),
  salePrice: z.number().int().positive().max(1_000_000).nullable().default(null),
  category: z.string().trim().min(1),
  colour: z.string().trim().max(60).default(''),
  fabric: z.string().trim().max(300).default(''),
  care: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  fit: z.string().trim().max(500).default(''),
  deliveryInfo: z.string().trim().max(1000).default(''),
  returnInfo: z.string().trim().max(1000).default(''),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isSoldOut: z.boolean().default(false),
  /** Offered sizes and their stock. A size not listed is not offered. */
  stock: z.partialRecord(sizeEnum, z.number().int().min(0, 'Stock cannot be negative').max(100_000))
    .refine((s) => Object.keys(s).length > 0, 'Choose at least one size'),
}).refine((p) => p.salePrice === null || p.salePrice < p.price, { message: 'Sale price must be lower than the regular price', path: ['salePrice'] })

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 100)

async function uniqueSlug(db: pg.PoolClient, base: string, exceptId?: string) {
  let slug = base || 'product', n = 2
  while ((await db.query('SELECT 1 FROM products WHERE slug = $1 AND id IS DISTINCT FROM $2', [slug, exceptId ?? null])).rowCount) slug = `${base}-${n++}`
  return slug
}

async function writeProduct(db: pg.PoolClient, b: z.infer<typeof productSchema>, id?: string) {
  const cat = (await db.query('SELECT id FROM categories WHERE slug = $1', [b.category])).rows[0]
  if (!cat) fail(422, 'Choose a valid category')
  const slug = await uniqueSlug(db, b.slug || slugify(b.name), id)
  const vals = [b.name, slug, b.description, b.details, b.price, b.salePrice, cat.id, b.colour, b.fabric, b.care, b.fit, b.deliveryInfo, b.returnInfo, b.isFeatured, b.isNewArrival, b.isActive, b.isSoldOut]
  let pid = id
  if (id) {
    const r = await db.query(`UPDATE products SET name=$2, slug=$3, description=$4, details=$5, price=$6, sale_price=$7, category_id=$8, colour=$9, fabric=$10, care=$11, fit=$12,
                              delivery_info=$13, return_info=$14, is_featured=$15, is_new_arrival=$16, is_active=$17, is_sold_out=$18, updated_at=now() WHERE id=$1 RETURNING id`, [id, ...vals])
    if (!r.rowCount) fail(404, 'Product not found')
  } else {
    pid = (await db.query(`INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, delivery_info, return_info, is_featured, is_new_arrival, is_active, is_sold_out)
                           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`, vals)).rows[0].id
  }
  // Size-level inventory: one variant + one inventory row per offered size
  const sizes = Object.keys(b.stock)
  await db.query('DELETE FROM product_variants WHERE product_id = $1 AND NOT (size = ANY($2::text[]))', [pid, sizes])
  for (const [size, qty] of Object.entries(b.stock)) {
    const v = await db.query(`INSERT INTO product_variants (product_id, size) VALUES ($1,$2)
                              ON CONFLICT (product_id, size) DO UPDATE SET size = EXCLUDED.size RETURNING id`, [pid, size])
    await db.query(`INSERT INTO inventory (variant_id, quantity) VALUES ($1,$2)
                    ON CONFLICT (variant_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()`, [v.rows[0].id, qty])
  }
  return pid!
}

secured.get('/products', async (c) => c.json((await listProducts({ includeInactive: true })).map((p) => toApi(p, true))))
secured.get('/products/:id', async (c) => {
  const p = await getProduct({ id: parse(z.string().uuid(), c.req.param('id')) }, true)
  if (!p) fail(404, 'Product not found')
  return c.json(toApi(p!, true))
})
secured.post('/products', async (c) => {
  const b = parse(productSchema, await c.req.json())
  const id = await tx((db) => writeProduct(db, b))
  return c.json(toApi((await getProduct({ id }, true))!, true), 201)
})
secured.put('/products/:id', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const b = parse(productSchema, await c.req.json())
  await tx((db) => writeProduct(db, b, id))
  return c.json(toApi((await getProduct({ id }, true))!, true))
})
secured.delete('/products/:id', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const ordered = (await q('SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1', [id])).rowCount
  if (ordered) {
    // Keep it for order history; just hide it from customers.
    await q('UPDATE products SET is_active = false, updated_at = now() WHERE id = $1', [id])
    return c.json({ result: 'deactivated', message: 'This product has past orders, so it was hidden from the shop instead of deleted.' })
  }
  const imgs = (await q('SELECT storage_key, thumb_key FROM product_images WHERE product_id = $1', [id])).rows
  const r = await q('DELETE FROM products WHERE id = $1', [id])
  if (!r.rowCount) fail(404, 'Product not found')
  await removeObjects(imgs.flatMap((i) => [i.storage_key, i.thumb_key]))
  return c.json({ result: 'deleted' })
})

// ───────── Product images (uploaded by the browser straight to Supabase Storage) ─────────
const MAX_PHOTOS = 20

// Step 1: issue one-time signed upload links for N photos (each = main + thumbnail).
secured.post('/products/:id/images/sign', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const { files } = parse(z.object({ files: z.array(z.object({ contentType: z.enum(STORAGE_ALLOWED_TYPES) })).min(1).max(12) }), await c.req.json())
  if (!(await q('SELECT 1 FROM products WHERE id = $1', [id])).rowCount) fail(404, 'Product not found')
  const n = (await q('SELECT count(*)::int AS n FROM product_images WHERE product_id = $1', [id])).rows[0].n
  if (n + files.length > MAX_PHOTOS) fail(422, `A product can have up to ${MAX_PHOTOS} photos.`)
  const uploads = []
  for (const f of files) {
    const { key, thumbKey } = newImageKeys(id, f.contentType)
    uploads.push({ key, thumbKey, uploadUrl: await signUpload(key), thumbUploadUrl: await signUpload(thumbKey), contentType: f.contentType })
  }
  return c.json({ uploads, maxBytes: STORAGE_MAX_BYTES })
})

// Step 2: after the browser has uploaded, verify the files and record the photo.
secured.post('/products/:id/images/finalize', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const pattern = KEY_PATTERN(id)
  const { key, thumbKey } = parse(z.object({ key: z.string().regex(pattern), thumbKey: z.string().regex(pattern) }), await c.req.json())
  if (thumbKey.replace('-thumb', '') !== key) fail(422, 'Photo and thumbnail do not match.')
  if (!(await q('SELECT 1 FROM products WHERE id = $1', [id])).rowCount) fail(404, 'Product not found')
  const dupe = await q('SELECT 1 FROM product_images WHERE storage_key = $1', [key])
  if (dupe.rowCount) return c.json(toApi((await getProduct({ id }, true))!, true)) // already recorded (retry)

  for (const k of [key, thumbKey]) {
    const v = await verifyUploaded(k)
    if (!v.ok) { await removeObjects([key, thumbKey]); fail(422, v.reason) }
  }
  await tx(async (db) => {
    const cur = (await db.query('SELECT count(*)::int AS n, bool_or(is_primary) AS has_primary FROM product_images WHERE product_id = $1', [id])).rows[0]
    if (cur.n >= MAX_PHOTOS) fail(422, `A product can have up to ${MAX_PHOTOS} photos.`)
    await db.query('INSERT INTO product_images (product_id, url, storage_key, thumb_url, thumb_key, position, is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, publicUrl(key), key, publicUrl(thumbKey), thumbKey, cur.n, !cur.has_primary])
    await db.query('UPDATE products SET updated_at = now() WHERE id = $1', [id])
  })
  return c.json(toApi((await getProduct({ id }, true))!, true), 201)
})

secured.put('/products/:id/images/order', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const ids = parse(z.array(z.string().uuid()).max(50), await c.req.json())
  await tx(async (db) => {
    for (const [i, imageId] of ids.entries()) await db.query('UPDATE product_images SET position = $3 WHERE id = $1 AND product_id = $2', [imageId, id, i])
  })
  return c.json(toApi((await getProduct({ id }, true))!, true))
})

secured.post('/products/:id/images/:imageId/primary', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const imageId = parse(z.string().uuid(), c.req.param('imageId'))
  await tx(async (db) => {
    const r = await db.query('SELECT 1 FROM product_images WHERE id = $1 AND product_id = $2', [imageId, id])
    if (!r.rowCount) fail(404, 'Photo not found')
    await db.query('UPDATE product_images SET is_primary = false WHERE product_id = $1', [id])
    await db.query('UPDATE product_images SET is_primary = true WHERE id = $1', [imageId])
  })
  return c.json(toApi((await getProduct({ id }, true))!, true))
})

secured.delete('/products/:id/images/:imageId', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const imageId = parse(z.string().uuid(), c.req.param('imageId'))
  const r = await q('DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING storage_key, thumb_key, is_primary', [imageId, id])
  if (!r.rows[0]) fail(404, 'Photo not found')
  await removeObjects([r.rows[0].storage_key, r.rows[0].thumb_key])
  if (r.rows[0].is_primary) {
    await q(`UPDATE product_images SET is_primary = true WHERE id = (SELECT id FROM product_images WHERE product_id = $1 ORDER BY position LIMIT 1)`, [id])
  }
  return c.json(toApi((await getProduct({ id }, true))!, true))
})

// ───────── Orders ─────────
const STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'] as const

secured.get('/orders', async (c) => {
  const status = c.req.query('status')
  if (status && STATUSES.includes(status as never)) return c.json(await loadOrder('o.status = $1 ORDER BY o.created_at DESC', [status]))
  return c.json(await loadOrder('true ORDER BY o.created_at DESC LIMIT 500', []))
})

secured.get('/orders/:id', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const [o] = await loadOrder('o.id = $1', [id])
  if (!o) fail(404, 'Order not found')
  return c.json(o)
})

secured.patch('/orders/:id/status', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('id'))
  const { status } = parse(z.object({ status: z.enum(STATUSES) }), await c.req.json())
  await tx(async (db) => {
    const r = await db.query('SELECT status, payment_method, payment_status FROM orders WHERE id = $1 FOR UPDATE', [id])
    const o = r.rows[0]
    if (!o) fail(404, 'Order not found')
    if (o.status === status) return
    const closed = (s: string) => s === 'cancelled' || s === 'refunded'
    if (closed(o.status) && !closed(status)) fail(409, 'A cancelled or refunded order cannot be reopened. Ask the customer to place a new order.')
    // Put stock back when an order is cancelled/refunded (once).
    if (!closed(o.status) && closed(status)) {
      await db.query(`UPDATE inventory i SET quantity = i.quantity + oi.quantity, updated_at = now()
                      FROM order_items oi WHERE oi.order_id = $1 AND oi.variant_id = i.variant_id`, [id])
    }
    let pay = o.payment_status
    if (status === 'refunded') pay = 'refunded'
    else if (status === 'delivered' && o.payment_method === 'cod') pay = 'paid'
    await db.query('UPDATE orders SET status = $2, payment_status = $3, updated_at = now() WHERE id = $1', [id, status, pay])
    await db.query('INSERT INTO order_status_history (order_id, status, changed_by) VALUES ($1,$2,$3)', [id, status, c.get('admin').id])
  })
  const [o] = await loadOrder('o.id = $1', [id])
  return c.json(o)
})

// ───────── Settings ─────────
secured.get('/settings', async (c) => c.json(await getSettings()))
secured.put('/settings', async (c) => {
  const s = parse(settingsSchema, await c.req.json())
  await saveSettings(s)
  return c.json(s)
})

secured.get('/categories', async (c) => c.json((await q('SELECT slug, name, tagline FROM categories ORDER BY sort_order')).rows))

adminRoutes.route('/', secured)
