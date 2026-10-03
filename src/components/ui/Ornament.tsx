/** Small gold divider echoing the logo's leaf-and-line border. */
export default function Ornament({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 14" className={`h-3.5 w-40 text-gold ${className}`} aria-hidden>
      <path d="M0 7h62M98 7h62" stroke="currentColor" strokeWidth=".8" />
      <path d="M80 1.5 85.5 7 80 12.5 74.5 7Z" fill="none" stroke="currentColor" strokeWidth=".9" />
      <circle cx="80" cy="7" r="1.4" fill="currentColor" />
      <path d="M66 7c2-3 5-3.6 7-3M66 7c2 3 5 3.6 7 3M94 7c-2-3-5-3.6-7-3M94 7c-2 3-5 3.6-7 3" fill="none" stroke="currentColor" strokeWidth=".8" />
    </svg>
  )
}

export function SectionTitle({ eyebrow, title, sub, align = 'center' }: { eyebrow?: string; title: string; sub?: string; align?: 'center' | 'left' }) {
  return (
    <div className={`flex flex-col gap-3 ${align === 'center' ? 'items-center text-center' : 'items-start'}`}>
      {eyebrow && <span className="text-[11px] uppercase tracking-brand text-gold">{eyebrow}</span>}
      <h2 className="font-display text-[34px] leading-[1.1] text-ink sm:text-[42px] [text-wrap:balance]">{title}</h2>
      {align === 'center' && <Ornament />}
      {sub && <p className="max-w-xl text-[15px] leading-relaxed text-ink-soft">{sub}</p>}
    </div>
  )
}
