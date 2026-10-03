import type { Product } from '../../types'
import ProductCard from './ProductCard'
export default function ProductGrid({ products, cols = 4 }: { products: Product[]; cols?: 3 | 4 }) {
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 md:grid-cols-3 ${cols === 4 ? 'lg:grid-cols-4' : ''}`}>
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
