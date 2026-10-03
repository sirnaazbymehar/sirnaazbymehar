import type { CartItem } from '../../types'
import { productService } from '../../services/productService'
import { formatPrice } from '../../lib/format'
import ProductImage from '../product/ProductImage'

interface Totals { subtotal: number; shipping: number; discount: number; total: number }

export default function OrderSummary({ items, totals, couponSlot, couponCode }: { items: CartItem[]; totals: Totals; couponSlot?: React.ReactNode; couponCode?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-4">
        {items.map((i) => {
          const p = productService.byId(i.productId)
          return (
            <li key={i.productId + i.size} className="flex items-center gap-4">
              <div className="relative aspect-[3/4] w-16 shrink-0 bg-sand">
                {i.imageUrl ? <img src={i.imageUrl} alt="" className="h-full w-full object-cover" /> : p && <ProductImage product={p} />}
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] text-ivory">{i.quantity}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-[17px] leading-tight">{i.name}</span>
                <span className="text-[12.5px] text-ink-muted">Size {i.size}</span>
              </div>
              <span className="text-[14px] tabular-nums">{formatPrice(i.unitPrice * i.quantity)}</span>
            </li>
          )
        })}
      </ul>
      {couponSlot}
      <dl className="flex flex-col gap-2.5 border-t border-line pt-4 text-[14px]">
        <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
        <Row label="Shipping" value={totals.shipping ? formatPrice(totals.shipping) : 'Free'} />
        <Row label={`Discount${couponCode ? ` (${couponCode})` : ''}`} value={totals.discount ? `− ${formatPrice(totals.discount)}` : '—'} accent={!!totals.discount} />
        <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3.5">
          <dt className="text-[13px] uppercase tracking-label">Total</dt>
          <dd className="text-[22px] font-medium tabular-nums">{formatPrice(totals.total)}</dd>
        </div>
      </dl>
    </div>
  )
}
function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex justify-between"><dt className="text-ink-soft">{label}</dt><dd className={`tabular-nums ${accent ? 'text-wine' : ''}`}>{value}</dd></div>
}
