# Phase 4 — Supabase Integration: Discovery and Implementation Plan (Security-Revised)

> **Date:** 2026-10-13  
> **Phase:** Phase 4 — Supabase Clients, SQL Schema, and Row-Level Security (RLS)  
> **Mode:** Discovery, Audit, and Architecture Planning Only  
> **Target Application:** Inventra (Mini ERP Inventaris)

---

## 1. Executive Summary & Context

Phase 4 establishes the authoritative data layer for Inventra using **Supabase PostgreSQL**, **`@supabase/ssr` (v0.12.7)**, and **`@supabase/supabase-js` (v2.117.3)** on **Next.js 16.4.0 (Turbopack)** and **React 19.3.0**.

Following strict architectural review and security directives:

- **Supabase PostgreSQL is the single source of truth** for all persistent application state.
- **Strict Role-Aware Row-Level Security (RLS)** is enforced at the database engine level. Anonymous access is completely denied across all tables.
- **Explicit Role Separation:** The `owner` role is defined as **read-only executive oversight** (dashboard metrics, catalog viewing, audit history browsing). Only `admin_gudang` is authorized to perform stock mutations and catalog updates.
- **Immutable & Trustworthy Movement History:** Direct `INSERT`, `UPDATE`, and `DELETE` on `stock_movements` are **strictly revoked** for all application roles. Stock movements can **only** be created through the atomic database RPC function (`public.record_stock_movement`).
- **Pessimistic Concurrency & Atomicity:** The RPC function acquires an exclusive row lock (`SELECT ... FOR UPDATE`) on the product, validates stock availability, updates inventory, and logs movement history in a single atomic database transaction.
- **Zero-Trust Actor Attribution:** Client-supplied user IDs and roles are rejected. Actor identity is resolved strictly via `(select auth.uid())`, and roles are verified via non-recursive database lookup.
- **Service-Role Isolation:** The privileged service-role key is isolated to server-only administrative tasks (catalog seeding, demo reset) and protected with Next.js `server-only` guards.

**Strict Stop Condition Notice:** This document represents architecture planning and review only. No application source code, SQL migrations, dependencies, or live database configurations were modified.

---

## 2. Current-State Findings & Repository Audit

### 2.1 Dependencies & Package Audit ([package.json](file:///c:/Experience/Projects/inventra/package.json))

- `@supabase/ssr`: `^0.12.7` is installed and locked.
- `@supabase/supabase-js`: `^2.117.3` is installed and locked.
- `next`: `16.4.0` (App Router with Turbopack).
- `react`: `19.3.0` (React 19 Server Components).
- **Finding:** No additional packages or ORMs are needed. All required Supabase SDKs are present.

### 2.2 Environment & Git Configuration ([.gitignore](file:///c:/Experience/Projects/inventra/.gitignore))

- Line 34 of `.gitignore` specifies `.env*`.
- **Finding:** Running `git check-ignore -v .env.example` confirmed that `.env.example` is currently ignored by Git. To allow `.env.example` to be committed as a clean template without leaking secrets, `.gitignore` must be updated with `!.env.example`.
- There is currently no `.env.example` or `.env.local` in the project root.

### 2.3 Directory Structure & Application State

- `src/lib/`: Contains only `utils.ts` (`cn` helper). The `src/lib/supabase/` factory directory does not exist yet.
- `supabase/`: Directory does not exist yet. No migrations (`supabase/migrations/`) or seed scripts (`supabase/seed.sql`) exist.
- `src/types/`: Contains only `global.d.ts` (IntlMessages). `src/types/database.ts`, `src/types/auth.ts`, and `src/types/inventory.ts` do not exist yet.
- `src/proxy.ts`: Currently runs only `createMiddleware(routing)` for `next-intl`. It does not yet perform Supabase session cookie refresh.

---

## 3. Role-Aware Permission Matrix (RBAC & RLS)

### 3.1 Role Definitions & Boundaries

Inventra defines two distinct roles stored in `public.profiles.role`:

1. **`admin_gudang` (Warehouse Administrator):**
   - Responsible for day-to-day warehouse operations.
   - Capabilities: View catalog, view movement history, create/edit products, execute stock IN and stock OUT mutations.
2. **`owner` (Business Owner):**
   - Responsible for business oversight and inventory valuation.
   - Capabilities: View dashboard KPIs, view catalog, view stock levels, browse filterable movement history.
   - **Constraint:** Strictly **read-only**. The owner cannot modify product information, cannot execute stock mutations, and cannot delete records.

### 3.2 Non-Recursive Role Lookup Function

