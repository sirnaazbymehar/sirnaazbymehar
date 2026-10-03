-- OPTIONAL: 12 illustrated sample products (no photos). Run after setup.sql if you want example products.
-- Delete them later from Admin → Products.
BEGIN;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Farsi Embroidered Suit', 'farsi-embroidered-suit', 'A soft wine kameez with resham embroidery climbing from the neckline, paired with straight trousers and a chiffon dupatta edged in gold.', ARRAY['3-piece: kameez, trousers, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 2295, 1895, c.id, 'Wine', 'Cotton-silk kameez · cotton trousers · chiffon dupatta', ARRAY['Dry clean only', 'Store folded in a muslin bag', 'Steam or low iron on the reverse, avoid embroidery']::text[], 'Relaxed straight fit. Kameez length 44". Model wears size S.', TRUE, TRUE, FALSE, 96, '{"silhouette":"straight","base":"#6B1E33","accent":"#D9B97A","trim":"#C9A15E","backdrop":"#EFE3D6","motif":"floral","dupatta":true}'::jsonb, '2026-09-24'::timestamptz, '2026-09-24'::timestamptz
  FROM categories c WHERE c.slug = 'pakistani-suits'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 3), ('M', 5), ('L', 0), ('XL', 4), ('XXL', 2), ('XXXL', 1)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Ivory Lawn Suit', 'ivory-lawn-suit', 'Breathable printed lawn in ivory with delicate sage buti, finished with a scalloped hem. Made for long summer days and daytime gatherings.', ARRAY['3-piece: kameez, trousers, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 2195, NULL, c.id, 'Ivory', 'Pure lawn cotton · voile dupatta', ARRAY['Gentle hand wash in cold water', 'Wash dark colours separately', 'Dry in shade', 'Warm iron on the reverse']::text[], 'Straight fit with side slits. Kameez length 42".', TRUE, TRUE, FALSE, 88, '{"silhouette":"straight","base":"#F4EDE0","accent":"#8FA58A","trim":"#B9A57F","backdrop":"#E5E0D2","motif":"buti","dupatta":true}'::jsonb, '2026-09-22'::timestamptz, '2026-09-22'::timestamptz
  FROM categories c WHERE c.slug = 'pakistani-suits'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 4), ('M', 6), ('L', 5), ('XL', 3), ('XXL', 2), ('XXXL', 0)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Noor Co-ord Set', 'noor-coord-set', 'A blush short kurta with mirror-work placket and matching straight pants. Pairs easily with flats for brunch or heels for an evening out.', ARRAY['2-piece: kurta, pants', 'Fully stitched, ready to wear', 'Elasticated waistband with drawstring']::text[], 1795, NULL, c.id, 'Blush', 'Muslin cotton', ARRAY['Gentle hand wash in cold water', 'Wash dark colours separately', 'Dry in shade', 'Warm iron on the reverse']::text[], 'Relaxed fit. Kurta length 34".', FALSE, TRUE, FALSE, 91, '{"silhouette":"coord","base":"#E7BFB4","accent":"#B5774F","trim":"#C99A6B","backdrop":"#F2E6DF","motif":"jaal","dupatta":false}'::jsonb, '2026-09-20'::timestamptz, '2026-09-20'::timestamptz
  FROM categories c WHERE c.slug = 'coord-sets'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 2), ('M', 4), ('L', 4), ('XL', 2), ('XXL', 1), ('XXXL', 0)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Mehfil Pakistani Suit', 'mehfil-pakistani-suit', 'Deep emerald A-line kameez with tilla-work borders and a net dupatta. A grown-up choice for sangeet nights and family dinners.', ARRAY['3-piece: kameez, trousers, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 2495, NULL, c.id, 'Emerald', 'Georgette kameez · net dupatta · crepe trousers', ARRAY['Dry clean only', 'Store folded in a muslin bag', 'Steam or low iron on the reverse, avoid embroidery']::text[], 'A-line fit, flared from the waist. Kameez length 46".', TRUE, TRUE, FALSE, 94, '{"silhouette":"aline","base":"#1F4A3E","accent":"#D8BC86","trim":"#C8A665","backdrop":"#E6E4DA","motif":"jaal","dupatta":true}'::jsonb, '2026-09-18'::timestamptz, '2026-09-18'::timestamptz
  FROM categories c WHERE c.slug = 'festive-edit'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 2), ('M', 3), ('L', 3), ('XL', 1), ('XXL', 0), ('XXXL', 0)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Gulnaar Anarkali', 'gulnaar-anarkali', 'A floor-grazing rose anarkali with gota borders and a soft organza dupatta. Movement and light in every step.', ARRAY['3-piece: anarkali, churidar, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 3495, 2995, c.id, 'Rose', 'Chanderi silk · organza dupatta', ARRAY['Dry clean only', 'Store folded in a muslin bag', 'Steam or low iron on the reverse, avoid embroidery']::text[], 'Fitted bodice, full flare. Length 52".', TRUE, TRUE, FALSE, 85, '{"silhouette":"anarkali","base":"#B35A6B","accent":"#F0D6A2","trim":"#E2BF7E","backdrop":"#F1E4DE","motif":"buti","dupatta":true}'::jsonb, '2026-09-02'::timestamptz, '2026-09-02'::timestamptz
  FROM categories c WHERE c.slug = 'festive-edit'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 1), ('M', 2), ('L', 2), ('XL', 1), ('XXL', 1), ('XXXL', 0)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Zarmina Chikankari Suit', 'zarmina-chikankari-suit', 'Hand-done chikankari on powder blue georgette, with a crisp white trouser and mulmul dupatta. Quietly beautiful.', ARRAY['3-piece: kameez, trousers, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 2695, NULL, c.id, 'Powder Blue', 'Georgette kameez · mulmul dupatta', ARRAY['Dry clean only', 'Store folded in a muslin bag', 'Steam or low iron on the reverse, avoid embroidery']::text[], 'Straight fit. Kameez length 44".', FALSE, TRUE, FALSE, 79, '{"silhouette":"straight","base":"#B9CAD6","accent":"#FFFFFF","trim":"#E8EEF2","backdrop":"#E8E6E1","motif":"floral","dupatta":true}'::jsonb, '2026-09-15'::timestamptz, '2026-09-15'::timestamptz
  FROM categories c WHERE c.slug = 'pakistani-suits'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 3), ('M', 3), ('L', 2), ('XL', 2), ('XXL', 1), ('XXXL', 1)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Saba Striped Co-ord', 'saba-striped-coord', 'Mustard and ivory woven stripes in a breezy kurta and pant set. Easy, polished, and made for everyday wear.', ARRAY['2-piece: kurta, pants', 'Fully stitched, ready to wear', 'Side pockets']::text[], 1695, 1495, c.id, 'Mustard', 'Handloom cotton', ARRAY['Gentle hand wash in cold water', 'Wash dark colours separately', 'Dry in shade', 'Warm iron on the reverse']::text[], 'Relaxed fit. Kurta length 36".', FALSE, FALSE, FALSE, 72, '{"silhouette":"coord","base":"#D3A548","accent":"#F6EBD3","trim":"#8C6A2D","backdrop":"#EFE8DA","motif":"stripe","dupatta":false}'::jsonb, '2026-08-28'::timestamptz, '2026-08-28'::timestamptz
  FROM categories c WHERE c.slug = 'coord-sets'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 3), ('M', 5), ('L', 4), ('XL', 3), ('XXL', 2), ('XXXL', 2)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Shehnaz Velvet Suit', 'shehnaz-velvet-suit', 'Midnight velvet kameez with zari jaal and a contrast silk dupatta. Our warmest piece for winter weddings.', ARRAY['3-piece: kameez, trousers, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 3995, NULL, c.id, 'Midnight', 'Micro velvet · silk dupatta', ARRAY['Dry clean only', 'Store folded in a muslin bag', 'Steam or low iron on the reverse, avoid embroidery']::text[], 'Straight fit. Kameez length 44".', FALSE, FALSE, TRUE, 90, '{"silhouette":"aline","base":"#1E2340","accent":"#CFB27A","trim":"#BB9A5C","backdrop":"#E4E1DC","motif":"jaal","dupatta":true}'::jsonb, '2026-08-20'::timestamptz, '2026-08-20'::timestamptz
  FROM categories c WHERE c.slug = 'festive-edit'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 0), ('M', 0), ('L', 0), ('XL', 0), ('XXL', 0), ('XXXL', 0)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Hayat Lawn Suit', 'hayat-lawn-suit', 'Sage green lawn with an all-over floral print and lace-trimmed sleeves. Light enough for July, pretty enough for Eid.', ARRAY['3-piece: kameez, trousers, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 1995, NULL, c.id, 'Sage', 'Lawn cotton · chiffon dupatta', ARRAY['Gentle hand wash in cold water', 'Wash dark colours separately', 'Dry in shade', 'Warm iron on the reverse']::text[], 'Straight fit. Kameez length 42".', FALSE, FALSE, FALSE, 76, '{"silhouette":"straight","base":"#9DAE8E","accent":"#F4EBDD","trim":"#E6D9BF","backdrop":"#ECE7DC","motif":"floral","dupatta":true}'::jsonb, '2026-08-12'::timestamptz, '2026-08-12'::timestamptz
  FROM categories c WHERE c.slug = 'pakistani-suits'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 5), ('M', 6), ('L', 6), ('XL', 4), ('XXL', 3), ('XXXL', 2)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Rooh Co-ord Set', 'rooh-coord-set', 'A jet black kurta with ivory threadwork on the yoke and slim pants. Minimal and striking.', ARRAY['2-piece: kurta, pants', 'Fully stitched, ready to wear']::text[], 1895, NULL, c.id, 'Black', 'Rayon slub', ARRAY['Gentle hand wash in cold water', 'Wash dark colours separately', 'Dry in shade', 'Warm iron on the reverse']::text[], 'Regular fit. Kurta length 38".', FALSE, TRUE, FALSE, 83, '{"silhouette":"coord","base":"#262122","accent":"#EDE3D1","trim":"#CDBFA5","backdrop":"#E9E4DC","motif":"buti","dupatta":false}'::jsonb, '2026-09-26'::timestamptz, '2026-09-26'::timestamptz
  FROM categories c WHERE c.slug = 'coord-sets'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 2), ('M', 3), ('L', 3), ('XL', 2), ('XXL', 2), ('XXXL', 1)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Mahrukh Tissue Suit', 'mahrukh-tissue-suit', 'Champagne tissue with a sheen that catches candlelight, cut into an A-line kameez with sequin borders.', ARRAY['3-piece: kameez, trousers, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 3295, 2795, c.id, 'Champagne', 'Tissue silk · organza dupatta', ARRAY['Dry clean only', 'Store folded in a muslin bag', 'Steam or low iron on the reverse, avoid embroidery']::text[], 'A-line fit. Kameez length 46".', TRUE, TRUE, FALSE, 81, '{"silhouette":"aline","base":"#D9C29A","accent":"#8B5E3C","trim":"#A9814F","backdrop":"#EEE7DB","motif":"buti","dupatta":true}'::jsonb, '2026-09-05'::timestamptz, '2026-09-05'::timestamptz
  FROM categories c WHERE c.slug = 'festive-edit'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 2), ('M', 2), ('L', 3), ('XL', 1), ('XXL', 1), ('XXXL', 0)) AS q(size, qty) ON q.size = v.size;

