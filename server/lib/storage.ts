// ─────────────────────────────────────────────────────────────
//  Product photos in Supabase Storage.
//
//  The browser never gets a storage key. Upload works like this:
//   1. A signed-in admin asks the server for upload links (POST /api/admin/products/:id/images/sign).
//   2. The server, using the service-role key, asks Supabase for one-time signed upload URLs for
//      fixed paths under products/<productId>/ (valid 2 hours, one file each, cannot overwrite).
//   3. The browser PUTs the already-resized photo straight to Supabase (so Netlify's 6 MB limit never applies).
//   4. The server re-checks the stored file (real JPEG/PNG/WebP bytes, size limit) before recording it.
//      Anything that fails the check is deleted.
// ─────────────────────────────────────────────────────────────
import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../env'
import { STORAGE_ALLOWED_TYPES, STORAGE_MAX_BYTES } from './storage-rules'

const api = () => `${env.supabase.url}/storage/v1`

// Official Supabase client, used only on the server. It handles both key types correctly:
// the new secret keys (sb_secret_…) and the legacy service_role key.
let _client: SupabaseClient | null = null
const bucket = () => {
  _client ??= createClient(env.supabase.url, env.supabase.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  return _client.storage.from(env.supabase.bucket)
}

export const publicUrl = (key: string) => `${api()}/object/public/${env.supabase.bucket}/${key}`

export const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }

/** Fixed, unguessable paths under the product's own folder. */
export function newImageKeys(productId: string, contentType: string) {
  const id = randomUUID()
  const ext = EXT[contentType]
  return { key: `products/${productId}/${id}.${ext}`, thumbKey: `products/${productId}/${id}-thumb.${ext}` }
}

export const KEY_PATTERN = (productId: string) =>
  new RegExp(`^products/${productId}/[0-9a-f-]{36}(-thumb)?\\.(webp|jpg|png)$`)

export async function signUpload(key: string) {
  const { data, error } = await bucket().createSignedUploadUrl(key) // one file, valid 2 hours, no overwrite
  if (error || !data) throw new Error(`Storage refused to create an upload link: ${error?.message ?? 'unknown error'}`)
  return data.signedUrl // …/storage/v1/object/upload/sign/<bucket>/<key>?token=…
}

function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}

/** Confirms the uploaded object exists, really is an allowed image, and is within the size limit. */
export async function verifyUploaded(key: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const r = await fetch(publicUrl(key), { headers: { Range: 'bytes=0-31' } })
  if (r.status === 404 || r.status === 400) return { ok: false, reason: 'The photo did not finish uploading. Please try again.' }
  if (!r.ok) throw new Error(`Storage check failed (${r.status}).`)
  const total = Number(r.headers.get('content-range')?.split('/')[1] ?? r.headers.get('content-length') ?? 0)
  const head = new Uint8Array(await r.arrayBuffer()).slice(0, 32)
  const kind = sniff(head)
  if (!kind || !(STORAGE_ALLOWED_TYPES as readonly string[]).includes(kind)) return { ok: false, reason: 'That file is not a JPEG, PNG or WebP photo.' }
  if (!total || total > STORAGE_MAX_BYTES) return { ok: false, reason: 'That photo is too large.' }
  return { ok: true }
}

export async function removeObjects(keys: string[]) {
  const list = keys.filter(Boolean)
  if (!list.length) return
  // A leftover file costs a few KB; never block the admin on it.
  await bucket().remove(list).catch(() => {})
}
