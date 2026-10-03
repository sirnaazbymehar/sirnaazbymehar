import { useStore } from '../../context/StoreContext'
export default function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 sm:bottom-8">
      <span key={toast} className="animate-rise bg-ink px-5 py-3 text-[13px] tracking-wide text-ivory shadow-lg">{toast}</span>
    </div>
  )
}
