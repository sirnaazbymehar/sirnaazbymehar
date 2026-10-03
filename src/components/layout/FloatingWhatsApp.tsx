import { useLocation } from 'react-router-dom'
import { whatsappEnabled, whatsappUrl } from '../../config/site'
import { WhatsAppIcon } from '../ui/Icons'

export default function FloatingWhatsApp() {
  const { pathname } = useLocation()
  if (!whatsappEnabled() || pathname.startsWith('/admin') || pathname === '/checkout') return null
  const onProduct = /^\/shop\/.+/.test(pathname)
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#1F7A4D] text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,.45)] transition-transform hover:scale-105 sm:right-6 ${onProduct ? 'bottom-[92px] lg:bottom-6' : 'bottom-5 sm:bottom-6'}`}
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <WhatsAppIcon />
    </a>
  )
}
