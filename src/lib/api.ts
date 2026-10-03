// Thin client for the Sirnaaz API. Cookies (httpOnly) carry the session; no keys live in the browser.
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function request<T>(method: string, path: string, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<T> {
  const isForm = body instanceof FormData
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: { ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'We couldn’t reach the shop. Check your connection and try again.')
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'Something went wrong. Please try again.')
  return data as T
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown, headers?: Record<string, string>) => request<T>('POST', p, b ?? {}, headers),
  put: <T>(p: string, b?: unknown) => request<T>('PUT', p, b ?? {}),
  patch: <T>(p: string, b?: unknown) => request<T>('PATCH', p, b ?? {}),
  del: <T>(p: string) => request<T>('DELETE', p),
  upload: <T>(p: string, form: FormData) => request<T>('POST', p, form),
}

/** Step 2 of a photo upload: PUT the prepared file to the one-time Supabase Storage link (no keys involved). */
export async function uploadToSignedUrl(url: string, blob: Blob, contentType: string, attempts = 3) {
  let lastError = 'Upload failed.'
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType, 'Cache-Control': 'max-age=31536000', 'x-upsert': 'false' } })
      if (r.ok) return
      const data = await r.json().catch(() => null)
      // "already exists" on a retry means the first attempt actually succeeded
      if (r.status === 400 && /already exists|Duplicate/i.test(JSON.stringify(data))) return
      lastError = data?.message ?? `Upload failed (${r.status}).`
      if (r.status < 500) break // a rule was broken (type/size/expired link) — retrying won't help
    } catch {
      lastError = 'The connection dropped while uploading.'
    }
    await new Promise((res) => setTimeout(res, 800 * (i + 1)))
  }
  throw new ApiError(0, lastError)
}
