# API — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13
>
> **Status:** All contracts below are **planned** — none are implemented yet. This document describes the intended server-side API surface.

---

## 1. API Architecture

Inventra uses **Next.js Server Actions** as the primary server-side API pattern. Route Handlers (`/api/...`) are used only when a traditional REST endpoint is necessary (e.g., external integrations).

- **Server Actions:** For all form submissions and mutations from the UI.
- **Route Handlers:** For the DummyJSON data import and optional external integrations.
- **No unnecessary API layer:** Server Components fetch data directly from Supabase via the server client. Server Actions handle mutations.

### 1.1 Response Contract

All server actions and route handlers return a consistent response shape:

```typescript
interface ActionResult<T = unknown> {
  success: boolean
  data: T | null
  error: string | null // Translation key for user-facing messages
}
```

### 1.2 Validation Boundaries

Every server action:

1. **Receives** raw, untrusted input from the client.
2. **Validates** input with a Zod schema (same schema used on the client for UX).
3. **Checks** authentication (user is logged in).
4. **Checks** authorization (user has the required role).
5. **Delegates** to the service layer for business logic.
6. **Returns** a typed `ActionResult`.

---

## 2. Authentication Actions

### 2.1 Sign In

| Property          | Value                                       |
| :---------------- | :------------------------------------------ |
| **Type**          | Server Action                               |
| **Location**      | `src/app/(auth)/login/actions.ts` (planned) |
| **Auth Required** | No                                          |
| **Role Required** | None                                        |

**Input (Zod schema: `loginSchema`):**

```typescript
{
  email: string // Valid email format
  password: string // Non-empty
}
```

**Success Response:**

```typescript
{ success: true, data: { redirectTo: '/dashboard' }, error: null }
```

**Error Responses:**

| Scenario            | Error Key                        |
| :------------------ | :------------------------------- |
| Invalid credentials | `auth.error.invalid_credentials` |
| Validation failure  | `auth.error.validation`          |
| Server error        | `common.error.server`            |

### 2.2 Sign Out

| Property          | Value                                 |
| :---------------- | :------------------------------------ |
| **Type**          | Server Action                         |
| **Location**      | `src/app/(auth)/actions.ts` (planned) |
| **Auth Required** | Yes                                   |
| **Role Required** | Any authenticated                     |

**Input:** None.

**Success Response:**

```typescript
{ success: true, data: null, error: null }
```

Redirects to `/login` after sign out.

---

## 3. Product / Catalog Actions

### 3.1 Get Products (Server Component Data Fetching)

| Property          | Value                                  |
| :---------------- | :------------------------------------- |
| **Type**          | Server Component query (not an action) |
| **Auth Required** | Yes                                    |
| **Role Required** | `admin_gudang`, `owner`                |

Products are fetched directly in Server Components via the Supabase server client:

```typescript
// Planned: Direct query in Server Component
const { data: products } = await supabase.from('products').select('*').order('name')
```

**Note:** This is not an API endpoint — it's a direct database query in a Server Component, protected by RLS.

### 3.2 Import Catalog from DummyJSON

| Property          | Value                                                          |
| :---------------- | :------------------------------------------------------------- |
| **Type**          | Server Action                                                  |
| **Location**      | `src/services/catalog-service.ts` → called by action (planned) |
| **Auth Required** | Yes                                                            |
| **Role Required** | `admin_gudang`                                                 |

**Input:** None (fetches from `https://dummyjson.com/products?limit=30`).

**Process:**

1. Fetch products from DummyJSON API using native `fetch`.
2. Transform each product:
   - Generate unique SKU (e.g., `INV-001`).
   - Map `category`, `title` → `name`, `description`.
   - Convert `price` (USD) → IDR (using documented conversion rate).
   - Set `unit` to `'pcs'` by default.
   - Use DummyJSON `stock` as initial stock.
   - Use DummyJSON `thumbnail` as `image_url`.
