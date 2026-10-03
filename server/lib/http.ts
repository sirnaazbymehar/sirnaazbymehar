import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ZodSchema } from 'zod'
import { createHash } from 'node:crypto'
import { q } from '../db/pool'

export const fail = (status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 503, message: string): never => {
  throw new HTTPException(status, { message })
}

export function parse<T>(schema: ZodSchema<T>, data: unknown): T {
  const r = schema.safeParse(data)
  if (!r.success) {
    const i = r.error.issues[0]
    fail(422, i ? `${i.path.join('.') ? i.path.join('.') + ': ' : ''}${i.message}` : 'Invalid input')
  }
  return (r as { data: T }).data
}

/** The visitor's IP. Netlify sets x-nf-client-connection-ip itself, so it can't be spoofed by the client. */
export function clientIp(c: Context) {
  return c.req.header('x-nf-client-connection-ip')
    ?? c.req.header('x-forwarded-for')?.split(',').pop()?.trim()
    ?? 'local'
}

/**
 * Fixed-window rate limit stored in Postgres, so every function instance shares the same counters.
 * One indexed single-row upsert per call — only used on sensitive endpoints (login, register, reset,
 * orders, coupon checks), so it is never on the path of ordinary browsing.
 */
export async function rateLimit(key: string, max: number, windowMs: number) {
  const r = await q<{ count: number }>(
    `INSERT INTO rate_limits AS r (key, window_start, count) VALUES ($1, now(), 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN r.window_start < now() - ($2 || ' milliseconds')::interval THEN 1 ELSE r.count + 1 END,
       window_start = CASE WHEN r.window_start < now() - ($2 || ' milliseconds')::interval THEN now() ELSE r.window_start END
     RETURNING count`, [createHash('sha256').update(key).digest('hex'), String(windowMs)]) // keys may contain emails, so only a hash is stored
  // occasional cleanup of stale rows (≈1 in 200 calls), finished before the response is sent
  if (Math.random() < 0.005) await q(`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`).catch(() => {})
  if (r.rows[0].count > max) fail(429, 'Too many attempts. Please wait a few minutes and try again.')
}
