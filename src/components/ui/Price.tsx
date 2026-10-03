import type { Product } from '../../types'
import { discountPercent, formatPrice } from '../../lib/format'

export default function Price({ product, large = false }: { product: Product; large?: boolean }) {
  const off = discountPercent(product.price, product.salePrice)
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-1 ${large ? 'text-2xl' : 'text-[15px]'}`}>
      <span className="font-medium text-ink tabular-nums">{formatPrice(product.salePrice ?? product.price)}</span>
      {off > 0 && (
        <>
          <span className={`${large ? 'text-base' : 'text-[13px]'} text-ink-muted line-through tabular-nums`}>{formatPrice(product.price)}</span>
          <span className={`${large ? 'text-sm' : 'text-[12px]'} font-medium uppercase tracking-label text-wine`}>{off}% off</span>
        </>
      )}
    </div>
  )
}
