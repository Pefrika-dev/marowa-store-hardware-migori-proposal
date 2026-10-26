-- ============================================================================
-- Marowa Store — reference production schema
-- ----------------------------------------------------------------------------
-- STATUS: Design reference only. This schema is NOT used by the frontend
-- demonstration and has not been deployed or load-tested as part of this
-- repository. Review with the production engineering/security team before use.
--
-- Target: PostgreSQL 15+ (tested syntax target: PostgreSQL 16).
-- Money: NUMERIC(12,2). Quantities: NUMERIC(12,3) to allow metres/litres.
-- All timestamps are stored in UTC; render in Africa/Nairobi at the edge.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- catalogue text search

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Staff accounts, sessions and audit
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  password_hash   text NOT NULL,
  full_name       text NOT NULL,
  role            text NOT NULL
                    CHECK (role IN ('owner', 'manager', 'sales', 'stock', 'viewer')),
  is_active       boolean NOT NULL DEFAULT true,
  totp_secret     text,                    -- encrypted at rest by the app/KMS
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_not_blank CHECK (length(trim(email)) > 3),
  CONSTRAINT users_name_not_blank CHECK (length(trim(full_name)) >= 2)
);

CREATE UNIQUE INDEX users_email_lower_uidx ON users (lower(email));

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      text NOT NULL,
  ip              inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  revoked_at      timestamptz,
  CONSTRAINT sessions_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX sessions_token_hash_uidx ON sessions (token_hash);
CREATE INDEX sessions_user_active_idx ON sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL,
  name            text NOT NULL,
  eyebrow         text,
  description     text NOT NULL DEFAULT '',
  image_path      text,
  image_alt       text,
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX categories_slug_uidx ON categories (slug);
CREATE UNIQUE INDEX categories_name_lower_uidx ON categories (lower(name));

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE brands (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL,
  name            text NOT NULL,
  notes           text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brands_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX brands_slug_uidx ON brands (slug);
CREATE UNIQUE INDEX brands_name_lower_uidx ON brands (lower(name));

CREATE TRIGGER brands_set_updated_at
BEFORE UPDATE ON brands
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                   text NOT NULL,
  slug                  text NOT NULL,
  name                  text NOT NULL,
  category_id           uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id              uuid REFERENCES brands(id) ON DELETE SET NULL,
  unit                  text NOT NULL,
  description           text NOT NULL DEFAULT '',
  price                 numeric(12,2)
                          CHECK (price IS NULL OR price >= 0),
  stock_qty             numeric(12,3)
                          CHECK (stock_qty IS NULL OR stock_qty >= 0),
  low_stock_threshold   numeric(12,3) NOT NULL DEFAULT 0
                          CHECK (low_stock_threshold >= 0),
  currency              char(3) NOT NULL DEFAULT 'KES',
  image_path            text,
  image_alt             text,
  specifications        jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active             boolean NOT NULL DEFAULT false,
  is_featured           boolean NOT NULL DEFAULT false,
  published_at          timestamptz,
  created_by            uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by            uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  CONSTRAINT products_sku_format CHECK (sku ~ '^[A-Z0-9][A-Z0-9-]{3,23}$'),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT products_name_length CHECK (length(trim(name)) BETWEEN 3 AND 160),
  CONSTRAINT products_specs_array CHECK (jsonb_typeof(specifications) = 'array')
);

CREATE UNIQUE INDEX products_sku_uidx ON products (upper(sku));
CREATE UNIQUE INDEX products_slug_uidx ON products (slug);
CREATE INDEX products_category_idx ON products (category_id)
  WHERE deleted_at IS NULL;
CREATE INDEX products_brand_idx ON products (brand_id)
  WHERE deleted_at IS NULL;
