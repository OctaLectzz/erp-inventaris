# DATABASE — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13

---

## 1. Overview

Inventra uses **Supabase PostgreSQL** as its primary database. The schema is designed around three core tables: `profiles`, `products`, and `stock_movements`. All schema changes are managed through **Supabase SQL migrations** — no ORM is used.

---

## 2. Entity Relationship Diagram

```
┌──────────────────┐
│   auth.users     │  (Supabase managed)
│──────────────────│
│  id (uuid) PK    │
│  email           │
│  ...             │
└────────┬─────────┘
         │ 1
         │
         │ 1
┌────────▼─────────┐        ┌──────────────────────┐
│    profiles      │        │      products         │
│──────────────────│        │──────────────────────│
│  id (uuid) PK/FK │        │  id (uuid) PK         │
│  email           │        │  sku (text) UNIQUE     │
│  full_name       │        │  name (text)           │
│  role            │        │  category (text)       │
│  created_at      │        │  unit (text)           │
│  updated_at      │        │  price (bigint)        │
└──────────────────┘        │  stock (int)           │
                            │  description (text)    │
                            │  image_url (text)      │
                            │  created_at            │
                            │  updated_at            │
                            └───────────┬────────────┘
                                        │ 1
                                        │
                                        │ *
                            ┌───────────▼────────────┐
                            │   stock_movements      │
                            │────────────────────────│
                            │  id (uuid) PK           │
                            │  product_id (uuid) FK   │
                            │  user_id (uuid) FK      │
                            │  type (text)            │
                            │  quantity (int)         │
                            │  stock_before (int)     │
                            │  stock_after (int)      │
                            │  note (text)            │
                            │  created_at             │
                            └────────────────────────┘
```

---

## 3. Table Definitions

### 3.1 `profiles`

Linked 1:1 with `auth.users`. Created automatically when a new user is provisioned.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | User ID from Supabase Auth |
| `email` | `text` | NOT NULL | User email (denormalized for convenience) |
| `full_name` | `text` | NOT NULL | Display name |
| `role` | `text` | NOT NULL, CHECK (role IN ('admin_gudang', 'owner')) | User role for RBAC |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Profile creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Last profile update timestamp |

**Indexes:**
- PK on `id`
- Unique on `email`

**Notes:**
- The `role` column uses a CHECK constraint instead of an enum for simpler migrations.
- `updated_at` should be maintained via a trigger or application logic.

### 3.2 `products`

Inventory catalog. Each product has a unique SKU and a stock quantity.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Product UUID |
| `sku` | `text` | NOT NULL, UNIQUE | Stock Keeping Unit — unique product identifier |
| `name` | `text` | NOT NULL | Product name |
| `category` | `text` | NOT NULL | Product category (from DummyJSON) |
| `unit` | `text` | NOT NULL, DEFAULT `'pcs'` | Unit of measure (pcs, kg, liter, etc.) |
| `price` | `bigint` | NOT NULL, CHECK (price >= 0) | Reference price in IDR (Indonesian Rupiah) |
| `stock` | `integer` | NOT NULL, DEFAULT 0, CHECK (stock >= 0) | Current stock quantity |
| `description` | `text` | | Optional product description |
| `image_url` | `text` | | Product image URL (from DummyJSON) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Product creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Last product update timestamp |

**Indexes:**
- PK on `id`
- UNIQUE on `sku`
- Index on `category` (for filtering)
- Index on `stock` (for low-stock queries)

**Constraints:**
- `CHECK (stock >= 0)` — stock can never go negative. This is the database-level safety net for the stock OUT validation.
- `CHECK (price >= 0)` — prices are non-negative.

### 3.3 `stock_movements`

