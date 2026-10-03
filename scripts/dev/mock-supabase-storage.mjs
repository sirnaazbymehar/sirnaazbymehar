// LOCAL TESTING ONLY — a small stand-in for Supabase Storage, so photo uploads can be tested without
// a Supabase account. It mimics the endpoints the site uses and the bucket rules from supabase/setup.sql:
//   POST   /storage/v1/object/upload/sign/:bucket/:path   (service-role key required) → { url }
//   PUT    /storage/v1/object/upload/sign/:bucket/:path?token=…  (one file, no overwrite, type + size limits)
//   GET    /storage/v1/object/public/:bucket/:path          (public read, Range supported)
//   DELETE /storage/v1/object/:bucket  { prefixes: [...] }  (service-role key required)
// Test hooks: POST /__mock/fail-next-upload  makes the next upload fail with 500.
//
// Run:  MOCK_SERVICE_KEY=dev-service-key node scripts/dev/mock-supabase-storage.mjs   (port 54321)
import http from 'node:http'
import { randomBytes } from 'node:crypto'

const PORT = Number(process.env.MOCK_STORAGE_PORT ?? 54321)
const SERVICE_KEY = process.env.MOCK_SERVICE_KEY ?? 'dev-service-key'
const BUCKET = { id: 'product-images', public: true, maxBytes: 10 * 1024 * 1024, types: ['image/webp', 'image/jpeg', 'image/png'] }

const objects = new Map() // key → { body: Buffer, type }
const tokens = new Map() // token → { key, expires }
let failNext = 0
const stats = { signed: 0, uploaded: 0, rejected: 0, deleted: 0 }

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-upsert, cache-control, range',
  'Access-Control-Expose-Headers': 'content-range, content-length',
}
const send = (res, status, body, headers = {}) => {
  const isBuf = Buffer.isBuffer(body)
  res.writeHead(status, { ...cors, ...(isBuf ? {} : { 'Content-Type': 'application/json' }), ...headers })
  res.end(isBuf ? body : JSON.stringify(body))
}
const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = []; let size = 0
  let tooLarge = false
  req.on('data', (c) => { size += c.length; if (size > BUCKET.maxBytes + 1024) tooLarge = true; else chunks.push(c) }) // keep reading so we can answer 413
  req.on('end', () => (tooLarge ? reject(Object.assign(new Error('too large'), { tooLarge: true })) : resolve(Buffer.concat(chunks))))
  req.on('error', reject)
})
const isService = (req) => req.headers.authorization === `Bearer ${SERVICE_KEY}`

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    const p = decodeURIComponent(url.pathname)
    if (req.method === 'OPTIONS') return send(res, 204, Buffer.alloc(0))

    if (p === '/__mock/fail-next-upload' && req.method === 'POST') { failNext++; return send(res, 200, { ok: true }) }
    if (p === '/__mock/stats') return send(res, 200, { ...stats, objects: [...objects.keys()] })

    let m = p.match(/^\/storage\/v1\/object\/upload\/sign\/([^/]+)\/(.+)$/)
    if (m && req.method === 'POST') {
      if (!isService(req)) return send(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'Invalid signature' })
      if (m[1] !== BUCKET.id) return send(res, 404, { message: 'Bucket not found' })
      const token = randomBytes(24).toString('base64url')
      tokens.set(token, { key: m[2], expires: Date.now() + 2 * 3600e3 })
      stats.signed++
      return send(res, 200, { url: `/object/upload/sign/${m[1]}/${m[2]}?token=${token}` })
    }
    if (m && req.method === 'PUT') {
      const t = tokens.get(url.searchParams.get('token') ?? '')
      if (!t || t.key !== m[2] || t.expires < Date.now()) { stats.rejected++; return send(res, 400, { statusCode: '403', error: 'Unauthorized', message: 'invalid signature' }) }
      if (failNext > 0) { failNext--; return send(res, 500, { message: 'simulated storage failure' }) }
      if (objects.has(m[2])) { stats.rejected++; return send(res, 400, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' }) }
      const type = (req.headers['content-type'] ?? '').split(';')[0].trim()
      if (!BUCKET.types.includes(type)) { stats.rejected++; return send(res, 400, { statusCode: '415', error: 'invalid_mime_type', message: `mime type ${type} is not supported` }) }
      let body
      try { body = await readBody(req) } catch (e) { stats.rejected++; return send(res, 413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' }) }
      if (body.length > BUCKET.maxBytes) { stats.rejected++; return send(res, 413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' }) }
      objects.set(m[2], { body, type })
      tokens.delete(url.searchParams.get('token'))
      stats.uploaded++
      return send(res, 200, { Key: `${m[1]}/${m[2]}` })
    }

    m = p.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
    if (m && (req.method === 'GET' || req.method === 'HEAD')) {
      const o = objects.get(m[2])
      if (!o) return send(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' })
      const range = req.headers.range?.match(/bytes=(\d+)-(\d+)/)
      const base = { 'Content-Type': o.type, 'Cache-Control': 'public, max-age=31536000', 'X-Content-Type-Options': 'nosniff' }
      if (range) {
        const s = Number(range[1]), e = Math.min(Number(range[2]), o.body.length - 1)
        return send(res, 206, o.body.subarray(s, e + 1), { ...base, 'Content-Range': `bytes ${s}-${e}/${o.body.length}` })
      }
      return send(res, 200, o.body, base)
    }

    m = p.match(/^\/storage\/v1\/object\/([^/]+)$/)
    if (m && req.method === 'DELETE') {
      if (!isService(req)) return send(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'Invalid signature' })
      const { prefixes = [] } = JSON.parse((await readBody(req)).toString() || '{}')
      const gone = prefixes.filter((k) => objects.delete(k))
      stats.deleted += gone.length
      return send(res, 200, gone.map((name) => ({ name })))
    }

    // Anything else (e.g. an attempt to upload without a signed URL) is refused, like Supabase with no policies.
    return send(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' })
  } catch (e) {
    send(res, 500, { message: String(e) })
  }
}).listen(PORT, () => console.log(`mock Supabase Storage on http://localhost:${PORT}`))
