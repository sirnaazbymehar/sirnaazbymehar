// Shared limits for product photos. The browser shrinks photos well below this; the bucket enforces it too.
export const STORAGE_MAX_BYTES = 10 * 1024 * 1024
export const STORAGE_ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const
