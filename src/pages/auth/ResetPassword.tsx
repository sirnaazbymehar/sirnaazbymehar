import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import AuthCard, { FormError } from './AuthCard'

export default function ResetPassword() {
  useDocumentMeta('Choose a new password — Sirnaaz by Mehar')
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (pw.length < 8) return setError('Password must be at least 8 characters.')
    if (pw !== pw2) return setError('The two passwords don’t match.')
    setBusy(true)
    try { await authService.reset(token, pw); setDone(true) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <AuthCard title="Choose a new password">
      {done ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[14.5px] text-ink-soft">Your password has been changed. For your security you've been signed out on all devices.</p>
          <Link to="/login" className="btn-primary">Sign in</Link>
        </div>
      ) : !token ? (
        <p className="text-center text-[14px] text-ink-soft">This link is incomplete. <Link to="/forgot-password" className="text-wine underline">Request a new one</Link>.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <FormError message={error} />
          <div className="field"><label htmlFor="rp-1">New password</label><input id="rp-1" type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div className="field"><label htmlFor="rp-2">Confirm new password</label><input id="rp-2" type="password" autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
        </form>
      )}
    </AuthCard>
  )
}
