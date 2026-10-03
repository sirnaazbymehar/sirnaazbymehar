import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product, Size } from '../../types'
import { useStore } from '../../context/StoreContext'
import { isSoldOut, sizeStock } from '../../lib/product'
import { discountPercent } from '../../lib/format'
import { CloseIcon, HeartIcon, PlusIcon } from '../ui/Icons'
import Price from '../ui/Price'
import ProductImage from './ProductImage'
import QuickView from './QuickView'

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWished } = useStore()
  const [picking, setPicking] = useState(false)
  const [quick, setQuick] = useState(false)
  const soldOut = isSoldOut(product)
  const off = discountPercent(product.price, product.salePrice)
  const wished = isWished(product.id)
  const href = `/shop/${product.slug}`

  const add = (s: Size) => { addToCart(product, s, 1, false); setPicking(false) }

  return (
    <article className="group flex flex-col gap-3.5">
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        <Link to={href} aria-label={product.name} className="absolute inset-0">
          <ProductImage product={product} className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]" />
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [@media(hover:none)]:hidden">
            <ProductImage product={product} index={1} />
          </div>
          {soldOut && <div className="absolute inset-0 bg-ivory/45" />}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="bg-ink px-2.5 py-1 text-[10px] uppercase tracking-label text-ivory">Sold out</span>
          ) : (
            <>
              {product.isNewArrival && <span className="bg-ivory/90 px-2.5 py-1 text-[10px] uppercase tracking-label text-wine">New</span>}
              {off > 0 && <span className="bg-wine px-2.5 py-1 text-[10px] uppercase tracking-label text-ivory">{off}% off</span>}
            </>
          )}
        </div>

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wished}
          className={`absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-ivory/80 backdrop-blur transition-colors ${wished ? 'text-wine' : 'text-ink hover:text-wine'}`}
        >
          <HeartIcon filled={wished} width={19} />
        </button>

        {/* desktop hover actions */}
        {!soldOut && !picking && (
          <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)]:flex">
            <button onClick={() => setQuick(true)} className="h-11 flex-1 bg-ivory/95 text-[11px] uppercase tracking-label text-ink hover:bg-ivory">Quick view</button>
            <button onClick={() => setPicking(true)} className="h-11 flex-1 bg-wine text-[11px] uppercase tracking-label text-ivory hover:bg-wine-deep">Add to cart</button>
          </div>
        )}
        {/* touch quick add */}
        {!soldOut && !picking && (
          <button onClick={() => setPicking(true)} aria-label={`Quick add ${product.name}`} className="absolute bottom-2.5 right-2.5 grid h-10 w-10 place-items-center rounded-full bg-ivory/90 text-ink shadow-sm [@media(hover:hover)]:hidden">
            <PlusIcon width={18} />
          </button>
        )}

        {picking && (
          <div className="absolute inset-x-0 bottom-0 animate-rise bg-ivory/97 p-3 shadow-[0_-8px_20px_-12px_rgba(0,0,0,.3)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10.5px] uppercase tracking-label text-ink-soft">Select size</span>
              <button onClick={() => setPicking(false)} aria-label="Close size picker" className="-m-2 grid h-9 w-9 place-items-center"><CloseIcon width={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {product.sizes.map((s) => {
                const out = sizeStock(product, s) === 0
                return (
                  <button key={s} disabled={out} onClick={() => add(s)} className={`h-10 border text-[12px] ${out ? 'border-line text-ink-muted/60 line-through' : 'border-ink/25 hover:border-wine hover:bg-wine hover:text-ivory'}`}>{s}</button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-0.5">
        <Link to={href} className="font-display text-[19px] leading-tight text-ink hover:text-wine sm:text-[20px]">{product.name}</Link>
        <Price product={product} />
        <p className="flex flex-wrap gap-x-2 text-[11.5px] tracking-wide text-ink-muted" aria-label="Available sizes">
          {soldOut ? <span className="uppercase tracking-label text-wine">Sold out</span> : product.sizes.map((s) => (
            <span key={s} className={sizeStock(product, s) === 0 ? 'text-ink-muted/45 line-through' : ''}>{s}</span>
          ))}
        </p>
      </div>

      {quick && <QuickView product={product} onClose={() => setQuick(false)} />}
    </article>
  )
}
