// ─────────────────────────────────────────────────────────────
//  Store settings come from the database (Admin → Settings).
//  `site` exposes them to components; the defaults below are only
//  used for the first paint if the settings request fails.
// ─────────────────────────────────────────────────────────────
import { api } from '../lib/api'

export interface Store { name: string; city: string; address: string }
export interface Settings {
  brandName: string; tagline: string
  instagramHandle: string; facebookUrl: string; youtubeUrl: string
  whatsappNumber: string; whatsappMessage: string
  contactEmail: string; businessPhone: string; city: string; stores: Store[]
  currency: 'INR'; shippingCharge: number; freeShippingThreshold: number; deliveryEstimate: string
  codEnabled: boolean; codMaxOrder: number; onlinePaymentsEnabled: boolean
  shippingPolicy: string; returnPolicy: string
  /** Read-only, from the server: true when an email service is configured. */
  passwordResetEnabled?: boolean
}

let s: Settings = {
  brandName: 'Sirnaaz by Mehar', tagline: 'Timeless Pakistani fashion, curated with love.',
  instagramHandle: 'SirnaazByMehar', facebookUrl: '', youtubeUrl: '',
  whatsappNumber: '', whatsappMessage: 'Hi Sirnaaz by Mehar, I would like to know more about your products.',
  contactEmail: 'sirnaazbymehar@gmail.com', businessPhone: '', city: 'New Delhi',
  stores: [{ name: 'Model Town', city: 'Delhi', address: '' }, { name: 'Jammu', city: 'Jammu', address: '' }],
  currency: 'INR', shippingCharge: 99, freeShippingThreshold: 2499, deliveryEstimate: '4–7 working days',
  codEnabled: true, codMaxOrder: 10000, onlinePaymentsEnabled: false,
  shippingPolicy: '', returnPolicy: '',
}

export async function loadSettings() {
  s = await api.get<Settings>('/settings')
}
export const setSettings = (next: Settings) => { s = next }
export const getSettings = () => s

export const site = {
  get name() { return s.brandName },
  get tagline() { return s.tagline },
  get instagramHandle() { return s.instagramHandle },
  get facebookUrl() { return s.facebookUrl },
  get youtubeUrl() { return s.youtubeUrl },
  get whatsappNumber() { return s.whatsappNumber },
  get whatsappMessage() { return s.whatsappMessage },
  get email() { return s.contactEmail },
  get phone() { return s.businessPhone },
  get city() { return s.city },
  get stores() { return s.stores },
  get shipping() { return { freeAbove: s.freeShippingThreshold, flatRate: s.shippingCharge, estimate: s.deliveryEstimate } },
  get codEnabled() { return s.codEnabled },
  get codMaxOrder() { return s.codMaxOrder },
  get onlinePaymentsEnabled() { return s.onlinePaymentsEnabled },
  get shippingPolicy() { return s.shippingPolicy },
  get returnPolicy() { return s.returnPolicy },
}

export const storeLabel = (st: Store) => (st.name === st.city || !st.city ? st.name : `${st.name}, ${st.city}`)
export const storesSummary = () => site.stores.map(storeLabel).join(' & ')

export const instagramUrl = () => `https://instagram.com/${s.instagramHandle}`
export const whatsappEnabled = () => s.whatsappNumber.length > 0
export const mailtoUrl = (subject: string, body = '') =>
  `mailto:${s.contactEmail}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`
export const whatsappUrl = (message: string = s.whatsappMessage) =>
  `https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(message)}`
