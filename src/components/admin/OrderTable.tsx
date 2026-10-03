import { useNavigate } from 'react-router-dom'
import type { Order, OrderStatus, PaymentStatus } from '../../types'
import { formatDate, formatPrice } from '../../lib/format'

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded']
export const statusLabel = (s: string) => s[0].toUpperCase() + s.slice(1)
export const payLabel: Record<PaymentStatus, string> = { paid: 'Paid', pending: 'Awaiting payment', 'cod-pending': 'COD · due', refunded: 'Refunded', failed: 'Failed' }
export const statusPill: Record<OrderStatus, string> = {
  pending: 'bg-[#F4E3C3] text-[#7A5418]', confirmed: 'bg-[#E3E6F1] text-[#33406B]', packed: 'bg-[#EADFF0] text-[#5B3A6E]',
  shipped: 'bg-[#DCEBF0] text-[#245366]', delivered: 'bg-[#DDEBDF] text-[#2F6B4A]', cancelled: 'bg-[#F1DADC] text-[#7A2632]', refunded: 'bg-[#E8E2DC] text-[#5A4E4F]',
}

export default function OrderTable({ orders }: { orders: Order[] }) {
  const nav = useNavigate()
  if (!orders.length) return <p className="border border-line bg-ivory p-6 text-[14px] text-ink-soft">No orders yet. New orders appear here as soon as they're placed.</p>
  return (
    <div className="overflow-x-auto border border-line bg-ivory">
      <table className="w-full min-w-[860px] text-left text-[13px]">
        <thead className="border-b border-line text-[10.5px] uppercase tracking-label text-ink-muted">
          <tr>{['Order', 'Customer', 'Products', 'Amount', 'Payment', 'Status', 'Date'].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => (
            <tr key={o.id} onClick={() => nav(`/admin/orders/${o.id}`)} className="cursor-pointer align-top hover:bg-sand/50">
              <td className="px-4 py-3.5 font-medium"><a href={`/admin/orders/${o.id}`} onClick={(e) => e.preventDefault()} className="text-wine underline-offset-4 hover:underline">{o.number}</a></td>
              <td className="px-4 py-3.5"><div>{o.address.fullName}</div><div className="text-ink-muted">{o.address.mobile}</div></td>
              <td className="px-4 py-3.5">{o.items.map((i) => <div key={i.productId + i.size}>{i.name} <span className="text-ink-muted">· {i.size} × {i.quantity}</span></div>)}</td>
              <td className="px-4 py-3.5 tabular-nums">{formatPrice(o.total)}</td>
              <td className="px-4 py-3.5">{o.paymentMethod === 'cod' ? 'COD' : 'Online'} · {payLabel[o.paymentStatus]}</td>
              <td className="px-4 py-3.5"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] ${statusPill[o.status]}`}>{statusLabel(o.status)}</span></td>
              <td className="whitespace-nowrap px-4 py-3.5 text-ink-muted">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
