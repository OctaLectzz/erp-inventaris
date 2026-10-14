-- ==============================================================================
-- Migration: 20261015000001_website_settings_and_rbac.sql
-- Description: Website branding settings table, singleton row, RLS policies, and RBAC updates
-- Target: public.website_settings, public.profiles
-- ==============================================================================

-- 1. Create public.website_settings table
CREATE TABLE IF NOT EXISTS public.website_settings (
  id text PRIMARY KEY DEFAULT 'default',
  site_name text NOT NULL DEFAULT 'Inventra ERP',
  tagline text NOT NULL DEFAULT 'Sistem Manajemen Inventaris Pergudangan Modern',
  company_name text NOT NULL DEFAULT 'PT. Syailendra Bumi Investama',
  description text DEFAULT 'Aplikasi Mini ERP Inventaris Gudang dengan pelacakan mutasi stok akurat, analitik mendalam, dan asisten cerdas AI.',
  about text DEFAULT 'PT. Syailendra Bumi Investama (DDistillers) berfokus pada produksi dan distribusi bahan baku alami, minyak atsiri, dan produk konsumen berkualitas tinggi.',
  logo_url text DEFAULT 'https://cdn.dummyjson.com/products/images/groceries/rice.png',
  favicon_url text DEFAULT NULL,
  contact_email text NOT NULL DEFAULT 'admin@ddistillers.com',
  contact_phone text NOT NULL DEFAULT '+62 21 555-0199',
  contact_address text NOT NULL DEFAULT 'Kawasan Industri Terpadu Blok C No. 12, Jawa Barat, Indonesia',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Insert initial singleton configuration if not exists
INSERT INTO public.website_settings (
  id,
  site_name,
  tagline,
  company_name,
  description,
  about,
  contact_email,
  contact_phone,
  contact_address
) VALUES (
  'default',
  'Inventra ERP',
  'Sistem Manajemen Inventaris Pergudangan Modern',
  'PT. Syailendra Bumi Investama',
  'Aplikasi Mini ERP Inventaris Gudang dengan pelacakan mutasi stok akurat, analitik mendalam, dan asisten cerdas AI.',
  'PT. Syailendra Bumi Investama (DDistillers) berfokus pada produksi dan distribusi bahan baku alami, minyak atsiri, dan produk konsumen berkualitas tinggi.',
  'admin@ddistillers.com',
  '+62 21 555-0199',
  'Kawasan Industri Terpadu Blok C No. 12, Jawa Barat, Indonesia'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS on website_settings
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings FORCE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow all authenticated and anonymous callers to read website branding
DROP POLICY IF EXISTS "website_settings_select_all" ON public.website_settings;
CREATE POLICY "website_settings_select_all"
  ON public.website_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow only owner and administrator to update website settings
DROP POLICY IF EXISTS "website_settings_update_owner_admin" ON public.website_settings;
CREATE POLICY "website_settings_update_owner_admin"
  ON public.website_settings
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role((SELECT auth.uid())) IN ('owner', 'administrator')
  )
  WITH CHECK (
    public.get_user_role((SELECT auth.uid())) IN ('owner', 'administrator')
  );

-- Allow only owner and administrator to insert website settings
DROP POLICY IF EXISTS "website_settings_insert_owner_admin" ON public.website_settings;
CREATE POLICY "website_settings_insert_owner_admin"
  ON public.website_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role((SELECT auth.uid())) IN ('owner', 'administrator')
  );

-- 5. Grant table privileges on public.website_settings
GRANT SELECT ON public.website_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.website_settings TO authenticated;
