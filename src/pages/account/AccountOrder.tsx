import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { orderService } from '../../services/orderService'
import OrderSummary from '../../components/checkout/OrderSummary'
import StatusTracker from '../../components/ui/StatusTracker'
import PageLoading from '../../components/ui/PageLoading'
import { formatDate } from '../../lib/format'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import NotFound from '../NotFound'
import type { Order } from '../../types'

export default function AccountOrder() {
  const { id = '' } = useParams()
  const { user, ready } = useAuth()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  useDocumentMeta(order ? `Order ${order.number} — Sirnaaz by Mehar` : 'Order — Sirnaaz by Mehar')
  useEffect(() => { if (user) orderService.mineById(id).then(setOrder).catch(() => setOrder(null)) }, [id, user])

  if (!ready) return <PageLoading />
  if (!user) return <Navigate to={`/login?next=/account/orders/${id}`} replace />
  if (order === undefined) return <PageLoading />
  if (!order) return <NotFound />
  const a = order.address
  return (
    <section className="container-x max-w-4xl py-10 sm:py-14">
      <Link to="/account" className="text-[11px] uppercase tracking-label text-ink-muted hover:text-ink">← My orders</Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-[34px] sm:text-[42px]">Order {order.number}</h1>
        <span className="text-[13px] text-ink-muted">Placed {formatDate(order.createdAt)}</span>
      </div>
      <div className="mt-8"><StatusTracker status={order.status} /></div>
      <div className="mt-10 grid gap-10 md:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-[24px]">Items</h2>
          <OrderSummary items={order.items} totals={order} couponCode={order.couponCode} />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-[24px]">Delivery address</h2>
            <address className="not-italic leading-relaxed text-ink-soft"><span className="text-ink">{a.fullName}</span><br />{a.house}, {a.address}<br />{a.area && <>{a.area}<br /></>}{a.city}, {a.state} {a.pincode}<br />{a.mobile}</address>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-[24px]">Payment</h2>
            <p className="text-ink-soft">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} · {({ paid: 'Paid', pending: 'Awaiting payment', 'cod-pending': 'Pay on delivery', refunded: 'Refunded', failed: 'Failed' } as const)[order.paymentStatus]}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
