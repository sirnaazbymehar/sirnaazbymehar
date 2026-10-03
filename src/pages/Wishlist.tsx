import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { productService } from '../services/productService'
import ProductGrid from '../components/product/ProductGrid'
import { useCatalog } from '../lib/useCatalog'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import type { Product } from '../types'

export default function Wishlist() {
  useDocumentMeta('Wishlist — Sirnaaz by Mehar')
  useCatalog()
  const { wishlist } = useStore()
  const items = wishlist.map((id) => productService.byId(id)).filter(Boolean) as Product[]
  return (
    <section className="container-x py-10 sm:py-16">
      <h1 className="font-display text-[40px] sm:text-[50px]">Wishlist <span className="text-[20px] text-ink-muted">({items.length})</span></h1>
      {items.length ? (
        <div className="mt-10"><ProductGrid products={items} /></div>
      ) : (
        <div className="flex flex-col items-start gap-5 py-14">
          <p className="text-ink-soft">Tap the heart on any piece to save it here for later.</p>
          <Link to="/shop" className="btn-primary">Explore the collection</Link>
        </div>
      )}
    </section>
  )
}
