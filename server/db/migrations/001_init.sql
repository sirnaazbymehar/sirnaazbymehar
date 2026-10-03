-- Sirnaaz by Mehar — initial schema (safe to run more than once: every object is created only if missing)
-- Money is stored as whole rupees (INTEGER). Convert to paise only at the payment-gateway boundary.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ───────── Catalogue ─────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  tagline     TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL DEFAULT '',
  details         TEXT[] NOT NULL DEFAULT '{}',
  price           INTEGER NOT NULL CHECK (price > 0),
  sale_price      INTEGER CHECK (sale_price IS NULL OR (sale_price > 0 AND sale_price < price)),
  category_id     INTEGER NOT NULL REFERENCES categories(id),
  colour          TEXT NOT NULL DEFAULT '',
  fabric          TEXT NOT NULL DEFAULT '',
  care            TEXT[] NOT NULL DEFAULT '{}',
  fit             TEXT NOT NULL DEFAULT '',
  delivery_info   TEXT NOT NULL DEFAULT '',
  return_info     TEXT NOT NULL DEFAULT '',
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,   -- inactive = hidden from customers
  is_sold_out     BOOLEAN NOT NULL DEFAULT FALSE,  -- manual override
  popularity      INTEGER NOT NULL DEFAULT 0,
  artwork         JSONB,                           -- placeholder illustration recipe, used until photos exist
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        TEXT NOT NULL CHECK (size IN ('S','M','L','XL','XXL','XXXL')),
  sku         TEXT UNIQUE,
  UNIQUE (product_id, size)
);

-- One row per variant (= per size). Stock can never go below zero.
CREATE TABLE IF NOT EXISTS inventory (
  variant_id  UUID PRIMARY KEY REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  storage_key  TEXT NOT NULL,
  position     INTEGER NOT NULL DEFAULT 0,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  alt          TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images(product_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary ON product_images(product_id) WHERE is_primary;

-- ───────── People ─────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,     -- stored lower-case
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL DEFAULT '',
  password_hash  TEXT NOT NULL,            -- argon2id, never plain text
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at  TIMESTAMPTZ
);

-- Sessions store only a SHA-256 hash of the cookie token.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id    UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((user_id IS NULL) <> (admin_id IS NULL))
);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash  TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  mobile      TEXT NOT NULL,
  house       TEXT NOT NULL,
  address     TEXT NOT NULL,
  area        TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'India',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlist (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- ───────── Commerce ─────────
CREATE TABLE IF NOT EXISTS coupons (
  code          TEXT PRIMARY KEY,           -- upper-case
  description   TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL CHECK (type IN ('percent','flat')),
  value         INTEGER NOT NULL CHECK (value > 0),
  min_subtotal  INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at    TIMESTAMPTZ
);

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number           TEXT NOT NULL UNIQUE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,  -- null = guest checkout
  view_token_hash  TEXT NOT NULL,                                 -- lets a guest view their own confirmation
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  house            TEXT NOT NULL,
  address          TEXT NOT NULL,
  area             TEXT NOT NULL DEFAULT '',
  city             TEXT NOT NULL,
  state            TEXT NOT NULL,
  pincode          TEXT NOT NULL,
  country          TEXT NOT NULL DEFAULT 'India',
  subtotal         INTEGER NOT NULL,
  shipping         INTEGER NOT NULL,
  discount         INTEGER NOT NULL DEFAULT 0,
  total            INTEGER NOT NULL,
  coupon_code      TEXT,
  payment_method   TEXT NOT NULL CHECK (payment_method IN ('online','cod')),
  payment_status   TEXT NOT NULL CHECK (payment_status IN ('pending','paid','cod-pending','refunded','failed')),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','packed','shipped','delivered','cancelled','refunded')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);

-- Snapshot of each line at the moment of purchase. Never re-derived from current product data.
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id    UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  product_slug  TEXT NOT NULL,
  image_url     TEXT,
  size          TEXT NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    INTEGER NOT NULL,
  line_total    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id          SERIAL PRIMARY KEY,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  changed_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-row settings document, edited from Admin → Settings.
CREATE TABLE IF NOT EXISTS site_settings (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
