// OPTIONAL local alternative to `netlify dev`: runs the API and serves the built site with plain Node.
// Production runs the same app inside a Netlify Function (netlify/functions/api.mts).
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync, readFileSync } from 'node:fs'
import { createApp } from './app'

const app = createApp()
if (existsSync('dist/index.html')) {
  app.use('*', serveStatic({ root: './dist' }))
  const html = readFileSync('dist/index.html', 'utf8')
  app.get('*', (c) => c.html(html))
}
const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, (i) => console.log(`Sirnaaz (local node) on http://localhost:${i.port}`))
