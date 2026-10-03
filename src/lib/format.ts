const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const formatPrice = (n: number) => inr.format(n)
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
export const discountPercent = (price: number, sale?: number) =>
  sale && sale < price ? Math.round(((price - sale) / price) * 100) : 0
