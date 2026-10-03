import { Link } from 'react-router-dom'
import type { CartItem } from '../../types'
import { useStore } from '../../context/StoreContext'
import { productService } from '../../services/productService'
import { sizeStock } from '../../lib/product'
import { formatPrice } from '../../lib/format'
import ProductImage from '../product/ProductImage'
import QuantityStepper from '../ui/QuantityStepper'

export default function CartItemRow({ item, onNavigate }: { item: CartItem; onNavigate?: () => void }) {
  const { setQuantity, removeFromCart } = useStore()
  const product = productService.byId(item.productId)
  const max = product ? sizeStock(product, item.size) : item.quantity
  return (
    <li className="flex gap-4 py-5">
      <Link to={`/shop/${item.slug}`} onClick={onNavigate} className="aspect-[3/4] w-[88px] shrink-0 overflow-hidden bg-sand">
        {product && <ProductImage product={product} />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/shop/${item.slug}`} onClick={onNavigate} className="font-display text-[18px] leading-tight hover:text-wine">{item.name}</Link>
          <span className="shrink-0 text-[14px] font-medium tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
        </div>
        <span className="text-[13px] text-ink-soft">Size: {item.size} · {formatPrice(item.unitPrice)} each</span>
        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityStepper value={item.quantity} max={max} onChange={(q) => setQuantity(item.productId, item.size, q)} small />
          <button onClick={() => removeFromCart(item.productId, item.size)} className="text-[11px] uppercase tracking-label text-ink-muted underline-offset-4 hover:text-wine hover:underline">Remove</button>
        </div>
        {item.quantity >= max && max > 0 && <span className="text-[12px] text-wine-soft">Only {max} left in this size</span>}
      </div>
    </li>
  )
}
