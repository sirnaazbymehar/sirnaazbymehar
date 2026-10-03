import { Hono } from 'hono'
import { z } from 'zod'
import { q } from '../db/pool'
import { checkPassword, hashPassword, requireUser, type AppEnv } from '../lib/auth'
import { fail, parse } from '../lib/http'
import { addressSchema, loadOrder } from '../lib/orders'

export const accountRoutes = new Hono<AppEnv>()
accountRoutes.use('*', requireUser)

accountRoutes.get('/orders', async (c) => c.json(await loadOrder('o.user_id = $1 ORDER BY o.created_at DESC', [c.get('user').id])))

accountRoutes.get('/orders/:id', async (c) => {
  const id = c.req.param('id')
  if (!z.string().uuid().safeParse(id).success) fail(404, 'Order not found')
  const [o] = await loadOrder('o.id = $1 AND o.user_id = $2', [id, c.get('user').id])
  if (!o) fail(404, 'Order not found')
  return c.json(o)
})

// ── profile
accountRoutes.patch('/profile', async (c) => {
  const b = parse(z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().max(20) }), await c.req.json())
  await q('UPDATE users SET name = $1, phone = $2 WHERE id = $3', [b.name, b.phone, c.get('user').id])
  return c.json({ ok: true })
})

accountRoutes.post('/password', async (c) => {
  const b = parse(z.object({ current: z.string().min(1), next: z.string().min(8, 'New password must be at least 8 characters').max(200) }), await c.req.json())
  const r = await q('SELECT password_hash FROM users WHERE id = $1', [c.get('user').id])
  if (!(await checkPassword(r.rows[0].password_hash, b.current))) fail(400, 'Your current password is incorrect.')
  await q('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(b.next), c.get('user').id])
  return c.json({ ok: true })
})

// ── addresses
const addr = (r: any) => ({ id: r.id, fullName: r.full_name, mobile: r.mobile, email: '', house: r.house, address: r.address, area: r.area, city: r.city, state: r.state, pincode: r.pincode, country: r.country, isDefault: r.is_default })
const addressBody = addressSchema.omit({ email: true }).extend({ isDefault: z.boolean().default(false) })

accountRoutes.get('/addresses', async (c) => {
  const r = await q('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at', [c.get('user').id])
  return c.json(r.rows.map(addr))
})

accountRoutes.post('/addresses', async (c) => {
  const b = parse(addressBody, await c.req.json())
  const uid = c.get('user').id
  const count = (await q('SELECT count(*)::int AS n FROM addresses WHERE user_id = $1', [uid])).rows[0].n
  if (count >= 10) fail(422, 'You can save up to 10 addresses.')
  const isDefault = b.isDefault || count === 0
  if (isDefault) await q('UPDATE addresses SET is_default = false WHERE user_id = $1', [uid])
  const r = await q(`INSERT INTO addresses (user_id, full_name, mobile, house, address, area, city, state, pincode, country, is_default)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [uid, b.fullName, b.mobile, b.house, b.address, b.area, b.city, b.state, b.pincode, b.country, isDefault])
  return c.json(addr(r.rows[0]), 201)
})

accountRoutes.put('/addresses/:id', async (c) => {
  const b = parse(addressBody, await c.req.json())
  const uid = c.get('user').id
  if (b.isDefault) await q('UPDATE addresses SET is_default = false WHERE user_id = $1', [uid])
  const r = await q(`UPDATE addresses SET full_name=$3, mobile=$4, house=$5, address=$6, area=$7, city=$8, state=$9, pincode=$10, country=$11, is_default = is_default OR $12
                     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [c.req.param('id'), uid, b.fullName, b.mobile, b.house, b.address, b.area, b.city, b.state, b.pincode, b.country, b.isDefault])
  if (!r.rows[0]) fail(404, 'Address not found')
  return c.json(addr(r.rows[0]))
})

accountRoutes.delete('/addresses/:id', async (c) => {
  await q('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [c.req.param('id'), c.get('user').id])
  return c.json({ ok: true })
})

// ── wishlist
accountRoutes.get('/wishlist', async (c) => {
  const r = await q('SELECT product_id FROM wishlist WHERE user_id = $1 ORDER BY created_at', [c.get('user').id])
  return c.json(r.rows.map((x) => x.product_id))
})

accountRoutes.put('/wishlist', async (c) => {
  // merge a list of product ids (used when a guest signs in)
  const ids = parse(z.array(z.string().uuid()).max(200), await c.req.json())
  await q(`INSERT INTO wishlist (user_id, product_id) SELECT $1, p.id FROM products p WHERE p.id = ANY($2::uuid[]) ON CONFLICT DO NOTHING`, [c.get('user').id, ids])
  const r = await q('SELECT product_id FROM wishlist WHERE user_id = $1 ORDER BY created_at', [c.get('user').id])
  return c.json(r.rows.map((x) => x.product_id))
})

accountRoutes.post('/wishlist/:productId', async (c) => {
  const id = parse(z.string().uuid(), c.req.param('productId'))
  await q('INSERT INTO wishlist (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [c.get('user').id, id])
  return c.json({ ok: true })
})

accountRoutes.delete('/wishlist/:productId', async (c) => {
  await q('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [c.get('user').id, c.req.param('productId')])
  return c.json({ ok: true })
})
