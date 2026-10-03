import { useEffect, useRef, useState } from 'react'
import { ALL_SIZES, type Category, type Product, type Size } from '../../types'
import { adminService, type ProductInput } from '../../services/adminService'
import { ApiError, uploadToSignedUrl } from '../../lib/api'
import { processPhoto, type ProcessedPhoto } from '../../lib/imageProcess'

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

type Img =
  | { key: string; kind: 'existing'; id: string; url: string }
  | { key: string; kind: 'new'; name: string; url: string; photo?: ProcessedPhoto } // no photo yet = still preparing

interface FormState {
  name: string; slug: string; price: string; salePrice: string; category: string; colour: string; fabric: string
  description: string; details: string; care: string; fit: string; deliveryInfo: string; returnInfo: string
  isActive: boolean; isNewArrival: boolean; isFeatured: boolean; isSoldOut: boolean
  sizes: Partial<Record<Size, string>> // offered sizes → stock as typed
}

function fromProduct(p?: Product): FormState {
  return {
    name: p?.name ?? '', slug: p?.slug ?? '', price: p ? String(p.price) : '', salePrice: p?.salePrice ? String(p.salePrice) : '',
    category: p?.category ?? 'pakistani-suits', colour: p?.colour ?? '', fabric: p?.fabric ?? '', description: p?.description ?? '',
    details: (p?.details ?? ['Fully stitched, ready to wear']).join('\n'), care: (p?.care ?? []).join('\n'), fit: p?.fit ?? '',
    deliveryInfo: p?.deliveryInfo ?? '', returnInfo: p?.returnInfo ?? '',
    isActive: p?.isActive ?? true, isNewArrival: p?.isNewArrival ?? true, isFeatured: p?.isFeatured ?? false, isSoldOut: p?.isSoldOut ?? false,
    sizes: p ? Object.fromEntries(p.sizes.map((s) => [s, String(p.stock[s] ?? 0)])) : { S: '0', M: '0', L: '0', XL: '0', XXL: '0', XXXL: '0' },
  }
}

