import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { productService } from '../../services/productService'
import ProductForm from '../../components/admin/ProductForm'
import ProductImage from '../../components/product/ProductImage'
import PageLoading from '../../components/ui/PageLoading'
import { CloseIcon } from '../../components/ui/Icons'
import { formatPrice } from '../../lib/format'
import { isSoldOut, sellingPrice, totalStock } from '../../lib/product'
import type { Product } from '../../types'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const load = () => adminService.products().then(setProducts).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])
  const refreshShop = () => productService.load().catch(() => {})

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      const r = await adminService.deleteProduct(deleting.id)
      setMsg(r.result === 'deleted' ? `${deleting.name} was deleted.` : r.message ?? `${deleting.name} was hidden from the shop.`)
      setDeleting(null); load(); refreshShop()
    } catch (e) { setError((e as Error).message); setDeleting(null) }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-[34px]">Products</h1><p className="text-[14px] text-ink-soft">{products ? `${products.length} products · ` : ''}changes appear on the website as soon as you save.</p></div>
        <button onClick={() => { setMsg(''); setEditing('new') }} className="btn-primary">+ Add product</button>
      </header>
      {msg && <p role="status" className="border-l-2 border-[#2F6B4A] bg-ivory px-3 py-2 text-[13.5px] text-[#2F6B4A]">{msg}</p>}
      {error && <p role="alert" className="border-l-2 border-wine bg-ivory px-3 py-2 text-[13.5px] text-wine">{error}</p>}
      {!products ? <PageLoading /> : (
        <div className="overflow-x-auto border border-line bg-ivory">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="border-b border-line text-[10.5px] uppercase tracking-label text-ink-muted">
              <tr>{['Product', 'Category', 'Price', 'Stock by size', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className={p.isActive === false ? 'opacity-60' : ''}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-14 w-11 shrink-0 overflow-hidden bg-sand"><ProductImage product={p} /></div>
                    <div className="flex flex-col"><span className="font-medium">{p.name}</span><span className="text-[11.5px] text-ink-muted">{p.images.length} photo{p.images.length === 1 ? '' : 's'}</span></div></div></td>
                  <td className="px-4 py-3 text-ink-soft">{productService.category(p.category)?.name ?? p.category}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatPrice(sellingPrice(p))}{p.salePrice && <span className="ml-1.5 text-ink-muted line-through">{formatPrice(p.price)}</span>}</td>
                  <td className="px-4 py-3 text-[12px] tabular-nums text-ink-soft">
                    <div className="flex flex-wrap gap-x-2">{p.sizes.map((s) => <span key={s} className={(p.stock[s] ?? 0) === 0 ? 'text-wine' : ''}>{s}:{p.stock[s] ?? 0}</span>)}</div>
                    <span className="text-ink-muted">Total {totalStock(p)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {p.isActive === false ? <span className="rounded-full bg-[#E8E2DC] px-2.5 py-0.5 text-[11.5px] text-[#5A4E4F]">Hidden</span>
                        : isSoldOut(p) ? <span className="rounded-full bg-[#F1DADC] px-2.5 py-0.5 text-[11.5px] text-[#7A2632]">Sold out</span>
                        : <span className="rounded-full bg-[#DDEBDF] px-2.5 py-0.5 text-[11.5px] text-[#2F6B4A]">Live</span>}
                      {p.isNewArrival && <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11.5px]">New</span>}
                      {p.isFeatured && <span className="rounded-full bg-gold-pale px-2.5 py-0.5 text-[11.5px]">Featured</span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="inline-flex gap-4">
                      {p.isActive !== false && <Link to={`/shop/${p.slug}`} className="text-ink-soft underline-offset-4 hover:underline">View</Link>}
                      <button onClick={() => { setMsg(''); setEditing(p) }} className="text-wine underline-offset-4 hover:underline">Edit</button>
                      <button onClick={() => setDeleting(p)} className="text-ink-muted underline-offset-4 hover:underline">Delete</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Product editor">
          <div className="absolute inset-0 animate-fade bg-wine-deep/40" />
          <div className="relative h-full w-full max-w-2xl animate-slideIn overflow-y-auto bg-ivory px-6 pt-6 sm:px-8 sm:pt-8">
            <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-[28px]">{editing === 'new' ? 'Add product' : `Edit ${editing.name}`}</h2><button onClick={() => setEditing(null)} className="grid h-11 w-11 place-items-center" aria-label="Close"><CloseIcon /></button></div>
            <ProductForm
              product={editing === 'new' ? undefined : editing}
              onCancel={() => setEditing(null)}
              onDone={(p) => { setEditing(null); setMsg(`${p.name} saved${p.isActive === false ? ' (hidden from the shop)' : ' and live in the shop'}.`); load(); refreshShop() }}
            />
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="del-title">
          <div className="absolute inset-0 animate-fade bg-wine-deep/45" onClick={() => setDeleting(null)} />
          <div className="relative flex w-full max-w-md animate-rise flex-col gap-4 bg-ivory p-6 sm:p-8">
            <h2 id="del-title" className="font-display text-[26px]">Delete {deleting.name}?</h2>
            <p className="text-[14px] leading-relaxed text-ink-soft">The product and its photos will be removed from the shop. If it has been ordered before, it will be hidden instead so past orders stay complete.</p>
            <div className="flex gap-3"><button onClick={confirmDelete} className="btn-primary">Yes, delete</button><button onClick={() => setDeleting(null)} className="btn-outline">Keep product</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
