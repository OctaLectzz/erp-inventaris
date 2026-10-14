-- ==============================================================================
-- Migration: 20261014000001_categories_and_storage.sql
-- Description: Master categories table, product category foreign key, and Supabase Storage setup
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: public.categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT categories_slug_not_empty CHECK (length(trim(slug)) > 0)
);

-- Unique index on case-insensitive category name and slug
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_lower_idx ON public.categories (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON public.categories (slug);

-- ------------------------------------------------------------------------------
-- 2. Seed existing distinct categories from public.products (Zero Data Loss)
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (name, slug)
SELECT DISTINCT
  trim(category) AS name,
  lower(regexp_replace(trim(category), '[^a-zA-Z0-9]+', '-', 'g')) AS slug
FROM public.products
WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT (lower(name)) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Add category_id foreign key to public.products
-- ------------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);

-- Backfill category_id for existing products based on matching category name
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE lower(trim(p.category)) = lower(c.name)
  AND p.category_id IS NULL;

-- ------------------------------------------------------------------------------
-- 4. Enable Row-Level Security (RLS) on public.categories
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated and anonymous users to view categories
CREATE POLICY categories_select_all
  ON public.categories FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow administrators / warehouse staff to create new categories
CREATE POLICY categories_insert_admin
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
  );

-- Allow administrators / warehouse staff to update categories
CREATE POLICY categories_update_admin
  ON public.categories FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
  )
  WITH CHECK (
    public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
  );

-- Allow administrators to delete unused categories
CREATE POLICY categories_delete_admin
  ON public.categories FOR DELETE
  TO authenticated
  USING (
    public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
  );

-- ------------------------------------------------------------------------------
-- 5. Supabase Storage Setup: product-images bucket
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for Product Images'
  ) THEN
    CREATE POLICY "Public Access for Product Images"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin Upload for Product Images'
  ) THEN
    CREATE POLICY "Admin Upload for Product Images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'product-images' AND
        public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin Update for Product Images'
  ) THEN
    CREATE POLICY "Admin Update for Product Images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'product-images' AND
        public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admin Delete for Product Images'
  ) THEN
    CREATE POLICY "Admin Delete for Product Images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images' AND
        public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
      );
  END IF;
END $$;
