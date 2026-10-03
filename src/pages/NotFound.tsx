import { Link } from 'react-router-dom'
import Ornament from '../components/ui/Ornament'
export default function NotFound() {
  return (
    <section className="container-x flex flex-col items-center gap-5 py-28 text-center">
      <span className="text-[11px] uppercase tracking-brand text-gold">Page not found</span>
      <h1 className="font-display text-[44px]">This page has wandered off</h1>
      <Ornament />
      <p className="text-ink-soft">The piece or page you're looking for may have moved or sold out.</p>
      <Link to="/shop" className="btn-primary">Browse the collection</Link>
    </section>
  )
}
