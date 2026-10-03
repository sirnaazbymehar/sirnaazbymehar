import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { authService } from '../services/authService'

interface Auth {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<User>
  register: (b: { name: string; email: string; phone: string; password: string }) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try { setUser((await authService.me()).user) } catch { setUser(null) } finally { setReady(true) }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const value = useMemo<Auth>(() => ({
    user, ready, refresh,
    login: async (e, p) => { const { user } = await authService.login(e, p); setUser(user); return user },
    register: async (b) => { const { user } = await authService.register(b); setUser(user); return user },
    logout: async () => { await authService.logout().catch(() => {}); setUser(null) },
  }), [user, ready, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
