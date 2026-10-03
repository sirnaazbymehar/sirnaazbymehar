import { site } from '../../config/site'
import { formatPrice } from '../../lib/format'
export default function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const left = site.shipping.freeAbove - subtotal
  const pct = Math.min(100, (subtotal / site.shipping.freeAbove) * 100)
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-ink-soft">
        {left > 0 ? <>You're <strong className="font-medium text-wine">{formatPrice(left)}</strong> away from free shipping</> : <>Your order ships <strong className="font-medium text-wine">free</strong></>}
      </p>
      <div className="h-[3px] w-full bg-line"><div className="h-full bg-gold transition-[width] duration-500" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
