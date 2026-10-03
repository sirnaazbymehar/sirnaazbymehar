import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { orderService, priceCart, validateCoupon } from '../services/orderService'
import { productService } from '../services/productService'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import CheckoutForm, { emptyAddress, validate, type Errors } from '../components/checkout/CheckoutForm'
import OrderSummary from '../components/checkout/OrderSummary'
import { ShieldIcon } from '../components/ui/Icons'
import { site } from '../config/site'
import { formatPrice } from '../lib/format'
import { load, save } from '../lib/storage'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import type { Address, Coupon, PaymentMethod } from '../types'

const CHECKOUT_KEY = 'sbm.checkoutKey'
const randomKey = () => crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')

export default function Checkout() {
  useDocumentMeta('Checkout — Sirnaaz by Mehar')
  const { cart, clearCart } = useStore()
  const { user } = useAuth()
  const nav = useNavigate()
  const [address, setAddress] = useState<Address>(() => load('sbm.address', emptyAddress))
  const [errors, setErrors] = useState<Errors>({})
  const [method, setMethod] = useState<PaymentMethod>(site.onlinePaymentsEnabled ? 'online' : 'cod')
  const [checking, setChecking] = useState(false)

  // Signed in: start from the default saved address and account email.
  useEffect(() => {
    if (!user) return
    authService.addresses().then((list) => {
      const d = list.find((a) => a.isDefault) ?? list[0]
      setAddress((cur) => d && !cur.house ? { ...d, email: user.email, country: 'India' } : { ...cur, email: cur.email || user.email, fullName: cur.fullName || user.name })
    }).catch(() => {})
  }, [user])
  const [code, setCode] = useState('')
  const [coupon, setCoupon] = useState<Coupon | undefined>()
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [placing, setPlacing] = useState(false)
  const [payError, setPayError] = useState('')

  const totals = priceCart(cart, coupon)
  const codAllowed = site.codEnabled && totals.total <= site.codMaxOrder

  if (!cart.length && !placing) return <Navigate to="/cart" replace />

  const applyCoupon = async () => {
    setChecking(true)
    try {
      const c = await validateCoupon(code, totals.subtotal)
      setCoupon(c); setCouponMsg({ ok: true, text: `${c.code} applied — ${c.description}` })
    } catch (e) {
      setCoupon(undefined); setCouponMsg({ ok: false, text: (e as Error).message })
    } finally { setChecking(false) }
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(address)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(`co-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    setPlacing(true); setPayError('')
    try {
      // One key per checkout: if this request is retried (double-click, lost response, network drop),
      // the server returns the same order instead of creating another.
      const idempotencyKey = load<string>(CHECKOUT_KEY, '') || randomKey()
      save(CHECKOUT_KEY, idempotencyKey)
      const order = await orderService.place({ items: cart, address, paymentMethod: method, couponCode: coupon?.code, idempotencyKey })
      save(CHECKOUT_KEY, '')
      save('sbm.address', address)
      clearCart()
      productService.load().catch(() => {}) // refresh stock levels
      nav(`/order/${order.id}?t=${encodeURIComponent(order.viewToken)}`, { replace: true })
    } catch (err) {
      setPlacing(false)
      setPayError((err as Error).message)
      if (err instanceof ApiError && err.status === 409) productService.load().catch(() => {})
    }
  }

  const couponSlot = (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <label htmlFor="coupon" className="text-[11px] uppercase tracking-label text-ink-soft">Promo code</label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" className="input h-11 min-w-0 flex-1 uppercase" />
        <button type="button" onClick={applyCoupon} disabled={!code.trim() || checking} className="btn-outline h-11 min-h-0 px-5">{checking ? '…' : 'Apply'}</button>
      </div>
      {couponMsg && <span className={`text-[12.5px] ${couponMsg.ok ? 'text-[#2F6B4A]' : 'text-wine'}`}>{couponMsg.text}</span>}
    </div>
  )

  return (
    <section className="container-x py-8 sm:py-12">
      <nav className="mb-6 text-[11px] uppercase tracking-label text-ink-muted" aria-label="Checkout steps">
        <Link to="/cart" className="hover:text-ink">Bag</Link><span className="mx-2">›</span><span className="text-wine">Details & payment</span><span className="mx-2">›</span><span>Confirmation</span>
      </nav>
      <h1 className="font-display text-[38px] sm:text-[48px]">Checkout</h1>

      <form onSubmit={placeOrder} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
        <div className="flex flex-col gap-10">
          <CheckoutForm value={address} onChange={setAddress} errors={errors} />

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-4 font-display text-[26px]">Payment</legend>
            <PayOption id="pay-online" checked={method === 'online'} disabled={!site.onlinePaymentsEnabled} onSelect={() => setMethod('online')} title="Pay online"
              sub={site.onlinePaymentsEnabled ? 'UPI, debit/credit cards, netbanking and wallets via Razorpay' : 'UPI, cards and netbanking — coming soon'} />
            {site.codEnabled && (
              <PayOption id="pay-cod" checked={method === 'cod'} disabled={!codAllowed} onSelect={() => setMethod('cod')} title="Cash on Delivery"
                sub={codAllowed ? 'Pay in cash or UPI when your order arrives' : `Available on orders up to ${formatPrice(site.codMaxOrder)}`} />
            )}
            <p className="mt-1 flex items-center gap-2 text-[12.5px] text-ink-muted"><ShieldIcon width={16} className="text-gold" />Payments are processed securely. We never store your card details.</p>
          </fieldset>
        </div>

        <aside className="flex flex-col gap-5 self-start bg-sand/60 p-5 sm:p-7 lg:sticky lg:top-36">
          <h2 className="font-display text-[26px]">Order summary</h2>
          <OrderSummary items={cart} totals={totals} couponSlot={couponSlot} couponCode={coupon?.code} />
          {payError && <p role="alert" className="text-[13px] text-wine">{payError}</p>}
          <button type="submit" disabled={placing || (method === 'cod' && !codAllowed) || (method === 'online' && !site.onlinePaymentsEnabled)} className="btn-primary h-14 w-full">
            {placing ? 'Placing order…' : method === 'online' ? `Pay ${formatPrice(totals.total)}` : `Place order · ${formatPrice(totals.total)}`}
          </button>
          {!user && <p className="text-center text-[12px] text-ink-muted"><Link to="/login?next=/checkout" className="underline underline-offset-4">Sign in</Link> to save this order to your account, or check out as a guest.</p>}
        </aside>
      </form>
    </section>
  )
}

function PayOption({ id, checked, onSelect, title, sub, disabled }: { id: string; checked: boolean; onSelect: () => void; title: string; sub: string; disabled?: boolean }) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-4 border p-4 transition-colors ${checked ? 'border-wine bg-white/70' : 'border-line hover:border-ink/40'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
      <input id={id} type="radio" name="payment" checked={checked} onChange={onSelect} disabled={disabled} className="mt-1 h-4 w-4 accent-[#5C1A2B]" />
      <span className="flex flex-col gap-0.5"><span className="text-[15px] font-medium">{title}</span><span className="text-[13px] text-ink-soft">{sub}</span></span>
    </label>
  )
}
