-- ==============================================================================
-- Migration: 20261013000003_stock_mutation_rpc.sql
-- Description: Authoritative atomic stock mutation RPC function
-- Function: public.record_stock_movement(uuid, text, integer, text)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Function: public.record_stock_movement
-- ------------------------------------------------------------------------------
-- Executes an atomic stock mutation (IN or OUT) with pessimistic locking.
-- Enforces role authorization (admin_gudang only) and zero-trust actor binding.
-- Mutates products.stock and appends an immutable entry to stock_movements
-- in a single atomic database transaction.
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
  -- 1. Actor Identification (Zero-trust: never accept client-supplied actor ID)
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Authentication required to perform stock movements'
    );
  END IF;

  -- 2. Role-Based Access Enforcement (admin_gudang only; owner is read-only)
  v_user_role := public.get_user_role(v_user_id);
  IF v_user_role IS DISTINCT FROM 'admin_gudang' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'FORBIDDEN',
      'message', 'Only warehouse administrators (admin_gudang) can mutate inventory'
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

  -- 4. Pessimistic Row Lock (Prevent concurrent race conditions on product stock)
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
    -- Check for integer overflow protection
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

  -- 6. Atomic Dual Mutation (Product stock update + ledger entry append)
  -- Operates with table owner authority (SECURITY DEFINER) without forgeable session tokens
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

  -- 7. Return Structured Result Envelope
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
    -- On unexpected runtime/constraint failures, PostgreSQL rolls back the entire transaction
    RAISE;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Function Execution Privileges
-- ------------------------------------------------------------------------------
-- Deny execution from PUBLIC and unauthenticated (anon) callers
REVOKE EXECUTE ON FUNCTION public.record_stock_movement(uuid, text, integer, text) FROM PUBLIC, anon;

-- Grant execution to authenticated users (role authorization checked inside function)
GRANT EXECUTE ON FUNCTION public.record_stock_movement(uuid, text, integer, text) TO authenticated;
