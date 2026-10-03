import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { env } from './env'
import { isDbUnavailable } from './db/pool'
import type { AppEnv } from './lib/auth'
import { publicRoutes } from './routes/public'
import { authRoutes } from './routes/auth'
import { accountRoutes } from './routes/account'
import { adminRoutes } from './routes/admin'

/**
 * The whole API. Stateless: every request reads what it needs from Postgres, so it runs the same in one
 * Netlify Function instance or a hundred. Nothing important is kept in memory (only a 10-second settings cache).
 */
export function createApp() {
  const app = new Hono<AppEnv>()

  app.use('/api/*', secureHeaders({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }))

  // CSRF defence: state-changing calls must come from our own site (cookies are also SameSite=Lax).
  app.use('/api/*', async (c, next) => {
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      const origin = c.req.header('origin')
      const host = c.req.header('x-forwarded-host') ?? c.req.header('host')
      const allowed = [env.publicUrl, new URL(c.req.url).origin, host && `https://${host}`, host && `http://${host}`].filter(Boolean)
      if (origin && !allowed.includes(origin)) throw new HTTPException(403, { message: 'Request blocked.' })
    }
    c.header('Cache-Control', 'no-store')
    await next()
  })

  // Netlify's local server (and possibly its CDN) re-requests a 403/404 path as …/index.html, ….html etc.
  // Those alternate paths never exist in the API, so answer them immediately and run no code a second time.
  app.use('/api/*', async (c, next) => {
    if (/(\/index\.html?|\.html?)$/.test(c.req.path)) return c.json({ error: 'Not found' }, 404)
    await next()
  })

  // Photos go straight to Supabase Storage, so API requests are always small.
  app.use('/api/*', bodyLimit({ maxSize: 200 * 1024, onError: (c) => c.json({ error: 'Request too large.' }, 413) }))

  app.get('/api/health', (c) => c.json({ ok: true }))
  app.route('/api', publicRoutes)
  app.route('/api/auth', authRoutes)
  app.route('/api/account', accountRoutes)
  app.route('/api/admin', adminRoutes)
  app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

  app.onError((err, c) => {
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
    if (isDbUnavailable(err)) {
      console.error('Database unavailable:', (err as Error).message)
      c.header('Retry-After', '15')
      return c.json({ error: 'The shop is busy or briefly unavailable. Please try again in a moment — nothing has been charged or ordered.' }, 503)
    }
    const code = (err as { code?: string }).code
    if (code === '23505') return c.json({ error: 'That already exists. Please use a different value.' }, 409)
    if (code === '23503') return c.json({ error: 'A linked item no longer exists.' }, 404)
    if (code === '23514') return c.json({ error: 'That value is not allowed.' }, 422)
    if (err instanceof SyntaxError) return c.json({ error: 'Invalid request.' }, 400)
    console.error(err)
    return c.json({ error: 'Something went wrong on our side. Please try again.' }, 500)
  })

  return app
}
