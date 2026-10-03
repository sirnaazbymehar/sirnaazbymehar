import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import AuthCard, { FormError } from './AuthCard'

export const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account')

export default function Login() {
  useDocumentMeta('Sign in — Sirnaaz by Mehar')
  const { user, login } = useAuth()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={next} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try { await login(email, password); nav(next, { replace: true }) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <AuthCard title="Sign in" sub="Track your orders and keep your wishlist across devices."
      footer={<>New to Sirnaaz? <Link to={`/register?next=${encodeURIComponent(next)}`} className="text-wine underline underline-offset-4">Create an account</Link></>}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormError message={error} />
        <div className="field"><label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field">
          <div className="flex items-baseline justify-between"><label htmlFor="login-password">Password</label><Link to="/forgot-password" className="text-[12px] text-ink-soft underline underline-offset-4">Forgot password?</Link></div>
          <input id="login-password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary mt-2 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthCard>
  )
}
