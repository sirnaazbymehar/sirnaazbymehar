import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productService, type SortKey } from '../services/productService'
import { ALL_SIZES, type CategorySlug, type Size } from '../types'
import ProductGrid from '../components/product/ProductGrid'
import { CloseIcon } from '../components/ui/Icons'
import Ornament from '../components/ui/Ornament'
import { useCatalog } from '../lib/useCatalog'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const sorts: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'popular', label: 'Popular' },
]
const prices = [
  { v: 0, label: 'Any price' },
  { v: 1800, label: 'Under ₹1,800' },
  { v: 2500, label: 'Under ₹2,500' },
  { v: 3000, label: 'Under ₹3,000' },
]

export default function Shop() {
  const catalog = useCatalog()
  const [params, setParams] = useSearchParams()
  const category = (params.get('category') ?? '') as CategorySlug | 'new-arrivals' | ''
  const q = params.get('q') ?? ''
  const sort = (params.get('sort') ?? 'newest') as SortKey
  const [sizes, setSizes] = useState<Size[]>([])
  const [colours, setColours] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState(0)
  const [inStock, setInStock] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const cat = category === 'new-arrivals' ? { name: 'New Arrivals', tagline: 'Fresh styles just added to Sirnaaz by Mehar.' } : category ? productService.category(category) : undefined
  const title = q ? `Results for “${q}”` : cat?.name ?? 'The Collection'
  useDocumentMeta(`${cat?.name ?? 'Shop'} — Sirnaaz by Mehar`, cat?.tagline ?? 'Shop Pakistani suits, co-ord sets and festive wear from Sirnaaz by Mehar.')

  const products = useMemo(
    () => productService.list({ search: q, category: category || undefined, sizes, colours, maxPrice, inStockOnly: inStock, sort }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, category, sizes, colours, maxPrice, inStock, sort, catalog],
  )
  const swatches = useMemo(() => {
    const m = new Map<string, string>()
    const named: Record<string, string> = { wine: '#6B1E33', maroon: '#6B1E33', ivory: '#F4EDE0', white: '#FAFAF7', cream: '#F2E8D5', black: '#262122', navy: '#1E2340',
      blue: '#5872A0', 'powder blue': '#B9CAD6', green: '#3F6B4E', emerald: '#1F4A3E', sage: '#9DAE8E', pink: '#E7A9B4', blush: '#E7BFB4', rose: '#B35A6B',
      red: '#A3263A', mustard: '#D3A548', yellow: '#E2C35A', gold: '#C9AE7E', champagne: '#D9C29A', beige: '#D8C6A8', peach: '#EBB49A', terracotta: '#B4613F',
      orange: '#D07A3A', purple: '#6A4A7A', lavender: '#B9A7CF', grey: '#9A9490', gray: '#9A9490', brown: '#6E4B3A', teal: '#2F6F6E', midnight: '#1E2340' }
    productService.list().forEach((p) => p.colour && m.set(p.colour, p.artwork?.base ?? named[p.colour.toLowerCase()] ?? '#D8CBB8'))
    return [...m.entries()].sort()
  }, [catalog])

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    setParams(next, { replace: true })
  }
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const activeCount = sizes.length + colours.length + (maxPrice ? 1 : 0) + (inStock ? 1 : 0)
  const clearAll = () => { setSizes([]); setColours([]); setMaxPrice(0); setInStock(false) }

  const catTabs = [
    { slug: '', name: 'All' },
    { slug: 'new-arrivals', name: 'New Arrivals' },
    ...productService.categories().map((c) => ({ slug: c.slug, name: c.name })),
  ]

  const Filters = (
    <div className="flex flex-col gap-8">
      <FilterGroup title="Size">
        <div className="grid grid-cols-3 gap-2">
          {ALL_SIZES.map((s) => (
            <button key={s} onClick={() => setSizes(toggle(sizes, s))} aria-pressed={sizes.includes(s)} className={`chip min-w-0 ${sizes.includes(s) ? 'border-wine bg-wine text-ivory' : 'border-line hover:border-ink/50'}`}>{s}</button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="flex flex-col gap-1">
          {prices.map((p) => (
            <label key={p.v} className="flex min-h-[40px] cursor-pointer items-center gap-3 text-[14px]">
              <input type="radio" name="price" id={`price-${p.v}`} checked={maxPrice === p.v} onChange={() => setMaxPrice(p.v)} className="h-4 w-4 accent-[#5C1A2B]" />{p.label}
            </label>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {swatches.map(([name, hex]) => (
            <button key={name} onClick={() => setColours(toggle(colours, name))} aria-pressed={colours.includes(name)} title={name}
              className={`flex items-center gap-2 border py-1.5 pl-1.5 pr-3 text-[12.5px] ${colours.includes(name) ? 'border-wine' : 'border-line hover:border-ink/40'}`}>
              <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: hex }} />{name}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Availability">
        <label className="flex min-h-[40px] cursor-pointer items-center gap-3 text-[14px]">
          <input type="checkbox" id="in-stock" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 accent-[#5C1A2B]" />In stock only
        </label>
      </FilterGroup>
      {activeCount > 0 && <button onClick={clearAll} className="self-start text-[12px] uppercase tracking-label text-wine underline underline-offset-4">Clear all filters</button>}
    </div>
  )

  return (
    <>
      <section className="border-b border-line bg-sand/50">
        <div className="container-x flex flex-col items-center gap-3 py-10 text-center sm:py-14">
          <nav className="text-[11px] uppercase tracking-label text-ink-muted" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-ink">Home</Link> <span className="mx-1.5">/</span> <span className="text-ink-soft">Shop</span>
          </nav>
          <h1 className="font-display text-[40px] leading-tight sm:text-[54px]">{title}</h1>
          <Ornament />
          {cat?.tagline && !q && <p className="text-[15px] text-ink-soft">{cat.tagline}</p>}
        </div>
        <div className="container-x no-scrollbar flex gap-2 overflow-x-auto pb-5 sm:justify-center">
          {catTabs.map((c) => (
            <button key={c.slug} onClick={() => { const n = new URLSearchParams(params); if (c.slug) n.set('category', c.slug); else n.delete('category'); n.delete('q'); setParams(n) }}
              className={`shrink-0 border px-4 py-2.5 text-[11.5px] uppercase tracking-label transition-colors ${category === c.slug && !q ? 'border-wine bg-wine text-ivory' : 'border-line bg-ivory text-ink-soft hover:border-ink/40'}`}>{c.name}</button>
          ))}
        </div>
      </section>

      <div className="container-x grid gap-10 py-8 lg:grid-cols-[230px_1fr] lg:py-12">
        <aside className="hidden lg:block" aria-label="Filters">{Filters}</aside>

        <div className="min-w-0">
          <div className="sticky z-20 -mx-4 mb-8 flex items-center justify-between gap-3 border-b border-line bg-ivory/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0 lg:static lg:bg-transparent" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 68px)' }}>
            <button onClick={() => setFiltersOpen(true)} className="flex h-10 items-center gap-2 border border-line px-4 text-[11.5px] uppercase tracking-label lg:hidden">
              Filter{activeCount > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-wine text-[10px] text-ivory">{activeCount}</span>}
            </button>
            <span className="hidden text-[13px] text-ink-muted lg:inline">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span>
            <label className="flex items-center gap-2 text-[13px]">
              <span className="hidden text-ink-muted sm:inline">Sort by</span>
              <select id="sort" value={sort} onChange={(e) => setParam('sort', e.target.value === 'newest' ? '' : e.target.value)} className="h-10 border border-line bg-ivory px-3 text-[13px] outline-none focus:border-gold">
                {sorts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
          </div>

          {products.length ? (
            <ProductGrid products={products} cols={3} />
          ) : (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <p className="font-display text-[26px]">Nothing matches just yet</p>
              <p className="text-[14px] text-ink-soft">Try removing a filter, or browse the full collection.</p>
              <button onClick={() => { clearAll(); setParams({}) }} className="btn-outline">See all pieces</button>
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 animate-fade bg-wine-deep/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] animate-rise flex-col bg-ivory" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="font-display text-[24px]">Filter</h2>
              <button onClick={() => setFiltersOpen(false)} className="grid h-11 w-11 place-items-center" aria-label="Close filters"><CloseIcon /></button>
            </div>
            <div className="overflow-y-auto px-5 py-6">{Filters}</div>
            <div className="border-t border-line p-4"><button onClick={() => setFiltersOpen(false)} className="btn-primary w-full">Show {products.length} {products.length === 1 ? 'piece' : 'pieces'}</button></div>
          </div>
        </div>
      )}
    </>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      <h3 className="border-b border-line pb-2.5 text-[11px] uppercase tracking-brand text-ink">{title}</h3>
      {children}
    </div>
  )
}
