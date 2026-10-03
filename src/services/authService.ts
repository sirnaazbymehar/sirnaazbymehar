import { api } from '../lib/api'
import type { SavedAddress, User } from '../types'

export const authService = {
  me: () => api.get<{ user: User | null }>('/auth/me'),
  login: (email: string, password: string) => api.post<{ user: User }>('/auth/login', { email, password }),
  register: (b: { name: string; email: string; phone: string; password: string }) => api.post<{ user: User }>('/auth/register', b),
  logout: () => api.post('/auth/logout'),
  forgot: (email: string) => api.post('/auth/forgot', { email }),
  reset: (token: string, password: string) => api.post('/auth/reset', { token, password }),
  updateProfile: (b: { name: string; phone: string }) => api.patch('/account/profile', b),
  changePassword: (current: string, next: string) => api.post('/account/password', { current, next }),
  addresses: () => api.get<SavedAddress[]>('/account/addresses'),
  addAddress: (a: Omit<SavedAddress, 'id' | 'email'>) => api.post<SavedAddress>('/account/addresses', a),
  updateAddress: (id: string, a: Omit<SavedAddress, 'id' | 'email'>) => api.put<SavedAddress>(`/account/addresses/${id}`, a),
  deleteAddress: (id: string) => api.del(`/account/addresses/${id}`),
  wishlist: () => api.get<string[]>('/account/wishlist'),
  mergeWishlist: (ids: string[]) => api.put<string[]>('/account/wishlist', ids),
  addWish: (id: string) => api.post(`/account/wishlist/${id}`),
  removeWish: (id: string) => api.del(`/account/wishlist/${id}`),
}
