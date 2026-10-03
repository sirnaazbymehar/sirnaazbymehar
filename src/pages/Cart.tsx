import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { priceCart } from '../services/orderService'
import CartItemRow from '../components/cart/CartItemRow'
import FreeShippingBar from '../components/cart/FreeShippingBar'
import { formatPrice } from '../lib/format'
import { useDocumentMeta } from '../lib/useDocumentMeta'

export default function Cart() {
  useDocumentMeta('Your Bag — Sirnaaz by Mehar')
  const { cart, cartCount } = useStore()
  const t = priceCart(cart)
  return (
    <section className="container-x py-10 sm:py-16">
      <h1 className="font-display text-[40px] sm:text-[50px]">Your Bag <span className="text-[20px] text-ink-muted">({cartCount})</span></h1>
      {cart.length === 0 ? (
        <div className="flex flex-col items-start gap-5 py-14">
          <p className="text-ink-soft">Your bag is empty.</p>
          <Link to="/shop" className="btn-primary">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-line border-y border-line">{cart.map((i) => <CartItemRow key={i.productId + i.size} item={i} />)}</ul>
          <aside className="flex flex-col gap-4 self-start bg-sand/60 p-6">
            <FreeShippingBar subtotal={t.subtotal} />
            <dl className="flex flex-col gap-2.5 border-t border-line pt-4 text-[14px]">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular-nums">{formatPrice(t.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="tabular-nums">{t.shipping ? formatPrice(t.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-[17px] font-medium"><dt>Total</dt><dd className="tabular-nums">{formatPrice(t.total)}</dd></div>
            </dl>
            <Link to="/checkout" className="btn-primary w-full">Proceed to checkout</Link>
            <Link to="/shop" className="text-center text-[12px] uppercase tracking-label text-ink-soft underline-offset-4 hover:underline">Continue shopping</Link>
          </aside>
        </div>
      )}
    </section>
  )
}
