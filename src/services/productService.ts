// ─────────────────────────────────────────────────────────────
//  Product catalogue, loaded from the API (GET /api/products).
//  The whole active catalogue is small, so it is fetched once and
//  filtered in the browser; prices and stock are re-checked by the
//  server when an order is placed.
// ─────────────────────────────────────────────────────────────
import { api } from '../lib/api'
import type { Category, CategorySlug, Product, Size } from '../types'
import { sellingPrice, isSoldOut } from '../lib/product'

let products: Product[] = []
let categories: Category[] = []
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((f) => f())

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'popular'
export interface ProductQuery {
  search?: string
  category?: CategorySlug | 'new-arrivals'
  sizes?: Size[]
  colours?: string[]
  maxPrice?: number
  inStockOnly?: boolean
  sort?: SortKey
}

export const productService = {
  async load() {
    const [p, c] = await Promise.all([api.get<Product[]>('/products'), api.get<Category[]>('/categories')])
    products = p
    categories = c
    notify()
  },
  list(q: ProductQuery = {}): Product[] {
    let out = [...products]
    if (q.search) {
      const s = q.search.toLowerCase()
      out = out.filter((p) => [p.name, p.colour, p.description, p.fabric].join(' ').toLowerCase().includes(s))
    }
    if (q.category === 'new-arrivals') out = out.filter((p) => p.isNewArrival)
    else if (q.category) out = out.filter((p) => p.category === q.category)
    if (q.sizes?.length) out = out.filter((p) => q.sizes!.some((s) => (p.stock[s] ?? 0) > 0))
    if (q.colours?.length) out = out.filter((p) => q.colours!.includes(p.colour))
    if (q.maxPrice) out = out.filter((p) => sellingPrice(p) <= q.maxPrice!)
    if (q.inStockOnly) out = out.filter((p) => !isSoldOut(p))
    switch (q.sort ?? 'newest') {
      case 'price-asc': out.sort((a, b) => sellingPrice(a) - sellingPrice(b)); break
      case 'price-desc': out.sort((a, b) => sellingPrice(b) - sellingPrice(a)); break
      case 'popular': out.sort((a, b) => b.popularity - a.popularity); break
      default: out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
    return out
  },
  bySlug: (slug: string) => products.find((p) => p.slug === slug),
  byId: (id: string) => products.find((p) => p.id === id),
  newArrivals: (limit = 8) => productService.list({ category: 'new-arrivals' }).slice(0, limit),
  featured: () => products.filter((p) => p.isFeatured),
  related: (p: Product, limit = 4) =>
    products.filter((x) => x.id !== p.id && x.category === p.category).concat(products.filter((x) => x.category !== p.category)).slice(0, limit),
  colours: () => [...new Set(products.map((p) => p.colour).filter(Boolean))].sort(),
  categories: () => categories,
  category: (slug: string) => categories.find((c) => c.slug === slug),
  all: () => products,
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
}
