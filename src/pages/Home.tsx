import { Link } from 'react-router-dom'
import emblem from '../assets/emblem.webp'
import logoFull from '../assets/logo-full.webp'
import { productService } from '../services/productService'
import ProductImage from '../components/product/ProductImage'
import ProductCard from '../components/product/ProductCard'
import Ornament, { SectionTitle } from '../components/ui/Ornament'
import { InstagramIcon, NeedleIcon, ShieldIcon, StoreIcon, TruckIcon } from '../components/ui/Icons'
import { instagramUrl, site } from '../config/site'
import { useCatalog } from '../lib/useCatalog'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import type { Product } from '../types'

const ARCH = 'polygon(0 100%, 0 30%, 3% 21%, 9% 13%, 18% 6.5%, 30% 2%, 40% .4%, 50% 0, 60% .4%, 70% 2%, 82% 6.5%, 91% 13%, 97% 21%, 100% 30%, 100% 100%)'

function Arch({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <Link to={`/shop/${product.slug}`} className={`group relative block ${className}`} aria-label={product.name}>
      <div className="absolute -inset-[7px] border border-gold-soft/50" style={{ clipPath: ARCH }} aria-hidden />
      <div className="relative h-full overflow-hidden" style={{ clipPath: ARCH }}>
        <ProductImage product={product} eager className="transition-transform duration-[1200ms] group-hover:scale-105" />
      </div>
    </Link>
  )
}

