import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product, Size } from '../../types'
import { useStore } from '../../context/StoreContext'
import { CloseIcon } from '../ui/Icons'
import Price from '../ui/Price'
import ProductImage from './ProductImage'
import SizeSelector from './SizeSelector'

export default function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addToCart } = useStore()
  const [size, setSize] = useState<Size | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`}>
      <div className="absolute inset-0 animate-fade bg-wine-deep/45" onClick={onClose} />
      <div className="relative grid max-h-[90vh] w-full max-w-3xl animate-rise overflow-y-auto bg-ivory sm:grid-cols-2">
        <button onClick={onClose} className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center bg-ivory/80" aria-label="Close"><CloseIcon /></button>
        <div className="aspect-[3/4] bg-sand"><ProductImage product={product} full /></div>
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <span className="text-[11px] uppercase tracking-brand text-gold">{product.colour}</span>
          <h3 className="font-display text-[30px] leading-tight">{product.name}</h3>
          <Price product={product} large />
          <p className="text-[14px] leading-relaxed text-ink-soft">{product.description}</p>
          <SizeSelector product={product} value={size} onChange={(s) => { setSize(s); setErr(false) }} error={err} />
          {err && <span className="-mt-2 text-[13px] text-wine">Please choose a size</span>}
          <button className="btn-primary" onClick={() => { if (!size) return setErr(true); addToCart(product, size); onClose() }}>Add to cart</button>
          <Link to={`/shop/${product.slug}`} onClick={onClose} className="text-[12px] uppercase tracking-label text-ink-soft underline underline-offset-4">View full details</Link>
        </div>
      </div>
    </div>
  )
}
