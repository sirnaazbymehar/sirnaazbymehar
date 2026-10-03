import { Link } from 'react-router-dom'
import logoFull from '../assets/logo-full.webp'
import { productService } from '../services/productService'
import ProductImage from '../components/product/ProductImage'
import Ornament from '../components/ui/Ornament'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { site, storesSummary } from '../config/site'

export default function About() {
  useDocumentMeta('About Us — Sirnaaz by Mehar', 'The story behind Sirnaaz by Mehar: Pakistani silhouettes and ethnic wear chosen with care for the modern woman.')
  const pool = productService.list({ sort: 'popular' }).sort((x, y) => Number(y.images.length > 0) - Number(x.images.length > 0))
  const [a, b] = pool
  return (
    <>
      <section className="bg-sand/50">
        <div className="container-x flex flex-col items-center gap-6 py-14 text-center sm:py-20">
          <img src={logoFull} alt="Sirnaaz by Mehar" className="w-[240px] sm:w-[300px]" />
          <h1 className="max-w-3xl font-display text-[36px] leading-[1.1] sm:text-[52px]">A wardrobe of quiet grace, chosen one piece at a time.</h1>
        </div>
      </section>

      <section className="container-x grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {a && <div className="aspect-[3/4] overflow-hidden bg-sand"><ProductImage product={a} full /></div>}
          {b && <div className="mt-10 aspect-[3/4] overflow-hidden bg-sand"><ProductImage product={b} index={b.images.length ? 0 : 1} full /></div>}
        </div>
        <div className="flex flex-col gap-6 text-[16px] leading-[1.8] text-ink-soft">
          <span className="text-[11px] uppercase tracking-brand text-gold">Our story</span>
          <h2 className="font-display text-[34px] leading-tight text-ink sm:text-[42px]">Sirnaaz by Mehar</h2>
          <p>Sirnaaz by Mehar was started to bring the elegance of Pakistani silhouettes to women who want clothes that feel special without feeling complicated. Every suit is chosen for its cut, its fabric and the way it makes you feel when you walk into a room.</p>
          <p>We keep our collections small and considered: breathable lawns for everyday, embroidered suits for gatherings, co-ord sets for ease, and a festive edit for the occasions that matter most.</p>
          <p>Each piece arrives fully stitched and ready to wear, in sizes S to XXXL, because beautiful clothing should fit real women.</p>
        </div>
      </section>

      <section className="border-y border-line bg-ivory">
        <ul className="container-x grid gap-10 py-14 text-center sm:grid-cols-3 sm:py-20">
          {[
            ['Considered design', 'Classic Pakistani cuts, refined for today and edited with restraint.'],
            ['Fabrics that feel right', 'Lawn, cotton-silk, georgette and organza, chosen for comfort and drape.'],
            ['Personal service', site.stores.length ? `Questions on fit or styling? Visit our stores in ${storesSummary()}, or write to us.` : 'Questions on fit or styling? Write to us and talk to a real person.'],
          ].map(([t, d]) => (
            <li key={t} className="flex flex-col items-center gap-3">
              <Ornament className="w-24" />
              <h3 className="font-display text-[24px] text-ink">{t}</h3>
              <p className="max-w-xs text-[14.5px] leading-relaxed text-ink-soft">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x flex flex-col items-center gap-5 py-16 text-center sm:py-24">
        <h2 className="font-display text-[32px] sm:text-[40px]">Find your next favourite</h2>
        <Link to="/shop" className="btn-primary">Explore the collection</Link>
      </section>
    </>
  )
}
