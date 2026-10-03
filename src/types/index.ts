// Core domain types, matching the API responses (see server/lib/catalog.ts and server/lib/orders.ts).

export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
export const ALL_SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export type CategorySlug = string

export interface Category {
  slug: CategorySlug
  name: string
  tagline: string
}

/** Visual recipe for the placeholder artwork. Replaced by real photo URLs in `images` later. */
export interface Artwork {
  silhouette: 'straight' | 'aline' | 'anarkali' | 'coord'
  base: string // garment colour
  accent: string // embroidery / print colour
  trim: string // borders
  backdrop: string // studio backdrop tint
  motif: 'buti' | 'jaal' | 'stripe' | 'floral' | 'plain'
  dupatta: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  details: string[]
  fabric: string
  care: string[]
  fit: string
  deliveryInfo?: string // falls back to the shop's shipping policy
  returnInfo?: string // falls back to the shop's return policy
  price: number // MRP in ₹
  salePrice?: number // selling price when discounted
  category: CategorySlug
  colour: string
  images: string[] // photo URLs, primary first
  thumbs?: string[] // small versions for cards, same order as images
  artwork?: Artwork // placeholder illustration used until photos are uploaded
  /** Sizes this product is offered in. */
  sizes: Size[]
  /** Per-size inventory. A size with 0 shows as sold out. */
  stock: Partial<Record<Size, number>>
  isFeatured: boolean
  isNewArrival: boolean
  isActive?: boolean
  isSoldOut: boolean // manual override from admin
  imageRecords?: ProductImageRecord[] // admin only
  popularity: number
  createdAt: string
  updatedAt: string
}

export interface ProductImageRecord { id: string; url: string; thumbUrl?: string; isPrimary: boolean; position: number }

export interface CartItem {
  productId: string
  slug: string
  name: string
  size: Size
  quantity: number
  unitPrice: number
  imageUrl?: string | null
}

export interface Address {
  fullName: string
  mobile: string
  email: string
  house: string
  address: string
  area: string
  city: string
  state: string
  pincode: string
  country: string
}

export type PaymentMethod = 'online' | 'cod'
export type PaymentStatus = 'pending' | 'paid' | 'cod-pending' | 'refunded' | 'failed'
export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface Order {
  id: string
  number: string
  createdAt: string
  items: CartItem[]
  address: Address
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  subtotal: number
  shipping: number
  discount: number
  total: number
  couponCode?: string
  history?: { status: OrderStatus; at: string }[]
}

export interface User { id: string; email: string; name: string; phone: string }
export interface SavedAddress extends Address { id: string; isDefault: boolean }

export interface Coupon {
  code: string
  description: string
  type: 'percent' | 'flat'
  value: number
  minSubtotal: number
}
