import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { BagIcon, CloseIcon, HeartIcon, InstagramIcon, MenuIcon, SearchIcon, UserIcon } from '../ui/Icons'
import SearchOverlay from './SearchOverlay'
import { instagramUrl, site, storesSummary } from '../../config/site'

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?category=new-arrivals', label: 'New Arrivals' },
  { to: '/shop?category=pakistani-suits', label: 'Pakistani Suits' },
  { to: '/shop?category=coord-sets', label: 'Co-ord Sets' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Wordmark({ light = false, className = '' }: { light?: boolean; className?: string }) {
  return (
    <span className={`flex flex-col items-center leading-none ${light ? 'text-ivory' : 'text-ink'} ${className}`}>
      <span className="font-brand text-[24px] tracking-[0.2em] sm:text-[28px]">SIRNAAZ</span>
      <span className={`mt-1.5 flex items-center gap-2 font-brand text-[9.5px] tracking-[0.42em] ${light ? 'text-gold-soft' : 'text-gold'}`}>
        <span className="h-px w-4 bg-current opacity-70" />BY MEHAR<span className="h-px w-4 bg-current opacity-70" />
      </span>
    </span>
  )
}

export default function Navbar() {
  const { cartCount, wishlist, setDrawerOpen } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()

  useEffect(() => { setMenuOpen(false); setSearchOpen(false) }, [loc.pathname, loc.search])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }, [menuOpen])

  const isActive = (to: string) => {
    const [path, qs] = to.split('?')
    if (qs) return loc.pathname === path && loc.search === `?${qs}`
    if (path === '/shop') return loc.pathname === '/shop' && !loc.search.includes('category=')
    return loc.pathname === path
  }

  const iconBtn = 'relative grid h-11 w-11 place-items-center text-ink transition-colors hover:text-wine'

  return (
    <>
      <div className="bg-wine-deep text-ivory/90">
        <p className="container-x py-2 text-center text-[11px] tracking-[0.14em] sm:text-[12px]">
          <span className="hidden sm:inline">Free shipping across India on orders above </span><span className="sm:hidden">Free shipping above </span>₹{site.shipping.freeAbove.toLocaleString('en-IN')}{site.stores.length > 0 && <span className="hidden sm:inline"> · Stores in {storesSummary()}</span>}
        </p>
      </div>

      <header style={{ top: 'env(safe-area-inset-top, 0px)' }} className={`sticky top-0 z-40 border-b transition-[background,box-shadow] duration-300 ${scrolled ? 'border-line bg-ivory/95 shadow-[0_6px_24px_-18px_rgba(62,15,28,.45)] backdrop-blur' : 'border-transparent bg-ivory'}`}>
        <div className="container-x grid grid-cols-[1fr_auto_1fr] items-center py-2.5 sm:py-3">
          <div className="flex items-center">
            <button className={`${iconBtn} lg:hidden -ml-2.5`} aria-label="Open menu" onClick={() => setMenuOpen(true)}><MenuIcon /></button>
            <button className={iconBtn} aria-label="Search" onClick={() => setSearchOpen(true)}><SearchIcon /></button>
          </div>
          <Link to="/" aria-label="Sirnaaz by Mehar — home"><Wordmark /></Link>
          <div className="flex items-center justify-end">
            <Link to="/wishlist" className={`${iconBtn} hidden sm:grid`} aria-label="Wishlist">
              <HeartIcon />
              {wishlist.length > 0 && <span className="absolute right-1.5 top-2 h-1.5 w-1.5 rounded-full bg-wine" />}
            </Link>
            <Link to="/account" className={`${iconBtn} hidden sm:grid`} aria-label="Account"><UserIcon /></Link>
            <button className={`${iconBtn} -mr-2.5`} aria-label={`Bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`} onClick={() => setDrawerOpen(true)}>
              <BagIcon />
              {cartCount > 0 && (
                <span key={cartCount} className="absolute right-0.5 top-1 grid h-[18px] min-w-[18px] animate-fade place-items-center rounded-full bg-wine px-1 text-[10px] font-medium text-ivory tabular-nums">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
        <nav className="hidden border-t border-line/70 lg:block" aria-label="Main">
          <ul className="container-x flex justify-center gap-9 py-3">
            {navLinks.map((l) => (
              <li key={l.label}>
                <NavLink to={l.to} className={`link-u text-[12px] uppercase tracking-label ${isActive(l.to) ? 'text-wine after:scale-x-100' : 'text-ink-soft hover:text-ink'}`}>{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade bg-wine-deep/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slideLeft flex-col bg-ivory" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <Wordmark className="!items-start" />
              <button className="grid h-11 w-11 place-items-center" aria-label="Close menu" onClick={() => setMenuOpen(false)}><CloseIcon /></button>
            </div>
            <ul className="flex flex-col px-5 py-3">
              {navLinks.map((l) => (
                <li key={l.label} className="border-b border-line/70">
                  <Link to={l.to} className={`flex items-center justify-between py-4 font-display text-[22px] ${isActive(l.to) ? 'text-wine' : 'text-ink'}`}>{l.label}</Link>
                </li>
              ))}
              <li><Link to="/shop?category=festive-edit" className="flex py-4 font-display text-[22px] text-ink">Festive Edit</Link></li>
            </ul>
            <div className="mt-auto grid grid-cols-3 border-t border-line text-[11px] uppercase tracking-label text-ink-soft" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <Link to="/wishlist" className="flex flex-col items-center gap-1.5 py-4"><HeartIcon />Wishlist</Link>
              <Link to="/account" className="flex flex-col items-center gap-1.5 border-x border-line py-4"><UserIcon />Account</Link>
              <a href={instagramUrl()} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 py-4"><InstagramIcon />Instagram</a>
            </div>
          </div>
        </div>
      )}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}
