import type { Category, Coupon, Product } from '../types'

type SeedProduct = Omit<Product, 'sizes'>

// ─────────────────────────────────────────────────────────────
//  SEED DATA — sample catalogue loaded into the database by `npm run db:seed`.
//  The website reads products from the database, not from this file.
// ─────────────────────────────────────────────────────────────

export const categories: Category[] = [
  { slug: 'pakistani-suits', name: 'Pakistani Suits', tagline: 'Traditional silhouettes with contemporary elegance.' },
  { slug: 'coord-sets', name: 'Co-ord Sets', tagline: 'Effortless coordinated looks for every occasion.' },
  { slug: 'festive-edit', name: 'Festive Edit', tagline: 'Statement pieces for celebrations and special occasions.' },
]

const lawnCare = ['Gentle hand wash in cold water', 'Wash dark colours separately', 'Dry in shade', 'Warm iron on the reverse']
const festiveCare = ['Dry clean only', 'Store folded in a muslin bag', 'Steam or low iron on the reverse, avoid embroidery']

const commonDetails = (pieces: string) => [pieces, 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']

export const seedProducts: SeedProduct[] = [
  {
    id: 'p01', name: 'Farsi Embroidered Suit', slug: 'farsi-embroidered-suit',
    description: 'A soft wine kameez with resham embroidery climbing from the neckline, paired with straight trousers and a chiffon dupatta edged in gold.',
    details: commonDetails('3-piece: kameez, trousers, dupatta'),
    fabric: 'Cotton-silk kameez · cotton trousers · chiffon dupatta', care: festiveCare,
    fit: 'Relaxed straight fit. Kameez length 44". Model wears size S.',
    price: 2295, salePrice: 1895, category: 'pakistani-suits', colour: 'Wine', images: [],
    artwork: { silhouette: 'straight', base: '#6B1E33', accent: '#D9B97A', trim: '#C9A15E', backdrop: '#EFE3D6', motif: 'floral', dupatta: true },
    stock: { S: 3, M: 5, L: 0, XL: 4, XXL: 2, XXXL: 1 },
    isFeatured: true, isNewArrival: true, isSoldOut: false, popularity: 96,
    createdAt: '2026-09-24', updatedAt: '2026-09-24',
  },
  {
    id: 'p02', name: 'Ivory Lawn Suit', slug: 'ivory-lawn-suit',
    description: 'Breathable printed lawn in ivory with delicate sage buti, finished with a scalloped hem. Made for long summer days and daytime gatherings.',
    details: commonDetails('3-piece: kameez, trousers, dupatta'),
    fabric: 'Pure lawn cotton · voile dupatta', care: lawnCare,
    fit: 'Straight fit with side slits. Kameez length 42".',
    price: 2195, category: 'pakistani-suits', colour: 'Ivory', images: [],
    artwork: { silhouette: 'straight', base: '#F4EDE0', accent: '#8FA58A', trim: '#B9A57F', backdrop: '#E5E0D2', motif: 'buti', dupatta: true },
    stock: { S: 4, M: 6, L: 5, XL: 3, XXL: 2, XXXL: 0 },
    isFeatured: true, isNewArrival: true, isSoldOut: false, popularity: 88,
    createdAt: '2026-09-22', updatedAt: '2026-09-22',
  },
  {
    id: 'p03', name: 'Noor Co-ord Set', slug: 'noor-coord-set',
    description: 'A blush short kurta with mirror-work placket and matching straight pants. Pairs easily with flats for brunch or heels for an evening out.',
    details: ['2-piece: kurta, pants', 'Fully stitched, ready to wear', 'Elasticated waistband with drawstring'],
    fabric: 'Muslin cotton', care: lawnCare,
    fit: 'Relaxed fit. Kurta length 34".',
    price: 1795, category: 'coord-sets', colour: 'Blush', images: [],
    artwork: { silhouette: 'coord', base: '#E7BFB4', accent: '#B5774F', trim: '#C99A6B', backdrop: '#F2E6DF', motif: 'jaal', dupatta: false },
    stock: { S: 2, M: 4, L: 4, XL: 2, XXL: 1, XXXL: 0 },
    isFeatured: false, isNewArrival: true, isSoldOut: false, popularity: 91,
    createdAt: '2026-09-20', updatedAt: '2026-09-20',
  },
  {
    id: 'p04', name: 'Mehfil Pakistani Suit', slug: 'mehfil-pakistani-suit',
    description: 'Deep emerald A-line kameez with tilla-work borders and a net dupatta. A grown-up choice for sangeet nights and family dinners.',
    details: commonDetails('3-piece: kameez, trousers, dupatta'),
    fabric: 'Georgette kameez · net dupatta · crepe trousers', care: festiveCare,
    fit: 'A-line fit, flared from the waist. Kameez length 46".',
    price: 2495, category: 'festive-edit', colour: 'Emerald', images: [],
    artwork: { silhouette: 'aline', base: '#1F4A3E', accent: '#D8BC86', trim: '#C8A665', backdrop: '#E6E4DA', motif: 'jaal', dupatta: true },
    stock: { S: 2, M: 3, L: 3, XL: 1, XXL: 0, XXXL: 0 },
    isFeatured: true, isNewArrival: true, isSoldOut: false, popularity: 94,
    createdAt: '2026-09-18', updatedAt: '2026-09-18',
  },
  {
    id: 'p05', name: 'Gulnaar Anarkali', slug: 'gulnaar-anarkali',
    description: 'A floor-grazing rose anarkali with gota borders and a soft organza dupatta. Movement and light in every step.',
    details: commonDetails('3-piece: anarkali, churidar, dupatta'),
    fabric: 'Chanderi silk · organza dupatta', care: festiveCare,
    fit: 'Fitted bodice, full flare. Length 52".',
    price: 3495, salePrice: 2995, category: 'festive-edit', colour: 'Rose', images: [],
    artwork: { silhouette: 'anarkali', base: '#B35A6B', accent: '#F0D6A2', trim: '#E2BF7E', backdrop: '#F1E4DE', motif: 'buti', dupatta: true },
    stock: { S: 1, M: 2, L: 2, XL: 1, XXL: 1, XXXL: 0 },
    isFeatured: true, isNewArrival: true, isSoldOut: false, popularity: 85,
    createdAt: '2026-09-02', updatedAt: '2026-09-02',
  },
  {
    id: 'p06', name: 'Zarmina Chikankari Suit', slug: 'zarmina-chikankari-suit',
    description: 'Hand-done chikankari on powder blue georgette, with a crisp white trouser and mulmul dupatta. Quietly beautiful.',
    details: commonDetails('3-piece: kameez, trousers, dupatta'),
    fabric: 'Georgette kameez · mulmul dupatta', care: festiveCare,
    fit: 'Straight fit. Kameez length 44".',
    price: 2695, category: 'pakistani-suits', colour: 'Powder Blue', images: [],
    artwork: { silhouette: 'straight', base: '#B9CAD6', accent: '#FFFFFF', trim: '#E8EEF2', backdrop: '#E8E6E1', motif: 'floral', dupatta: true },
    stock: { S: 3, M: 3, L: 2, XL: 2, XXL: 1, XXXL: 1 },
    isFeatured: false, isNewArrival: true, isSoldOut: false, popularity: 79,
    createdAt: '2026-09-15', updatedAt: '2026-09-15',
  },
  {
    id: 'p07', name: 'Saba Striped Co-ord', slug: 'saba-striped-coord',
    description: 'Mustard and ivory woven stripes in a breezy kurta and pant set. Easy, polished, and made for everyday wear.',
    details: ['2-piece: kurta, pants', 'Fully stitched, ready to wear', 'Side pockets'],
    fabric: 'Handloom cotton', care: lawnCare,
    fit: 'Relaxed fit. Kurta length 36".',
    price: 1695, salePrice: 1495, category: 'coord-sets', colour: 'Mustard', images: [],
    artwork: { silhouette: 'coord', base: '#D3A548', accent: '#F6EBD3', trim: '#8C6A2D', backdrop: '#EFE8DA', motif: 'stripe', dupatta: false },
    stock: { S: 3, M: 5, L: 4, XL: 3, XXL: 2, XXXL: 2 },
    isFeatured: false, isNewArrival: false, isSoldOut: false, popularity: 72,
    createdAt: '2026-08-28', updatedAt: '2026-08-28',
  },
  {
    id: 'p08', name: 'Shehnaz Velvet Suit', slug: 'shehnaz-velvet-suit',
    description: 'Midnight velvet kameez with zari jaal and a contrast silk dupatta. Our warmest piece for winter weddings.',
    details: commonDetails('3-piece: kameez, trousers, dupatta'),
    fabric: 'Micro velvet · silk dupatta', care: festiveCare,
    fit: 'Straight fit. Kameez length 44".',
    price: 3995, category: 'festive-edit', colour: 'Midnight', images: [],
    artwork: { silhouette: 'aline', base: '#1E2340', accent: '#CFB27A', trim: '#BB9A5C', backdrop: '#E4E1DC', motif: 'jaal', dupatta: true },
    stock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
    isFeatured: false, isNewArrival: false, isSoldOut: true, popularity: 90,
    createdAt: '2026-08-20', updatedAt: '2026-09-29',
  },
  {
    id: 'p09', name: 'Hayat Lawn Suit', slug: 'hayat-lawn-suit',
    description: 'Sage green lawn with an all-over floral print and lace-trimmed sleeves. Light enough for July, pretty enough for Eid.',
    details: commonDetails('3-piece: kameez, trousers, dupatta'),
    fabric: 'Lawn cotton · chiffon dupatta', care: lawnCare,
    fit: 'Straight fit. Kameez length 42".',
    price: 1995, category: 'pakistani-suits', colour: 'Sage', images: [],
    artwork: { silhouette: 'straight', base: '#9DAE8E', accent: '#F4EBDD', trim: '#E6D9BF', backdrop: '#ECE7DC', motif: 'floral', dupatta: true },
    stock: { S: 5, M: 6, L: 6, XL: 4, XXL: 3, XXXL: 2 },
    isFeatured: false, isNewArrival: false, isSoldOut: false, popularity: 76,
    createdAt: '2026-08-12', updatedAt: '2026-08-12',
  },
  {
    id: 'p10', name: 'Rooh Co-ord Set', slug: 'rooh-coord-set',
    description: 'A jet black kurta with ivory threadwork on the yoke and slim pants. Minimal and striking.',
    details: ['2-piece: kurta, pants', 'Fully stitched, ready to wear'],
    fabric: 'Rayon slub', care: lawnCare,
    fit: 'Regular fit. Kurta length 38".',
    price: 1895, category: 'coord-sets', colour: 'Black', images: [],
    artwork: { silhouette: 'coord', base: '#262122', accent: '#EDE3D1', trim: '#CDBFA5', backdrop: '#E9E4DC', motif: 'buti', dupatta: false },
    stock: { S: 2, M: 3, L: 3, XL: 2, XXL: 2, XXXL: 1 },
    isFeatured: false, isNewArrival: true, isSoldOut: false, popularity: 83,
    createdAt: '2026-09-26', updatedAt: '2026-09-26',
  },
  {
    id: 'p11', name: 'Mahrukh Tissue Suit', slug: 'mahrukh-tissue-suit',
    description: 'Champagne tissue with a sheen that catches candlelight, cut into an A-line kameez with sequin borders.',
    details: commonDetails('3-piece: kameez, trousers, dupatta'),
    fabric: 'Tissue silk · organza dupatta', care: festiveCare,
    fit: 'A-line fit. Kameez length 46".',
    price: 3295, salePrice: 2795, category: 'festive-edit', colour: 'Champagne', images: [],
    artwork: { silhouette: 'aline', base: '#D9C29A', accent: '#8B5E3C', trim: '#A9814F', backdrop: '#EEE7DB', motif: 'buti', dupatta: true },
    stock: { S: 2, M: 2, L: 3, XL: 1, XXL: 1, XXXL: 0 },
    isFeatured: true, isNewArrival: true, isSoldOut: false, popularity: 81,
    createdAt: '2026-09-05', updatedAt: '2026-09-05',
  },
  {
    id: 'p12', name: 'Inaya Cotton Suit', slug: 'inaya-cotton-suit',
    description: 'Terracotta cotton with block-printed jaal and a mulmul dupatta. Your new favourite for work and weekends.',
    details: commonDetails('3-piece: kameez, trousers, dupatta'),
    fabric: 'Cambric cotton · mulmul dupatta', care: lawnCare,
    fit: 'Straight fit. Kameez length 42".',
    price: 1595, category: 'pakistani-suits', colour: 'Terracotta', images: [],
    artwork: { silhouette: 'straight', base: '#B4613F', accent: '#F1DFC2', trim: '#E5C99C', backdrop: '#EFE5DA', motif: 'jaal', dupatta: true },
    stock: { S: 3, M: 4, L: 4, XL: 3, XXL: 0, XXXL: 0 },
    isFeatured: false, isNewArrival: false, isSoldOut: false, popularity: 70,
    createdAt: '2026-08-05', updatedAt: '2026-08-05',
  },
]

export const coupons: Coupon[] = [
  { code: 'WELCOME10', description: '10% off your first order', type: 'percent', value: 10, minSubtotal: 0 },
  { code: 'SIRNAAZ300', description: '₹300 off orders above ₹3,999', type: 'flat', value: 300, minSubtotal: 3999 },
]
