import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

describe('Supabase Migrations & Security Contract Static Audit', () => {
  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations')
  const seedFile = path.resolve(__dirname, '../../supabase/seed.sql')

  const initialSchemaPath = path.join(migrationsDir, '20261013000001_initial_schema.sql')
  const rlsPoliciesPath = path.join(migrationsDir, '20261013000002_rls_policies.sql')
  const rpcPath = path.join(migrationsDir, '20261013000003_stock_mutation_rpc.sql')

  it('verifies all expected migration files and seed file exist', () => {
    expect(fs.existsSync(initialSchemaPath)).toBe(true)
    expect(fs.existsSync(rlsPoliciesPath)).toBe(true)
    expect(fs.existsSync(rpcPath)).toBe(true)
    expect(fs.existsSync(seedFile)).toBe(true)
  })

  describe('20261013000001_initial_schema.sql', () => {
    const content = fs.readFileSync(initialSchemaPath, 'utf-8')

    it('creates all three core application tables', () => {
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.profiles')
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.products')
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.stock_movements')
    })

    it('defines primary keys, foreign keys, and restrict deletion rules', () => {
      expect(content).toContain('REFERENCES auth.users(id) ON DELETE CASCADE')
      expect(content).toContain('REFERENCES public.products(id) ON DELETE RESTRICT')
      expect(content).toContain('REFERENCES auth.users(id) ON DELETE RESTRICT')
    })

    it('enforces database check constraints on stock, prices, and quantities', () => {
      expect(content).toContain('CONSTRAINT products_price_non_negative CHECK (price >= 0)')
      expect(content).toContain('CONSTRAINT products_stock_non_negative CHECK (stock >= 0)')
      expect(content).toContain("CONSTRAINT movements_type_check CHECK (type IN ('IN', 'OUT'))")
      expect(content).toContain('CONSTRAINT movements_quantity_positive CHECK (quantity > 0)')
      expect(content).toContain('CONSTRAINT movements_stock_before_non_negative CHECK (stock_before >= 0)')
      expect(content).toContain('CONSTRAINT movements_stock_after_non_negative CHECK (stock_after >= 0)')
      expect(content).toContain('CONSTRAINT movements_delta_integrity CHECK')
    })

    it('creates case-insensitive SKU index and foreign key indexes', () => {
      expect(content).toContain('CREATE UNIQUE INDEX IF NOT EXISTS products_sku_lower_idx ON public.products (lower(sku))')
      expect(content).toContain('CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx')
      expect(content).toContain('CREATE INDEX IF NOT EXISTS stock_movements_user_id_idx')
    })

    it('configures updated_at timestamp triggers', () => {
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.set_updated_at()')
      expect(content).toContain('CREATE TRIGGER trg_profiles_updated_at')
      expect(content).toContain('CREATE TRIGGER trg_products_updated_at')
    })
  })

  describe('20261013000002_rls_policies.sql', () => {
    const content = fs.readFileSync(rlsPoliciesPath, 'utf-8')

    it('enforces and forces RLS on all tables', () => {
      expect(content).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;')
      expect(content).toContain('ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;')
      expect(content).toContain('ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;')
      expect(content).toContain('ALTER TABLE public.products FORCE ROW LEVEL SECURITY;')
      expect(content).toContain('ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;')
      expect(content).toContain('ALTER TABLE public.stock_movements FORCE ROW LEVEL SECURITY;')
    })

    it('revokes all access from anon and PUBLIC across all tables', () => {
      expect(content).toContain('REVOKE ALL ON public.profiles FROM PUBLIC, anon;')
      expect(content).toContain('REVOKE ALL ON public.products FROM PUBLIC, anon;')
      expect(content).toContain('REVOKE ALL ON public.stock_movements FROM PUBLIC, anon;')
    })

    it('revokes direct mutations on stock_movements from authenticated role', () => {
      expect(content).toContain('REVOKE ALL ON public.stock_movements FROM authenticated;')
      expect(content).toContain('GRANT SELECT ON public.stock_movements TO authenticated;')
      expect(content).not.toContain('GRANT INSERT ON public.stock_movements TO authenticated')
      expect(content).not.toContain('GRANT UPDATE ON public.stock_movements TO authenticated')
      expect(content).not.toContain('GRANT DELETE ON public.stock_movements TO authenticated')
    })

    it('restricts product privileges: column-level UPDATE/INSERT without stock, and revokes DELETE', () => {
      expect(content).toContain('GRANT SELECT ON public.products TO authenticated;')
      expect(content).toContain('GRANT INSERT (id, sku, name, category, unit, price, description, image_url) ON public.products TO authenticated;')
      expect(content).toContain('GRANT UPDATE (sku, name, category, unit, price, description, image_url) ON public.products TO authenticated;')
      expect(content).not.toContain('GRANT UPDATE ON public.products TO authenticated;')
      expect(content).not.toContain('GRANT DELETE ON public.products TO authenticated')
    })

    it('implements defensive trigger to prevent direct stock modification via SQL API', () => {
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.prevent_direct_stock_modification()')
      expect(content).toContain('CREATE TRIGGER trg_protect_product_stock')
      expect(content).toContain('REVOKE EXECUTE ON FUNCTION public.prevent_direct_stock_modification() FROM PUBLIC, anon, authenticated;')
      expect(content).not.toContain('inventra.authorized_stock_mutation')
    })

    it('protects profile roles from self-elevation via triggers and column grants', () => {
      expect(content).toContain('GRANT SELECT, UPDATE (full_name, email) ON public.profiles TO authenticated;')
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()')
      expect(content).toContain('CREATE TRIGGER trg_protect_profile_role')
      expect(content).toContain('REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_change() FROM PUBLIC, anon, authenticated;')
      expect(content).toContain('REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;')
    })

    it('implements non-recursive get_user_role SECURITY DEFINER function with hardened search_path', () => {
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)')
      expect(content).toContain('SECURITY DEFINER')
      expect(content).toContain("SET search_path = ''")
      expect(content).toContain('REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;')
      expect(content).toContain('GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;')
    })

    it('defines explicit role separation policies for products and profiles', () => {
      expect(content).toContain('CREATE POLICY "products_select_authenticated"')
      expect(content).toContain('CREATE POLICY "products_insert_admin"')
      expect(content).toContain('CREATE POLICY "products_update_admin"')
      expect(content).toContain("public.get_user_role((SELECT auth.uid())) = 'admin_gudang'")
      expect(content).toContain('CREATE POLICY "profiles_select_own"')
      expect(content).toContain('CREATE POLICY "movements_select_authenticated"')
    })
  })

  describe('20261013000003_stock_mutation_rpc.sql', () => {
    const content = fs.readFileSync(rpcPath, 'utf-8')

    it("defines public.record_stock_movement with SECURITY DEFINER and search_path = ''", () => {
      expect(content).toContain('CREATE OR REPLACE FUNCTION public.record_stock_movement(')
      expect(content).toContain('SECURITY DEFINER')
      expect(content).toContain("SET search_path = ''")
    })

    it('resolves actor strictly from (SELECT auth.uid()) and rejects client-supplied user IDs', () => {
      expect(content).toContain('v_user_id := (SELECT auth.uid());')
      expect(content).not.toContain('p_user_id')
    })

    it('enforces admin_gudang role authorization inside function', () => {
      expect(content).toContain('v_user_role := public.get_user_role(v_user_id);')
      expect(content).toContain("IF v_user_role IS DISTINCT FROM 'admin_gudang' THEN")
      expect(content).toContain("'FORBIDDEN'")
    })

    it('executes pessimistic row locking with FOR UPDATE', () => {
      expect(content).toContain('SELECT stock INTO v_current_stock')
      expect(content).toContain('FROM public.products')
      expect(content).toContain('FOR UPDATE;')
    })

    it('validates quantities, boundaries, movement type, and notes', () => {
      expect(content).toContain('IF p_quantity IS NULL OR p_quantity <= 0 THEN')
      expect(content).toContain('IF p_quantity > 2147483647 THEN')
      expect(content).toContain("IF p_type IS NULL OR p_type NOT IN ('IN', 'OUT') THEN")
      expect(content).toContain("IF v_clean_note = '' THEN")
      expect(content).toContain('IF v_current_stock < p_quantity THEN')
    })

    it('executes atomic mutations without forgeable session tokens and revokes execution from PUBLIC and anon', () => {
      expect(content).not.toContain('set_config')
      expect(content).not.toContain('inventra.authorized_stock_mutation')
      expect(content).toContain('REVOKE EXECUTE ON FUNCTION public.record_stock_movement(uuid, text, integer, text) FROM PUBLIC, anon;')
      expect(content).toContain('GRANT EXECUTE ON FUNCTION public.record_stock_movement(uuid, text, integer, text) TO authenticated;')
    })
  })

  describe('supabase/seed.sql', () => {
    const content = fs.readFileSync(seedFile, 'utf-8')

    it('contains exactly 30 seeded catalog products', () => {
      const match = content.match(/GROC-|BEAU-|FRAG-|FURN-|HOME-|KITC-/g)
      expect(match?.length).toBe(30)
    })

    it('does not contain plain text passwords or forged auth.users inserts', () => {
      expect(content).not.toMatch(/INSERT\s+INTO\s+auth\.users/i)
      expect(content).not.toContain('encrypted_password')
      expect(content).not.toContain('password_hash')
    })

    it('uses IDR prices (bigint integers >= 0)', () => {
      expect(content).toContain('85000')
      expect(content).toContain('1850000')
      expect(content).not.toContain('$')
    })
  })
})
