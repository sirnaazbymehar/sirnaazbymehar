// Prepares a product photo in the browser before upload, so large phone photos never fail:
//  • reads JPEG / PNG / WebP (and HEIC where the browser supports it, e.g. Safari on iPhone)
//  • applies the camera's rotation and drops hidden metadata such as GPS location
//  • makes a main photo (max 1600 px) and a small card thumbnail (max 640 px)
//  • saves as WebP, or JPEG if this browser can't make WebP
const MAIN = { w: 1600, h: 2133, quality: 0.85 }
const THUMB = { w: 640, h: 853, quality: 0.8 }
const MAX_INPUT_BYTES = 60 * 1024 * 1024
const OUTPUT_LIMIT = 9.5 * 1024 * 1024

export interface ProcessedPhoto {
  main: Blob
  thumb: Blob
  type: 'image/webp' | 'image/jpeg'
  previewUrl: string
  width: number
  height: number
}

export class PhotoError extends Error {}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  // Preferred: createImageBitmap honours EXIF rotation with imageOrientation 'from-image'.
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() }
    } catch { /* fall back to <img> */ }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    const heic = /hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type)
    throw new PhotoError(heic
      ? `“${file.name}” is an iPhone HEIC photo this browser can't open. Upload it from Safari on the iPhone, or set iPhone Camera → Formats → Most Compatible, or save it as JPEG first.`
      : `“${file.name}” couldn't be opened as a photo. Please choose a JPEG, PNG or WebP image.`)
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality))
}

async function render(src: { source: CanvasImageSource; width: number; height: number }, box: { w: number; h: number; quality: number }, type: 'image/webp' | 'image/jpeg') {
  const scale = Math.min(1, box.w / src.width, box.h / src.height)
  const w = Math.max(1, Math.round(src.width * scale)), h = Math.max(1, Math.round(src.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new PhotoError('This browser could not prepare the photo. Please try Chrome or Safari.')
  if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h) } // JPEG has no transparency
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src.source, 0, 0, w, h)
  const blob = await toBlob(canvas, type, box.quality)
  canvas.width = canvas.height = 0 // free memory on phones
  return blob
}

export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  if (file.size > MAX_INPUT_BYTES) throw new PhotoError(`“${file.name}” is larger than 60 MB. Please choose a smaller photo.`)
  if (file.type && !file.type.startsWith('image/')) throw new PhotoError(`“${file.name}” is not a photo.`)
  const src = await decode(file)
  try {
    if (src.width < 200 || src.height < 200) throw new PhotoError(`“${file.name}” is too small (${src.width}×${src.height}). Use a photo at least 600 px wide.`)
    let type: 'image/webp' | 'image/jpeg' = 'image/webp'
    let main = await render(src, MAIN, type)
    if (!main || main.type !== 'image/webp') { type = 'image/jpeg'; main = await render(src, MAIN, type) } // older Safari can't make WebP
    if (!main) throw new PhotoError(`“${file.name}” could not be prepared. Please try another photo.`)
    if (main.size > OUTPUT_LIMIT) main = await render(src, { ...MAIN, quality: 0.7 }, type)
    const thumb = await render(src, THUMB, type)
    if (!main || !thumb) throw new PhotoError(`“${file.name}” could not be prepared. Please try another photo.`)
    return { main, thumb, type, previewUrl: URL.createObjectURL(thumb), width: src.width, height: src.height }
  } finally {
    src.close()
  }
}