export default function Home() {
  useDocumentMeta('Sirnaaz by Mehar — Pakistani Suits & Ethnic Wear', 'Timeless Pakistani silhouettes, thoughtfully curated for the modern woman. Shop Pakistani suits, co-ord sets and festive wear.')
  useCatalog()
  const arrivals = productService.newArrivals(8)
  // Featured pieces lead the hero; products with photos are preferred everywhere.
  const withPhotosFirst = (list: Product[]) => [...list].sort((a, b) => Number(b.images.length > 0) - Number(a.images.length > 0))
  const all = productService.list({ sort: 'popular' })
  const heroPool = withPhotosFirst([...productService.featured(), ...all.filter((p) => !p.isFeatured)])
  const hero = heroPool.length >= 3 ? [heroPool[1], heroPool[0], heroPool[2]] : []
  const festive = withPhotosFirst(productService.list({ category: 'festive-edit', sort: 'popular' }))[0] ?? all[0]
  const pick = (slug: string) => withPhotosFirst(productService.list({ category: slug, sort: 'popular' }))[0]
  const catArt: Record<string, Product | undefined> = {
    'new-arrivals': pick('new-arrivals'),
    ...Object.fromEntries(productService.categories().map((c) => [c.slug, pick(c.slug)])),
  }
  const cats = [
    ...productService.categories().map((c) => ({ slug: c.slug as string, name: c.name, tagline: c.tagline })),
    { slug: 'new-arrivals', name: 'New Arrivals', tagline: 'Fresh styles just added to Sirnaaz by Mehar.' },
  ]
  const insta = productService.list({ sort: 'popular' }).slice(0, 6)

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-wine-deep text-ivory">
        <img src={emblem} alt="" aria-hidden className="pointer-events-none absolute -left-40 top-1/2 w-[640px] -translate-y-1/2 opacity-[0.07]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(201,174,126,.18),transparent_60%)]" aria-hidden />
        <div className="container-x relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:py-20">
          <div className="flex flex-col items-start gap-6">
            <span className="animate-rise text-[11px] uppercase tracking-brand text-gold-soft" style={{ animationDelay: '.05s' }}>The Autumn–Festive Edit · 2026</span>
            <h1 className="animate-rise font-display text-[46px] font-normal leading-[1.02] sm:text-[64px] lg:text-[78px]" style={{ animationDelay: '.15s' }}>
              Elegance, <em className="font-normal text-gold-pale">Woven</em><br />Beautifully.
            </h1>
            <p className="max-w-md animate-rise text-[16px] leading-relaxed text-ivory/80 sm:text-[17px]" style={{ animationDelay: '.3s' }}>
              Timeless Pakistani silhouettes, thoughtfully curated for the modern woman.
            </p>
            <div className="flex w-full animate-rise flex-col gap-3 pt-2 sm:w-auto sm:flex-row" style={{ animationDelay: '.45s' }}>
              <Link to="/shop?category=new-arrivals" className="btn-gold">Shop new arrivals</Link>
              <Link to="/shop" className="btn-outline-light">Explore collection</Link>
            </div>
          </div>

          {hero.length === 3 && <div className="relative mx-auto grid w-full max-w-[560px] animate-fade grid-cols-[1fr_1.3fr_1fr] items-end gap-3 sm:gap-5" style={{ animationDuration: '1.4s' }}>
            <Arch product={hero[0]} className="aspect-[3/5] translate-y-6 opacity-95" />
            <Arch product={hero[1]} className="aspect-[3/5]" />
            <Arch product={hero[2]} className="aspect-[3/5] translate-y-6 opacity-95" />
          </div>}
        </div>
      </section>

      {/* ───────── PROMISES ───────── */}
      <section className="border-b border-line bg-sand/60">
        <ul className="container-x grid grid-cols-2 gap-y-5 py-6 text-[12.5px] text-ink-soft md:grid-cols-4">
          {[
            [<TruckIcon key="t" />, `Free shipping above ₹${site.shipping.freeAbove.toLocaleString('en-IN')}`],
            [<StoreIcon key="r" />, site.stores.length ? `Stores in ${site.stores.map((x) => x.city || x.name).filter((v, i, a) => a.indexOf(v) === i).join(' & ')}` : 'Easy returns support'],
            [<ShieldIcon key="s" />, 'Secure UPI & card payments'],
            [<NeedleIcon key="n" />, 'Fully stitched, sizes S–XXXL'],
          ].map(([icon, text], i) => (
            <li key={i} className="flex items-center justify-center gap-2.5 px-2 text-center"><span className="shrink-0 text-gold">{icon}</span>{text}</li>
          ))}
        </ul>
      </section>

      {/* ───────── CATEGORIES ───────── */}
      <section className="container-x py-16 sm:py-24">
        <SectionTitle eyebrow="Curated for you" title="Shop by Category" />
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {cats.map((c) => (
            <Link key={c.slug} to={`/shop?category=${c.slug}`} className="reveal group flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                {catArt[c.slug] && <ProductImage product={catArt[c.slug]!} index={catArt[c.slug]!.images.length ? 0 : 1} className="transition-transform duration-[1100ms] group-hover:scale-[1.06]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-wine-deep/70 via-wine-deep/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 text-ivory sm:p-6">
                  <h3 className="font-display text-[22px] leading-tight sm:text-[30px]">{c.name}</h3>
                  <p className="hidden text-[13.5px] leading-snug text-ivory/85 sm:block">{c.tagline}</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-[10.5px] uppercase tracking-label text-gold-pale">
                    Shop now <span className="h-px w-6 bg-current transition-all duration-300 group-hover:w-10" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────── NEW ARRIVALS ───────── */}
      <section className="bg-sand/50 py-16 sm:py-24">
        <div className="container-x">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle eyebrow="Just in" title="New Arrivals" align="left" />
            <Link to="/shop?category=new-arrivals" className="link-u hidden text-[12px] uppercase tracking-label text-wine sm:inline">View all new arrivals</Link>
          </div>
          <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {arrivals.map((p) => (
              <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-auto"><ProductCard product={p} /></div>
            ))}
          </div>
          <div className="mt-10 flex justify-center sm:hidden"><Link to="/shop?category=new-arrivals" className="btn-outline w-full">View all new arrivals</Link></div>
        </div>
      </section>

      {/* ───────── FESTIVE EDITORIAL ───────── */}
      <section className="container-x grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-20">
        {festive && (
          <Link to={`/shop/${festive.slug}`} className="reveal grid grid-cols-[1.4fr_1fr] gap-3 sm:gap-5" aria-label={festive.name}>
            <div className="aspect-[3/4] overflow-hidden bg-sand"><ProductImage product={festive} full /></div>
            <div className="flex flex-col gap-3 sm:gap-5">
              <div className="aspect-square overflow-hidden bg-sand"><ProductImage product={festive} index={1} /></div>
              <div className="aspect-square overflow-hidden bg-sand"><ProductImage product={festive} index={2} /></div>
            </div>
          </Link>
        )}
        <div className="flex flex-col items-start gap-6">
          <span className="text-[11px] uppercase tracking-brand text-gold">The Festive Edit</span>
          <h2 className="font-display text-[38px] leading-[1.08] sm:text-[52px]">Dressed for the <em>mehfil</em>, made to be remembered.</h2>
          <p className="max-w-lg text-[15.5px] leading-relaxed text-ink-soft">
            Gota borders, tilla work and organza that moves with you. Pieces chosen for sangeet nights, Eid dinners and every celebration you'll want to remember.
          </p>
          <ul className="grid w-full max-w-md grid-cols-3 border-y border-line py-5 text-center">
            {[['S–XXXL', 'size range'], ['Stitched', 'ready to wear'], ['COD', 'available']].map(([a, b]) => (
              <li key={a} className="flex flex-col gap-1"><span className="font-display text-[26px] text-wine">{a}</span><span className="text-[11.5px] text-ink-muted">{b}</span></li>
            ))}
          </ul>
          <Link to="/shop?category=festive-edit" className="btn-primary">Shop the festive edit</Link>
        </div>
      </section>

      {/* ───────── STORY ───────── */}
      <section className="bg-ivory">
        <div className="container-x flex flex-col items-center gap-7 border-t border-line py-16 text-center sm:py-24">
          <img src={logoFull} alt="Sirnaaz by Mehar" className="w-[260px] sm:w-[320px]" />
          <p className="max-w-2xl font-display text-[24px] italic leading-snug text-ink sm:text-[30px]">
            Graceful silhouettes, honest fabrics and the quiet confidence of a well-chosen suit, for every mehfil and every day in between.
          </p>
          <span className="text-[11px] uppercase tracking-brand text-gold">The Sirnaaz promise</span>
          <Link to="/about" className="link-u text-[12px] uppercase tracking-label text-wine">Read our story</Link>
        </div>
      </section>

      {/* ───────── INSTAGRAM ───────── */}
      <section className="bg-sand/50 py-16 sm:py-24">
        <div className="container-x flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[11px] uppercase tracking-brand text-gold">Follow our journey</span>
            <a href={instagramUrl()} target="_blank" rel="noreferrer" className="font-display text-[34px] text-ink hover:text-wine sm:text-[44px]">@{site.instagramHandle}</a>
            <Ornament />
          </div>
          <div className="grid w-full grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-6">
            {insta.map((p, i) => (
              <a key={p.id} href={instagramUrl()} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden bg-sand" aria-label={`${p.name} on Instagram`}>
                <ProductImage product={p} index={p.images.length ? 0 : i % 2} className="transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute inset-0 grid place-items-center bg-wine-deep/0 text-ivory opacity-0 transition-all duration-300 group-hover:bg-wine-deep/40 group-hover:opacity-100"><InstagramIcon width={28} /></span>
              </a>
            ))}
          </div>
          <a href={instagramUrl()} target="_blank" rel="noreferrer" className="btn-outline"><InstagramIcon width={18} />Follow us on Instagram</a>
        </div>
      </section>
    </>
  )
}
