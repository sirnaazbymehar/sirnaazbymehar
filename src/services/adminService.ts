import { api } from '../lib/api'
import type { Settings } from '../config/site'
import type { Category, Order, OrderStatus, Product, Size } from '../types'

export interface AdminUser { id: string; email: string; name: string }
export interface ProductInput {
  name: string; slug?: string; description: string; details: string[]; price: number; salePrice: number | null
  category: string; colour: string; fabric: string; care: string[]; fit: string; deliveryInfo: string; returnInfo: string
  isFeatured: boolean; isNewArrival: boolean; isActive: boolean; isSoldOut: boolean
  stock: Partial<Record<Size, number>>
}
export interface Stats {
  totalOrders: number; totalRevenue: number; pendingOrders: number; productsSold: number
  lowStock: { id: string; name: string; slug: string; size: Size; quantity: number }[]
  recentOrders: Order[]
}

export const adminService = {
  me: () => api.get<{ admin: AdminUser | null }>('/admin/auth/me'),
  login: (email: string, password: string) => api.post<{ admin: AdminUser }>('/admin/auth/login', { email, password }),
  logout: () => api.post('/admin/auth/logout'),
  stats: () => api.get<Stats>('/admin/stats'),
  categories: () => api.get<Category[]>('/admin/categories'),
  products: () => api.get<Product[]>('/admin/products'),
  product: (id: string) => api.get<Product>(`/admin/products/${id}`),
  createProduct: (p: ProductInput) => api.post<Product>('/admin/products', p),
  updateProduct: (id: string, p: ProductInput) => api.put<Product>(`/admin/products/${id}`, p),
  deleteProduct: (id: string) => api.del<{ result: 'deleted' | 'deactivated'; message?: string }>(`/admin/products/${id}`),
  /** Step 1: one-time upload links (the browser then sends photos straight to Supabase Storage). */
  signImages: (id: string, files: { contentType: string }[]) =>
    api.post<{ uploads: { key: string; thumbKey: string; uploadUrl: string; thumbUploadUrl: string; contentType: string }[]; maxBytes: number }>(`/admin/products/${id}/images/sign`, { files }),
  /** Step 3: the server checks the uploaded files and records the photo. */
  finalizeImage: (id: string, key: string, thumbKey: string) => api.post<Product>(`/admin/products/${id}/images/finalize`, { key, thumbKey }),
  setupStatus: () => api.get<{ available: boolean }>('/admin/setup'),
  setup: (b: { token: string; email: string; name: string; password: string }) => api.post<{ admin: AdminUser }>('/admin/setup', b),
  reorderImages: (id: string, ids: string[]) => api.put<Product>(`/admin/products/${id}/images/order`, ids),
  setPrimaryImage: (id: string, imageId: string) => api.post<Product>(`/admin/products/${id}/images/${imageId}/primary`),
  deleteImage: (id: string, imageId: string) => api.del<Product>(`/admin/products/${id}/images/${imageId}`),
  orders: (status?: string) => api.get<Order[]>(`/admin/orders${status ? `?status=${status}` : ''}`),
  order: (id: string) => api.get<Order>(`/admin/orders/${id}`),
  setOrderStatus: (id: string, status: OrderStatus) => api.patch<Order>(`/admin/orders/${id}/status`, { status }),
  settings: () => api.get<Settings>('/admin/settings'),
  saveSettings: (s: Settings) => api.put<Settings>('/admin/settings', s),
}
