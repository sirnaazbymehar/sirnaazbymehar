import type pg from 'pg'
import { q } from '../db/pool'

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const
export type Size = (typeof SIZES)[number]

// One query that returns products with their sizes, stock and images as the API shape.
const SELECT = `
  SELECT p.*, c.slug AS category,
    COALESCE((SELECT json_agg(json_build_object('size', v.size, 'variantId', v.id, 'quantity', COALESCE(i.quantity, 0))
                              ORDER BY array_position(ARRAY['S','M','L','XL','XXL','XXXL'], v.size))
              FROM product_variants v LEFT JOIN inventory i ON i.variant_id = v.id WHERE v.product_id = p.id), '[]') AS variants,
    COALESCE((SELECT json_agg(json_build_object('id', im.id, 'url', im.url, 'thumbUrl', COALESCE(im.thumb_url, im.url), 'isPrimary', im.is_primary, 'position', im.position)
                              ORDER BY im.is_primary DESC, im.position, im.created_at)
              FROM product_images im WHERE im.product_id = p.id), '[]') AS images
  FROM products p JOIN categories c ON c.id = p.category_id`

export interface ProductRow extends pg.QueryResultRow {
  id: string; name: string; slug: string; description: string; details: string[]; price: number; sale_price: number | null
  category: string; colour: string; fabric: string; care: string[]; fit: string; delivery_info: string; return_info: string
  is_featured: boolean; is_new_arrival: boolean; is_active: boolean; is_sold_out: boolean; popularity: number; artwork: unknown
  created_at: string; updated_at: string
  variants: { size: Size; variantId: string; quantity: number }[]
  images: { id: string; url: string; thumbUrl: string; isPrimary: boolean; position: number }[]
}

export function toApi(r: ProductRow, admin = false) {
  const stock: Partial<Record<Size, number>> = {}
  r.variants.forEach((v) => (stock[v.size] = v.quantity))
  return {
    id: r.id, name: r.name, slug: r.slug, description: r.description, details: r.details,
    price: r.price, salePrice: r.sale_price ?? undefined, category: r.category, colour: r.colour,
    fabric: r.fabric, care: r.care, fit: r.fit, deliveryInfo: r.delivery_info, returnInfo: r.return_info,
    images: r.images.map((i) => i.url),
    thumbs: r.images.map((i) => i.thumbUrl),
    sizes: r.variants.map((v) => v.size),
    stock, artwork: r.artwork ?? undefined,
    isFeatured: r.is_featured, isNewArrival: r.is_new_arrival, isSoldOut: r.is_sold_out, isActive: r.is_active,
    popularity: r.popularity, createdAt: r.created_at, updatedAt: r.updated_at,
    ...(admin ? { imageRecords: r.images } : {}),
  }
}

export async function listProducts(opts: { includeInactive?: boolean } = {}) {
  const r = await q<ProductRow>(`${SELECT} ${opts.includeInactive ? '' : 'WHERE p.is_active'} ORDER BY p.created_at DESC`)
  return r.rows
}

export async function getProduct(where: { id?: string; slug?: string }, includeInactive = false) {
  const cond = where.id ? 'p.id = $1' : 'p.slug = $1'
  const r = await q<ProductRow>(`${SELECT} WHERE ${cond} ${includeInactive ? '' : 'AND p.is_active'}`, [where.id ?? where.slug])
  return r.rows[0] ?? null
}
