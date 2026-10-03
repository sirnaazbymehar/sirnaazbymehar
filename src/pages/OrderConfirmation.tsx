import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { orderService } from '../services/orderService'
import OrderSummary from '../components/checkout/OrderSummary'
import StatusTracker from '../components/ui/StatusTracker'
import Ornament from '../components/ui/Ornament'
import { formatDate } from '../lib/format'
import { site } from '../config/site'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import NotFound from './NotFound'
import PageLoading from '../components/ui/PageLoading'
import { useAuth } from '../context/AuthContext'
import type { Order } from '../types'

export default function OrderConfirmation() {
  useDocumentMeta('Order confirmed — Sirnaaz by Mehar')
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const token = params.get('t')
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  useEffect(() => { orderService.get(id, token).then(setOrder).catch(() => setOrder(null)) }, [id, token])
  if (order === undefined) return <PageLoading />
  if (!order) return <NotFound />
  const a = order.address
  const eta = new Date(order.createdAt); eta.setDate(eta.getDate() + 7)
  return (
    <section className="container-x max-w-4xl py-12 sm:py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-16 w-16 animate-rise place-items-center rounded-full bg-wine text-ivory">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </span>
        <h1 className="font-display text-[38px] leading-tight sm:text-[52px]">Thank You For Your Order!</h1>
        <Ornament />
        <p className="max-w-md text-ink-soft">Your order has been placed successfully. A confirmation will be sent to <strong className="font-medium text-ink">{a.email}</strong>.{!user && ' Bookmark this page to check your order status later.'}</p>
      </div>

      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
        {[
          ['Order number', order.number],
          ['Order date', formatDate(order.createdAt)],
          ['Payment', order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentStatus === 'paid' ? 'Paid online' : 'Online · awaiting payment'],
          ['Estimated delivery', `By ${formatDate(eta.toISOString())}`],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 bg-ivory p-4 sm:p-5"><dt className="text-[10.5px] uppercase tracking-label text-ink-muted">{k}</dt><dd className="text-[14.5px] font-medium">{v}</dd></div>
        ))}
      </dl>

      <div className="mt-10"><StatusTracker status={order.status} /></div>

      <div className="mt-12 grid gap-10 md:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-[24px]">Items</h2>
          <OrderSummary items={order.items} totals={order} couponCode={order.couponCode} />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-[24px]">Delivery address</h2>
          <address className="not-italic leading-relaxed text-ink-soft">
            <span className="text-ink">{a.fullName}</span><br />{a.house}, {a.address}<br />{a.area && <>{a.area}<br /></>}{a.city}, {a.state} {a.pincode}<br />{a.country}<br />{a.mobile}
          </address>
          <p className="text-[13px] text-ink-muted">Orders are dispatched in 1–2 working days and delivered in {site.shipping.estimate}.</p>
          <p className="text-[13.5px] text-ink-soft">Questions about your order? Email <span className="select-all text-ink">{site.email}</span> with your order number.</p>
        </div>
      </div>

      <div className="mt-14 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/shop" className="btn-primary">Continue shopping</Link>
        <Link to={user ? `/account/orders/${order.id}` : `/order/${order.id}?t=${encodeURIComponent(token ?? '')}`} className="btn-outline">View my order</Link>
      </div>
    </section>
  )
}