If an RLS policy queries `public.profiles` to check the calling user's role, and `public.profiles` itself has RLS enabled, PostgreSQL can enter infinite policy recursion or suffer severe performance degradation.

To eliminate recursion and optimize policy execution, a `SECURITY DEFINER` helper function is established:

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = p_user_id;
$$;

-- Revoke execute from public/anon; allow authenticated
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
```

_Alternative/Complementary JWT Strategy:_ Synchronizing the verified role into `raw_app_meta_data->>'role'` allows RLS policies to evaluate `((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin_gudang'`, eliminating database queries entirely during session validation.

### 3.3 Role/Table/Operation Permission Matrix

| Table                            | Operation |    `admin_gudang`    |     `owner`      | Policy Name                      | Enforcement Mechanism                                                                                                                                         |
| :------------------------------- | :-------: | :------------------: | :--------------: | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`profiles`**                   | `SELECT`  |     Own profile      |   Own profile    | `profiles_select_own`            | `USING ((select auth.uid()) = id)`                                                                                                                            |
| **`profiles`**                   | `INSERT`  |      ❌ Denied       |    ❌ Denied     | _(None)_                         | Created strictly via Auth trigger or admin service role.                                                                                                      |
| **`profiles`**                   | `UPDATE`  |    Own (non-role)    |  Own (non-role)  | `profiles_update_own`            | `USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id)` + Trigger preventing role alteration.                                                |
| **`profiles`**                   | `DELETE`  |      ❌ Denied       |    ❌ Denied     | _(None)_                         | Cascade with `auth.users` only.                                                                                                                               |
| **`products`**                   | `SELECT`  |      ✅ Allowed      |    ✅ Allowed    | `products_select_authenticated`  | `TO authenticated USING (true)`                                                                                                                               |
| **`products`**                   | `INSERT`  |      ✅ Allowed      |    ❌ Denied     | `products_insert_admin`          | `TO authenticated WITH CHECK (public.get_user_role((select auth.uid())) = 'admin_gudang')`                                                                    |
| **`products`**                   | `UPDATE`  | ✅ Allowed (catalog) |    ❌ Denied     | `products_update_admin`          | `TO authenticated USING (public.get_user_role((select auth.uid())) = 'admin_gudang') WITH CHECK (public.get_user_role((select auth.uid())) = 'admin_gudang')` |
| **`products`**                   | `DELETE`  |      ❌ Denied       |    ❌ Denied     | _(None)_                         | Preserved for history auditability.                                                                                                                           |
| **`stock_movements`**            | `SELECT`  |      ✅ Allowed      |    ✅ Allowed    | `movements_select_authenticated` | `TO authenticated USING (true)`                                                                                                                               |
| **`stock_movements`**            | `INSERT`  |   ❌ Direct Denied   | ❌ Direct Denied | _(None)_                         | **Direct INSERT revoked.** Movements must be created via `record_stock_movement` RPC.                                                                         |
| **`stock_movements`**            | `UPDATE`  |      ❌ Denied       |    ❌ Denied     | _(None)_                         | Immutable historical ledger.                                                                                                                                  |
| **`stock_movements`**            | `DELETE`  |      ❌ Denied       |    ❌ Denied     | _(None)_                         | Immutable historical ledger.                                                                                                                                  |
| **RPC: `record_stock_movement`** | `EXECUTE` |    ✅ Authorized     |    ❌ Denied     | RPC Function Body                | Verified inside function: `IF public.get_user_role(auth.uid()) != 'admin_gudang' THEN RAISE EXCEPTION ...`                                                    |

---

## 4. Atomic and Trustworthy Stock History (RPC Architecture)

### 4.1 Reassessing Direct Table Access

In previous designs, authenticated users held direct `INSERT` permissions on `stock_movements`. This created two significant security risks:

1. A client could insert a movement log without updating `products.stock`.
2. A client could forge `stock_before` and `stock_after` quantities.

**Architectural Decision:** Direct table mutation on `stock_movements` is **completely revoked** for the `authenticated` role:

```sql
REVOKE INSERT, UPDATE, DELETE ON public.stock_movements FROM anon, authenticated;
```

All inventory mutations must route exclusively through the atomic PostgreSQL function `public.record_stock_movement`.

### 4.2 Comprehensive RPC Function Implementation

```sql
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
  -- 1. Actor Identification (Never trust client input)
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Authentication required');
  END IF;

  -- 2. Role-Based Access Enforcement
  v_user_role := public.get_user_role(v_user_id);
  IF v_user_role IS DISTINCT FROM 'admin_gudang' THEN
    RETURN json_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Only warehouse administrators can mutate inventory');
  END IF;

  -- 3. Input Validation
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'INVALID_QUANTITY', 'message', 'Quantity must be a positive integer');
  END IF;

  IF p_type IS NULL OR p_type NOT IN ('IN', 'OUT') THEN
    RETURN json_build_object('success', false, 'error', 'INVALID_TYPE', 'message', 'Movement type must be IN or OUT');
  END IF;

  v_clean_note := trim(coalesce(p_note, ''));
  IF v_clean_note = '' THEN
    RETURN json_build_object('success', false, 'error', 'EMPTY_NOTE', 'message', 'A reason or note is required for all stock movements');
  END IF;

  -- 4. Pessimistic Row Lock (Prevent concurrent race conditions)
  SELECT stock INTO v_current_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'PRODUCT_NOT_FOUND', 'message', 'Target product does not exist');
  END IF;

  -- 5. Stock Level Calculation & Availability Check
  IF p_type = 'IN' THEN
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

  -- 6. Atomic Dual Mutation
  UPDATE public.products
  SET stock = v_new_stock, updated_at = now()
  WHERE id = p_product_id;

  INSERT INTO public.stock_movements (
    product_id, user_id, type, quantity, stock_before, stock_after, note, created_at
  ) VALUES (
    p_product_id, v_user_id, p_type, p_quantity, v_current_stock, v_new_stock, v_clean_note, now()
  ) RETURNING id INTO v_movement_id;

  -- 7. Return Structured Contract Envelope
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
END;
$$;

-- Security hardening: revoke public execution, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.record_stock_movement(uuid, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_stock_movement(uuid, text, integer, text) TO authenticated;
```

---

## 5. Profile and Role Protection

### 5.1 Preventing Self-Role Elevation

Users must never be able to elevate their own role from `owner` to `admin_gudang` via the profile update endpoint.

1. **Column-Level Revocation:**
   ```sql
   REVOKE UPDATE (role) ON public.profiles FROM authenticated;
   ```
2. **Defensive Database Trigger:**
   ```sql
   CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
   RETURNS trigger
   LANGUAGE plpgsql
   AS $$
   BEGIN
     IF NEW.role IS DISTINCT FROM OLD.role THEN
       RAISE EXCEPTION 'Modifying user roles directly is forbidden.';
     END IF;
     RETURN NEW;
   END;
   $$;

   CREATE TRIGGER trg_protect_profile_role
     BEFORE UPDATE ON public.profiles
     FOR EACH ROW
     EXECUTE FUNCTION public.prevent_profile_role_change();
   ```

### 5.2 Initial Role Provisioning Strategy

- **Public Self-Registration is Disabled:** In accordance with [docs/SECURITY.md](file:///c:/Experience/Projects/inventra/docs/SECURITY.md) §2.4, there is no public signup page.
- **Never Trust Client Signup Metadata:** Client-submitted `raw_user_meta_data` can be manipulated by malicious actors. Therefore, role assignment relies exclusively on:
  1. Administrative seed migration (`supabase/seed.sql`) injecting demo users with pre-assigned roles.
  2. Server-side Supabase Auth Admin API setting `raw_app_meta_data: { role: 'admin_gudang' }`.
- **Automated Profile Creation Trigger (`handle_new_user`):**
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      -- Derive role from server-controlled app_metadata, defaulting to restricted 'owner'
      coalesce(NEW.raw_app_meta_data->>'role', 'owner')
    );
    RETURN NEW;
  END;
  $$;
  ```

---

## 6. Service-Role Key Isolation

### 6.1 Why `service_role` Bypasses RLS

In PostgreSQL with Supabase, the `service_role` carries the `bypassrls` attribute. Any request executed with the `service_role` key skips all RLS policies. It is designed solely for trusted infrastructure operations.

### 6.2 Strict Isolation Boundary

1. **Zero Client Exposure:** `SUPABASE_SERVICE_ROLE_KEY` is never prefixed with `NEXT_PUBLIC_` and never added to client configurations.
2. **Build-Time `server-only` Guard:**
   In `src/lib/supabase/admin.ts`:
   ```typescript
   import 'server-only'

   import { createClient } from '@supabase/supabase-js'

   import type { Database } from '@/types/database'

   export function createAdminClient() {
     const url = process.env.NEXT_PUBLIC_SUPABASE_URL
     const key = process.env.SUPABASE_SERVICE_ROLE_KEY
     if (!url || !key) {
       throw new Error('Missing Supabase admin environment credentials.')
     }
     return createClient<Database>(url, key, {
       auth: { persistSession: false, autoRefreshToken: false }
     })
   }
   ```
   If `admin.ts` is accidentally imported by a Client Component (`'use client'`), Next.js fails the production build immediately.
3. **Usage Scope:** The admin client is restricted to:
   - Initial administrative seeding.
   - The assessment demo-reset endpoint (`/api/admin/reset`).
   - Vitest backend integration test fixtures.
     Normal application routes and Server Actions **must always** use the scoped `createServerClient` bound to the caller's session cookies.

---

## 7. Catalog Seed Requirements & Price Conversion

### 7.1 Reconciling Seed with DummyJSON Requirements

The take-home assessment brief explicitly requires products to be sourced from the **DummyJSON API** (`https://dummyjson.com/products`).

Inventra satisfies this requirement through a dual architecture:

1. **Initial Database Seed (`supabase/seed.sql`):** Pre-populates the database with 30 curated products transformed directly from DummyJSON categories:
   - Groceries (e.g. Rice, Coffee, Cooking Oil)
   - Beauty & Fragrances
   - Furniture & Storage
2. **Dynamic Catalog Import Service (`src/services/catalog-sync.ts`):** A server-side service capable of fetching live items from `https://dummyjson.com/products?limit=30`, transforming the data into Inventra schema, and upserting into `public.products`.

### 7.2 IDR Price Conversion Architecture

- DummyJSON prices are provided in USD as floats (e.g. `$9.99`, `$12.50`).
- Inventra uses a documented fixed conversion rate constant:
  $$\text{Price}_{\text{IDR}} = \text{round}(\text{Price}_{\text{USD}} \times 16{,}000)$$
- **Handling PostgreSQL `bigint` in TypeScript:**
  - `price` is stored as `bigint` in PostgreSQL to represent whole Indonesian Rupiah (IDR).
  - In TypeScript interfaces and Zod schemas:
    ```typescript
    export const priceSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
    ```
  - Standard retail values (e.g. Rp 150.000 to Rp 50.000.000) are well below `Number.MAX_SAFE_INTEGER` ($9 \times 10^{15}$).
  - Display formatting uses standard Indonesian locale formatting:
    ```typescript
    export function formatIDR(amount: number): string {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(amount)
    }
    ```

### 7.3 Assessment Demo-Reset Requirement

Reviewers evaluating the take-home assessment require the ability to reset test data back to a clean state after recording test mutations.

- **Demo Reset Procedure:**
  An administrative Server Action or endpoint resets the state by:
  1. Truncating `public.stock_movements`.
  2. Resetting `public.products.stock` back to initial baseline numbers.
  3. Re-verifying demo user profiles (`admin_gudang@inventra.local` and `owner@inventra.local`).

---

## 8. Data & Integration Correctness

### 8.1 Accurate `updated_at` Timestamps

Relying on application code to manually supply `updated_at` leads to missed timestamps. A PostgreSQL trigger enforces automatic timestamp updates:

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### 8.2 Next.js 16 `src/proxy.ts` Cookie Integration

In Next.js 16, `src/proxy.ts` is the single canonical entry point for routing and middleware. It currently runs `next-intl`'s `createMiddleware(routing)`.

When integrating Supabase session token refresh in `proxy.ts`, there is a critical risk: **if the Supabase client creates a fresh response object, the locale rewrite headers generated by `next-intl` can be lost; conversely, if the `next-intl` response is returned without Supabase's `Set-Cookie` headers, user authentication sessions expire unexpectedly.**

**The Correct Integration Architecture (`src/lib/supabase/middleware.ts`):**

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import type { Database } from '@/types/database'
import type { NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      }
    }
  })

  // Refresh auth token
  await supabase.auth.getUser()

  return response
}
```

In `src/proxy.ts`:

1. Execute `createMiddleware(routing)` to generate the localized rewrite/redirect response.
2. Pass the request and the generated response into `updateSession(request, response)`.
3. Return the response containing both locale headers and refreshed auth cookies.

---

## 9. File-by-File Implementation Plan

| Target File                                                                   | Action | Layer          | Purpose                                                                                                     |
| :---------------------------------------------------------------------------- | :----: | :------------- | :---------------------------------------------------------------------------------------------------------- |
| **[.gitignore](file:///c:/Experience/Projects/inventra/.gitignore)**          | Modify | Config         | Add `!.env.example` so template is tracked while `.env.local` remains ignored.                              |
| **[.env.example](file:///c:/Experience/Projects/inventra/.env.example)**      | Create | Config         | Clean template for all required public and private environment variables.                                   |
| **`supabase/migrations/20261013000001_initial_schema.sql`**                   | Create | Database       | Tables (`profiles`, `products`, `stock_movements`), indexes, constraints, `updated_at` triggers.            |
| **`supabase/migrations/20261013000002_rls_policies.sql`**                     | Create | Database       | Enable RLS, `get_user_role` helper, role protection trigger, explicit `admin_gudang` vs `owner` policies.   |
| **`supabase/migrations/20261013000003_stock_mutation_rpc.sql`**               | Create | Database       | Pessimistic-locking atomic `record_stock_movement` function with actor and role verification.               |
| **`supabase/seed.sql`**                                                       | Create | Database       | Baseline products (DummyJSON schema, IDR prices) and demo profile mappings.                                 |
| **`src/types/database.ts`**                                                   | Create | Types          | TypeScript interface for Supabase schema (`Database`, tables, views, functions).                            |
| **`src/types/auth.ts`**                                                       | Create | Types          | Types for `UserRole`, `UserProfile`, and session states.                                                    |
| **`src/types/inventory.ts`**                                                  | Create | Types          | Business domain types for `Product`, `StockMovement`, and summary calculations.                             |
| **`src/lib/supabase/client.ts`**                                              | Create | Infrastructure | Browser client factory (`createBrowserClient`).                                                             |
| **`src/lib/supabase/server.ts`**                                              | Create | Infrastructure | Server client factory (`createServerClient`) with async `cookies()` and Server Component `try/catch` guard. |
| **`src/lib/supabase/middleware.ts`**                                          | Create | Infrastructure | Session cookie synchronization helper for Next.js 16 proxy.                                                 |
| **`src/lib/supabase/admin.ts`**                                               | Create | Infrastructure | Server-only admin client factory (`createAdminClient`) guarded by `import 'server-only'`.                   |
| **[src/proxy.ts](file:///c:/Experience/Projects/inventra/src/proxy.ts)**      | Modify | Infrastructure | Combine `next-intl` localization with Supabase session refresh.                                             |
| **`tests/supabase/client.test.ts`**                                           | Create | Testing        | Vitest tests verifying Supabase client factory instantiation and mock handlers.                             |
| **`docs/reports/Phase 4 - Supabase Integration/phase4_completion_report.md`** | Create | Docs           | Formal Phase 4 completion report.                                                                           |

---

## 10. Explicit Unresolved Questions

Before executing live migrations or seeding, the following operational questions should be noted:

1. **Demo Account Authentication Provisioning:**  
   Because demo users (`admin_gudang@inventra.local` and `owner@inventra.local`) require matching records in `auth.users`, will reviewers create them in the Supabase Dashboard, or should a Supabase CLI seed script / local seed migration provision them directly into `auth.users`?  
   _Current Plan:_ Document standard reviewer credentials (`admin_gudang@inventra.local` / `InventraAdmin2026!`) in README and author the seed script to support both dashboard and migration provisioning.
2. **Live Supabase Credentials:**  
   Does the reviewer have an active Supabase project URL and anon key ready for `.env.local`, or will Phase 4 verification run against mock client suites and SQL syntax validation until credentials are provided?  
   _Current Plan:_ Validate all client factories, types, and SQL syntax locally with mocked credentials in tests, allowing seamless connection once live credentials are supplied.

---

## 11. Recommended Implementation Sequence

1. **Step 1:** Configuration & Git Setup (`.gitignore` update and `.env.example` creation).
2. **Step 2:** SQL Migrations Authoring (`001_initial_schema`, `002_rls_policies`, `003_stock_mutation_rpc`, `seed.sql`).
3. **Step 3:** TypeScript Schema & Domain Types (`database.ts`, `auth.ts`, `inventory.ts`).
4. **Step 4:** Supabase Client Factories (`client.ts`, `server.ts`, `middleware.ts`, `admin.ts`).
5. **Step 5:** Proxy Session Integration ([src/proxy.ts](file:///c:/Experience/Projects/inventra/src/proxy.ts)).
6. **Step 6:** Unit Tests & Quality Gates (`vitest`, `tsc`, `lint`, `prettier`, `build`).
7. **Step 7:** Phase 4 Completion Report & Stop Condition.

---

> 🛑 **STRICT STOP CONDITION:** In compliance with instructions, no application source code, SQL migrations, dependencies, or database configurations were modified during this turn. Awaiting your approval before proceeding to implementation.