WITH p AS (
  INSERT INTO products (name, slug, description, details, price, sale_price, category_id, colour, fabric, care, fit, is_featured, is_new_arrival, is_sold_out, popularity, artwork, created_at, updated_at)
  SELECT 'Inaya Cotton Suit', 'inaya-cotton-suit', 'Terracotta cotton with block-printed jaal and a mulmul dupatta. Your new favourite for work and weekends.', ARRAY['3-piece: kameez, trousers, dupatta', 'Fully stitched, ready to wear', 'Lining included where fabric is sheer']::text[], 1595, NULL, c.id, 'Terracotta', 'Cambric cotton · mulmul dupatta', ARRAY['Gentle hand wash in cold water', 'Wash dark colours separately', 'Dry in shade', 'Warm iron on the reverse']::text[], 'Straight fit. Kameez length 42".', FALSE, FALSE, FALSE, 70, '{"silhouette":"straight","base":"#B4613F","accent":"#F1DFC2","trim":"#E5C99C","backdrop":"#EFE5DA","motif":"jaal","dupatta":true}'::jsonb, '2026-08-05'::timestamptz, '2026-08-05'::timestamptz
  FROM categories c WHERE c.slug = 'pakistani-suits'
  ON CONFLICT (slug) DO NOTHING RETURNING id
), v AS (
  INSERT INTO product_variants (product_id, size) SELECT p.id, s.size FROM p, (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('XXXL')) AS s(size) RETURNING id, size
)
INSERT INTO inventory (variant_id, quantity) SELECT v.id, q.qty FROM v JOIN (VALUES ('S', 3), ('M', 4), ('L', 4), ('XL', 3), ('XXL', 0), ('XXXL', 0)) AS q(size, qty) ON q.size = v.size;

COMMIT;
