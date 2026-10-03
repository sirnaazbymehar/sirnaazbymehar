-- ═══════════════════════════════════════════════════════════════════
-- Sirnaaz by Mehar — READ-ONLY diagnostic. Changes nothing.
-- Shows exactly which parts of the setup already exist in this Supabase project.
-- ═══════════════════════════════════════════════════════════════════
WITH expected(t) AS (VALUES ('addresses'), ('admin_users'), ('categories'), ('coupons'), ('inventory'), ('order_items'),
  ('order_status_history'), ('orders'), ('password_resets'), ('product_images'), ('product_variants'), ('products'),
  ('rate_limits'), ('schema_migrations'), ('sessions'), ('site_settings'), ('users'), ('wishlist'))
SELECT * FROM (
  SELECT 1 AS n, 'Shop tables present' AS item,
         (SELECT count(*) FROM expected e WHERE to_regclass('public.' || e.t) IS NOT NULL) || ' of 18' AS value
  UNION ALL SELECT 2, 'Missing tables',
         COALESCE((SELECT string_agg(e.t, ', ') FROM expected e WHERE to_regclass('public.' || e.t) IS NULL), 'none')
  UNION ALL SELECT 3, 'Setup steps recorded',
         CASE WHEN to_regclass('public.schema_migrations') IS NULL THEN 'none (table not created)'
              ELSE COALESCE((xpath('/table/row/v/text()', query_to_xml('SELECT string_agg(name, '', '' ORDER BY name) AS v FROM public.schema_migrations', false, false, '')))[1]::text, 'none') END
  UNION ALL SELECT 4, 'Tables without Row Level Security',
         COALESCE((SELECT string_agg(tablename, ', ') FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity), 'none')
  UNION ALL SELECT 5, 'Rows: products / orders / customers / admins',
         CASE WHEN to_regclass('public.products') IS NULL THEN 'tables not created' ELSE
           (xpath('/table/row/v/text()', query_to_xml('SELECT (SELECT count(*) FROM public.products) || '' / '' || (SELECT count(*) FROM public.orders) || '' / '' || (SELECT count(*) FROM public.users) || '' / '' || (SELECT count(*) FROM public.admin_users) AS v', false, false, '')))[1]::text END
  UNION ALL SELECT 6, 'Photo bucket product-images',
         COALESCE((SELECT CASE WHEN public THEN 'exists, public' ELSE 'exists, NOT public' END FROM storage.buckets WHERE id = 'product-images'), 'not created')
  UNION ALL SELECT 7, 'Other tables in public schema (not from this setup)',
         COALESCE((SELECT string_agg(tablename, ', ') FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (SELECT t FROM expected)), 'none')
) d ORDER BY n;