export default function ProductForm({ product, onDone, onCancel }: { product?: Product; onDone: (p: Product) => void; onCancel: () => void }) {
  const [f, setF] = useState<FormState>(() => fromProduct(product))
  const [cats, setCats] = useState<Category[]>([])
  const [imgs, setImgs] = useState<Img[]>(() => (product?.imageRecords ?? []).map((r) => ({ key: r.id, kind: 'existing' as const, id: r.id, url: r.url })))
  const [primary, setPrimary] = useState<string | null>(() => product?.imageRecords?.find((r) => r.isPrimary)?.id ?? null)
  const [removed, setRemoved] = useState<string[]>([])
  const [err, setErr] = useState('')
  const [photoErrors, setPhotoErrors] = useState<string[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const dragKey = useRef<string | null>(null)
  const slugTouched = useRef(!!product)
  const savedId = useRef<string | null>(product?.id ?? null) // so a retry after a failed upload updates instead of duplicating

  useEffect(() => { adminService.categories().then(setCats).catch(() => {}) }, [])
  // revoke preview URLs on unmount
  useEffect(() => () => imgs.forEach((i) => i.kind === 'new' && URL.revokeObjectURL(i.url)), []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((x) => ({ ...x, [k]: v }))
  const effectivePrimary = primary && imgs.some((i) => i.key === primary) ? primary : imgs[0]?.key ?? null

  // Photos are prepared (rotated, resized, compressed) right after they are chosen, one at a time,
  // so a big phone photo is ready long before Save and memory use stays low on phones.
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setPhotoErrors([])
    const list = Array.from(files)
    const tiles: Img[] = list.map((file) => ({ key: crypto.randomUUID(), kind: 'new', name: file.name, url: '' }))
    setImgs((x) => [...x, ...tiles])
    for (const [i, file] of list.entries()) {
      const key = tiles[i].key
      try {
        const photo = await processPhoto(file)
        setImgs((x) => x.map((t) => (t.key === key ? { key, kind: 'new', name: file.name, url: photo.previewUrl, photo } : t)))
      } catch (e) {
        setImgs((x) => x.filter((t) => t.key !== key))
        setPhotoErrors((errs) => [...errs, (e as Error).message])
      }
    }
  }
  const move = (key: string, dir: -1 | 1) => setImgs((list) => {
    const i = list.findIndex((x) => x.key === key), j = i + dir
    if (j < 0 || j >= list.length) return list
    const out = [...list]; [out[i], out[j]] = [out[j], out[i]]; return out
  })
  const drop = (targetKey: string) => setImgs((list) => {
    const from = list.findIndex((x) => x.key === dragKey.current), to = list.findIndex((x) => x.key === targetKey)
    if (from < 0 || to < 0 || from === to) return list
    const out = [...list]; const [m] = out.splice(from, 1); out.splice(to, 0, m); return out
  })
  const remove = (img: Img) => {
    setImgs((x) => x.filter((i) => i.key !== img.key))
    if (img.kind === 'existing') setRemoved((r) => [...r, img.id])
    else URL.revokeObjectURL(img.url)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    const sizes = Object.entries(f.sizes) as [Size, string][]
    if (!f.name.trim()) return setErr('Give the product a name.')
    if (!(Number(f.price) > 0)) return setErr('Enter a price greater than ₹0.')
    if (f.salePrice && Number(f.salePrice) >= Number(f.price)) return setErr('Sale price should be lower than the regular price.')
    if (!sizes.length) return setErr('Choose at least one size.')
    if (sizes.some(([, q]) => !/^\d+$/.test(q))) return setErr('Stock for each size must be a whole number (0 or more).')
    if (imgs.some((i) => i.kind === 'new' && !i.photo)) return setErr('Please wait — photos are still being prepared.')

    const body: ProductInput = {
      name: f.name.trim(), slug: f.slug.trim(), description: f.description, details: lines(f.details), price: Math.round(Number(f.price)),
      salePrice: f.salePrice ? Math.round(Number(f.salePrice)) : null, category: f.category, colour: f.colour, fabric: f.fabric,
      care: lines(f.care), fit: f.fit, deliveryInfo: f.deliveryInfo, returnInfo: f.returnInfo,
      isActive: f.isActive, isNewArrival: f.isNewArrival, isFeatured: f.isFeatured, isSoldOut: f.isSoldOut,
      stock: Object.fromEntries(sizes.map(([s, q]) => [s, Number(q)])),
    }
    try {
      setSaving('Saving details…')
      let saved = savedId.current ? await adminService.updateProduct(savedId.current, body) : await adminService.createProduct(body)
      const pid = saved.id
      savedId.current = pid

      for (const id of removed) { setSaving('Removing photos…'); saved = await adminService.deleteImage(pid, id) }
      setRemoved([])

      // Upload new photos one by one so each gets its stored id, then apply the chosen order + primary.
      const idFor = new Map<string, string>()
      imgs.forEach((i) => i.kind === 'existing' && idFor.set(i.key, i.id))
      const newOnes = imgs.filter((i): i is Extract<Img, { kind: 'new' }> => i.kind === 'new' && !!i.photo)
      for (const [n, img] of newOnes.entries()) {
        setSaving(`Uploading photo ${n + 1} of ${newOnes.length}…`)
        const photo = img.photo!
        const { uploads: [u] } = await adminService.signImages(pid, [{ contentType: photo.type }])
        await uploadToSignedUrl(u.uploadUrl, photo.main, photo.type)
        await uploadToSignedUrl(u.thumbUploadUrl, photo.thumb, photo.type)
        saved = await adminService.finalizeImage(pid, u.key, u.thumbKey)
        const added = (saved.imageRecords ?? []).find((r) => r.url.endsWith(u.key))
        if (added) {
          idFor.set(img.key, added.id)
          setImgs((list) => list.map((x) => (x.key === img.key ? { key: x.key, kind: 'existing', id: added.id, url: added.url } : x)))
        }
      }
      const orderedIds = imgs.map((i) => idFor.get(i.key)).filter((x): x is string => !!x)
      if (orderedIds.length) {
        setSaving('Arranging photos…')
        saved = await adminService.reorderImages(pid, orderedIds)
        const primaryId = effectivePrimary ? idFor.get(effectivePrimary) : undefined
        if (primaryId) saved = await adminService.setPrimaryImage(pid, primaryId)
      }
      onDone(saved)
    } catch (e2) {
      setErr(e2 instanceof ApiError ? `${e2.message} Your details are saved — press Save again to retry the remaining photos.` : 'Could not save. Please try again.')
      setSaving(null)
    }
  }

  const L = 'text-[11px] uppercase tracking-label text-ink-soft'
  const T = (k: keyof FormState, label: string, rows = 3, hint?: string) => (
    <div className="field sm:col-span-2"><label htmlFor={`pf-${k}`}>{label}</label>
      <textarea id={`pf-${k}`} rows={rows} className="input h-auto py-3" value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} />
      {hint && <span className="text-[12px] text-ink-muted">{hint}</span>}</div>
  )

  return (
    <form onSubmit={submit} className="flex flex-col gap-8" noValidate>
      {/* ── Photos ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between"><span className={L}>Photos</span><span className="text-[12px] text-ink-muted">Drag or use arrows to reorder · ★ sets the main photo</span></div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {imgs.map((img, i) => (
            <div key={img.key} draggable onDragStart={() => (dragKey.current = img.key)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(img.key)}
              className={`group relative aspect-[3/4] overflow-hidden bg-sand ${effectivePrimary === img.key ? 'ring-2 ring-wine ring-offset-2 ring-offset-ivory' : ''}`}>
              {img.url ? <img src={img.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                : <span className="grid h-full w-full place-items-center p-2 text-center text-[11px] text-ink-soft"><span><span className="mx-auto mb-2 block h-4 w-4 animate-spin rounded-full border border-gold border-t-transparent" />Preparing photo…</span></span>}
              {effectivePrimary === img.key && <span className="absolute left-1.5 top-1.5 bg-wine px-1.5 py-0.5 text-[9.5px] uppercase tracking-label text-ivory">Main</span>}
              {img.kind === 'new' && <span className="absolute right-1.5 top-1.5 bg-ivory/90 px-1.5 py-0.5 text-[9.5px] uppercase tracking-label">New</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 text-ivory">
                <button type="button" onClick={() => move(img.key, -1)} disabled={i === 0} className="h-9 flex-1 disabled:opacity-30" aria-label="Move earlier">←</button>
                <button type="button" onClick={() => setPrimary(img.key)} className="h-9 flex-1" aria-label="Make main photo" aria-pressed={effectivePrimary === img.key}>★</button>
                <button type="button" onClick={() => move(img.key, 1)} disabled={i === imgs.length - 1} className="h-9 flex-1 disabled:opacity-30" aria-label="Move later">→</button>
                <button type="button" onClick={() => remove(img)} className="h-9 flex-1" aria-label="Remove photo">✕</button>
              </div>
            </div>
          ))}
          <label htmlFor="pf-images" className="grid aspect-[3/4] cursor-pointer place-items-center border border-dashed border-ink/30 p-2 text-center text-[12px] text-ink-soft hover:border-wine">
            <span>+ Add photos<br /><span className="text-[11px] text-ink-muted">JPG, PNG, WebP or HEIC</span></span>
            <input id="pf-images" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          </label>
        </div>
        {photoErrors.length > 0 && (
          <ul role="alert" className="flex flex-col gap-1 border-l-2 border-wine bg-sand px-3 py-2 text-[13px] text-wine">
            {photoErrors.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}
        <span className="text-[12px] text-ink-muted">Large phone photos are fine — they're resized automatically before upload.</span>
      </section>

      {/* ── Details ── */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="field sm:col-span-2"><label htmlFor="pf-name">Product name</label>
          <input id="pf-name" className="input" value={f.name} placeholder="e.g. Ayesha Embroidered Suit" onChange={(e) => { const v = e.target.value; setF((x) => ({ ...x, name: v, slug: slugTouched.current ? x.slug : slugify(v) })) }} /></div>
        <div className="field sm:col-span-2"><label htmlFor="pf-slug">Web address</label>
          <div className="flex items-center gap-1 text-[13px] text-ink-muted">/shop/<input id="pf-slug" className="input h-10" value={f.slug} onChange={(e) => { slugTouched.current = true; set('slug', slugify(e.target.value)) }} /></div></div>
        <div className="field"><label htmlFor="pf-price">Price (₹)</label><input id="pf-price" className="input" inputMode="numeric" value={f.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))} /></div>
        <div className="field"><label htmlFor="pf-sale">Sale price (₹, optional)</label><input id="pf-sale" className="input" inputMode="numeric" value={f.salePrice} onChange={(e) => set('salePrice', e.target.value.replace(/\D/g, ''))} /></div>
        <div className="field"><label htmlFor="pf-cat">Category</label>
          <select id="pf-cat" className="input" value={f.category} onChange={(e) => set('category', e.target.value)}>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select></div>
        <div className="field"><label htmlFor="pf-colour">Colour</label><input id="pf-colour" className="input" value={f.colour} onChange={(e) => set('colour', e.target.value)} /></div>
        {T('description', 'Description', 3)}
        <div className="field sm:col-span-2"><label htmlFor="pf-fabric">Fabric</label><input id="pf-fabric" className="input" value={f.fabric} onChange={(e) => set('fabric', e.target.value)} placeholder="e.g. Cotton-silk kameez · chiffon dupatta" /></div>
        {T('details', 'Product details', 3, 'One point per line, e.g. “3-piece: kameez, trousers, dupatta”.')}
        {T('care', 'Care instructions', 3, 'One instruction per line.')}
        <div className="field sm:col-span-2"><label htmlFor="pf-fit">Fit information</label><input id="pf-fit" className="input" value={f.fit} onChange={(e) => set('fit', e.target.value)} /></div>
        {T('deliveryInfo', 'Delivery information (optional)', 2, 'Leave empty to use the shop’s shipping policy.')}
        {T('returnInfo', 'Return information (optional)', 2, 'Leave empty to use the shop’s return policy.')}
      </section>

      {/* ── Sizes & stock ── */}
      <section className="flex flex-col gap-3">
        <span className={L}>Sizes & stock</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ALL_SIZES.map((s) => {
            const on = s in f.sizes
            return (
              <div key={s} className={`flex items-center gap-3 border p-3 ${on ? 'border-ink/30 bg-white/60' : 'border-line opacity-60'}`}>
                <label className="flex w-16 items-center gap-2 text-[14px] font-medium">
                  <input id={`pf-size-${s}`} type="checkbox" checked={on} className="h-4 w-4 accent-[#5C1A2B]"
                    onChange={(e) => setF((x) => { const sizes = { ...x.sizes }; if (e.target.checked) sizes[s] = '0'; else delete sizes[s]; return { ...x, sizes } })} />{s}
                </label>
                <input id={`pf-stock-${s}`} aria-label={`Stock for ${s}`} disabled={!on} inputMode="numeric" className="input h-10 min-w-0 flex-1 text-center"
                  value={f.sizes[s] ?? ''} onChange={(e) => setF((x) => ({ ...x, sizes: { ...x.sizes, [s]: e.target.value.replace(/\D/g, '') } }))} />
              </div>
            )
          })}
        </div>
        <span className="text-[12px] text-ink-muted">A size with 0 in stock shows as sold out and can’t be bought.</span>
      </section>

      {/* ── Visibility ── */}
      <section className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
        {([['isActive', 'Visible in shop'], ['isNewArrival', 'New arrival'], ['isFeatured', 'Featured'], ['isSoldOut', 'Mark whole product sold out']] as const).map(([k, l]) => (
          <label key={k} className="flex min-h-[40px] items-center gap-2.5"><input id={`pf-${k}`} type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[#5C1A2B]" />{l}</label>
        ))}
      </section>

      {err && <p role="alert" className="border-l-2 border-wine bg-sand px-3 py-2 text-[13.5px] text-wine">{err}</p>}
      <div className="sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-line bg-ivory px-6 py-4 sm:-mx-8 sm:px-8">
        <button className="btn-primary" disabled={!!saving}>{saving ?? (product ? 'Save changes' : 'Publish product')}</button>
        <button type="button" onClick={onCancel} className="btn-outline" disabled={!!saving}>Cancel</button>
      </div>
    </form>
  )
}
