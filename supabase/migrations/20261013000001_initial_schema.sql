-- ==============================================================================
-- Migration: 20261013000001_initial_schema.sql
-- Description: Core tables, indexes, constraints, and updated_at triggers
-- Target: public.profiles, public.products, public.stock_movements
-- ==============================================================================

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Table: public.profiles
-- Linked 1:1 with auth.users. Contains role for RBAC ('admin_gudang' or 'owner').
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role IN ('admin_gudang', 'owner')),
  CONSTRAINT profiles_email_not_empty CHECK (length(trim(email)) > 0),
  CONSTRAINT profiles_name_not_empty CHECK (length(trim(full_name)) > 0)
);

-- Unique index on lowercase email for case-insensitive lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- updated_at trigger for profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Table: public.products
-- Central catalog. Sourced from DummyJSON with whole IDR prices (bigint).
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  price bigint NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_price_non_negative CHECK (price >= 0),
  CONSTRAINT products_stock_non_negative CHECK (stock >= 0),
  CONSTRAINT products_sku_not_empty CHECK (sku = trim(sku) AND length(sku) > 0),
  CONSTRAINT products_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT products_category_not_empty CHECK (length(trim(category)) > 0)
);

-- Case-insensitive unique SKU index
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_lower_idx ON public.products (lower(sku));
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_stock_idx ON public.products (stock);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products (created_at DESC);

-- updated_at trigger for products
DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Table: public.stock_movements
-- Append-only audit ledger of every inventory mutation.
-- Restricted deletions preserve complete traceability.
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type text NOT NULL,
  quantity integer NOT NULL,
  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT movements_type_check CHECK (type IN ('IN', 'OUT')),
  CONSTRAINT movements_quantity_positive CHECK (quantity > 0),
  CONSTRAINT movements_stock_before_non_negative CHECK (stock_before >= 0),
  CONSTRAINT movements_stock_after_non_negative CHECK (stock_after >= 0),
  CONSTRAINT movements_note_not_empty CHECK (length(trim(note)) > 0),
  CONSTRAINT movements_delta_integrity CHECK (
    (type = 'IN'  AND stock_after = stock_before + quantity) OR
    (type = 'OUT' AND stock_after = stock_before - quantity)
  )
);

-- Foreign-key and query indexes
CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS stock_movements_user_id_idx ON public.stock_movements (user_id);
CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON public.stock_movements (type);
CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx ON public.stock_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_product_created_idx ON public.stock_movements (product_id, created_at DESC);
