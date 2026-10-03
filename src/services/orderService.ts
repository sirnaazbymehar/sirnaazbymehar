// Orders are created and stored by the server (POST /api/orders). The server re-prices
// the bag, checks size-level stock and coupons, and decrements inventory in one transaction.
import { api } from '../lib/api'
import type { Address, CartItem, Coupon, Order, PaymentMethod } from '../types'
import { site } from '../config/site'

/** Display-only estimate of totals. The server's figures are the ones that count. */
export function priceCart(items: CartItem[], coupon?: Coupon) {
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0)
  const shipping = subtotal === 0 || subtotal >= site.shipping.freeAbove ? 0 : site.shipping.flatRate
  let discount = 0
  if (coupon && subtotal >= coupon.minSubtotal) {
    discount = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal)
  }
  return { subtotal, shipping, discount, total: Math.max(0, subtotal + shipping - discount) }
}

export const validateCoupon = (code: string, subtotal: number) => api.post<Coupon>('/coupons/validate', { code, subtotal })

export const orderService = {
  /**
   * Only product ids, sizes and quantities are sent — the server works out every price and total.
   * `idempotencyKey` makes retries safe: the same key never creates a second order.
   */
  place: (input: { items: CartItem[]; address: Address; paymentMethod: PaymentMethod; couponCode?: string; idempotencyKey: string }) =>
    api.post<{ id: string; number: string; viewToken: string; duplicate?: boolean }>('/orders', {
      items: input.items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })),
      address: input.address,
      paymentMethod: input.paymentMethod,
      couponCode: input.couponCode,
    }, { 'Idempotency-Key': input.idempotencyKey }),
  /** Guest access uses the private token from the confirmation link; signed-in owners don't need it. */
  get: (id: string, token?: string | null) => api.get<Order>(`/orders/${id}${token ? `?t=${encodeURIComponent(token)}` : ''}`),
  mine: () => api.get<Order[]>('/account/orders'),
  mineById: (id: string) => api.get<Order>(`/account/orders/${id}`),
}
