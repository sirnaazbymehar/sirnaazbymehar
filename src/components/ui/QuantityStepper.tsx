import { MinusIcon, PlusIcon } from './Icons'
export default function QuantityStepper({ value, onChange, max = 99, small = false }: { value: number; onChange: (n: number) => void; max?: number; small?: boolean }) {
  const h = small ? 'h-9 w-9' : 'h-12 w-12'
  return (
    <div className="inline-flex items-center self-start border border-line bg-white/60" role="group" aria-label="Quantity">
      <button type="button" className={`grid ${h} place-items-center disabled:opacity-30`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity"><MinusIcon width={16} /></button>
      <span className={`${small ? 'w-7 text-[14px]' : 'w-10 text-[15px]'} text-center tabular-nums`} aria-live="polite">{value}</span>
      <button type="button" className={`grid ${h} place-items-center disabled:opacity-30`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity"><PlusIcon width={16} /></button>
    </div>
  )
}
