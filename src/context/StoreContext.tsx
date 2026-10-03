import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type { CartItem, Product, Size } from '../types'
import { load, save } from '../lib/storage'
import { sellingPrice, sizeStock } from '../lib/product'
import { productService } from '../services/productService'
import { authService } from '../services/authService'
import { useAuth } from './AuthContext'

interface State {
  cart: CartItem[]
  wishlist: string[] // product ids
}

type Action =
  | { type: 'add'; item: CartItem }
  | { type: 'setQty'; productId: string; size: Size; quantity: number }
  | { type: 'remove'; productId: string; size: Size }
  | { type: 'clear' }
  | { type: 'toggleWish'; productId: string }
  | { type: 'setWish'; ids: string[] }

const maxFor = (productId: string, size: Size) => {
  const p = productService.byId(productId)
  return p ? sizeStock(p, size) : 0
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'add': {
      const existing = state.cart.find((i) => i.productId === a.item.productId && i.size === a.item.size)
      const cap = maxFor(a.item.productId, a.item.size)
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) =>
            i === existing ? { ...i, quantity: Math.min(cap, i.quantity + a.item.quantity) } : i,
          ),
        }
      }
      return { ...state, cart: [...state.cart, { ...a.item, quantity: Math.min(cap, a.item.quantity) }] }
    }
    case 'setQty':
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.productId === a.productId && i.size === a.size
            ? { ...i, quantity: Math.max(1, Math.min(maxFor(a.productId, a.size), a.quantity)) }
            : i,
        ),
      }
    case 'remove':
      return { ...state, cart: state.cart.filter((i) => !(i.productId === a.productId && i.size === a.size)) }
    case 'clear':
      return { ...state, cart: [] }
    case 'setWish':
      return { ...state, wishlist: a.ids }
    case 'toggleWish':
      return {
        ...state,
        wishlist: state.wishlist.includes(a.productId)
          ? state.wishlist.filter((id) => id !== a.productId)
          : [...state.wishlist, a.productId],
      }
  }
}

interface Store {
  cart: CartItem[]
  cartCount: number
  wishlist: string[]
  addToCart: (p: Product, size: Size, quantity?: number, openDrawer?: boolean) => void
  setQuantity: (productId: string, size: Size, quantity: number) => void
  removeFromCart: (productId: string, size: Size) => void
  clearCart: () => void
  toggleWishlist: (productId: string) => void
  isWished: (productId: string) => boolean
  drawerOpen: boolean
  setDrawerOpen: (v: boolean) => void
  toast: string | null
  notify: (msg: string) => void
}

const Ctx = createContext<Store | null>(null)
const KEY = 'sbm.store'

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = load<State>(KEY, { cart: [], wishlist: [] })
    // Drop anything that no longer exists in the shop (e.g. a product was removed).
    return {
      cart: saved.cart.flatMap((i) => {
        const p = productService.byId(i.productId)
        return p ? [{ ...i, name: p.name, slug: p.slug, unitPrice: sellingPrice(p), imageUrl: p.images[0] ?? null }] : []
      }),
      wishlist: saved.wishlist.filter((id) => productService.byId(id)),
    }
  })

  // Signed-in shoppers keep their wishlist in their account; a guest wishlist is merged in on sign-in.
  useEffect(() => {
    if (!user) return
    authService.mergeWishlist(state.wishlist).then((ids) => dispatch({ type: 'setWish', ids })).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => save(KEY, state), [state])

  const notify = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600)
  }, [])

  const value = useMemo<Store>(
    () => ({
      cart: state.cart,
      cartCount: state.cart.reduce((n, i) => n + i.quantity, 0),
      wishlist: state.wishlist,
      addToCart: (p, size, quantity = 1, openDrawer = true) => {
        dispatch({
          type: 'add',
          item: { productId: p.id, slug: p.slug, name: p.name, size, quantity, unitPrice: sellingPrice(p), imageUrl: p.images[0] ?? null },
        })
        if (openDrawer) setDrawerOpen(true)
        else notify(`${p.name} (${size}) added to your bag`)
      },
      setQuantity: (productId, size, quantity) => dispatch({ type: 'setQty', productId, size, quantity }),
      removeFromCart: (productId, size) => dispatch({ type: 'remove', productId, size }),
      clearCart: () => dispatch({ type: 'clear' }),
      toggleWishlist: (productId) => {
        const had = state.wishlist.includes(productId)
        dispatch({ type: 'toggleWish', productId })
        if (user) (had ? authService.removeWish(productId) : authService.addWish(productId)).catch(() => notify('Could not update your wishlist. Please try again.'))
        notify(had ? 'Removed from wishlist' : 'Saved to wishlist')
      },
      isWished: (id) => state.wishlist.includes(id),
      drawerOpen,
      setDrawerOpen,
      toast,
      notify,
    }),
    [state, drawerOpen, toast, notify, user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside StoreProvider')
  return v
}
