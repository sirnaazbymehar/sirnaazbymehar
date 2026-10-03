import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import AuthCard, { FormError } from './AuthCard'
import { getSettings, site } from '../../config/site'

export default function ForgotPassword() {
  useDocumentMeta('Reset password — Sirnaaz by Mehar')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try { await authService.forgot(email); setSent(true) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <AuthCard title="Reset password" footer={<Link to="/login" className="text-wine underline underline-offset-4">Back to sign in</Link>}>
      {!getSettings().passwordResetEnabled ? (
        <p className="text-center text-[14.5px] leading-relaxed text-ink-soft">
          Password reset by email isn't available yet. Please write to <span className="select-all text-ink">{site.email}</span> from your account email and we'll help you get back in.
        </p>
      ) : sent ? (
        <p className="text-center text-[14.5px] leading-relaxed text-ink-soft">If an account exists for <strong className="font-medium text-ink">{email}</strong>, we've sent a link to reset your password. It works for one hour.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <p className="text-[14px] text-ink-soft">Enter your account email and we'll send you a link to choose a new password.</p>
          <FormError message={error} />
          <div className="field"><label htmlFor="fp-email">Email</label><input id="fp-email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <button className="btn-primary w-full" disabled={busy || !email}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
    </AuthCard>
  )
}
