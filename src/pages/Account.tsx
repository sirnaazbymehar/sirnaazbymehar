import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { orderService } from '../services/orderService'
import { authService } from '../services/authService'
import StatusTracker from '../components/ui/StatusTracker'
import PageLoading from '../components/ui/PageLoading'
import CheckoutForm, { emptyAddress, validate, type Errors } from '../components/checkout/CheckoutForm'
import { FormError } from './auth/AuthCard'
import { formatDate, formatPrice } from '../lib/format'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import type { Address, Order, SavedAddress } from '../types'

const tabs = [
  { key: 'orders', label: 'Orders' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'profile', label: 'Profile' },
] as const
type Tab = (typeof tabs)[number]['key']

export default function Account() {
  useDocumentMeta('My Account — Sirnaaz by Mehar')
  const { user, ready, logout } = useAuth()
  const { wishlist } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'orders'

  if (!ready) return <PageLoading />
  if (!user) return <Navigate to="/login?next=/account" replace />

  return (
    <section className="container-x py-10 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] sm:text-[50px]">My Account</h1>
          <p className="text-[14px] text-ink-soft">Signed in as {user.name} · {user.email}</p>
        </div>
        <div className="flex items-center gap-5 text-[12px] uppercase tracking-label">
          <Link to="/wishlist" className="text-ink-soft hover:text-wine">Wishlist ({wishlist.length})</Link>
          <button onClick={logout} className="text-wine underline-offset-4 hover:underline">Sign out</button>
        </div>
      </div>

      <div className="no-scrollbar mt-8 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setParams({ tab: t.key })}
            className={`-mb-px shrink-0 border-b-2 pb-3 text-[12px] uppercase tracking-label ${tab === t.key ? 'border-wine text-wine' : 'border-transparent text-ink-muted hover:text-ink'}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'orders' && <Orders />}
        {tab === 'addresses' && <Addresses />}
        {tab === 'profile' && <Profile />}
      </div>
    </section>
  )
}

function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { orderService.mine().then(setOrders).catch((e) => setError(e.message)) }, [])
  if (error) return <FormError message={error} />
  if (!orders) return <PageLoading />
  if (!orders.length) return (
    <div className="flex flex-col items-start gap-4 border border-line p-6">
      <p className="text-ink-soft">You haven't placed an order yet.</p>
      <Link to="/shop" className="btn-primary">Start shopping</Link>
    </div>
  )
  return (
    <div className="flex flex-col gap-5">
      {orders.map((o) => (
        <article key={o.id} className="flex flex-col gap-5 border border-line p-5 sm:p-6">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-col"><span className="text-[15px] font-medium">{o.number}</span><span className="text-[12.5px] text-ink-muted">Placed {formatDate(o.createdAt)}</span></div>
            <span className="text-[16px] font-medium tabular-nums">{formatPrice(o.total)}</span>
          </header>
          <StatusTracker status={o.status} />
          <ul className="flex flex-col gap-1 text-[13.5px] text-ink-soft">
            {o.items.map((i) => <li key={i.productId + i.size}>{i.name} · Size {i.size} · Qty {i.quantity}</li>)}
          </ul>
          <Link to={`/account/orders/${o.id}`} className="self-start text-[12px] uppercase tracking-label text-wine underline-offset-4 hover:underline">View order details</Link>
        </article>
      ))}
    </div>
  )
}

function Addresses() {
  const { user } = useAuth()
  const [list, setList] = useState<SavedAddress[] | null>(null)
  const [editing, setEditing] = useState<(Address & { id?: string; isDefault: boolean }) | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [error, setError] = useState('')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const load = () => authService.addresses().then(setList).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const errs = validate({ ...editing, email: user!.email })
    setErrors(errs)
    if (Object.keys(errs).length) return
    const { id, email: _omit, ...body } = editing
    void _omit
    try {
      if (id) await authService.updateAddress(id, body); else await authService.addAddress(body)
      setEditing(null); setError(''); load()
    } catch (err) { setError((err as Error).message) }
  }

  if (!list) return error ? <FormError message={error} /> : <PageLoading />
  if (editing) return (
    <form onSubmit={save} noValidate className="flex max-w-2xl flex-col gap-6">
      <h2 className="font-display text-[26px]">{editing.id ? 'Edit address' : 'Add an address'}</h2>
      <FormError message={error} />
      <CheckoutForm value={editing} onChange={(a) => setEditing({ ...editing, ...a })} errors={errors} hideEmail />
      <label className="flex items-center gap-3 text-[14px]"><input id="addr-default" type="checkbox" checked={editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} className="h-4 w-4 accent-[#5C1A2B]" />Use as my default address</label>
      <div className="flex gap-3"><button className="btn-primary">Save address</button><button type="button" onClick={() => { setEditing(null); setErrors({}) }} className="btn-outline">Cancel</button></div>
    </form>
  )
  return (
    <div className="flex flex-col gap-5">
      <FormError message={error} />
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <div key={a.id} className="flex flex-col gap-3 border border-line p-5">
            <address className="not-italic text-[14px] leading-relaxed text-ink-soft">
              <span className="text-ink">{a.fullName}</span>{a.isDefault && <span className="ml-2 bg-gold-pale px-2 py-0.5 text-[10.5px] uppercase tracking-label text-wine-deep">Default</span>}<br />
              {a.house}, {a.address}<br />{a.area && <>{a.area}<br /></>}{a.city}, {a.state} {a.pincode}<br />{a.mobile}
            </address>
            <div className="flex gap-4 text-[12px] uppercase tracking-label">
              <button onClick={() => setEditing({ ...a })} className="text-wine">Edit</button>
              {confirmDel === a.id ? (
                <span className="flex gap-3 normal-case tracking-normal"><span className="text-ink-soft">Delete this address?</span>
                  <button onClick={async () => { await authService.deleteAddress(a.id).catch(() => {}); setConfirmDel(null); load() }} className="text-wine underline">Delete</button>
                  <button onClick={() => setConfirmDel(null)} className="text-ink-muted underline">Keep</button></span>
              ) : <button onClick={() => setConfirmDel(a.id)} className="text-ink-muted">Delete</button>}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setEditing({ ...emptyAddress, fullName: user!.name, mobile: user!.phone, isDefault: list.length === 0 })} className="btn-outline self-start">+ Add address</button>
    </div>
  )
}

function Profile() {
  const { user, refresh } = useAuth()
  const { notify } = useStore()
  const [name, setName] = useState(user!.name)
  const [phone, setPhone] = useState(user!.phone)
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState('')
  const [pwError, setPwError] = useState('')

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try { await authService.updateProfile({ name, phone }); await refresh(); notify('Profile saved') } catch (err) { setError((err as Error).message) }
  }
  const savePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError('')
    try { await authService.changePassword(cur, next); setCur(''); setNext(''); notify('Password changed') } catch (err) { setPwError((err as Error).message) }
  }
  return (
    <div className="grid max-w-3xl gap-12 md:grid-cols-2">
      <form onSubmit={saveProfile} className="flex flex-col gap-4">
        <h2 className="font-display text-[24px]">Your details</h2>
        <FormError message={error} />
        <div className="field"><label htmlFor="pr-name">Full name</label><input id="pr-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor="pr-email">Email</label><input id="pr-email" className="input opacity-70" value={user!.email} readOnly /></div>
        <div className="field"><label htmlFor="pr-phone">Mobile</label><input id="pr-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <button className="btn-primary self-start">Save details</button>
      </form>
      <form onSubmit={savePw} className="flex flex-col gap-4">
        <h2 className="font-display text-[24px]">Change password</h2>
        <FormError message={pwError} />
        <div className="field"><label htmlFor="pr-cur">Current password</label><input id="pr-cur" type="password" autoComplete="current-password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="field"><label htmlFor="pr-new">New password</label><input id="pr-new" type="password" autoComplete="new-password" className="input" value={next} onChange={(e) => setNext(e.target.value)} /></div>
        <button className="btn-outline self-start" disabled={!cur || next.length < 8}>Update password</button>
      </form>
    </div>
  )
}