CREATE INDEX products_published_idx ON products (is_active, published_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX products_featured_idx ON products (is_featured)
  WHERE is_active AND deleted_at IS NULL;
CREATE INDEX products_search_trgm_idx
  ON products USING gin ((name || ' ' || sku) gin_trgm_ops);

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Current quantity is a cached convenience value. Every change must also
-- create an inventory_movements row; reconcile periodically.
CREATE TABLE inventory_movements (
  id              bigserial PRIMARY KEY,
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  delta           numeric(12,3) NOT NULL CHECK (delta <> 0),
  reason          text NOT NULL
                    CHECK (reason IN ('stock_in', 'sale', 'adjustment', 'return',
                                      'damage', 'recount', 'reservation_release')),
  reference       text,
  note            text,
  actor_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX inventory_movements_product_time_idx
  ON inventory_movements (product_id, created_at DESC);
CREATE INDEX inventory_movements_actor_time_idx
  ON inventory_movements (actor_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Document references (quotation, inquiry)
-- ---------------------------------------------------------------------------
CREATE TABLE document_counters (
  scope         text NOT NULL,
  period_year   integer NOT NULL,
  last_value    bigint NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  PRIMARY KEY (scope, period_year)
);

-- Returns e.g. MRW-Q-2026-0007. Call inside the same transaction as the
-- document insert. The ON CONFLICT update locks the counter row.
CREATE OR REPLACE FUNCTION next_document_reference(
  p_scope text,
  p_prefix text,
  p_year integer
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_next bigint;
BEGIN
  INSERT INTO document_counters (scope, period_year, last_value)
  VALUES (p_scope, p_year, 1)
  ON CONFLICT (scope, period_year)
  DO UPDATE SET last_value = document_counters.last_value + 1
  RETURNING last_value INTO v_next;

  RETURN p_prefix || '-' || p_year::text || '-' || lpad(v_next::text, 4, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- Quotation requests
-- ---------------------------------------------------------------------------
CREATE TABLE quotations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             text NOT NULL,
  customer_name         text NOT NULL,
  phone_e164            text NOT NULL,
  email                 text,
  project_type          text,
  project_description   text NOT NULL,
  needed_by             date,
  preferred_branch      text,
  contact_method        text NOT NULL DEFAULT 'phone'
                          CHECK (contact_method IN ('phone', 'whatsapp', 'email')),
  status                text NOT NULL DEFAULT 'New'
                          CHECK (status IN ('New', 'Under Review', 'Awaiting Customer',
                                            'Quoted', 'Closed', 'Cancelled')),
  internal_notes        text NOT NULL DEFAULT '',
  currency              char(3) NOT NULL DEFAULT 'KES',
  indicative_total      numeric(12,2)
                          CHECK (indicative_total IS NULL OR indicative_total >= 0),
  prices_visible        boolean NOT NULL DEFAULT true,
  source                text NOT NULL DEFAULT 'web',
  consent_version       text NOT NULL,
  consent_at            timestamptz NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  closed_at             timestamptz,
  CONSTRAINT quotations_reference_format CHECK (reference ~ '^[A-Z]{2,6}-[A-Z]-[0-9]{4}-[0-9]{4,}$'),
  CONSTRAINT quotations_phone_not_blank CHECK (length(trim(phone_e164)) >= 7),
  CONSTRAINT quotations_description_length CHECK (length(project_description) BETWEEN 15 AND 4000)
);

CREATE UNIQUE INDEX quotations_reference_uidx ON quotations (reference);
CREATE INDEX quotations_status_created_idx ON quotations (status, created_at DESC);
CREATE INDEX quotations_created_idx ON quotations (created_at DESC);
CREATE INDEX quotations_phone_idx ON quotations (phone_e164);

CREATE TRIGGER quotations_set_updated_at
BEFORE UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE quotation_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  line_no         integer NOT NULL CHECK (line_no > 0),
  sku_snapshot    text NOT NULL,
  name_snapshot   text NOT NULL,
  unit_snapshot   text NOT NULL,
  qty             numeric(12,3) NOT NULL CHECK (qty > 0 AND qty <= 9999),
  unit_price      numeric(12,2)
                    CHECK (unit_price IS NULL OR unit_price >= 0),
  line_total      numeric(12,2)
                    CHECK (line_total IS NULL OR line_total >= 0),
  note            text NOT NULL DEFAULT '',
  UNIQUE (quotation_id, line_no),
  CONSTRAINT quotation_items_price_consistency
    CHECK ((unit_price IS NULL AND line_total IS NULL)
        OR (unit_price IS NOT NULL AND line_total IS NOT NULL))
);

CREATE INDEX quotation_items_quotation_idx ON quotation_items (quotation_id, line_no);
CREATE INDEX quotation_items_product_idx ON quotation_items (product_id);

-- Append-only status history for quotations.
CREATE TABLE quotation_status_history (
  id              bigserial PRIMARY KEY,
  quotation_id    uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  from_status     text,
  to_status       text NOT NULL,
  actor_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quotation_status_history_quote_idx
  ON quotation_status_history (quotation_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Inquiries
-- ---------------------------------------------------------------------------
CREATE TABLE inquiries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference       text NOT NULL,
  customer_name   text NOT NULL,
  phone_e164      text,
  email           text,
  topic           text,
  message         text NOT NULL,
  status          text NOT NULL DEFAULT 'New'
                    CHECK (status IN ('New', 'In Progress', 'Awaiting Customer',
                                      'Resolved', 'Closed')),
  internal_notes  text NOT NULL DEFAULT '',
  source          text NOT NULL DEFAULT 'web',
  consent_version text,
  consent_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  CONSTRAINT inquiries_reference_format CHECK (reference ~ '^[A-Z]{2,6}-[A-Z]-[0-9]{4}-[0-9]{4,}$'),
  CONSTRAINT inquiries_message_length CHECK (length(message) BETWEEN 10 AND 4000),
  CONSTRAINT inquiries_contact_present
    CHECK (nullif(trim(coalesce(phone_e164, '')), '') IS NOT NULL
        OR nullif(trim(coalesce(email, '')), '') IS NOT NULL)
);

CREATE UNIQUE INDEX inquiries_reference_uidx ON inquiries (reference);
CREATE INDEX inquiries_status_created_idx ON inquiries (status, created_at DESC);
CREATE INDEX inquiries_created_idx ON inquiries (created_at DESC);

CREATE TRIGGER inquiries_set_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Settings and audit
-- ---------------------------------------------------------------------------
CREATE TABLE settings (
  key             text PRIMARY KEY,
  value           jsonb NOT NULL,
  updated_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id              bigserial PRIMARY KEY,
  actor_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_role      text,
  action          text NOT NULL,
  entity_type     text NOT NULL,
  entity_id       text,
  before_state    jsonb,
  after_state     jsonb,
  ip              inet,
  user_agent      text,
  request_id      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id, created_at DESC);
CREATE INDEX audit_logs_created_idx ON audit_logs (created_at DESC);

-- The application role should not be able to update or delete audit rows.
-- Example deployment grants (adapt to your role names):
--   REVOKE UPDATE, DELETE ON audit_logs FROM app_rw;
--   GRANT INSERT, SELECT ON audit_logs TO app_rw;
--   GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO app_rw;

-- ---------------------------------------------------------------------------
-- Read views
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW published_products AS
SELECT
  p.id,
  p.sku,
  p.slug,
  p.name,
  p.description,
  p.unit,
  p.price,
  p.stock_qty,
  p.low_stock_threshold,
  p.currency,
  p.image_path,
  p.image_alt,
  p.specifications,
  p.is_featured,
  p.published_at,
  c.id   AS category_id,
  c.slug AS category_slug,
  c.name AS category_name,
  b.id   AS brand_id,
  b.name AS brand_name,
  CASE
    WHEN p.stock_qty IS NULL THEN 'contact'
    WHEN p.stock_qty <= 0 THEN 'out-of-stock'
    WHEN p.stock_qty <= COALESCE(p.low_stock_threshold, 0) THEN 'low-stock'
    ELSE 'in-stock'
  END AS stock_status
FROM products p
JOIN categories c ON c.id = p.category_id AND c.is_active
LEFT JOIN brands b ON b.id = p.brand_id
WHERE p.is_active
  AND p.deleted_at IS NULL;

COMMENT ON VIEW published_products IS
  'Public catalogue projection. Excludes drafts, deleted rows and inactive categories.';

COMMENT ON COLUMN products.price IS
  'NULL means price must be confirmed; it must never be treated as zero.';
COMMENT ON COLUMN products.stock_qty IS
  'NULL means availability must be confirmed; zero means out of stock.';
COMMENT ON TABLE inventory_movements IS
  'Append-only stock ledger. Every quantity change must create a row.';

COMMIT;
