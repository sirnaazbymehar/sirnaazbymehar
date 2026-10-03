import type { OrderStatus } from '../../types'
const steps: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Order Placed' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' }, { key: 'delivered', label: 'Delivered' },
]
export default function StatusTracker({ status }: { status: OrderStatus }) {
  if (status === 'cancelled' || status === 'refunded') return <span className="text-[13px] uppercase tracking-label text-wine">{status === 'cancelled' ? 'Cancelled' : 'Refunded'}</span>
  const at = steps.findIndex((s) => s.key === status)
  return (
    <ol className="grid grid-cols-5" aria-label="Order status">
      {steps.map((s, i) => (
        <li key={s.key} className="relative flex flex-col items-center gap-2 text-center" aria-current={i === at ? 'step' : undefined}>
          {i > 0 && <span className={`absolute right-1/2 top-[7px] h-px w-full ${i <= at ? 'bg-wine' : 'bg-line'}`} aria-hidden />}
          <span className={`relative h-[15px] w-[15px] rounded-full border-2 ${i <= at ? 'border-wine bg-wine' : 'border-line bg-ivory'}`} />
          <span className={`text-[10.5px] leading-tight sm:text-[12px] ${i <= at ? 'text-ink' : 'text-ink-muted'}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  )
}
