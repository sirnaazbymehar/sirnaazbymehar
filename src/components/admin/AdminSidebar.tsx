import { NavLink, Link } from 'react-router-dom'
const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/settings', label: 'Settings' },
]
export default function AdminSidebar({ onSignOut }: { onSignOut: () => void }) {
  return (
    <aside className="flex flex-col gap-1 bg-wine-deep text-ivory/80 lg:min-h-screen lg:w-60 lg:shrink-0">
      <div className="flex items-center justify-between px-5 py-5 lg:flex-col lg:items-start lg:gap-1">
        <span className="font-brand text-[18px] tracking-[0.2em] text-ivory">SIRNAAZ</span>
        <span className="text-[10px] uppercase tracking-brand text-gold-soft">Store admin</span>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0" aria-label="Admin">
        <span className="sr-only">Admin sections</span>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `shrink-0 px-3 py-2.5 text-[13px] tracking-wide ${isActive ? 'bg-ivory/10 text-ivory' : 'hover:bg-ivory/5'}`}>{l.label}</NavLink>
        ))}
      </nav>
      <div className="flex gap-4 px-5 pb-3 text-[12px] lg:hidden">
        <Link to="/" className="hover:text-ivory">View store</Link>
        <button onClick={onSignOut} className="hover:text-ivory">Sign out</button>
      </div>
      <div className="mt-auto hidden flex-col gap-2 p-5 text-[12px] lg:flex">
        <Link to="/" className="hover:text-ivory">← View store</Link>
        <button onClick={onSignOut} className="text-left hover:text-ivory">Sign out</button>
      </div>
    </aside>
  )
}