Immutable log of every stock change. Created atomically alongside stock updates.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Movement UUID |
| `product_id` | `uuid` | NOT NULL, FK → `products(id)` ON DELETE RESTRICT | Associated product |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE RESTRICT | User who performed the action |
| `type` | `text` | NOT NULL, CHECK (type IN ('IN', 'OUT')) | Movement type |
| `quantity` | `integer` | NOT NULL, CHECK (quantity > 0) | Quantity moved (always positive) |
| `stock_before` | `integer` | NOT NULL, CHECK (stock_before >= 0) | Stock before the movement |
| `stock_after` | `integer` | NOT NULL, CHECK (stock_after >= 0) | Stock after the movement |
| `note` | `text` | NOT NULL | Reason or reference for the movement |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Movement timestamp |

**Indexes:**
- PK on `id`
- Index on `product_id` (for product-specific history)
- Index on `user_id` (for user-specific history)
- Index on `type` (for type filtering)
- Index on `created_at` (for date range queries, DESC)
- Composite index on `(product_id, created_at DESC)` (for product movement history)

**Constraints:**
- `CHECK (quantity > 0)` — quantities are always positive integers.
- `CHECK (stock_before >= 0)` and `CHECK (stock_after >= 0)` — stock values are never negative.
- `ON DELETE RESTRICT` on both FKs — cannot delete a product or user that has movement history.
- `stock_before` and `stock_after` are computed **server-side** at insert time, never from client input.

---

## 4. Relationships

| From | To | Type | FK Column | On Delete |
| :--- | :--- | :--- | :--- | :--- |
| `profiles.id` | `auth.users.id` | 1:1 | `profiles.id` | CASCADE |
| `stock_movements.product_id` | `products.id` | Many:1 | `stock_movements.product_id` | RESTRICT |
| `stock_movements.user_id` | `auth.users.id` | Many:1 | `stock_movements.user_id` | RESTRICT |

---

## 5. Row-Level Security (RLS)

### 5.1 RLS Policy Overview

RLS is ENABLED on all tables. Policies ensure authenticated users can only access appropriate data.

### 5.2 Planned Policies

#### `profiles`

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

#### `products`

```sql
-- All authenticated users can view products
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert products (for catalog import)
CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- All authenticated users can update products (for stock mutations)
CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

#### `stock_movements`

```sql
-- All authenticated users can view movements
CREATE POLICY "Authenticated users can view movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert movements
CREATE POLICY "Authenticated users can insert movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 5.3 RLS Rules

- **No anonymous access** to any table.
- **Movement insertion** requires `user_id` to match the authenticated user — users cannot create movements attributed to other users.
- **DELETE is not permitted** via RLS on `products` and `stock_movements` to preserve data integrity. Only the demo reset mechanism (using the service role key server-side) can delete data.

---

## 6. Atomic Stock Mutation

### 6.1 Transaction Requirement

Stock updates and movement history insertion MUST happen atomically. If either operation fails, the entire mutation must be rolled back.

### 6.2 Planned Implementation (Supabase RPC)

