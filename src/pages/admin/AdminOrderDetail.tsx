import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { ORDER_STATUSES, payLabel, statusLabel, statusPill } from '../../components/admin/OrderTable'
import OrderSummary from '../../components/checkout/OrderSummary'
import PageLoading from '../../components/ui/PageLoading'
import { formatDate } from '../../lib/format'
import type { Order, OrderStatus } from '../../types'

export default function AdminOrderDetail() {
  const { id = '' } = useParams()
  const [o, setO] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<OrderStatus | ''>('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { adminService.order(id).then(setO).catch((e) => setError(e.message)) }, [id])
  if (error && !o) return <p className="text-wine">{error}</p>
  if (!o) return <PageLoading />
  const a = o.address
  const closed = o.status === 'cancelled' || o.status === 'refunded'
  const needsConfirm = pending === 'cancelled' || pending === 'refunded'

  const apply = async () => {
    if (!pending) return
    setBusy(true); setError(''); setMsg('')
    try { const next = await adminService.setOrderStatus(o.id, pending); setO(next); setMsg(`Status changed to ${statusLabel(pending)}.`); setPending('') }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <Link to="/admin/orders" className="text-[11px] uppercase tracking-label text-ink-muted hover:text-ink">← All orders</Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="font-display text-[34px]">Order {o.number}</h1><p className="text-[13px] text-ink-muted">Placed {formatDate(o.createdAt)} · {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p></div>
        <span className={`rounded-full px-4 py-1.5 text-[13px] ${statusPill[o.status]}`}>{statusLabel(o.status)}</span>
      </header>

      <section className="flex flex-col gap-3 border border-line bg-ivory p-5">
        <h2 className="text-[11px] uppercase tracking-label text-ink-soft">Update status</h2>
        {closed ? <p className="text-[14px] text-ink-soft">This order is {o.status}. Its stock has been returned to inventory.</p> : (
          <div className="flex flex-wrap items-center gap-3">
            <select id="status-select" aria-label="New status" value={pending} onChange={(e) => setPending(e.target.value as OrderStatus)} className="h-11 border border-line bg-white px-3 text-[14px]">
              <option value="">Choose new status…</option>
              {ORDER_STATUSES.filter((s) => s !== o.status).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <button onClick={apply} disabled={!pending || busy} className="btn-primary min-h-[44px]">{busy ? 'Saving…' : needsConfirm ? `Yes, mark ${statusLabel(pending)}` : 'Update status'}</button>
          </div>
        )}
        {needsConfirm && <p className="text-[13px] text-wine">This returns the items to stock and can’t be undone.</p>}
        {msg && <p role="status" className="text-[13px] text-[#2F6B4A]">{msg}</p>}
        {error && <p role="alert" className="text-[13px] text-wine">{error}</p>}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section className="flex flex-col gap-4 border border-line bg-ivory p-5">
          <h2 className="font-display text-[22px]">Items</h2>
          <OrderSummary items={o.items} totals={o} couponCode={o.couponCode} />
        </section>
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2 border border-line bg-ivory p-5 text-[14px]">
            <h2 className="font-display text-[22px]">Customer</h2>
            <p>{a.fullName}</p>
            <p className="select-all text-ink-soft">{a.mobile}</p>
            <p className="select-all text-ink-soft">{a.email}</p>
          </section>
          <section className="flex flex-col gap-2 border border-line bg-ivory p-5 text-[14px]">
            <h2 className="font-display text-[22px]">Ship to</h2>
            <address className="select-all not-italic leading-relaxed text-ink-soft">{a.fullName}<br />{a.house}, {a.address}<br />{a.area && <>{a.area}<br /></>}{a.city}, {a.state} {a.pincode}<br />{a.country}</address>
          </section>
          <section className="flex flex-col gap-2 border border-line bg-ivory p-5 text-[14px]">
            <h2 className="font-display text-[22px]">Payment</h2>
            <p className="text-ink-soft">{o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} · {payLabel[o.paymentStatus]}</p>
          </section>
          <section className="flex flex-col gap-2 border border-line bg-ivory p-5 text-[13.5px]">
            <h2 className="font-display text-[22px]">History</h2>
            <ol className="flex flex-col gap-1.5 text-ink-soft">
              {(o.history ?? []).map((h, i) => <li key={i}>{statusLabel(h.status)} · {formatDate(h.at)} {new Date(h.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</li>)}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
