# ARCHITECTURE — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13

---

## 1. System Overview

Inventra is a **modular monolith** built on **Next.js App Router** with **Supabase** as the backend. All business logic, API handling, authentication, and database operations are contained within a single Next.js application. There is no separate backend service.

```
┌─────────────────────────────────────────────────────┐
│                      CLIENTS                         │
│                                                     │
│   ┌────────────┐    ┌────────────┐                  │
│   │  Desktop   │    │  Mobile    │                  │
│   │  Browser   │    │  Browser   │                  │
│   └─────┬──────┘    └─────┬──────┘                  │
└─────────┼─────────────────┼─────────────────────────┘
          │                 │
          ▼                 ▼
┌───────────────────────────────────────┐
│         NEXT.JS APPLICATION           │
│                                       │
│  App Router (Pages, Layouts)          │
│  Server Components                    │
│  Server Actions / Route Handlers      │
│  Middleware (Auth + i18n)             │
│  Zod Validation + React Hook Form     │
└─────────────┬─────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│          EXTERNAL SERVICES            │
│                                       │
│  ┌──────────────┐  ┌──────────────┐  │
│  │  Supabase    │  │  DummyJSON   │  │
│  │  PostgreSQL  │  │  API         │  │
│  │  + Auth      │  │  (seed only) │  │
│  └──────────────┘  └──────────────┘  │
└───────────────────────────────────────┘
```

---

## 2. Architecture Layers

### 2.1 Layer Diagram

