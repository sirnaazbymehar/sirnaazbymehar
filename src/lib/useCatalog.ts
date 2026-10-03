import { useSyncExternalStore } from 'react'
import { productService } from '../services/productService'
/** Re-renders when products change (admin edits, stock updates). */
export function useCatalog() {
  return useSyncExternalStore(productService.subscribe, productService.all)
}
