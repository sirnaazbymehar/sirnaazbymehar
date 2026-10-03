import { z } from 'zod'
import { q } from '../db/pool'

export const settingsSchema = z.object({
  brandName: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(160),
  instagramHandle: z.string().trim().max(60).regex(/^[A-Za-z0-9._]*$/, 'Instagram handle can only contain letters, numbers, dots and underscores'),
  facebookUrl: z.string().trim().max(200).refine((v) => !v || /^https:\/\//.test(v), 'Facebook link must start with https://'),
  youtubeUrl: z.string().trim().max(200).refine((v) => !v || /^https:\/\//.test(v), 'YouTube link must start with https://'),
  whatsappNumber: z.string().trim().regex(/^(\d{10,15})?$/, 'WhatsApp number: digits only with country code, e.g. 919812345678 (leave empty to hide WhatsApp)'),
  whatsappMessage: z.string().trim().max(300),
  contactEmail: z.string().trim().email(),
  businessPhone: z.string().trim().max(30),
  city: z.string().trim().max(80),
  stores: z.array(z.object({ name: z.string().trim().min(1).max(80), city: z.string().trim().max(80), address: z.string().trim().max(300).default('') })).max(10),
  currency: z.literal('INR'),
  shippingCharge: z.number().int().min(0).max(5000),
  freeShippingThreshold: z.number().int().min(0).max(1000000),
  deliveryEstimate: z.string().trim().max(60),
  codEnabled: z.boolean(),
  codMaxOrder: z.number().int().min(0).max(1000000),
  onlinePaymentsEnabled: z.boolean(),
  shippingPolicy: z.string().trim().max(4000),
  returnPolicy: z.string().trim().max(4000),
})
export type Settings = z.infer<typeof settingsSchema>

export const defaultSettings: Settings = {
  brandName: 'Sirnaaz by Mehar',
  tagline: 'Timeless Pakistani fashion, curated with love.',
  instagramHandle: 'SirnaazByMehar',
  facebookUrl: '',
  youtubeUrl: '',
  whatsappNumber: '',
  whatsappMessage: 'Hi Sirnaaz by Mehar, I would like to know more about your products.',
  contactEmail: 'sirnaazbymehar@gmail.com',
  businessPhone: '',
  city: 'New Delhi',
  stores: [
    { name: 'Model Town', city: 'Delhi', address: '' },
    { name: 'Jammu', city: 'Jammu', address: '' },
  ],
  currency: 'INR',
  shippingCharge: 99,
  freeShippingThreshold: 2499,
  deliveryEstimate: '4–7 working days',
  codEnabled: true,
  codMaxOrder: 10000,
  onlinePaymentsEnabled: false, // switch on once Razorpay is connected
  shippingPolicy: 'We ship across India. Orders are dispatched within 1–2 working days and usually arrive in 4–7 working days. You will receive tracking details by email once your order ships.',
  returnPolicy: 'If there is a problem with your order, email us at sirnaazbymehar@gmail.com with your order number and we will help you.',
}

let cache: { value: Settings; at: number } | null = null

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < 10_000) return cache.value
  const r = await q<{ data: Settings }>('SELECT data FROM site_settings WHERE id = 1')
  const value = { ...defaultSettings, ...(r.rows[0]?.data ?? {}) }
  cache = { value, at: Date.now() }
  return value
}

export async function saveSettings(s: Settings) {
  await q(`INSERT INTO site_settings (id, data, updated_at) VALUES (1, $1, now())
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`, [s])
  cache = null
}
