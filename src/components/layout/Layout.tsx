import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import FloatingWhatsApp from './FloatingWhatsApp'
import Toast from './Toast'
import CartDrawer from '../cart/CartDrawer'

export default function Layout() {
  const { pathname, search } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [pathname, search])
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main key={pathname} className="flex-1 animate-fade">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
      <Toast />
    </div>
  )
}
