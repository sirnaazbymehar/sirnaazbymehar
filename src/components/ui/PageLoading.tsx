export default function PageLoading() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <span className="flex items-center gap-3 text-[12px] uppercase tracking-label text-ink-muted">
        <span className="h-4 w-4 animate-spin rounded-full border border-gold border-t-transparent" />Loading
      </span>
    </div>
  )
}
