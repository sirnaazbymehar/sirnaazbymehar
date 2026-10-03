import { createContext, useContext, useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { Wordmark } from '../../components/layout/Navbar'
import PageLoading from '../../components/ui/PageLoading'
import { adminService, type AdminUser } from '../../services/adminService'
import { useDocumentMeta } from '../../lib/useDocumentMeta'

// The browser only decides what to *show*. Every /api/admin request is checked on the server
// against an admin session cookie (separate from customer sessions), so typing an admin URL
// without signing in as an admin shows this sign-in form and the data stays locked.
const AdminCtx = createContext<AdminUser | null>(null)
export const useAdmin = () => useContext(AdminCtx)

export default function AdminLayout() {
  useDocumentMeta('Admin — Sirnaaz by Mehar')
  const [admin, setAdmin] = useState<AdminUser | null | undefined>(undefined)
  const nav = useNavigate()
  useEffect(() => { adminService.me().then((r) => setAdmin(r.admin)).catch(() => setAdmin(null)) }, [])

  if (admin === undefined) return <PageLoading />
  if (!admin) return <AdminLogin onSignedIn={setAdmin} />
  return (
    <AdminCtx.Provider value={admin}>
      <div className="flex min-h-screen flex-col bg-[#F6F2EA] lg:flex-row">
        <AdminSidebar onSignOut={async () => { await adminService.logout().catch(() => {}); setAdmin(null); nav('/admin') }} />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10"><Outlet /></main>
      </div>
    </AdminCtx.Provider>
  )
}

function AdminLogin({ onSignedIn }: { onSignedIn: (a: AdminUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [setupAvailable, setSetupAvailable] = useState(false)
  const [setupMode, setSetupMode] = useState(false)
  useEffect(() => { adminService.setupStatus().then((r) => { setSetupAvailable(r.available); setSetupMode(r.available) }).catch(() => {}) }, [])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try { onSignedIn((await adminService.login(email, password)).admin) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  if (setupMode) return <AdminSetup onSignedIn={onSignedIn} onCancel={() => setSetupMode(false)} />
  return (
    <div className="grid min-h-screen place-items-center bg-sand/60 px-4">
      <form onSubmit={submit} noValidate className="flex w-full max-w-sm flex-col gap-4 bg-ivory p-8 shadow-sm">
        <Wordmark />
        <h1 className="mt-4 text-center font-display text-[26px]">Admin sign in</h1>
        {error && <p role="alert" className="border-l-2 border-wine bg-sand px-3 py-2 text-[13.5px] text-wine">{error}</p>}
        <div className="field"><label htmlFor="adm-email">Email</label><input id="adm-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="adm-pass">Password</label><input id="adm-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        {setupAvailable && <button type="button" onClick={() => setSetupMode(true)} className="text-center text-[12px] text-wine underline underline-offset-4">First-time setup: create the admin account</button>}
        <Link to="/" className="text-center text-[12px] text-ink-soft underline underline-offset-4">Back to store</Link>
      </form>
    </div>
  )
}

/** Shown only while the server reports that no admin exists yet and a setup code is configured. */
function AdminSetup({ onSignedIn, onCancel }: { onSignedIn: (a: AdminUser) => void; onCancel: () => void }) {
  const [f, setF] = useState({ token: '', name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (f.password.length < 12) return setError('Use at least 12 characters for the admin password.')
    if (f.password !== f.confirm) return setError('The two passwords don’t match.')
    setBusy(true)
    try { onSignedIn((await adminService.setup({ token: f.token, name: f.name, email: f.email, password: f.password })).admin) }
    catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-sand/60 px-4 py-10">
      <form onSubmit={submit} noValidate className="flex w-full max-w-sm flex-col gap-4 bg-ivory p-8 shadow-sm">
        <Wordmark />
        <h1 className="mt-4 text-center font-display text-[26px]">Create the admin account</h1>
        <p className="text-center text-[13px] text-ink-soft">This works once. Enter the setup code you saved in Netlify as ADMIN_SETUP_TOKEN.</p>
        {error && <p role="alert" className="border-l-2 border-wine bg-sand px-3 py-2 text-[13.5px] text-wine">{error}</p>}
        <div className="field"><label htmlFor="setup-token">Setup code</label><input id="setup-token" className="input" type="password" autoComplete="off" value={f.token} onChange={set('token')} /></div>
        <div className="field"><label htmlFor="setup-name">Your name</label><input id="setup-name" className="input" autoComplete="name" value={f.name} onChange={set('name')} /></div>
        <div className="field"><label htmlFor="setup-email">Admin email</label><input id="setup-email" className="input" type="email" autoComplete="username" value={f.email} onChange={set('email')} /></div>
        <div className="field"><label htmlFor="setup-pass">Password (12+ characters)</label><input id="setup-pass" className="input" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} /></div>
        <div className="field"><label htmlFor="setup-pass2">Confirm password</label><input id="setup-pass2" className="input" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></div>
        <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create admin account'}</button>
        <button type="button" onClick={onCancel} className="text-center text-[12px] text-ink-soft underline underline-offset-4">I already have an admin account</button>
      </form>
    </div>
  )
}
