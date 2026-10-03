import { Hono } from 'hono'
import { z } from 'zod'
import { q, tx } from '../db/pool'
import { checkPassword, currentUser, dummyCheck, endSession, hashPassword, newToken, sha256, startSession, type AppEnv } from '../lib/auth'
import { clientIp, fail, parse, rateLimit } from '../lib/http'
import { sendMail } from '../lib/mailer'
import { emailEnabled, env } from '../env'

export const authRoutes = new Hono<AppEnv>()

const password = z.string().min(8, 'Password must be at least 8 characters').max(200)
const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(200)
const ip = clientIp

authRoutes.get('/me', async (c) => c.json({ user: await currentUser(c) }))

authRoutes.post('/register', async (c) => {
  await rateLimit(`register:${ip(c)}`, 10, 60 * 60_000)
  const b = parse(z.object({ name: z.string().trim().min(2, 'Enter your name').max(100), email, phone: z.string().trim().max(20).default(''), password }), await c.req.json())
  const exists = await q('SELECT 1 FROM users WHERE email = $1', [b.email])
  if (exists.rowCount) fail(409, 'An account with this email already exists. Try signing in instead.')
  const r = await q<{ id: string }>('INSERT INTO users (email, name, phone, password_hash) VALUES ($1,$2,$3,$4) RETURNING id', [b.email, b.name, b.phone, await hashPassword(b.password)])
  const id = r.rows[0].id
  // Link earlier guest orders placed with this email
  await q('UPDATE orders SET user_id = $1 WHERE user_id IS NULL AND customer_email = $2', [id, b.email])
  await startSession(c, 'user', id)
  return c.json({ user: { id, email: b.email, name: b.name, phone: b.phone } }, 201)
})

authRoutes.post('/login', async (c) => {
  const b = parse(z.object({ email, password: z.string().min(1).max(200) }), await c.req.json())
  await rateLimit(`login:${ip(c)}`, 20, 15 * 60_000)
  await rateLimit(`login:${b.email}`, 8, 15 * 60_000)
  const r = await q('SELECT id, email, name, phone, password_hash FROM users WHERE email = $1', [b.email])
  const u = r.rows[0]
  if (!u) { await dummyCheck(b.password); fail(401, 'Email or password is incorrect.') }
  if (!(await checkPassword(u.password_hash, b.password))) fail(401, 'Email or password is incorrect.')
  await startSession(c, 'user', u.id)
  return c.json({ user: { id: u.id, email: u.email, name: u.name, phone: u.phone } })
})

authRoutes.post('/logout', async (c) => {
  await endSession(c, 'user')
  return c.json({ ok: true })
})

authRoutes.post('/forgot', async (c) => {
  await rateLimit(`forgot:${ip(c)}`, 5, 15 * 60_000)
  const b = parse(z.object({ email }), await c.req.json())
  // Without an email service there is no safe way to deliver a reset link, so none is created.
  if (!emailEnabled()) fail(503, 'Password reset by email is not available yet. Please contact the shop and we will help you.')
  const r = await q('SELECT id, name FROM users WHERE email = $1', [b.email])
  if (r.rows[0]) {
    const token = newToken()
    await q(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '1 hour')`, [sha256(token), r.rows[0].id])
    const link = `${env.publicUrl}/reset-password?token=${token}`
    await sendMail(b.email, 'Reset your Sirnaaz by Mehar password', `Hi ${r.rows[0].name},\n\nUse this link within one hour to choose a new password:\n${link}\n\nIf you didn't ask for this, you can ignore this email.`)
  }
  // Same answer whether or not the account exists, so emails can't be probed.
  return c.json({ ok: true })
})

authRoutes.post('/reset', async (c) => {
  await rateLimit(`reset:${ip(c)}`, 10, 15 * 60_000)
  const b = parse(z.object({ token: z.string().min(20).max(200), password }), await c.req.json())
  await tx(async (db) => {
    const r = await db.query(`SELECT user_id FROM password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE`, [sha256(b.token)])
    if (!r.rows[0]) fail(400, 'This reset link has expired or was already used. Please request a new one.')
    const uid = r.rows[0].user_id
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(b.password), uid])
    await db.query('UPDATE password_resets SET used_at = now() WHERE token_hash = $1', [sha256(b.token)])
    await db.query('DELETE FROM sessions WHERE user_id = $1', [uid]) // sign out everywhere
  })
  return c.json({ ok: true })
})
