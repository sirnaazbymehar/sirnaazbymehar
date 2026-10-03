import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService, type Stats } from '../../services/adminService'
import { useAdmin } from './AdminLayout'
import { formatPrice } from '../../lib/format'
import OrderTable from '../../components/admin/OrderTable'
import PageLoading from '../../components/ui/PageLoading'

export default function AdminDashboard() {
  const admin = useAdmin()
  const [s, setS] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { adminService.stats().then(setS).catch((e) => setError(e.message)) }, [])
  if (error) return <p className="text-wine">{error}</p>
  if (!s) return <PageLoading />
  const tiles: [string, string, boolean?][] = [
    ['Total orders', String(s.totalOrders)], ['Total revenue', formatPrice(s.totalRevenue)],
    ['Products sold', String(s.productsSold)], ['Pending orders', String(s.pendingOrders), s.pendingOrders > 0],
  ]
  return (
    <div className="flex flex-col gap-10">
      <header><h1 className="font-display text-[34px]">Good to see you{admin?.name ? `, ${admin.name}` : ''}</h1><p className="text-[14px] text-ink-soft">Here's how the store is doing. Revenue excludes cancelled and refunded orders.</p></header>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([k, v, hot]) => (
          <div key={k} className="flex flex-col gap-1 border border-line bg-ivory p-5">
            <dt className="text-[10.5px] uppercase tracking-label text-ink-muted">{k}</dt>
            <dd className={`font-display text-[32px] [font-variant-numeric:lining-nums_tabular-nums] ${hot ? 'text-wine' : ''}`}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-10 xl:grid-cols-[1fr_340px]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex items-baseline justify-between"><h2 className="font-display text-[24px]">Recent orders</h2><Link to="/admin/orders" className="text-[12px] uppercase tracking-label text-wine">All orders</Link></div>
          <OrderTable orders={s.recentOrders} />
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-[24px]">Low stock</h2>
          {s.lowStock.length === 0 ? <p className="border border-line bg-ivory p-4 text-[13.5px] text-ink-soft">Every size has at least 2 in stock.</p> : (
            <ul className="divide-y divide-line border border-line bg-ivory">
              {s.lowStock.map((l) => (
                <li key={l.id + l.size} className="flex items-center justify-between px-4 py-3 text-[13px]">
                  <span>{l.name} <span className="text-ink-muted">· {l.size}</span></span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] ${l.quantity === 0 ? 'bg-[#F1DADC] text-[#7A2632]' : 'bg-[#F4E3C3] text-[#7A5418]'}`}>{l.quantity === 0 ? 'Sold out' : `${l.quantity} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