3. Upsert products into the database (ON CONFLICT on `sku` DO UPDATE).

**Success Response:**

```typescript
{
  success: true,
  data: { imported: 30, updated: 0 },
  error: null
}
```

**Error Responses:**

| Scenario                  | Error Key                       |
| :------------------------ | :------------------------------ |
| DummyJSON API unreachable | `catalog.error.api_unavailable` |
| Database insert failure   | `common.error.server`           |
| Unauthorized              | `common.error.unauthorized`     |

### 3.3 Reset Demo Data

| Property          | Value                                                          |
| :---------------- | :------------------------------------------------------------- |
| **Type**          | Server Action                                                  |
| **Location**      | `src/services/catalog-service.ts` → called by action (planned) |
| **Auth Required** | Yes                                                            |
| **Role Required** | `admin_gudang`                                                 |

**Input:** None (or confirmation flag).

**Process:**

1. Delete all records from `stock_movements` (using service role client).
2. Delete all records from `products`.
3. Re-import from DummyJSON.

**Success Response:**

```typescript
{ success: true, data: { message: 'Demo data reset successfully' }, error: null }
```

> **Note:** This action uses `SUPABASE_SERVICE_ROLE_KEY` server-side to bypass RLS for deletion.

---

## 4. Stock Movement Actions

### 4.1 Record Stock Movement (IN / OUT)

| Property          | Value                                                      |
| :---------------- | :--------------------------------------------------------- |
| **Type**          | Server Action                                              |
| **Location**      | `src/app/(dashboard)/stock-movements/actions.ts` (planned) |
| **Auth Required** | Yes                                                        |
| **Role Required** | `admin_gudang`, `owner`                                    |

**Input (Zod schema: `stockMovementSchema`):**

```typescript
{
  productId: string // UUID of the product
  type: 'IN' | 'OUT' // Movement type
  quantity: number // Positive integer (validated by Zod: int(), positive())
  note: string // Non-empty reason/reference
}
```

**Validation:**

| Rule                                 | Check Layer                           |
| :----------------------------------- | :------------------------------------ |
| `quantity` is a positive integer     | Zod (client + server)                 |
| `type` is 'IN' or 'OUT'              | Zod (client + server)                 |
| `note` is non-empty                  | Zod (client + server)                 |
| `productId` exists in database       | Service layer                         |
| Stock OUT `quantity` ≤ current stock | Database function (`FOR UPDATE` lock) |

**Process:**

1. Server Action validates input with Zod.
2. Calls `supabase.rpc('record_stock_movement', { ... })`.
3. The database function atomically:
   - Locks the product row.
   - Validates stock availability (for OUT).
   - Updates product stock.
   - Inserts movement record with computed `stock_before` and `stock_after`.
4. Returns the result.

**Success Response:**

```typescript
{
  success: true,
  data: {
    movement_id: 'uuid',
    stock_before: 10,
    stock_after: 15
  },
  error: null
}
```

**Error Responses:**

| Scenario                             | Error Key                        | HTTP Status (if route handler) |
| :----------------------------------- | :------------------------------- | :----------------------------- |
| Validation failure                   | `validation.error.*`             | 400                            |
| Product not found                    | `stock.error.product_not_found`  | 404                            |
| Insufficient stock (OUT > available) | `stock.error.insufficient_stock` | 409                            |
| Unauthorized                         | `common.error.unauthorized`      | 401                            |
| Forbidden (wrong role)               | `common.error.forbidden`         | 403                            |
| Server/database error                | `common.error.server`            | 500                            |

### 4.2 Get Movement History

| Property          | Value                                                                    |
| :---------------- | :----------------------------------------------------------------------- |
| **Type**          | Server Component query or Server Action (for filtered/paginated queries) |
| **Auth Required** | Yes                                                                      |
| **Role Required** | `admin_gudang`, `owner`                                                  |

**Input (filter parameters):**

