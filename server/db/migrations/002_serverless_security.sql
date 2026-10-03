-- 002 — serverless + Supabase hardening
-- • rate limits shared by every function instance
-- • idempotent order creation (double-click / lost response safe)
-- • product photo thumbnails
-- • Row Level Security on every table, and no table access for Supabase's public API roles

-- ───────── Rate limiting (one tiny row per key; single-statement upsert) ─────────
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT PRIMARY KEY,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  count         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits(window_start);

-- ───────── Orders: idempotency key (SHA-256 of the browser's checkout key) ─────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_idx ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ───────── Product images: small version for product cards ─────────
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS thumb_url TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS thumb_key TEXT;

-- ───────── Housekeeping indexes ─────────
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS password_resets_expires_idx ON password_resets(expires_at);

-- ───────── Row Level Security ─────────
-- The website's server connects as the database owner and is the only thing that reads or writes data.
-- Supabase also publishes every table through its own REST/GraphQL API for the `anon` and `authenticated`
-- roles. Enabling RLS with NO policies means those roles can see and change nothing, and the explicit
-- REVOKEs below remove their table privileges as a second lock.
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
-- (The table owner — the server's own login — is not subject to RLS, so the website keeps working.
--  Any table added by a future migration must also run ENABLE ROW LEVEL SECURITY; `npm run db:check` verifies this.)

DO $$
DECLARE r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END $$;
