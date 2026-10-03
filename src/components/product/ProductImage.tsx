import type { Product } from '../../types'
import ProductArt, { type ArtView } from './ProductArt'

const views: ArtView[] = ['front', 'detail', 'hem']

/**
 * Shows uploaded photographs (primary first). Product cards and small tiles use the light thumbnail;
 * pass `full` for large views (product gallery, quick view). Sample products without photos show their illustration.
 */
export default function ProductImage({ product, index = 0, className = '', eager = false, full = false }: { product: Product; index?: number; className?: string; eager?: boolean; full?: boolean }) {
  if (product.images.length) {
    const i = index % product.images.length
    const src = (!full && product.thumbs?.[i]) || product.images[i]
    return <img src={src} alt={product.name} loading={eager ? 'eager' : 'lazy'} decoding="async" className={`h-full w-full object-cover ${className}`} />
  }
  if (product.artwork) return <ProductArt product={product} view={views[index % views.length]} className={`h-full w-full ${className}`} />
  return (
    <div className={`grid h-full w-full place-items-center bg-sand text-center ${className}`} role="img" aria-label={`${product.name} — photo coming soon`}>
      <span className="px-4 font-brand text-[13px] tracking-[0.2em] text-gold">SIRNAAZ</span>
    </div>
  )
}

export const imageCount = (p: Product) => (p.images.length ? p.images.length : p.artwork ? views.length : 1)
