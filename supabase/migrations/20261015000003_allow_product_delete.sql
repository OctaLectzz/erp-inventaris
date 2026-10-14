-- ==============================================================================
-- Migration: Allow Product Deletion for Administrators
-- Description: Grants DELETE privilege on public.products to authenticated role
--              and creates RLS policy restricting deletion to administrators.
-- ==============================================================================

-- 1. Grant table DELETE privilege to authenticated role
GRANT DELETE ON public.products TO authenticated;

-- 2. Create RLS DELETE policy for administrator roles
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
  );
