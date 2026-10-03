import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { priceCart } from '../../services/orderService'
import { formatPrice } from '../../lib/format'
import { CloseIcon } from '../ui/Icons'
import CartItemRow from './CartItemRow'
import FreeShippingBar from './FreeShippingBar'

export default function CartDrawer() {
  const { cart, cartCount, drawerOpen, setDrawerOpen } = useStore()
  const nav = useNavigate()
  const { subtotal } = priceCart(cart)
  const close = () => setDrawerOpen(false)

  useEffect(() => {
    if (!drawerOpen) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  })

  if (!drawerOpen) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="absolute inset-0 animate-fade bg-wine-deep/40" onClick={close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[440px] animate-slideIn flex-col bg-ivory shadow-2xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-7">
          <h2 className="font-display text-[26px]">Your Bag <span className="text-[16px] text-ink-muted">({cartCount})</span></h2>
          <button onClick={close} className="-mr-2 grid h-11 w-11 place-items-center" aria-label="Close bag"><CloseIcon /></button>
        </header>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="font-display text-[24px]">Your bag is empty</p>
            <p className="text-[14px] text-ink-soft">Find something you love in our latest edit.</p>
            <button className="btn-primary" onClick={() => { close(); nav('/shop?category=new-arrivals') }}>Shop new arrivals</button>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-4 sm:px-7"><FreeShippingBar subtotal={subtotal} /></div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5 sm:px-7">
              {cart.map((i) => <CartItemRow key={i.productId + i.size} item={i} onNavigate={close} />)}
            </ul>
            <footer className="flex flex-col gap-3 border-t border-line bg-sand/60 px-5 py-5 sm:px-7">
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] uppercase tracking-label text-ink-soft">Subtotal</span>
                <span className="text-[20px] font-medium tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[12px] text-ink-muted">Shipping and discounts are calculated at checkout.</p>
              <button className="btn-primary w-full" onClick={() => { close(); nav('/checkout') }}>Proceed to checkout</button>
              <Link to="/cart" onClick={close} className="text-center text-[12px] uppercase tracking-label text-ink-soft underline-offset-4 hover:underline">View full bag</Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
