import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto'
import type { Context, Next } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { q } from '../db/pool'
import { fail } from './http'

// ───────── Passwords: scrypt (built into Node, no native add-ons) ─────────
// OWASP-recommended parameters: N=2^17, r=8, p=1 (≈128 MB of memory per hash), 16-byte salt, 64-byte key.
const N = 2 ** 17, R = 8, P = 1, KEYLEN = 64
const scrypt = (pw: string, salt: Buffer, n = N, r = R, p = P) =>
  new Promise<Buffer>((res, rej) => _scrypt(pw.normalize('NFKC'), salt, KEYLEN, { N: n, r, p, maxmem: 256 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))))

/** Stored as `scrypt$N$r$p$salt$hash` (base64). Parameters are stored so they can be raised later. */
export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  const key = await scrypt(pw, salt)
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function checkPassword(stored: string, pw: string) {
  const [alg, n, r, p, salt, hash] = stored.split('$')
  if (alg !== 'scrypt' || !salt || !hash) return false
  try {
    const expected = Buffer.from(hash, 'base64')
    const actual = await scrypt(pw, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p))
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch { return false }
}

// A real hash to compare against when the email doesn't exist, so login takes the same time either way.
let dummy: string | null = null
export async function dummyCheck(pw: string) {
  dummy ??= await hashPassword('timing-equaliser')
  await checkPassword(dummy, pw)
}

export const newToken = () => randomBytes(32).toString('base64url')
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

// ───────── Sessions: random token in an httpOnly cookie; only its SHA-256 is stored ─────────
const CUSTOMER_DAYS = 30
const ADMIN_HOURS = 12

/** Over HTTPS (production) cookies are Secure and use the __Host- prefix: host-only, path=/, can't be set over http. */
const isHttps = (c: Context) => new URL(c.req.url).protocol === 'https:' || c.req.header('x-forwarded-proto') === 'https'
const cookieName = (c: Context, kind: 'user' | 'admin') => `${isHttps(c) ? '__Host-' : ''}${kind === 'user' ? 'sbm_session' : 'sbm_admin'}`

export async function startSession(c: Context, kind: 'user' | 'admin', id: string) {
  const token = newToken()
  const ms = kind === 'user' ? CUSTOMER_DAYS * 864e5 : ADMIN_HOURS * 36e5
  await q(`INSERT INTO sessions (token_hash, ${kind === 'user' ? 'user_id' : 'admin_id'}, expires_at) VALUES ($1, $2, now() + ($3 || ' milliseconds')::interval)`, [sha256(token), id, String(ms)])
  // tidy up expired sessions while we're here (cheap, indexed)
  await q('DELETE FROM sessions WHERE expires_at < now()').catch(() => {})
  setCookie(c, cookieName(c, kind), token, { httpOnly: true, secure: isHttps(c), sameSite: 'Lax', path: '/', maxAge: ms / 1000 })
}

export async function endSession(c: Context, kind: 'user' | 'admin') {
  const name = cookieName(c, kind)
  const token = getCookie(c, name)
  if (token) await q('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)])
  deleteCookie(c, name, { path: '/', secure: isHttps(c) })
}

export interface SessionUser { id: string; email: string; name: string; phone: string }
export interface SessionAdmin { id: string; email: string; name: string }

export async function currentUser(c: Context): Promise<SessionUser | null> {
  const token = getCookie(c, cookieName(c, 'user'))
  if (!token) return null
  const r = await q<SessionUser>(
    `SELECT u.id, u.email, u.name, u.phone FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`, [sha256(token)])
  return r.rows[0] ?? null
}

/** Only a session row that points at admin_users counts — a customer session can never pass this. */
export async function currentAdmin(c: Context): Promise<SessionAdmin | null> {
  const token = getCookie(c, cookieName(c, 'admin'))
  if (!token) return null
  const r = await q<SessionAdmin>(
    `SELECT a.id, a.email, a.name FROM sessions s JOIN admin_users a ON a.id = s.admin_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND a.is_active`, [sha256(token)])
  return r.rows[0] ?? null
}

type Vars = { user: SessionUser; admin: SessionAdmin }
export type AppEnv = { Variables: Vars }

export async function requireUser(c: Context<AppEnv>, next: Next) {
  const u = await currentUser(c)
  if (!u) return fail(401, 'Please sign in to continue.')
  c.set('user', u)
  await next()
}

/** Guards every /api/admin/* route on the server. */
export async function requireAdmin(c: Context<AppEnv>, next: Next) {
  const a = await currentAdmin(c)
  if (!a) return fail(401, 'Admin sign-in required.')
  c.set('admin', a)
  await next()
}