```sql
-- Planned: Database function for atomic stock mutation
CREATE OR REPLACE FUNCTION record_stock_movement(
  p_product_id uuid,
  p_user_id uuid,
  p_type text,
  p_quantity integer,
  p_note text
) RETURNS json AS $$
DECLARE
  v_current_stock integer;
  v_new_stock integer;
  v_movement_id uuid;
BEGIN
  -- Lock the product row for update
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Product not found');
  END IF;

  -- Calculate new stock
  IF p_type = 'IN' THEN
    v_new_stock := v_current_stock + p_quantity;
  ELSIF p_type = 'OUT' THEN
    IF v_current_stock < p_quantity THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient stock');
    END IF;
    v_new_stock := v_current_stock - p_quantity;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid movement type');
  END IF;

  -- Update product stock
  UPDATE products SET stock = v_new_stock, updated_at = now()
  WHERE id = p_product_id;

  -- Insert movement record
  INSERT INTO stock_movements (product_id, user_id, type, quantity, stock_before, stock_after, note)
  VALUES (p_product_id, p_user_id, p_type, p_quantity, v_current_stock, v_new_stock, p_note)
  RETURNING id INTO v_movement_id;

  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'movement_id', v_movement_id,
      'stock_before', v_current_stock,
      'stock_after', v_new_stock
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.3 Atomicity Guarantees

- `SELECT ... FOR UPDATE` locks the product row to prevent concurrent modifications.
- The entire function runs within an implicit transaction.
- If any statement fails (including the CHECK constraint on `stock >= 0`), the transaction is rolled back.
- `SECURITY DEFINER` allows the function to bypass RLS for the atomic operation while the calling context is still authenticated.

---

## 7. SQL Migration Conventions

### 7.1 File Naming

```
supabase/migrations/
├── 001_initial_schema.sql       # Tables, indexes, constraints
├── 002_rls_policies.sql         # Row-level security policies
├── 003_functions.sql            # Database functions (atomic mutations)
└── 004_seed_demo_data.sql       # Demo account and initial data
```

### 7.2 Migration Rules

- Migrations are sequential and numbered.
- Each migration is idempotent where possible (`IF NOT EXISTS`).
- Destructive changes (DROP, ALTER) must be explicit and reviewed.
- NEVER modify a migration that has been applied — create a new migration instead.
- All migrations are tested locally before applying to production.
- Do NOT create or modify migrations without explicit user authorization.

---

## 8. Data Seeding

### 8.1 Demo Accounts

Two demo accounts are provisioned:

| Role | Email | Purpose |
| :--- | :--- | :--- |
| `admin_gudang` | `admin@inventra.demo` | Warehouse admin demo |
| `owner` | `owner@inventra.demo` | Business owner demo |

Passwords are documented in the README.

### 8.2 Product Catalog Seed

- Initial products are fetched from `https://dummyjson.com/products`.
- DummyJSON products are transformed:
  - SKU generated from product ID (e.g., `INV-001`, `INV-002`).
  - Price converted from USD to IDR (conversion rate documented in code).
  - Stock set to initial values from DummyJSON.
  - Category mapped from DummyJSON taxonomy.

### 8.3 Demo Reset

- An explicit "Reset Demo Data" action is available.
- Reset deletes all stock movements and re-seeds the product catalog to initial state.
- Reset is a server-side operation using the service role key.
- The reset mechanism is clearly labeled as destructive.

---

## 9. Timestamps and Time Zones

- All timestamps use `timestamptz` (timestamp with time zone).
- Timestamps default to `now()` (server time, UTC).
- The application displays timestamps in the user's locale format via `next-intl`.
- No manual timezone conversion in SQL queries.

---

## 10. Summary Queries (Planned)

### 10.1 Inventory Summary Metrics

```sql
-- Unique SKU count
SELECT COUNT(*) AS sku_count FROM products;

-- Total units
SELECT COALESCE(SUM(stock), 0) AS total_units FROM products;

-- Low stock items (stock < 5)
SELECT COUNT(*) AS low_stock_count FROM products WHERE stock < 5;

-- Estimated inventory value
SELECT COALESCE(SUM(price * stock), 0) AS total_value FROM products;
```

### 10.2 Movement History with Filters

```sql
-- Movement history with filters
SELECT
  sm.id,
  sm.created_at,
  p.sku,
  p.name AS product_name,
  sm.type,
  sm.quantity,
  sm.stock_before,
  sm.stock_after,
  pr.full_name AS user_name,
  sm.note
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN profiles pr ON sm.user_id = pr.id
WHERE
  (p.sku ILIKE '%' || :sku_filter || '%' OR :sku_filter IS NULL)
  AND (sm.type = :type_filter OR :type_filter IS NULL)
  AND (sm.created_at >= :date_from OR :date_from IS NULL)
  AND (sm.created_at <= :date_to OR :date_to IS NULL)
ORDER BY sm.created_at DESC
LIMIT :page_size OFFSET :offset;
```
