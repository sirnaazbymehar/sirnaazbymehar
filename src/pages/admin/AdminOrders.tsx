import { useEffect, useState } from 'react'
import { adminService } from '../../services/adminService'
import OrderTable, { ORDER_STATUSES, statusLabel } from '../../components/admin/OrderTable'
import PageLoading from '../../components/ui/PageLoading'
import type { Order } from '../../types'

export default function AdminOrders() {
  const [status, setStatus] = useState('')
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { setOrders(null); adminService.orders(status).then(setOrders).catch((e) => setError(e.message)) }, [status])
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-[34px]">Orders</h1><p className="text-[14px] text-ink-soft">Open an order to see full details and change its status.</p></div>
        <label className="flex items-center gap-2 text-[13px]">Show
          <select id="order-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 border border-line bg-ivory px-3">
            <option value="">All orders</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </label>
      </header>
      {error ? <p className="text-wine">{error}</p> : orders ? <OrderTable orders={orders} /> : <PageLoading />}
    </div>
  )
}
