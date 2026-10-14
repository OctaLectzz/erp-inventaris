-- ==============================================================================
-- Migration: 20261014000002_rbac_and_batch_transactions.sql
-- Description: Consolidated 3-role RBAC, atomic batch stock mutation RPC, and profile backfill
-- Target: public.profiles, public.products, public.stock_movements, auth.users
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Database Check Constraint Expansion: Consolidated RBAC Roles
-- ------------------------------------------------------------------------------
-- Permits both legacy roles ('admin_gudang', 'owner') and consolidated roles
-- ('administrator', 'staff_gudang', 'auditor') for non-destructive zero-downtime transition.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin_gudang', 'owner', 'administrator', 'staff_gudang', 'auditor'));

-- ------------------------------------------------------------------------------
-- 2. Trigger Function Update: Automatic Profile Provisioning
-- ------------------------------------------------------------------------------
-- Updates handle_new_user() to accept consolidated roles and default to 'auditor'.
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
  v_role := coalesce(NEW.raw_app_meta_data->>'role', 'auditor');
  IF v_role NOT IN ('admin_gudang', 'owner', 'administrator', 'staff_gudang', 'auditor') THEN
    v_role := 'auditor';
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

-- ------------------------------------------------------------------------------
-- 3. RLS Policies Update on public.products
-- ------------------------------------------------------------------------------
-- Allow both 'admin_gudang' and 'administrator' to insert and update catalog products.
-- Denies 'staff_gudang', 'auditor', and 'owner' from modifying catalog metadata.
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
  );

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
  )
  WITH CHECK (
    public.get_user_role((SELECT auth.uid())) IN ('admin_gudang', 'administrator')
  );

-- ------------------------------------------------------------------------------
-- 4. Update Single Mutation RPC: public.record_stock_movement
-- ------------------------------------------------------------------------------
-- Authorizes 'administrator' and 'staff_gudang' alongside legacy 'admin_gudang'.
-- Rejects 'auditor' and 'owner' (read-only).
CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_product_id uuid,
  p_type text,
  p_quantity integer,
  p_note text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_current_stock integer;
  v_new_stock integer;
  v_movement_id uuid;
  v_clean_note text;
