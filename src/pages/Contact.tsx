import { useState } from 'react'
import { instagramUrl, mailtoUrl, site, storeLabel, storesSummary, whatsappEnabled, whatsappUrl } from '../config/site'
import { WhatsAppIcon } from '../components/ui/Icons'
import { InstagramIcon, StoreIcon } from '../components/ui/Icons'
import Ornament from '../components/ui/Ornament'
import { formatPrice } from '../lib/format'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const policies = () => [
  { id: 'shipping', title: 'Shipping & Delivery', body: `${site.shippingPolicy}

Shipping is free on orders above ${formatPrice(site.shipping.freeAbove)}; below that a flat ${formatPrice(site.shipping.flatRate)} applies.` },
  { id: 'returns', title: 'Returns', body: site.returnPolicy || `If there is a problem with your order, email us at ${site.email} with your order number and we will help you.` },
  { id: 'privacy', title: 'Privacy Policy', body: 'We collect only the details needed to deliver your order and keep you updated: your name, contact details and address. We never sell your information. Passwords are stored in encrypted (hashed) form, and we do not see or store card details.' },
  { id: 'terms', title: 'Terms & Conditions', body: 'Prices are in Indian Rupees and include applicable taxes. Colours may vary slightly from photographs due to lighting and screen settings. We reserve the right to cancel an order if an item becomes unavailable, with a full refund.' },
]

export default function Contact() {
  useDocumentMeta('Contact Us — Sirnaaz by Mehar', `Visit Sirnaaz by Mehar${site.stores.length ? ` in ${storesSummary()}` : ''}, or reach us by email and Instagram.`)
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  return (
    <>
      <section className="bg-sand/50">
        <div className="container-x flex flex-col items-center gap-3 py-14 text-center sm:py-20">
          <span className="text-[11px] uppercase tracking-brand text-gold">We'd love to hear from you</span>
          <h1 className="font-display text-[42px] sm:text-[56px]">Contact Us</h1>
          <Ornament />
        </div>
      </section>

      <section className="container-x grid gap-14 py-14 sm:py-20 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <p className="max-w-md text-[16px] leading-relaxed text-ink-soft">Write to us, send a message on Instagram, or visit one of our stores to see the collection in person.</p>
          <dl className="flex flex-col divide-y divide-line border-y border-line">
            {[
              ['Email', site.email],
              ...(site.phone ? [['Phone', site.phone]] : []),
              ['Instagram', `@${site.instagramHandle}`],
              ['Based in', site.city],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                <dt className="text-[11px] uppercase tracking-label text-ink-muted">{k}</dt>
                <dd className="select-all text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row">
            {whatsappEnabled() && <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn-primary"><WhatsAppIcon width={18} />Chat on WhatsApp</a>}
            <a href={instagramUrl()} target="_blank" rel="noreferrer" className="btn-outline"><InstagramIcon width={18} />Message on Instagram</a>
          </div>
        </div>

        <form className="flex flex-col gap-4 bg-sand/60 p-6 sm:p-8" onSubmit={(e) => e.preventDefault()}>
          <h2 className="font-display text-[26px]">Send us a message</h2>
          <div className="field"><label htmlFor="ct-name">Your name</label><input id="ct-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
          <div className="field"><label htmlFor="ct-msg">Message</label><textarea id="ct-msg" rows={5} className="input h-auto py-3" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask about sizing, an order, or a custom request" /></div>
          <a href={mailtoUrl(`Enquiry from ${name || 'the website'}`, msg)} aria-disabled={!msg.trim()} className={`btn-primary ${!msg.trim() ? 'pointer-events-none opacity-45' : ''}`}>Send by email</a>
          <p className="text-[12px] text-ink-muted">Opens your email app with the message filled in. You can also write to <span className="select-all">{site.email}</span>.</p>
        </form>
      </section>

      {site.stores.length > 0 && <section id="stores" className="scroll-mt-40 border-t border-line bg-sand/40">
        <div className="container-x flex flex-col gap-10 py-14 sm:py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[11px] uppercase tracking-brand text-gold">Visit us</span>
            <h2 className="font-display text-[34px] sm:text-[42px]">Our Stores</h2>
            <Ornament />
          </div>
          <ul className="mx-auto grid w-full max-w-3xl gap-4 sm:grid-cols-2">
            {site.stores.map((s) => (
              <li key={s.name} className="flex items-start gap-4 border border-line bg-ivory p-6">
                <StoreIcon className="mt-1 shrink-0 text-gold" />
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-[24px] leading-tight">{storeLabel(s)}</h3>
                  <span className="whitespace-pre-line text-[13.5px] text-ink-soft">{s.address || `${site.name} store`}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>}

      <section className="border-t border-line bg-ivory">
        <div className="container-x grid gap-10 py-14 sm:py-20 md:grid-cols-2">
          {policies().map((p) => (
            <article key={p.id} id={p.id} className="flex scroll-mt-40 flex-col gap-3">
              <h2 className="font-display text-[26px]">{p.title}</h2>
              <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-soft">{p.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
