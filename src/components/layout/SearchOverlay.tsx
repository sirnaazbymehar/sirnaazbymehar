import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService } from '../../services/productService'
import { CloseIcon, SearchIcon } from '../ui/Icons'
import ProductImage from '../product/ProductImage'
import Price from '../ui/Price'

const suggestions = ['Lawn', 'Embroidered', 'Co-ord', 'Anarkali', 'Ivory', 'Festive']

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const nav = useNavigate()
  useEffect(() => {
    ref.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  const results = useMemo(() => (q.trim().length > 1 ? productService.list({ search: q.trim() }).slice(0, 6) : []), [q])

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="absolute inset-0 animate-fade bg-wine-deep/35" onClick={onClose} />
      <div className="relative max-h-[88vh] animate-rise overflow-y-auto bg-ivory shadow-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <form
          className="container-x flex items-center gap-3 border-b border-line py-4"
          onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/shop?q=${encodeURIComponent(q.trim())}`); onClose() }}
        >
          <SearchIcon className="shrink-0 text-gold" />
          <input id="site-search" ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search suits, fabrics, colours…" className="h-12 min-w-0 flex-1 bg-transparent font-display text-[22px] outline-none placeholder:text-ink-muted/60 sm:text-[26px]" />
          <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center" aria-label="Close search"><CloseIcon /></button>
        </form>
        <div className="container-x py-6">
          {!q.trim() && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-[11px] uppercase tracking-label text-ink-muted">Popular</span>
              {suggestions.map((s) => (
                <button key={s} onClick={() => setQ(s)} className="border border-line px-4 py-2 text-[13px] hover:border-gold">{s}</button>
              ))}
            </div>
          )}
          {q.trim().length > 1 && results.length === 0 && <p className="text-ink-soft">No pieces match “{q}”. Try a colour or fabric, like “lawn”.</p>}
          {results.length > 0 && (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {results.map((p) => (
                <li key={p.id}>
                  <Link to={`/shop/${p.slug}`} onClick={onClose} className="group flex flex-col gap-2">
                    <div className="aspect-[3/4] overflow-hidden bg-sand"><ProductImage product={p} className="transition-transform duration-500 group-hover:scale-105" /></div>
                    <span className="font-display text-[17px] leading-tight">{p.name}</span>
                    <Price product={p} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
