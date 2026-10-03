import { useEffect, useState } from 'react'
import { adminService } from '../../services/adminService'
import { setSettings, type Settings } from '../../config/site'
import PageLoading from '../../components/ui/PageLoading'

export default function AdminSettings() {
  const [s, setS] = useState<Settings | null>(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { adminService.settings().then(setS).catch((e) => setError(e.message)) }, [])
  if (!s) return error ? <p className="text-wine">{error}</p> : <PageLoading />
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v })

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(''); setError('')
    try { const saved = await adminService.saveSettings(s); setSettings(saved); setS(saved); setMsg('Settings saved. The website uses them from the next page load.') }
    catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  const text = (k: keyof Settings, label: string, hint?: string, type = 'text') => (
    <div className="field"><label htmlFor={`st-${k}`}>{label}</label><input id={`st-${k}`} type={type} className="input" value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} />{hint && <span className="text-[12px] text-ink-muted">{hint}</span>}</div>
  )
  const num = (k: keyof Settings, label: string, hint?: string) => (
    <div className="field"><label htmlFor={`st-${k}`}>{label}</label><input id={`st-${k}`} inputMode="numeric" className="input" value={String(s[k])} onChange={(e) => set(k, Number(e.target.value.replace(/\D/g, '') || 0) as never)} />{hint && <span className="text-[12px] text-ink-muted">{hint}</span>}</div>
  )
  const area = (k: keyof Settings, label: string) => (
    <div className="field sm:col-span-2"><label htmlFor={`st-${k}`}>{label}</label><textarea id={`st-${k}`} rows={4} className="input h-auto py-3" value={s[k] as string} onChange={(e) => set(k, e.target.value as never)} /></div>
  )
  const check = (k: keyof Settings, label: string, hint?: string) => (
    <label className="flex items-start gap-3 text-[14px] sm:col-span-2"><input id={`st-${k}`} type="checkbox" checked={s[k] as boolean} onChange={(e) => set(k, e.target.checked as never)} className="mt-1 h-4 w-4 accent-[#5C1A2B]" /><span>{label}{hint && <span className="block text-[12px] text-ink-muted">{hint}</span>}</span></label>
  )
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-4 border border-line bg-ivory p-5 sm:p-6"><h2 className="font-display text-[24px]">{title}</h2><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>
  )

  return (
    <form onSubmit={save} className="flex max-w-4xl flex-col gap-6" noValidate>
      <header><h1 className="font-display text-[34px]">Settings</h1><p className="text-[14px] text-ink-soft">These details appear across the website.</p></header>
      {Section({ title: 'Brand & contact', children: <>
        {text('brandName', 'Brand name')}
        {text('tagline', 'Tagline')}
        {text('contactEmail', 'Contact email', undefined, 'email')}
        {text('businessPhone', 'Business phone', 'Shown on the Contact page. Leave empty to hide.')}
        {text('whatsappNumber', 'WhatsApp number', 'Digits with country code, e.g. 919812345678. Leave empty to hide all WhatsApp buttons.')}
        {text('whatsappMessage', 'WhatsApp greeting message')}
        {text('city', 'Based in')}
      </> })}
      {Section({ title: 'Social media', children: <>
        {text('instagramHandle', 'Instagram handle', 'Without the @')}
        {text('facebookUrl', 'Facebook page link', 'Starts with https://')}
        {text('youtubeUrl', 'YouTube link', 'Starts with https://')}
      </> })}
      <section className="flex flex-col gap-4 border border-line bg-ivory p-5 sm:p-6">
        <h2 className="font-display text-[24px]">Stores</h2>
        {s.stores.map((st, i) => (
          <div key={i} className="grid gap-3 border-b border-line pb-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
            <div className="field"><label htmlFor={`store-name-${i}`}>Store name</label><input id={`store-name-${i}`} className="input" value={st.name} onChange={(e) => set('stores', s.stores.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></div>
            <div className="field"><label htmlFor={`store-city-${i}`}>City</label><input id={`store-city-${i}`} className="input" value={st.city} onChange={(e) => set('stores', s.stores.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)))} /></div>
            <div className="field"><label htmlFor={`store-addr-${i}`}>Address (optional)</label><input id={`store-addr-${i}`} className="input" value={st.address} onChange={(e) => set('stores', s.stores.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)))} /></div>
            <button type="button" onClick={() => set('stores', s.stores.filter((_, j) => j !== i))} className="h-12 text-[12px] uppercase tracking-label text-ink-muted hover:text-wine">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => set('stores', [...s.stores, { name: '', city: '', address: '' }])} className="btn-outline self-start">+ Add store</button>
      </section>
      {Section({ title: 'Shipping & payment', children: <>
        {num('shippingCharge', 'Shipping charge (₹)')}
        {num('freeShippingThreshold', 'Free shipping above (₹)')}
        {text('deliveryEstimate', 'Delivery time', 'e.g. 4–7 working days')}
        <div className="field"><label htmlFor="st-currency">Currency</label><select id="st-currency" className="input" value={s.currency} onChange={() => {}}><option value="INR">Indian Rupee (₹)</option></select></div>
        {check('codEnabled', 'Offer Cash on Delivery')}
        {num('codMaxOrder', 'Maximum order value for COD (₹)')}
        {check('onlinePaymentsEnabled', 'Offer online payment (UPI, cards)', 'Keep this off until the Razorpay connection is set up — orders would otherwise wait for payment that can’t be taken.')}
      </> })}
      {Section({ title: 'Policies', children: <>
        {area('shippingPolicy', 'Shipping policy')}
        {area('returnPolicy', 'Return policy')}
      </> })}
      {error && <p role="alert" className="border-l-2 border-wine bg-ivory px-3 py-2 text-[13.5px] text-wine">{error}</p>}
      {msg && <p role="status" className="border-l-2 border-[#2F6B4A] bg-ivory px-3 py-2 text-[13.5px] text-[#2F6B4A]">{msg}</p>}
      <div className="sticky bottom-0 -mx-4 border-t border-line bg-[#F6F2EA] px-4 py-4 sm:-mx-8 sm:px-8"><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
    </form>
  )
}
