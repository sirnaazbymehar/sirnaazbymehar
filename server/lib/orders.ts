import { z } from 'zod'
import type pg from 'pg'
import { q } from '../db/pool'
import { SIZES } from './catalog'
import type { Settings } from './settings'

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(100),
  mobile: z.string().trim().transform((v) => v.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')).pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
  house: z.string().trim().min(1, 'Enter your flat or house number').max(120),
  address: z.string().trim().min(4, 'Enter your street address').max(250),
  area: z.string().trim().max(120).default(''),
  city: z.string().trim().min(2, 'Enter your city').max(80),
  state: z.string().trim().min(2, 'Choose your state').max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  country: z.literal('India').default('India'),
})
export type AddressInput = z.infer<typeof addressSchema>

export const orderInputSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    size: z.enum(SIZES),
    quantity: z.number().int().min(1).max(10),
  })).min(1, 'Your bag is empty').max(30),
  address: addressSchema,
  paymentMethod: z.enum(['online', 'cod']),
  couponCode: z.string().trim().toUpperCase().max(40).optional().or(z.literal('').transform(() => undefined)),
})

export interface CouponRow { code: string; description: string; type: 'percent' | 'flat'; value: number; min_subtotal: number }

export async function findCoupon(code: string, db: Pick<pg.PoolClient, 'query'> = { query: q } as never) {
  const r = await db.query(`SELECT code, description, type, value, min_subtotal FROM coupons
                            WHERE code = $1 AND is_active AND (expires_at IS NULL OR expires_at > now())`, [code.trim().toUpperCase()])
  return (r.rows[0] as CouponRow | undefined) ?? null
}

export function totals(subtotal: number, s: Settings, coupon: CouponRow | null) {
  const shipping = subtotal === 0 || subtotal >= s.freeShippingThreshold ? 0 : s.shippingCharge
  let discount = 0
  if (coupon && subtotal >= coupon.min_subtotal) {
    discount = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal)
  }
  return { subtotal, shipping, discount, total: Math.max(0, subtotal + shipping - discount) }
}

export async function loadOrder(where: string, params: unknown[]) {
  const r = await q(`SELECT o.*, COALESCE((SELECT json_agg(json_build_object(
        'productId', oi.product_id, 'slug', oi.product_slug, 'name', oi.product_name, 'size', oi.size,
        'quantity', oi.quantity, 'unitPrice', oi.unit_price, 'imageUrl', oi.image_url) ORDER BY oi.product_name)
      FROM order_items oi WHERE oi.order_id = o.id), '[]') AS items,
      COALESCE((SELECT json_agg(json_build_object('status', h.status, 'at', h.changed_at) ORDER BY h.changed_at)
      FROM order_status_history h WHERE h.order_id = o.id), '[]') AS history
    FROM orders o WHERE ${where}`, params)
  return r.rows.map(serializeOrder)
}

export function serializeOrder(o: any) {
  return {
    id: o.id, number: o.number, createdAt: o.created_at, updatedAt: o.updated_at,
    status: o.status, paymentMethod: o.payment_method, paymentStatus: o.payment_status,
    subtotal: o.subtotal, shipping: o.shipping, discount: o.discount, total: o.total, couponCode: o.coupon_code ?? undefined,
    address: { fullName: o.customer_name, mobile: o.customer_phone, email: o.customer_email, house: o.house, address: o.address, area: o.area, city: o.city, state: o.state, pincode: o.pincode, country: o.country },
    items: o.items, history: o.history,
  }
}
