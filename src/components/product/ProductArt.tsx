import { useId } from 'react'
import type { Artwork, Product } from '../../types'

// ─────────────────────────────────────────────────────────────
//  Placeholder garment artwork, drawn from each product's colours.
//  When real photographs are uploaded (product.images), ProductImage
//  shows those instead and this component is no longer used.
// ─────────────────────────────────────────────────────────────

export type ArtView = 'front' | 'detail' | 'hem'

interface Shape { body: string; hemY: number; pants?: string; folds: string[] }

function shapeFor(a: Artwork): Shape {
  const top = 'M128 74 Q150 94 172 74 L188 80 L214 98'
  const topL = 'L86 98 L112 80 Z'
  switch (a.silhouette) {
    case 'anarkali':
      return {
        body: `${top} L230 192 L210 197 L194 128 L190 150 Q238 250 250 334 Q150 352 50 334 Q62 250 110 150 L106 128 L90 197 L70 192 ${topL}`,
        hemY: 340,
        pants: 'M128 340 L126 368 L146 368 L147 340 Z M153 340 L154 368 L174 368 L172 340 Z',
        folds: ['M150 152 L150 340', 'M132 154 L100 334', 'M168 154 L200 334', 'M116 156 L72 330', 'M184 156 L228 330'],
      }
    case 'aline':
      return {
        body: `${top} L230 196 L210 200 L196 130 Q206 220 224 304 Q150 314 76 304 Q94 220 104 130 L90 200 L70 196 ${topL}`,
        hemY: 308,
        pants: 'M114 306 L110 366 L146 366 L148 306 Z M152 306 L154 366 L190 366 L186 306 Z',
        folds: ['M128 150 L110 300', 'M172 150 L190 300', 'M150 150 L150 306'],
      }
    case 'coord':
      return {
        body: `${top} L226 176 L206 180 L196 128 L200 252 L100 252 L104 128 L94 180 L74 176 ${topL}`,
        hemY: 252,
        pants: 'M106 250 L100 366 L146 366 L150 262 L154 366 L200 366 L194 250 Z',
        folds: ['M134 150 L130 246', 'M166 150 L170 246'],
      }
    default:
      return {
        body: `${top} L230 196 L210 200 L196 130 L204 298 L96 298 L104 130 L90 200 L70 196 ${topL}`,
        hemY: 298,
        pants: 'M112 296 L108 366 L146 366 L148 296 Z M152 296 L154 366 L192 366 L188 296 Z',
        folds: ['M130 150 L126 292', 'M170 150 L174 292'],
      }
  }
}

function Motif({ id, a }: { id: string; a: Artwork }) {
  const c = a.accent
  switch (a.motif) {
    case 'buti':
      return (
        <pattern id={id} width="22" height="24" patternUnits="userSpaceOnUse">
          {[[5, 6], [16, 18]].map(([x, y]) => (
            <g key={x} fill={c} opacity="0.9">
              <circle cx={x} cy={y - 2.2} r="1.5" /><circle cx={x} cy={y + 2.2} r="1.5" />
              <circle cx={x - 2.2} cy={y} r="1.5" /><circle cx={x + 2.2} cy={y} r="1.5" />
              <circle cx={x} cy={y} r="1" fill={a.trim} />
            </g>
          ))}
        </pattern>
      )
    case 'jaal':
      return (
        <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="none" stroke={c} strokeWidth="0.7" opacity="0.75" />
          <circle cx="10" cy="10" r="1.6" fill={c} opacity="0.9" />
          <circle cx="0" cy="0" r="1" fill={c} /><circle cx="20" cy="0" r="1" fill={c} />
          <circle cx="0" cy="20" r="1" fill={c} /><circle cx="20" cy="20" r="1" fill={c} />
        </pattern>
      )
    case 'stripe':
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="4" height="12" fill={c} opacity="0.85" />
          <rect x="7" width="1" height="12" fill={a.trim} opacity="0.6" />
        </pattern>
      )
    case 'floral':
      return (
        <pattern id={id} width="34" height="38" patternUnits="userSpaceOnUse">
          <g fill={c} opacity="0.8">
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse key={r} cx="10" cy="7" rx="2.2" ry="4" transform={`rotate(${r} 10 11)`} />
            ))}
            <circle cx="10" cy="11" r="1.6" fill={a.trim} />
            <path d="M14 15 Q22 22 26 30" stroke={c} strokeWidth="0.8" fill="none" />
            <ellipse cx="22" cy="23" rx="1.4" ry="3" transform="rotate(-40 22 23)" />
            <circle cx="27" cy="31" r="1.6" />
          </g>
        </pattern>
      )
    default:
      return (
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="transparent" />
        </pattern>
      )
  }
}

