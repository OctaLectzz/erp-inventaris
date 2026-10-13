-- ==============================================================================
-- Migration: 20261013000002_rls_policies.sql
-- Description: Role-aware RLS policies, table privileges, role-protection triggers,
--              column-level stock protections, and non-recursive role helper function
-- Target: public.profiles, public.products, public.stock_movements
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper Function: Non-Recursive User Role Resolution
-- ------------------------------------------------------------------------------
-- SECURITY DEFINER allows querying public.profiles without triggering RLS recursion.
-- SET search_path = '' mitigates search-path hijacking attacks.
-- Restricted to returning caller's own role to prevent arbitrary user probing.
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_calling_user uuid;
  v_role text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Principle of least privilege: authenticated callers may only resolve their own role.
  -- Unauthenticated callers (auth.uid() IS NULL) and cross-user lookups are strictly denied.
  v_calling_user := (SELECT auth.uid());
  IF v_calling_user IS NULL AND (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RETURN NULL;
  END IF;

  IF v_calling_user IS NOT NULL AND v_calling_user IS DISTINCT FROM p_user_id THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN v_role;
END;
$$;

-- Function execution privilege hardening
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. Trigger: Prevent Profile Role Self-Elevation
-- ------------------------------------------------------------------------------
-- Ensures users cannot elevate their own role through profile updates.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only service_role or administrative database owners may alter user roles
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role'
     AND current_user NOT IN ('postgres', 'supabase_admin')
     AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Modifying user roles directly is forbidden.';
  END IF;
  RETURN NEW;
END;
$$;

-- Revoke direct execution from application roles
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

-- ------------------------------------------------------------------------------
-- 2b. Trigger: Prevent Direct Stock Modification via SQL API
-- ------------------------------------------------------------------------------
-- Secondary defense-in-depth alongside PostgreSQL column-level privileges.
-- Rejects any direct stock change executed in the context of application roles (anon, authenticated).
-- Rejects INSERTs by application roles where stock <> 0 (initial stock must start at zero).
-- SECURITY DEFINER functions executing as table owner (e.g. public.record_stock_movement)
-- and administrative service_role execute with elevated current_user and bypass this trigger safely,
-- eliminating any dependency on ambient or forgeable session configuration tokens.
CREATE OR REPLACE FUNCTION public.prevent_direct_stock_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.stock IS DISTINCT FROM OLD.stock AND current_user IN ('anon', 'authenticated') THEN
      RAISE EXCEPTION 'Direct stock modification is forbidden. Inventory mutations must be recorded via public.record_stock_movement RPC.';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.stock <> 0 AND current_user IN ('anon', 'authenticated') THEN
      RAISE EXCEPTION 'Initial product stock must be zero. Record stock additions via public.record_stock_movement RPC.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Revoke direct execution from application roles
REVOKE EXECUTE ON FUNCTION public.prevent_direct_stock_modification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_product_stock ON public.products;
CREATE TRIGGER trg_protect_product_stock
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_direct_stock_modification();

-- ------------------------------------------------------------------------------
-- 3. Trigger: Automatic Profile Provisioning on User Creation
-- ------------------------------------------------------------------------------
-- Derives role strictly from server-controlled app_metadata, never client metadata.
-- Defaults to restricted 'owner' role if unspecified.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  -- Authoritative role assignment from server-controlled raw_app_meta_data
  v_role := coalesce(NEW.raw_app_meta_data->>'role', 'owner');
  IF v_role NOT IN ('admin_gudang', 'owner') THEN
    v_role := 'owner';
  END IF;

  -- Display name from signup metadata or email prefix fallback
  v_name := coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  IF trim(v_name) = '' THEN
    v_name := 'Pengguna Inventra';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, v_name, v_role)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now();

  RETURN NEW;
END;
$$;

-- Never permit application roles to execute the auth trigger function directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF raw_app_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. Table SQL Privileges (Defense in Depth)
-- ------------------------------------------------------------------------------
-- Revoke all access from PUBLIC and anon across all tables
REVOKE ALL ON public.profiles FROM PUBLIC, anon;
REVOKE ALL ON public.products FROM PUBLIC, anon;
REVOKE ALL ON public.stock_movements FROM PUBLIC, anon;

-- Profiles: authenticated can SELECT and UPDATE permitted non-role columns
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, UPDATE (full_name, email) ON public.profiles TO authenticated;

-- Products: authenticated can SELECT.
-- INSERT is granted on catalog metadata columns (stock is omitted and defaults to 0).
-- UPDATE is granted strictly on catalog attributes (sku, name, category, unit, price, description, image_url).
-- Column-level privilege explicitly EXCLUDES 'stock', preventing direct stock edits via SQL API.
-- DELETE is permanently revoked.
REVOKE ALL ON public.products FROM authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT INSERT (id, sku, name, category, unit, price, description, image_url) ON public.products TO authenticated;
GRANT UPDATE (sku, name, category, unit, price, description, image_url) ON public.products TO authenticated;

-- Stock movements: authenticated can ONLY SELECT.
-- INSERT, UPDATE, and DELETE are strictly revoked.
REVOKE ALL ON public.stock_movements FROM authenticated;
GRANT SELECT ON public.stock_movements TO authenticated;

-- ------------------------------------------------------------------------------
-- 5. Row-Level Security (RLS) Enablement
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6. RLS Policies: public.profiles
-- ------------------------------------------------------------------------------
-- Users can only view their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Users can only update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ------------------------------------------------------------------------------
-- 7. RLS Policies: public.products
-- ------------------------------------------------------------------------------
-- All authenticated roles (admin_gudang and owner) can read products
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
CREATE POLICY "products_select_authenticated"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admin_gudang can insert products
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role((SELECT auth.uid())) = 'admin_gudang');

-- Only admin_gudang can update products (catalog information)
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role((SELECT auth.uid())) = 'admin_gudang')
  WITH CHECK (public.get_user_role((SELECT auth.uid())) = 'admin_gudang');

-- ------------------------------------------------------------------------------
-- 8. RLS Policies: public.stock_movements
-- ------------------------------------------------------------------------------
-- All authenticated roles (admin_gudang and owner) can read movement history
DROP POLICY IF EXISTS "movements_select_authenticated" ON public.stock_movements;
CREATE POLICY "movements_select_authenticated"
  ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT, UPDATE, or DELETE policies exist for stock_movements.
-- All mutations must occur via the atomic record_stock_movement RPC function.