```typescript
{
  sku?: string         // Partial SKU match (ILIKE)
  type?: 'IN' | 'OUT'  // Movement type filter
  dateFrom?: string    // ISO date string
  dateTo?: string      // ISO date string
  page?: number        // Page number (1-indexed)
  pageSize?: number    // Items per page (default: 20)
}
```

**Output:**

```typescript
{
  success: true,
  data: {
    movements: StockMovementWithDetails[],
    total: number,
    page: number,
    pageSize: number
  },
  error: null
}
```

Where `StockMovementWithDetails` includes joined product and user information:

```typescript
interface StockMovementWithDetails {
  id: string
  createdAt: string
  product: { sku: string; name: string }
  type: 'IN' | 'OUT'
  quantity: number
  stockBefore: number
  stockAfter: number
  user: { fullName: string }
  note: string
}
```

---

## 5. Dashboard / Summary Actions

### 5.1 Get Inventory Summary

| Property          | Value                   |
| :---------------- | :---------------------- |
| **Type**          | Server Component query  |
| **Auth Required** | Yes                     |
| **Role Required** | `admin_gudang`, `owner` |

**Output:**

```typescript
{
  skuCount: number // Total unique SKUs
  totalUnits: number // Sum of all product stock
  lowStockCount: number // Products with stock < 5
  totalValue: number // Sum of (price × stock) in IDR
}
```

**Low Stock Threshold:** Strictly below 5 units (`stock < 5`).

---

## 6. Error Handling

### 6.1 Error Categories

| Category           | Handling                 | Response                                        |
| :----------------- | :----------------------- | :---------------------------------------------- |
| **Validation**     | Zod parse failure        | Return field-level errors with translation keys |
| **Authentication** | No valid session         | Redirect to login or return 401                 |
| **Authorization**  | Wrong role               | Return 403 with translation key                 |
| **Business Logic** | e.g., insufficient stock | Return error with specific translation key      |
| **Database**       | Query failure            | Log server-side, return generic error           |
| **External API**   | DummyJSON unavailable    | Return specific error, suggest retry            |

### 6.2 Error Rules

- Never expose database error details, SQL queries, or stack traces to clients.
- Always use translation keys for user-facing error messages.
- Log errors server-side with sufficient context for debugging.
- Return specific error codes where possible (e.g., `stock.error.insufficient_stock`).

---

## 7. Atomicity and Consistency

### 7.1 Stock Mutation Semantics

- Stock mutations are **atomic**: the product stock update and the movement history insert succeed or fail together.
- The database function uses `SELECT ... FOR UPDATE` to lock the product row during mutation, preventing concurrent race conditions.
- The `CHECK (stock >= 0)` constraint on the `products` table is the final safety net — even if application logic has a bug, the database will not allow negative stock.

### 7.2 Consistency Invariant

```
product.stock = initial_stock + SUM(movements WHERE type='IN') - SUM(movements WHERE type='OUT')
```

This invariant is maintained by:

1. Atomic transactions (function handles both stock update and history insert).
2. `stock_before` and `stock_after` are computed server-side from the current database state.
3. Client-submitted `stock_before`/`stock_after` values are ignored.

### 7.3 Concurrency Handling

- Row-level locking (`FOR UPDATE`) prevents two concurrent mutations from creating an inconsistent state.
- If two users try to reduce the same product's stock simultaneously, only one will succeed if the combined reduction would exceed available stock.

---

## 8. What Does NOT Exist

This section clarifies what is **not** part of the API to avoid confusion:

- ❌ No REST API for CRUD operations (Server Actions are used instead).
- ❌ No GraphQL endpoint.
- ❌ No WebSocket/real-time subscriptions (could be added later with Supabase Realtime).
- ❌ No public registration endpoint.
- ❌ No POS, checkout, sales, or customer order endpoints.
- ❌ No file upload endpoints.
- ❌ No third-party webhook receivers.
