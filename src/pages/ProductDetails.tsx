import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productService } from '../services/productService'
import { useStore } from '../context/StoreContext'
import type { Size } from '../types'
import { isSoldOut, sellingPrice, sizeStock } from '../lib/product'
import { formatPrice } from '../lib/format'
import { useCatalog } from '../lib/useCatalog'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { instagramUrl, site, storesSummary } from '../config/site'
import ProductGallery from '../components/product/ProductGallery'
import SizeSelector from '../components/product/SizeSelector'
import ProductCard from '../components/product/ProductCard'
import Price from '../components/ui/Price'
import QuantityStepper from '../components/ui/QuantityStepper'
import { SectionTitle } from '../components/ui/Ornament'
import { CloseIcon, HeartIcon, InstagramIcon, PlusIcon, StoreIcon, TruckIcon } from '../components/ui/Icons'
import NotFound from './NotFound'

const sizeChart: [Size, number, number, number][] = [
  ['S', 36, 30, 40], ['M', 38, 32, 42], ['L', 40, 34, 44], ['XL', 42, 36, 46], ['XXL', 44, 38, 48], ['XXXL', 46, 40, 50],
]

export default function ProductDetails() {
  const { slug = '' } = useParams()
  useCatalog()
  const product = productService.bySlug(slug)
  const { addToCart, toggleWishlist, isWished } = useStore()
  const nav = useNavigate()
  const [size, setSize] = useState<Size | null>(null)
  const [qty, setQty] = useState(1)
  const [sizeErr, setSizeErr] = useState(false)
  const [guide, setGuide] = useState(false)
  const [open, setOpen] = useState<string | null>('Product details')

  useDocumentMeta(product ? `${product.name} — Sirnaaz by Mehar` : 'Not found — Sirnaaz by Mehar', product?.description)
  useEffect(() => { setSize(null); setQty(1); setSizeErr(false) }, [slug])

  // Structured data for Google Shopping / rich results
  useEffect(() => {
    if (!product) return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.text = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description,
      brand: { '@type': 'Brand', name: site.name }, color: product.colour, sku: product.id,
      offers: { '@type': 'Offer', priceCurrency: 'INR', price: sellingPrice(product), availability: isSoldOut(product) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' },
    })
    document.head.appendChild(el)
    return () => el.remove()
  }, [product])

  if (!product) return <NotFound />

  const soldOut = isSoldOut(product)
  const wished = isWished(product.id)
  const max = size ? sizeStock(product, size) : 10
  const cat = productService.category(product.category)
  const related = productService.related(product)

  const requireSize = () => { if (!size) { setSizeErr(true); document.getElementById('size-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false } return true }
  const onAdd = () => requireSize() && addToCart(product, size!, qty)
  const onBuy = () => { if (!requireSize()) return; addToCart(product, size!, qty, false); nav('/checkout') }

  const sections: [string, React.ReactNode][] = [
    ['Product details', <ul className="list-disc space-y-1.5 pl-5">{product.details.map((d) => <li key={d}>{d}</li>)}<li>Colour: {product.colour}</li></ul>],
    ['Fabric', <p>{product.fabric}</p>],
    ['Care instructions', <ul className="list-disc space-y-1.5 pl-5">{product.care.map((c) => <li key={c}>{c}</li>)}</ul>],
    ['Fit information', <p>{product.fit} <button onClick={() => setGuide(true)} className="text-wine underline underline-offset-4">See size guide</button></p>],
    ['Delivery', <p className="whitespace-pre-line">{product.deliveryInfo || `${site.shippingPolicy || `Delivered in ${site.shipping.estimate} across India.`} Free shipping on orders above ${formatPrice(site.shipping.freeAbove)}; otherwise a flat ${formatPrice(site.shipping.flatRate)}.${site.codEnabled ? ' Cash on Delivery available.' : ''}`}</p>],
    ['Returns', <p className="whitespace-pre-line">{product.returnInfo || site.returnPolicy || `If there's a problem with your order, email us at ${site.email} with your order number and we'll help.`}</p>],
  ]

  return (
    <>
      <div className="container-x pt-5 sm:pt-8">
        <nav className="text-[11px] uppercase tracking-label text-ink-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-ink">Home</Link><span className="mx-1.5">/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-ink">{cat?.name}</Link><span className="mx-1.5">/</span>
          <span className="text-ink-soft">{product.name}</span>
        </nav>
      </div>

      <section className="container-x grid gap-8 pb-16 pt-5 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-24 lg:pt-8">
        <div className="-mx-4 sm:mx-0 lg:sticky lg:top-36 lg:self-start"><ProductGallery product={product} /></div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] uppercase tracking-brand text-gold">{cat?.name} · {product.colour}</span>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-[34px] leading-[1.08] sm:text-[44px]">{product.name}</h1>
              <button onClick={() => toggleWishlist(product.id)} aria-pressed={wished} aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'} className={`mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line ${wished ? 'text-wine' : 'hover:text-wine'}`}><HeartIcon filled={wished} /></button>
            </div>
            <Price product={product} large />
            <span className="text-[12px] text-ink-muted">Inclusive of all taxes</span>
          </div>

          <p className="text-[15.5px] leading-relaxed text-ink-soft">{product.description}</p>

          {soldOut ? (
            <div className="flex flex-col gap-4 border border-line bg-sand/60 p-5">
              <span className="text-[12px] font-medium uppercase tracking-label text-wine">Sold out</span>
              <p className="text-[14px] text-ink-soft">This piece has sold out. Follow us on Instagram to hear first when it's restocked.</p>
              <a href={instagramUrl()} target="_blank" rel="noreferrer" className="btn-outline"><InstagramIcon width={18} />Follow @{site.instagramHandle}</a>
            </div>
          ) : (
            <>
              <div id="size-anchor" className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-label text-ink">Size{size && <span className="ml-2 normal-case tracking-normal text-ink-soft">— {size}</span>}</span>
                  <button onClick={() => setGuide(true)} className="text-[12px] text-ink-soft underline underline-offset-4 hover:text-wine">Size guide</button>
                </div>
                <SizeSelector product={product} value={size} onChange={(s) => { setSize(s); setSizeErr(false); setQty((q) => Math.min(q, sizeStock(product, s))) }} error={sizeErr} />
                {sizeErr && <span className="text-[13px] text-wine">Please select a size to continue</span>}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[11px] uppercase tracking-label text-ink">Quantity</span>
                <QuantityStepper value={qty} max={max} onChange={setQty} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={onAdd} className="btn-primary h-14">Add to cart</button>
                <button onClick={onBuy} className="btn-outline h-14">Buy now</button>
              </div>
            </>
          )}

          <ul className="grid grid-cols-1 gap-3 border-y border-line py-5 text-[13px] text-ink-soft sm:grid-cols-2">
            <li className="flex items-center gap-3"><TruckIcon className="shrink-0 text-gold" />Delivery in {site.shipping.estimate}</li>
            {site.stores.length > 0 && <li className="flex items-center gap-3"><StoreIcon className="shrink-0 text-gold" />Stores in {storesSummary()}</li>}
          </ul>

          <div className="flex flex-col">
            {sections.map(([title, body]) => (
              <div key={title} className="border-b border-line">
                <button onClick={() => setOpen(open === title ? null : title)} aria-expanded={open === title} className="flex w-full items-center justify-between py-4 text-left text-[12px] uppercase tracking-label">
                  {title}
                  <PlusIcon width={16} className={`transition-transform duration-300 ${open === title ? 'rotate-45' : ''}`} />
                </button>
                {open === title && <div className="animate-fade pb-5 text-[14.5px] leading-relaxed text-ink-soft">{body}</div>}
              </div>
            ))}
          </div>

          <a href={instagramUrl()} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[13.5px] text-ink-soft hover:text-wine">
            <InstagramIcon width={20} className="text-gold" />Questions about fit or fabric? Message us on Instagram
          </a>
        </div>
      </section>

      <section className="border-t border-line bg-sand/50 py-16 sm:py-20">
        <div className="container-x flex flex-col gap-10">
          <SectionTitle title="You May Also Like" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* mobile sticky purchase bar */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ivory/97 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] text-ink-soft">{size ? `Size ${size}` : 'Select a size'}</span>
            <span className="text-[16px] font-medium tabular-nums">{formatPrice(sellingPrice(product) * qty)}</span>
          </div>
          <button onClick={onAdd} className="btn-primary h-12 flex-1">Add to cart</button>
        </div>
      )}
      <div className="h-20 lg:hidden" aria-hidden />

      {guide && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="absolute inset-0 animate-fade bg-wine-deep/45" onClick={() => setGuide(false)} />
          <div className="relative w-full max-w-lg animate-rise bg-ivory p-6 sm:p-8">
            <button onClick={() => setGuide(false)} className="absolute right-2 top-2 grid h-11 w-11 place-items-center" aria-label="Close"><CloseIcon /></button>
            <h2 className="font-display text-[28px]">Size Guide</h2>
            <p className="mt-1 text-[13px] text-ink-soft">Body measurements in inches. Between sizes? Choose the larger one.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-center text-[14px] tabular-nums">
                <thead><tr className="border-b border-line text-[11px] uppercase tracking-label text-ink-soft">{['Size', 'Bust', 'Waist', 'Hip'].map((h) => <th key={h} className="py-2.5 font-normal">{h}</th>)}</tr></thead>
                <tbody>{sizeChart.map(([s, b, w, h]) => <tr key={s} className={`border-b border-line/70 ${size === s ? 'bg-gold-pale/50' : ''}`}><td className="py-2.5 font-medium">{s}</td><td>{b}</td><td>{w}</td><td>{h}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
