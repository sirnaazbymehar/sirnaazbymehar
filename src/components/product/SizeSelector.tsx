import type { Product, Size } from '../../types'
import { sizeStock } from '../../lib/product'

export default function SizeSelector({ product, value, onChange, error }: { product: Product; value: Size | null; onChange: (s: Size) => void; error?: boolean }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Size</legend>
      <div className="grid grid-cols-6 gap-2">
        {product.sizes.map((s) => {
          const left = sizeStock(product, s)
          const out = left === 0
          const sel = value === s
          return (
            <button
              key={s} type="button" disabled={out} onClick={() => onChange(s)} aria-pressed={sel}
              aria-label={out ? `${s}, sold out` : `${s}${left <= 2 ? `, only ${left} left` : ''}`}
              className={`chip relative min-w-0 ${sel ? 'border-wine bg-wine text-ivory' : out ? 'cursor-not-allowed border-line text-ink-muted/50' : `${error ? 'border-wine-soft' : 'border-ink/25'} hover:border-ink`}`}
            >
              {s}
              {out && <span className="absolute inset-0 m-auto h-px w-[70%] -rotate-[20deg] bg-ink-muted/40" aria-hidden />}
            </button>
          )
        })}
      </div>
      {value && sizeStock(product, value) <= 2 && <span className="text-[12.5px] text-wine">Only {sizeStock(product, value)} left in {value}</span>}
    </fieldset>
  )
}
