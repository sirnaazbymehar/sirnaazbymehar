// Writes dist/_headers (Netlify security headers) at build time.
// The Content-Security-Policy names the exact Supabase project, so the browser may only load photos from,
// and upload photos to, your own storage. SUPABASE_URL is not a secret (it is part of every photo address).
import { writeFileSync } from 'node:fs'

let storage = 'https://*.supabase.co'
try { if (process.env.SUPABASE_URL) storage = new URL(process.env.SUPABASE_URL).origin } catch { /* keep wildcard */ }

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${storage}`,
  "font-src 'self' data:",
  `connect-src 'self' ${storage}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

writeFileSync('dist/_headers', `/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/admin/*
  X-Robots-Tag: noindex, nofollow
`)
console.log(`✓ dist/_headers written (photos allowed from ${storage})`)