export default function ProductArt({ product, view = 'front', className = '' }: { product: Product; view?: ArtView; className?: string }) {
  const a: Artwork = product.artwork ?? { silhouette: 'straight', base: '#8A6F5C', accent: '#EADBC0', trim: '#C9AE7E', backdrop: '#EFE7DB', motif: 'buti', dupatta: true }
  const uid = useId().replace(/:/g, '')
  const s = shapeFor(a)
  const ids = { motif: `m${uid}`, clip: `c${uid}`, shade: `s${uid}`, bg: `b${uid}`, dup: `d${uid}` }
  const dark = luminance(a.base) < 0.3
  const pantsFill = a.silhouette === 'coord' ? a.base : shade(a.base, dark ? 0.12 : -0.1)

  const zoom =
    view === 'detail' ? 'translate(150 150) scale(2.5) translate(-150 -108)'
    : view === 'hem' ? `translate(150 200) scale(2.1) translate(-150 ${-(s.hemY - 22)})`
    : undefined

  return (
    <svg viewBox="0 0 300 400" className={className} role="img" aria-label={`${product.name} in ${product.colour}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <Motif id={ids.motif} a={a} />
        <clipPath id={ids.clip}><path d={s.body} /></clipPath>
        <linearGradient id={ids.shade} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={ids.bg} cx="0.5" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.dup} x1="0" x2="1">
          <stop offset="0" stopColor={a.trim} stopOpacity="0.5" />
          <stop offset="1" stopColor={a.accent} stopOpacity="0.28" />
        </linearGradient>
      </defs>

      {/* studio backdrop with a jharokha arch */}
      <rect width="300" height="400" fill={a.backdrop} />
      <rect width="300" height="400" fill={`url(#${ids.bg})`} />
      <path d="M58 400 V178 Q58 110 150 72 Q242 110 242 178 V400" fill="#fff" fillOpacity="0.28" stroke="#A8834A" strokeOpacity="0.28" strokeWidth="1" />
      <rect y="372" width="300" height="28" fill="#000" fillOpacity="0.04" />
      <ellipse cx="150" cy="372" rx="80" ry="6" fill="#000" opacity="0.08" />

      <g transform={zoom}>
        {/* hanger */}
        {view === 'front' && (
          <g stroke="#7D6A55" strokeWidth="2.4" fill="none" strokeLinecap="round">
            <path d="M150 62 V52 Q150 40 160 40 Q169 40 169 49" />
            <path d="M104 80 L150 61 L196 80" />
          </g>
        )}

        {s.pants && <path d={s.pants} fill={pantsFill} />}
        {s.pants && a.silhouette === 'coord' && <path d={s.pants} fill={`url(#${ids.motif})`} opacity="0.35" />}

        {/* kameez */}
        <path d={s.body} fill={a.base} />
        <g clipPath={`url(#${ids.clip})`}>
          <rect width="300" height="400" fill={`url(#${ids.motif})`} opacity={a.motif === 'jaal' ? 0.55 : 0.75} />
          {/* yoke embroidery */}
          <path d="M118 74 Q150 132 182 74" fill={a.base} />
          <path d="M118 74 Q150 132 182 74" fill={`url(#${ids.motif})`} opacity="0.35" />
          <path d="M120 76 Q150 128 180 76" fill="none" stroke={a.trim} strokeWidth="2.4" />
          <path d="M124 78 Q150 120 176 78" fill="none" stroke={a.accent} strokeWidth="1" strokeDasharray="1.5 2.5" />
          <path d="M150 100 V150" stroke={a.trim} strokeWidth="1.4" strokeDasharray="2 3" />
          {/* hem border */}
          <rect x="0" y={s.hemY - 22} width="300" height="22" fill={a.trim} opacity="0.9" />
          <rect x="0" y={s.hemY - 18} width="300" height="12" fill={`url(#${ids.motif})`} />
          <line x1="0" x2="300" y1={s.hemY - 25} y2={s.hemY - 25} stroke={a.trim} strokeWidth="1.2" strokeDasharray="3 2" />
          {/* cuffs */}
          <path d="M60 172 L100 176 M200 176 L240 172" stroke={a.trim} strokeWidth="9" opacity="0.9" />
          {s.folds.map((d) => <path key={d} d={d} stroke="#000" strokeOpacity="0.07" strokeWidth="5" fill="none" />)}
          <rect width="300" height="400" fill={`url(#${ids.shade})`} />
        </g>
        <path d={s.body} fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="0.8" />

        {/* dupatta draped over the shoulder */}
        {a.dupatta && (
          <g>
            <path d="M170 76 C196 90 212 150 220 348 L196 352 C194 190 184 120 160 84 Z" fill={`url(#${ids.dup})`} />
            <path d="M220 348 L196 352" stroke={a.trim} strokeWidth="6" />
            <path d="M170 76 C196 90 212 150 220 348" fill="none" stroke={a.trim} strokeWidth="1.6" strokeOpacity="0.9" />
            <path d="M206 352 l-1 12 M212 351 l0 12 M200 352 l-2 12" stroke={a.trim} strokeWidth="1" />
          </g>
        )}
      </g>
    </svg>
  )
}

function hexToRgb(h: string) {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function luminance(h: string) {
  const [r, g, b] = hexToRgb(h)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
function shade(h: string, amt: number) {
  const [r, g, b] = hexToRgb(h).map((c) => Math.round(Math.min(255, Math.max(0, amt > 0 ? c + (255 - c) * amt : c * (1 + amt)))))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