```
┌───────────────────────────────────────────────────┐
│                PRESENTATION LAYER                  │
│  React Server/Client Components, Pages, Layouts,   │
│  shadcn/ui, React Hook Form, next-intl, next-themes│
├───────────────────────────────────────────────────┤
│                APPLICATION LAYER                   │
│  Server Actions, Route Handlers, Middleware,       │
│  Zod Validation, Auth Guards, Role Checks          │
├───────────────────────────────────────────────────┤
│                 SERVICE LAYER                      │
│  Business Logic (Stock Mutations, Inventory        │
│  Calculations, Catalog Import, SKU Generation)     │
├───────────────────────────────────────────────────┤
│                DATA ACCESS LAYER                   │
│  Supabase Client (Server/Browser),                 │
│  SQL Queries, Transactions, RLS                    │
├───────────────────────────────────────────────────┤
│               INFRASTRUCTURE LAYER                 │
│  Supabase PostgreSQL, Supabase Auth,               │
│  DummyJSON API (seed data)                         │
└───────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer              | Responsibility                                                  | Planned Key Files                                              |
| :----------------- | :-------------------------------------------------------------- | :------------------------------------------------------------- |
| **Presentation**   | UI rendering, user interaction, form state, i18n, theming       | `src/app/**/page.tsx`, `src/components/**`                     |
| **Application**    | Request handling, Zod validation, auth enforcement, role checks | `src/app/**/actions.ts`, `src/middleware.ts`, `src/schemas/**` |
| **Service**        | Pure business logic, stock calculations, catalog import         | `src/services/**`                                              |
| **Data Access**    | Supabase queries, transactions, RLS enforcement                 | `src/lib/supabase/**`                                          |
| **Infrastructure** | External connections, environment configuration                 | `.env.local`, Supabase project                                 |

### 2.3 Key Principles

- **Server-first:** Default to Server Components. Use `'use client'` only when React hooks, event handlers, or browser APIs are required.
- **Validation at boundaries:** Zod schemas validate at the application layer (Server Actions / Route Handlers). The same schemas can be reused on the client via React Hook Form for UX, but server validation is always authoritative.
- **No client-side trust:** Stock values, role checks, and authorization are always computed server-side.
- **Atomic mutations:** Stock updates and movement history insertion happen in a single database transaction.
- **Shared schemas:** Zod schemas live in `src/schemas/` and are imported by both application and presentation layers. No duplicated validation logic.
- **Code modularization (< 250 lines):** Maintain clean separation of concerns. Target file length is < 250 lines; any file exceeding 250 lines must be reviewed for modular decomposition into dedicated presentation, column, filter, domain, or service files. Avoid files exceeding 300 lines unless an architectural exemption is documented.

---

## 3. Directory Structure

```
inventra/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (login page)
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/              # Protected route group
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar/nav
│   │   │   ├── page.tsx              # Dashboard home / summary
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx          # Product catalog
│   │   │   ├── stock-movements/
│   │   │   │   └── page.tsx          # Stock IN/OUT forms + history
│   │   │   └── settings/
│   │   │       └── page.tsx          # Theme, locale, demo reset
│   │   ├── api/                      # Route handlers (if needed)
│   │   ├── globals.css               # Tailwind v4 + design tokens
│   │   ├── layout.tsx                # Root layout (fonts, providers)
│   │   └── page.tsx                  # Landing/redirect
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   └── shared/                   # Reusable components
│   │       ├── data-table.tsx        # Generic data table
│   │       ├── nav-sidebar.tsx       # Navigation sidebar
│   │       ├── theme-toggle.tsx      # Theme switcher
│   │       └── locale-switcher.tsx   # Language switcher
│   │
│   ├── features/                     # Feature-specific components
│   │   ├── inventory/                # Product catalog components
│   │   ├── stock-movements/          # Stock IN/OUT components
│   │   └── dashboard/               # Summary/metrics components
│   │
│   ├── schemas/                      # Zod validation schemas
│   │   ├── product-schema.ts         # Product validation
│   │   ├── stock-movement-schema.ts  # Stock mutation validation
│   │   └── auth-schema.ts            # Login form validation
│   │
│   ├── services/                     # Business logic
│   │   ├── inventory-service.ts      # Stock calculations, mutations
│   │   ├── catalog-service.ts        # DummyJSON import, reset
│   │   └── movement-service.ts       # Movement history queries
│   │
│   ├── lib/                          # Library initialization
│   │   ├── supabase/
│   │   │   ├── server.ts             # Server-side Supabase client
│   │   │   ├── client.ts             # Browser-side Supabase client
│   │   │   └── middleware.ts         # Supabase middleware helper
│   │   └── utils.ts                  # cn() utility
│   │
│   ├── hooks/                        # Custom React hooks
│   │   └── use-inventory-filters.ts  # Filter state hook
│   │
│   ├── stores/                       # Zustand stores
│   │   └── ui-store.ts              # Sidebar, dialog state
│   │
│   ├── types/                        # TypeScript types
│   │   ├── database.ts              # Database row types
│   │   ├── inventory.ts             # Business domain types
│   │   └── auth.ts                  # Auth and role types
│   │
│   ├── messages/                     # i18n dictionaries
│   │   ├── id/                      # Indonesian translations
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── inventory.json
│   │   │   └── dashboard.json
│   │   └── en/                      # English translations
│   │       ├── common.json
│   │       ├── auth.json
│   │       ├── inventory.json
│   │       └── dashboard.json
│   │
│   └── middleware.ts                 # Auth + i18n middleware
│
├── supabase/
│   ├── migrations/                   # SQL migration files
│   │   └── 001_initial_schema.sql   # Tables, indexes, RLS
│   └── seed.sql                     # Demo data and accounts
│
└── public/                           # Static assets
```

---

## 4. Supabase Client Architecture

### 4.1 Client Types

Inventra uses `@supabase/ssr` to create Supabase clients appropriate for each execution context:

| Context                           | Factory                 | Cookie Handling                | Use Case                 |
| :-------------------------------- | :---------------------- | :----------------------------- | :----------------------- |
| **Server Component**              | `createServerClient()`  | Read-only from request cookies | Data fetching in RSC     |
| **Server Action / Route Handler** | `createServerClient()`  | Read/write cookies             | Mutations, auth checks   |
| **Middleware**                    | `createServerClient()`  | Read/write on request/response | Session refresh          |
| **Browser**                       | `createBrowserClient()` | Automatic (browser cookies)    | Client-side interactions |

### 4.2 Client Rules

- NEVER import the browser client in server code or vice versa.
- NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- The server client in Server Components is read-only for cookies.
- The middleware client refreshes the session on every request.

---

## 5. Zod Validation and React Hook Form Integration

### 5.1 Schema Architecture

```
src/schemas/
├── product-schema.ts           # Product CRUD validation
├── stock-movement-schema.ts    # Stock IN/OUT validation
└── auth-schema.ts              # Login form validation
```

Schemas are the single source of truth for input validation:

```typescript
// Example: src/schemas/stock-movement-schema.ts (planned)
import { z } from 'zod'

export const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['IN', 'OUT']),
  quantity: z.number().int({ message: 'validation.quantity.integer' }).positive({ message: 'validation.quantity.positive' }),
  note: z.string().min(1, { message: 'validation.note.required' })
})

export type StockMovementInput = z.infer<typeof stockMovementSchema>
```

### 5.2 Client-Side Integration (React Hook Form)

```typescript
// Example: Form component (planned)
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { stockMovementSchema } from '@/schemas/stock-movement-schema'

import type { StockMovementInput } from '@/schemas/stock-movement-schema'

const form = useForm<StockMovementInput>({
  resolver: zodResolver(stockMovementSchema),
  defaultValues: { type: 'IN', quantity: 1, note: '' }
})
```

### 5.3 Server-Side Validation

Every Server Action re-validates with the same Zod schema:

```typescript
// Example: Server Action (planned)
export async function recordStockMovement(input: unknown): Promise<ActionResult> {
  const parsed = stockMovementSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, data: null, error: parsed.error.issues[0].message }
  }
  // ... proceed with validated data
}
```

### 5.4 Validation Flow

```
User fills form
    │
    ▼
React Hook Form + Zod (client-side UX validation)
    │
    ▼ (onSubmit)
Server Action receives raw input
    │
    ▼
Zod re-validates on server (authoritative)
    │
    ▼ (valid)
Service layer processes business logic
    │
    ▼
Database transaction (stock update + history insert)
    │
    ▼
Return result to client
```

---

## 6. Service Layer Boundaries

### 6.1 Service Responsibilities

| Service             | Responsibility                                                                  |
| :------------------ | :------------------------------------------------------------------------------ |
| `inventory-service` | Stock calculations, mutation logic, available stock checks, inventory valuation |
| `catalog-service`   | Fetch from DummyJSON, transform to product format, seed/reset database          |
| `movement-service`  | Query movement history, apply filters (SKU, type, date)                         |

### 6.2 Service Rules

- Services contain **pure business logic** — no HTTP request/response handling.
- Services receive validated, typed inputs (from Zod).
- Services interact with the database via Supabase client (passed as parameter).
- Services return typed results, never throw for expected business errors.
- Stock mutation in `inventory-service` must be **atomic**: a single Supabase RPC call or transaction that updates the product stock and inserts the movement record together.

---

## 7. i18n Architecture

### 7.1 Provider Setup

- `next-intl` configured with middleware-based locale detection.
- Default locale: `id` (Indonesian).
- Supported locales: `id`, `en`.
- Translation files in `src/messages/{locale}/`.

### 7.2 Translation Responsibilities

| Layer                          | Translation Approach                                                    |
| :----------------------------- | :---------------------------------------------------------------------- |
| **Server Components**          | `getTranslations()` from `next-intl/server`                             |
| **Client Components**          | `useTranslations()` hook                                                |
| **Zod validation messages**    | Translation keys as message values, resolved at display time            |
| **Server-side error messages** | Translation keys returned to client, rendered by the presentation layer |

### 7.3 Rules

- NEVER hardcode UI text strings in components.
- All user-facing strings must have a translation key.
- Zod schema messages use translation keys (e.g., `'validation.quantity.positive'`), not hardcoded strings.
- The presentation layer is responsible for resolving translation keys to user-visible text.

---

## 8. Theme Provider Architecture

### 8.1 Setup

- `next-themes` provides light, dark, and system theme modes.
- Theme is persisted in `localStorage` and applied via class on `<html>`.
- CSS variables in `globals.css` define both light and dark palettes.
- The `@custom-variant dark (&:is(.dark *))` directive in Tailwind v4 enables dark mode via the `.dark` class.

### 8.2 Rules

- The theme provider wraps the application at the root layout level.
- Components use Tailwind's `dark:` variant for dark-mode styles.
- Brand colors (navy, teal, surface) are defined as CSS variables — never hardcoded.
- See `DESIGN.md` for the complete color system.

---

## 9. Role Authorization Architecture

### 9.1 Roles

| Role            | Code           | Access                                             |
| :-------------- | :------------- | :------------------------------------------------- |
| Warehouse Admin | `admin_gudang` | Full CRUD on inventory and stock movements         |
| Business Owner  | `owner`        | Full read access, stock mutations, summary metrics |

### 9.2 Authorization Flow

```
Request arrives
    │
    ▼
Middleware: Refresh Supabase session
    │
    ▼
Middleware: Check if route is protected
    │
    ▼ (protected)
Read user role from Supabase Auth metadata / profiles table
    │
    ▼
Check role against route's allowed roles
    │
    ▼ (unauthorized)
Redirect to login or 403 page
```

### 9.3 Authorization Rules

- **Route protection:** Middleware checks session existence for all `/(dashboard)` routes.
- **Role checks:** Server Actions and route handlers verify the user's role before executing business logic.
- **Client-side:** Role-based UI elements (navigation, buttons) are rendered conditionally, but this is cosmetic — server-side enforcement is authoritative.
- **Direct URL access:** Middleware intercepts unauthorized direct URL navigation.

---

## 10. Error Handling Architecture

### 10.1 Error Categories

| Category                 | Handling                     | User Feedback                                  |
| :----------------------- | :--------------------------- | :--------------------------------------------- |
| **Validation Error**     | Zod parse failure            | Field-level error messages via React Hook Form |
| **Business Logic Error** | Service returns error result | Toast notification with translated message     |
| **Auth Error**           | Middleware redirect          | Redirect to login page                         |
| **Database Error**       | Caught in try-catch          | Generic error message (no details exposed)     |
| **Network Error**        | Caught in try-catch          | Retry prompt or generic error                  |

### 10.2 Error Response Format

All internal API responses follow this contract:

```typescript
interface ActionResult<T = unknown> {
  success: boolean
  data: T | null
  error: string | null // Translation key for user-facing message
}
```

### 10.3 Rules

- Never expose database error details, stack traces, or internal state to clients.
- Always catch async errors in try-catch blocks.
- Log errors server-side for debugging.
- Return translated error keys to the client for display.

---

## 11. Data Flow Examples

### 11.1 Stock OUT Flow

```
1. User fills Stock OUT form (React Hook Form + Zod client validation)
2. Form submits → Server Action receives raw input
3. Server Action: Zod re-validates input
4. Server Action: Calls inventory-service.recordStockOut(supabase, validatedInput)
5. Service: Reads current stock from database (authoritative)
6. Service: Validates quantity ≤ current stock
7. Service: Executes atomic transaction:
   a. UPDATE products SET stock = stock - quantity WHERE id = productId AND stock >= quantity
   b. INSERT INTO stock_movements (product_id, type, quantity, stock_before, stock_after, ...)
8. Service: Returns { success: true, data: movementRecord }
9. Server Action: Returns result to client
10. Client: Shows success toast, refreshes data
```

### 11.2 Catalog Import Flow

```
1. Admin triggers "Import from DummyJSON" action
2. Server Action: Fetches products from https://dummyjson.com/products
3. Service: Transforms DummyJSON format → Inventra product format
   - Generate unique SKU
   - Map category
   - Convert price USD → IDR
   - Set initial stock
4. Service: Upserts products into Supabase
5. Returns import summary
```

---

## 12. Technology Decisions

| Decision                                        | Rationale                                                                                              |
| :---------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Supabase over custom backend**                | Built-in Auth, PostgreSQL, RLS, and real-time — reduces scope for a time-boxed assessment.             |
| **No ORM (no Prisma)**                          | Direct Supabase client queries are sufficient. Avoids additional abstraction for a small schema.       |
| **No Axios**                                    | Native `fetch` is built into Next.js with caching support. No need for an HTTP wrapper.                |
| **Zod + React Hook Form**                       | Type-safe validation shared between client and server. React Hook Form handles form state efficiently. |
| **Zustand over Context for UI state**           | Avoids unnecessary re-renders for frequently changing UI state (sidebar, filters).                     |
| **next-intl over raw i18n**                     | First-class Next.js App Router support with server/client component integration.                       |
| **Vitest over Jest**                            | Faster execution, native ESM support, and already installed as a dev dependency.                       |
| **Supabase SQL migrations over ORM migrations** | Direct SQL gives full control over schema, indexes, RLS policies, and functions.                       |
