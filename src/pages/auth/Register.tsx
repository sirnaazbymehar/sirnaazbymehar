import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import AuthCard, { FormError } from './AuthCard'
import { safeNext } from './Login'

export default function Register() {
  useDocumentMeta('Create account — Sirnaaz by Mehar')
  const { user, register } = useAuth()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={next} replace />
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (f.password.length < 8) return setError('Password must be at least 8 characters.')
    setBusy(true)
    try { await register(f); nav(next, { replace: true }) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <AuthCard title="Create account" sub="Orders you've already placed with this email are added to your account."
      footer={<>Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-wine underline underline-offset-4">Sign in</Link></>}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormError message={error} />
        <div className="field"><label htmlFor="reg-name">Full name</label><input id="reg-name" autoComplete="name" className="input" value={f.name} onChange={set('name')} /></div>
        <div className="field"><label htmlFor="reg-email">Email</label><input id="reg-email" type="email" autoComplete="email" className="input" value={f.email} onChange={set('email')} /></div>
        <div className="field"><label htmlFor="reg-phone">Mobile (optional)</label><input id="reg-phone" type="tel" inputMode="numeric" autoComplete="tel" className="input" value={f.phone} onChange={set('phone')} /></div>
        <div className="field"><label htmlFor="reg-password">Password</label><input id="reg-password" type="password" autoComplete="new-password" className="input" value={f.password} onChange={set('password')} /><span className="text-[12px] text-ink-muted">At least 8 characters.</span></div>
        <button className="btn-primary mt-2 w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthCard>
  )
}
