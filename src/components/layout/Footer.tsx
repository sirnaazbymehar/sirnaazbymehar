import { Link } from 'react-router-dom'
import emblem from '../../assets/emblem.webp'
import { instagramUrl, site, storesSummary, whatsappEnabled, whatsappUrl } from '../../config/site'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '../ui/Icons'
import { Wordmark } from './Navbar'

const cols = [
  { title: 'Shop', links: [['All pieces', '/shop'], ['New Arrivals', '/shop?category=new-arrivals'], ['Pakistani Suits', '/shop?category=pakistani-suits'], ['Co-ord Sets', '/shop?category=coord-sets'], ['Festive Edit', '/shop?category=festive-edit']] },
  { title: 'Help', links: [['Contact', '/contact'], ['Shipping & Delivery', '/contact#shipping'], ['Returns', '/contact#returns'], ['Track my order', '/account']] },
  { title: 'Sirnaaz', links: [['About Us', '/about'], ['Privacy Policy', '/contact#privacy'], ['Terms & Conditions', '/contact#terms']] },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-wine-deep text-ivory/80">
      <img src={emblem} alt="" aria-hidden className="pointer-events-none absolute -right-24 -top-10 w-[420px] opacity-[0.09] sm:w-[520px]" />
      <div className="container-x relative grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr] lg:py-20">
        <div className="flex flex-col items-start gap-5">
          <Wordmark light className="!items-start" />
          <p className="max-w-xs font-display text-[20px] italic leading-snug text-ivory/85">“{site.tagline}”</p>
          <p className="text-[13px] leading-relaxed text-ivory/65">{site.stores.length > 0 && <>Stores in {storesSummary()}<br /></>}<span className="select-all">{site.email}</span></p>
          <div className="flex gap-2">
            {[
              { href: instagramUrl(), label: 'Instagram', icon: <InstagramIcon width={19} /> },
              ...(site.facebookUrl ? [{ href: site.facebookUrl, label: 'Facebook', icon: <FacebookIcon width={19} /> }] : []),
              ...(whatsappEnabled() ? [{ href: whatsappUrl(), label: 'WhatsApp', icon: <WhatsAppIcon width={18} /> }] : []),
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="grid h-11 w-11 place-items-center border border-ivory/25 text-ivory/85 transition-colors hover:border-gold-soft hover:text-gold-soft">{s.icon}</a>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-4">
              <h3 className="text-[11px] uppercase tracking-brand text-gold-soft">{c.title}</h3>
              <ul className="flex flex-col gap-3 text-[14px]">
                {c.links.map(([l, to]) => <li key={l}><Link to={to} className="link-u hover:text-ivory">{l}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-x flex flex-col gap-2 py-6 text-[12px] text-ivory/55 sm:flex-row sm:justify-between">
          <span>© 2026 Sirnaaz by Mehar. All rights reserved.</span>
          <span>Secure payments · UPI · Cards · Netbanking · Cash on Delivery</span>
        </div>
      </div>
    </footer>
  )
}
