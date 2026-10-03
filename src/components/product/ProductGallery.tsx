import { useRef, useState } from 'react'
import type { Product } from '../../types'
import ProductImage, { imageCount } from './ProductImage'

export default function ProductGallery({ product }: { product: Product }) {
  const n = imageCount(product)
  const [active, setActive] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const go = (i: number) => {
    setActive(i)
    track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' })
  }
  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      {/* main image: swipeable on mobile */}
      <div className="relative flex-1">
        <div
          ref={track}
          onScroll={(e) => { const el = e.currentTarget; setActive(Math.round(el.scrollLeft / el.clientWidth)) }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto bg-sand"
        >
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="aspect-[3/4] w-full shrink-0 snap-center overflow-hidden">
              <ProductImage product={product} index={i} full eager={i === 0} className="transition-transform duration-700 hover:scale-[1.06]" />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 lg:hidden">
          {Array.from({ length: n }, (_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Image ${i + 1}`} className={`h-1.5 rounded-full transition-all ${active === i ? 'w-6 bg-wine' : 'w-1.5 bg-ink/25'}`} />
          ))}
        </div>
      </div>
      {/* thumbnails */}
      <div className="hidden gap-3 lg:flex lg:w-[88px] lg:flex-col">
        {Array.from({ length: n }, (_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`Show image ${i + 1}`} className={`aspect-[3/4] w-full overflow-hidden border transition-colors ${active === i ? 'border-wine' : 'border-transparent opacity-75 hover:opacity-100'}`}>
            <ProductImage product={product} index={i} />
          </button>
        ))}
      </div>
    </div>
  )
}
