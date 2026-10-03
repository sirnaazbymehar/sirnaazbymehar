import type { Product, Size } from '../types'

export const sellingPrice = (p: Product) => p.salePrice ?? p.price
export const sizeStock = (p: Product, s: Size) => p.stock[s] ?? 0
export const availableSizes = (p: Product) => p.sizes.filter((s) => sizeStock(p, s) > 0)
/** Sold out if admin marked it, or every offered size has reached zero. */
export const isSoldOut = (p: Product) => p.isSoldOut || availableSizes(p).length === 0
export const totalStock = (p: Product) => p.sizes.reduce((n, s) => n + sizeStock(p, s), 0)