BEGIN
  -- 1. Actor Identification
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Authentication required to perform stock movements'
    );
  END IF;

  -- 2. Role-Based Access Enforcement
  v_user_role := public.get_user_role(v_user_id);
  IF v_user_role NOT IN ('admin_gudang', 'administrator', 'staff_gudang') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'FORBIDDEN',
      'message', 'Only warehouse administrators and staff can mutate inventory'
    );
  END IF;

  -- 3. Input Validation
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_QUANTITY',
      'message', 'Quantity must be a positive integer greater than zero'
    );
  END IF;

  IF p_quantity > 2147483647 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'QUANTITY_OVERFLOW',
      'message', 'Quantity exceeds maximum allowed integer limit'
    );
  END IF;

  IF p_type IS NULL OR p_type NOT IN ('IN', 'OUT') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_TYPE',
      'message', 'Movement type must be strictly IN or OUT'
    );
  END IF;

  v_clean_note := trim(coalesce(p_note, ''));
  IF v_clean_note = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EMPTY_NOTE',
      'message', 'A non-empty reason or reference note is required for all movements'
    );
  END IF;

  -- 4. Pessimistic Row Lock
  SELECT stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PRODUCT_NOT_FOUND',
      'message', 'Target product does not exist'
    );
  END IF;

  -- 5. Stock Level Calculation & Availability Check
  IF p_type = 'IN' THEN
    IF (v_current_stock::bigint + p_quantity::bigint) > 2147483647 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'STOCK_OVERFLOW',
        'message', 'Resulting stock exceeds maximum inventory limit (2,147,483,647)'
      );
    END IF;
    v_new_stock := v_current_stock + p_quantity;
  ELSIF p_type = 'OUT' THEN
    IF v_current_stock < p_quantity THEN
      RETURN json_build_object(
        'success', false,
        'error', 'INSUFFICIENT_STOCK',
        'message', format('Insufficient stock. Available: %s, Requested: %s', v_current_stock, p_quantity)
      );
    END IF;
    v_new_stock := v_current_stock - p_quantity;
  END IF;

  -- 6. Atomic Mutation
  UPDATE public.products
  SET stock = v_new_stock, updated_at = now()
  WHERE id = p_product_id;

  INSERT INTO public.stock_movements (
    product_id,
    user_id,
    type,
    quantity,
    stock_before,
    stock_after,
    note,
    created_at
  ) VALUES (
    p_product_id,
    v_user_id,
    p_type,
    p_quantity,
    v_current_stock,
    v_new_stock,
    v_clean_note,
    now()
  ) RETURNING id INTO v_movement_id;

  -- 7. Return Result
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'movement_id', v_movement_id,
      'product_id', p_product_id,
      'type', p_type,
      'quantity', p_quantity,
      'stock_before', v_current_stock,
      'stock_after', v_new_stock,
      'note', v_clean_note
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. New Function: public.record_batch_stock_movements
-- ------------------------------------------------------------------------------
-- Executes an atomic multi-item stock mutation (all-or-nothing).
-- Operates inside a single transaction with deterministic row-level locking
-- (ordered by product UUID) to eliminate deadlocks and race conditions.
CREATE OR REPLACE FUNCTION public.record_batch_stock_movements(
  p_type text,
  p_items jsonb,
  p_note text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_clean_note text;
  v_items_count integer;
  v_batch_id uuid := gen_random_uuid();
  v_item record;
  v_product_id uuid;
  v_qty integer;
  v_current_stock integer;
  v_new_stock integer;
  v_product_name text;
  v_product_sku text;
  v_movement_id uuid;
  v_movements_json jsonb := '[]'::jsonb;
  v_seen_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  -- 1. Actor Identification
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Authentication required to perform stock movements'
    );
  END IF;

  -- 2. Role-Based Access Enforcement
  v_user_role := public.get_user_role(v_user_id);
  IF v_user_role NOT IN ('admin_gudang', 'administrator', 'staff_gudang') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'FORBIDDEN',
      'message', 'Only warehouse administrators and staff can mutate inventory'
    );
  END IF;

  -- 3. Top-level Parameter Validation
  IF p_type IS NULL OR p_type NOT IN ('IN', 'OUT') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_TYPE',
      'message', 'Movement type must be strictly IN or OUT'
    );
  END IF;

  v_clean_note := trim(coalesce(p_note, ''));
  IF length(v_clean_note) < 3 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EMPTY_NOTE',
      'message', 'A reference note of at least 3 characters is required for batch transactions'
    );
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_ITEMS',
      'message', 'Items must be provided as a non-empty array'
    );
  END IF;

  v_items_count := jsonb_array_length(p_items);
  IF v_items_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EMPTY_ITEMS',
      'message', 'Batch transaction must contain at least one line item'
    );
  END IF;

  IF v_items_count > 100 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ITEMS_LIMIT_EXCEEDED',
      'message', 'Batch transactions cannot exceed 100 items per request'
    );
  END IF;

  -- 4. Check for Duplicate Products in Input Array
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, quantity integer) LOOP
    IF v_item.product_id = ANY(v_seen_ids) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'DUPLICATE_PRODUCT',
        'message', format('Duplicate product detected in batch: %s. Combine quantities into a single item.', v_item.product_id)
      );
    END IF;
    v_seen_ids := array_append(v_seen_ids, v_item.product_id);

    IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'INVALID_QUANTITY',
        'message', 'Each item quantity must be a positive integer greater than zero'
      );
    END IF;

    IF v_item.quantity > 2147483647 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'QUANTITY_OVERFLOW',
        'message', 'An item quantity exceeds maximum allowed integer limit'
      );
    END IF;
  END LOOP;

  -- 5. Deterministic Row Locking (Order by Product UUID to prevent concurrent deadlocks)
  -- If two batch transactions touch overlapping items, ordered locking prevents deadlock.
  PERFORM 1
  FROM public.products
  WHERE id = ANY(v_seen_ids)
  ORDER BY id
  FOR UPDATE;

  -- 6. Verification & Availability Pass (All-or-Nothing check before writing)
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, quantity integer) LOOP
    v_product_id := v_item.product_id;
    v_qty := v_item.quantity;

    SELECT name, sku, stock INTO v_product_name, v_product_sku, v_current_stock
    FROM public.products
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'PRODUCT_NOT_FOUND',
        'message', format('Product %s not found in inventory catalog', v_product_id)
      );
    END IF;

    IF p_type = 'IN' THEN
      IF (v_current_stock::bigint + v_qty::bigint) > 2147483647 THEN
        RETURN json_build_object(
          'success', false,
          'error', 'STOCK_OVERFLOW',
          'message', format('Stock overflow for %s (SKU: %s). Resulting stock exceeds integer limit.', v_product_name, v_product_sku)
        );
      END IF;
    ELSIF p_type = 'OUT' THEN
      IF v_current_stock < v_qty THEN
        RETURN json_build_object(
          'success', false,
          'error', 'INSUFFICIENT_STOCK',
          'message', format('Insufficient stock for %s (SKU: %s). Available: %s, Requested: %s', v_product_name, v_product_sku, v_current_stock, v_qty)
        );
      END IF;
    END IF;
  END LOOP;

  -- 7. Execution Pass (Atomic dual-mutation: stock update + ledger entry append)
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, quantity integer) LOOP
    v_product_id := v_item.product_id;
    v_qty := v_item.quantity;

    SELECT stock, name, sku INTO v_current_stock, v_product_name, v_product_sku
    FROM public.products
    WHERE id = v_product_id;

    IF p_type = 'IN' THEN
      v_new_stock := v_current_stock + v_qty;
    ELSE
      v_new_stock := v_current_stock - v_qty;
    END IF;

    UPDATE public.products
    SET stock = v_new_stock, updated_at = now()
    WHERE id = v_product_id;

    INSERT INTO public.stock_movements (
      product_id,
      user_id,
      type,
      quantity,
      stock_before,
      stock_after,
      note,
      created_at
    ) VALUES (
      v_product_id,
      v_user_id,
      p_type,
      v_qty,
      v_current_stock,
      v_new_stock,
      format('[Batch %s] %s', substr(v_batch_id::text, 1, 8), v_clean_note),
      now()
    ) RETURNING id INTO v_movement_id;

    v_movements_json := v_movements_json || jsonb_build_object(
      'movement_id', v_movement_id,
      'product_id', v_product_id,
      'sku', v_product_sku,
      'name', v_product_name,
      'quantity', v_qty,
      'stock_before', v_current_stock,
      'stock_after', v_new_stock
    );
  END LOOP;

  -- 8. Return Atomic Batch Result Envelope
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'batch_id', v_batch_id,
      'type', p_type,
      'note', v_clean_note,
      'items_count', v_items_count,
      'movements', v_movements_json
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Privileges for record_batch_stock_movements
REVOKE EXECUTE ON FUNCTION public.record_batch_stock_movements(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_batch_stock_movements(text, jsonb, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. Backfill Existing Profiles and Seed Staff Demo Account
-- ------------------------------------------------------------------------------
-- Map existing demo accounts to consolidated roles:
-- admin@inventra.demo: admin_gudang -> administrator
-- owner@inventra.demo: owner -> auditor
UPDATE public.profiles
SET role = 'administrator', updated_at = now()
WHERE email = 'admin@inventra.demo' AND role = 'admin_gudang';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "administrator"}'::jsonb
WHERE email = 'admin@inventra.demo';

UPDATE public.profiles
SET role = 'auditor', updated_at = now()
WHERE email = 'owner@inventra.demo' AND role = 'owner';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "auditor"}'::jsonb
WHERE email = 'owner@inventra.demo';

-- ------------------------------------------------------------------------------
-- Rollback Plan Reference (If needed):
-- ------------------------------------------------------------------------------
-- 1. UPDATE public.profiles SET role = 'admin_gudang' WHERE role = 'administrator';
-- 2. UPDATE public.profiles SET role = 'owner' WHERE role = 'auditor';
-- 3. DROP FUNCTION IF EXISTS public.record_batch_stock_movements(text, jsonb, text);
-- 4. Restore original public.record_stock_movement from 20261013000003_stock_mutation_rpc.sql;
-- 5. Restore profiles_role_check to CHECK (role IN ('admin_gudang', 'owner'));
