import type { SVGProps } from 'react'
type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p })

export const SearchIcon = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
export const UserIcon = (p: P) => <svg {...base(p)}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" /></svg>
export const BagIcon = (p: P) => <svg {...base(p)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
export const MenuIcon = (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
export const CloseIcon = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
export const ChevronIcon = (p: P) => <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
export const PlusIcon = (p: P) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
export const MinusIcon = (p: P) => <svg {...base(p)}><path d="M5 12h14" /></svg>
export const TruckIcon = (p: P) => <svg {...base(p)}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>
export const ReturnIcon = (p: P) => <svg {...base(p)}><path d="M4 9h11a5 5 0 0 1 0 10H8" /><path d="m8 5-4 4 4 4" /></svg>
export const ShieldIcon = (p: P) => <svg {...base(p)}><path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
export const NeedleIcon = (p: P) => <svg {...base(p)}><path d="M19 5 7 17l-2 2" /><ellipse cx="18" cy="6" rx="1" ry="2" transform="rotate(45 18 6)" /><path d="M5 19c3-1 4-4 8-4" /></svg>
export const InstagramIcon = (p: P) => <svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" /></svg>
export const FacebookIcon = (p: P) => <svg {...base(p)}><path d="M14 8h3V4.5h-3a4 4 0 0 0-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.7-3.5h-3.2V8.6c0-.3.2-.6.5-.6Z" /></svg>
export const WhatsAppIcon = (p: P) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.3 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.3 1 2.5.1.2 1.7 2.6 4.1 3.7 1.5.6 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.4-.2Z" />
  </svg>
)
export const StoreIcon = (p: P) => <svg {...base(p)}><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.5 12v8h13v-8M10 20v-5h4v5" /></svg>
