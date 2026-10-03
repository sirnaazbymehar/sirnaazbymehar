import { emailEnabled, env } from '../env'

/**
 * Sends email through Resend (free tier is enough to start; OPTIONAL).
 * Always awaited before the HTTP response is returned — serverless functions may stop as soon as they reply.
 * Never throws: a failed email must not fail an order.
 */
export async function sendMail(to: string, subject: string, text: string) {
  if (!emailEnabled()) return
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.mail.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.mail.from, to, subject, text }),
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) console.error('Email failed', r.status)
  } catch (e) {
    console.error('Email failed', (e as Error).message)
  }
}
