// Seeds categories, coupons, default settings and (only if the shop is empty) the sample catalogue.
//   npm run db:seed            → safe to run repeatedly
//   npm run db:seed -- --no-samples   → skip sample products
import { fileURLToPath } from 'node:url'
import { closePool, tx } from './pool'
import { migrate } from './migrate'
import { categories, coupons, seedProducts } from '../../src/data/products'
import { defaultSettings } from '../lib/settings'

export async function seed({ samples = true } = {}) {
  await migrate()
  await tx(async (db) => {
    for (const [i, c] of categories.entries()) {
      await db.query(`INSERT INTO categories (slug, name, tagline, sort_order) VALUES ($1,$2,$3,$4)
                      ON CONFLICT (slug) DO NOTHING`, [c.slug, c.name, c.tagline, i])
    }
    for (const c of coupons) {
      await db.query(`INSERT INTO coupons (code, description, type, value, min_subtotal) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (code) DO NOTHING`,
        [c.code, c.description, c.type, c.value, c.minSubtotal])
    }
    await db.query(`INSERT INTO site_settings (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING`, [defaultSettings])

    const count = (await db.query('SELECT count(*)::int AS n FROM products')).rows[0].n
    if (!samples || count > 0) return
    for (const p of seedProducts) {
      const cat = (await db.query('SELECT id FROM categories WHERE slug = $1', [p.category])).rows[0].id
      const id = (await db.query(
        `INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit,
                               is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17) RETURNING id`,
        [p.name, p.slug, p.description, p.details, p.price, p.salePrice ?? null, cat, p.colour, p.fabric, p.care, p.fit,
         p.isFeatured, p.isNewArrival, p.isSoldOut, p.popularity, p.artwork, p.createdAt])).rows[0].id
      for (const [size, qty] of Object.entries(p.stock)) {
        const v = (await db.query('INSERT INTO product_variants (product_id, size) VALUES ($1,$2) RETURNING id', [id, size])).rows[0].id
        await db.query('INSERT INTO inventory (variant_id, quantity) VALUES ($1,$2)', [v, qty])
      }
    }
    console.log(`✓ seeded ${seedProducts.length} sample products`)
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seed({ samples: !process.argv.includes('--no-samples') }).then(() => { console.log('✓ seed complete'); return closePool() })
    .catch((e) => { console.error(e); process.exit(1) })
}
