// Netlify Function that runs the whole Hono API at /api/*.
// Same app as local development; no server memory is relied on between requests.
import type { Config } from '@netlify/functions'
import { createApp } from '../../server/app'

const app = createApp()

export default (req: Request) => app.fetch(req)

export const config: Config = {
  path: '/api/*',
}
