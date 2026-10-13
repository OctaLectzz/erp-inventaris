# TASK INSTRUCTION — NexPOS

> **Purpose:** Step-by-step instructions for AI coding agents building NexPOS.
> **Last Updated:** 2026-06-04

---

## 0. Before You Start

**MANDATORY: Read these documents before writing any code:**

1. `AGENTS.md` — Project rules, conventions, and constraints
2. `docs/PRD.md` — Feature requirements and user stories
3. `docs/ARCHITECTURE.md` — System design, database schema, API contracts
4. `docs/DESIGN.md` — Design system, colors, typography, component patterns
5. `docs/SECURITY.md` — Security requirements and patterns
6. `docs/TESTING.md` — Testing strategy and conventions

---

## Phase 1: Project Foundation

### Task 1.1 — Initialize Next.js Project

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

**Post-init checklist:**

- [ ] Verify `tsconfig.json` has `strict: true`
- [ ] Verify `src/app` directory exists
- [ ] Verify Tailwind is configured
- [ ] Remove default boilerplate (default page content, globals.css defaults)

### Task 1.2 — Install Core Dependencies

```bash
# UI & Styling
npx shadcn@latest init

# Database
npm install prisma @prisma/client
npm install @supabase/supabase-js @supabase/ssr

# Internationalization
npm install next-intl

# State Management & Data Fetching
npm install @tanstack/react-query

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Theme
npm install next-themes

# Utilities
npm install date-fns lucide-react sonner clsx tailwind-merge

# AI
npm install @google/generative-ai

# Charts
npm install recharts

# Dev Dependencies
npm install -D prettier eslint-config-prettier
```

### Task 1.3 — Initialize Prisma

```bash
npx prisma init
```

- Copy the full schema from `docs/ARCHITECTURE.md` Section 4.1 into `prisma/schema.prisma`
- Configure `DATABASE_URL` and `DIRECT_URL` in `.env.local`
- Run `npx prisma generate`

### Task 1.4 — Create `.env.example`

Create `.env.example` with all required variables (no values):

```env
# App
NEXT_PUBLIC_APP_NAME="NexPOS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# Database
DATABASE_URL=""
DIRECT_URL=""

# Auth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI
GEMINI_API_KEY=""

# WhatsApp Service
WA_SERVICE_URL=""
WA_SERVICE_SECRET=""
```

### Task 1.5 — Setup Folder Structure

Create all directories as defined in `docs/ARCHITECTURE.md` Section 3:

```bash
# Create all required directories
mkdir -p src/components/{ui,shared,dashboard,categories,products,orders,pos,reports,ai,whatsapp,auth,settings}
mkdir -p src/{contexts,hooks,layouts,lib/supabase,providers,schemas,services,types,utils,i18n}
mkdir -p src/messages/{id,en}
mkdir -p prisma
mkdir -p public/{images,icons,fonts}
```

### Task 1.6 — Configure Design System

1. Copy CSS variables from `docs/DESIGN.md` Section 2.1 into `src/app/globals.css`
2. Set up fonts (Inter + JetBrains Mono) in root layout
3. Configure `tailwind.config.ts` with design tokens
4. Set up `components.json` for shadcn/ui

### Task 1.7 — Setup Core Utilities

Create these foundational files:

| File                             | Content                           |
| :------------------------------- | :-------------------------------- |
| `src/lib/prisma.ts`              | Prisma client singleton           |
| `src/lib/supabase/client.ts`     | Supabase browser client           |
| `src/lib/supabase/server.ts`     | Supabase server client            |
| `src/lib/supabase/middleware.ts` | Supabase middleware client        |
| `src/lib/utils.ts`               | `cn()` helper (from shadcn)       |
| `src/lib/constants.ts`           | App-wide constants                |
| `src/utils/api-response.ts`      | Standardized API response builder |
| `src/utils/format-currency.ts`   | Currency formatter                |
| `src/utils/format-date.ts`       | Date formatter                    |
| `src/utils/role-permissions.ts`  | RBAC permission checker           |

### Task 1.8 — Setup Providers

Create provider components:

| File                                 | Content                       |
| :----------------------------------- | :---------------------------- |
| `src/providers/query-provider.tsx`   | TanStack React Query provider |
| `src/providers/theme-provider.tsx`   | next-themes provider          |
| `src/providers/session-provider.tsx` | Auth session context          |
| `src/providers/toast-provider.tsx`   | Sonner toast provider         |

### Task 1.9 — Setup Internationalization (next-intl)

1. Create `src/i18n/routing.ts` — Define locales (`id`, `en`) with `id` as default
2. Create `src/i18n/request.ts` — Request config for loading messages
3. Create `src/middleware.ts` — Combine auth + i18n middleware
4. Update `next.config.ts` — Wrap with `createNextIntlPlugin`
5. Create initial message files in `src/messages/id/` and `src/messages/en/`
6. Restructure `src/app/` to use `[locale]` dynamic segment

### Task 1.10 — Install shadcn/ui Components

```bash
npx shadcn@latest add button input card dialog table form select dropdown-menu avatar badge skeleton sheet tabs toast separator label textarea switch checkbox popover command scroll-area alert tooltip
```

---

## Phase 2: Authentication & RBAC

### Task 2.1 — Supabase Auth Setup

1. Configure Supabase project (Auth settings, Google OAuth provider)
2. Create `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`
3. Create auth callback API route: `src/app/api/auth/callback/route.ts`

### Task 2.2 — Auth Pages

1. Create login page: `src/app/[locale]/(auth)/login/page.tsx`
2. Create register page: `src/app/[locale]/(auth)/register/page.tsx`
3. Create forgot password page: `src/app/[locale]/(auth)/forgot-password/page.tsx`
4. Create auth components:
   - `src/components/auth/login-form.tsx`
   - `src/components/auth/register-form.tsx`
   - `src/components/auth/oauth-buttons.tsx`
5. Create auth schemas: `src/schemas/auth.schema.ts`
6. Create auth translations in `src/messages/[lang]/auth.json`

### Task 2.3 — Middleware (Auth + i18n + RBAC)

Update `src/middleware.ts`:

1. Refresh Supabase session
2. Handle i18n locale routing
3. Protect dashboard routes (redirect to login if unauthenticated)
4. Redirect authenticated users away from auth pages
5. Check RBAC permissions for protected routes

### Task 2.4 — Profile & Role Management

1. Create profile auto-creation trigger (Supabase function or on-login logic)
2. Create `src/utils/role-permissions.ts` with permission definitions
3. Create `src/hooks/use-auth.ts` hook

---

## Phase 3: Dashboard Layout & Navigation

### Task 3.1 — Dashboard Layout

1. Create `src/app/[locale]/(dashboard)/layout.tsx`
2. Create `src/components/shared/app-sidebar.tsx` — Navigation sidebar with role-based menu items
3. Create `src/components/shared/app-header.tsx` — Header with search, theme toggle, language switcher, user avatar
4. Create `src/components/shared/theme-toggle.tsx`
5. Create `src/components/shared/language-switcher.tsx`

### Task 3.2 — Dashboard Home Page

1. Create `src/app/[locale]/(dashboard)/dashboard/page.tsx`
2. Create dashboard components:
   - `src/components/dashboard/kpi-cards.tsx` — Revenue, Orders, Products, Low Stock
   - `src/components/dashboard/revenue-chart.tsx` — Line chart (Recharts)
   - `src/components/dashboard/top-products-chart.tsx` — Bar chart
   - `src/components/dashboard/recent-orders.tsx` — Latest orders table
   - `src/components/dashboard/low-stock-alert.tsx` — Warning list

### Task 3.3 — Shared Components

Create reusable components used across features:

- `src/components/shared/data-table.tsx` — Generic sortable/filterable table
- `src/components/shared/page-header.tsx` — Page title + actions bar
- `src/components/shared/confirm-dialog.tsx` — Delete confirmation
- `src/components/shared/empty-state.tsx` — No data state
- `src/components/shared/loading-spinner.tsx`
- `src/components/shared/status-badge.tsx`
- `src/components/shared/stat-card.tsx`
- `src/components/shared/image-upload.tsx`
- `src/components/shared/pagination-controls.tsx`
- `src/components/shared/search-input.tsx`

---

## Phase 4: Category & Product Management

### Task 4.1 — Category CRUD

1. **Types:** `src/types/category.types.ts`
2. **Schema:** `src/schemas/category.schema.ts`
3. **Service:** `src/services/category.service.ts`
4. **Hooks:** `src/hooks/use-categories.ts` (useQuery, useMutation)
5. **API Routes:**
   - `src/app/api/categories/route.ts` (GET, POST)
   - `src/app/api/categories/[id]/route.ts` (GET, PUT, DELETE)
6. **Components:**
   - `src/components/categories/category-list.tsx`
   - `src/components/categories/category-form.tsx`
   - `src/components/categories/category-card.tsx`
7. **Pages:**
   - `src/app/[locale]/(dashboard)/categories/page.tsx`
8. **Translations:** `src/messages/[lang]/categories.json`

### Task 4.2 — Product CRUD

1. **Types:** `src/types/product.types.ts`
2. **Schema:** `src/schemas/product.schema.ts`
3. **Service:** `src/services/product.service.ts`
4. **Hooks:** `src/hooks/use-products.ts`
5. **API Routes:**
   - `src/app/api/products/route.ts` (GET, POST)
   - `src/app/api/products/[id]/route.ts` (GET, PUT, DELETE)
6. **Components:**
   - `src/components/products/product-list.tsx`
   - `src/components/products/product-form.tsx`
   - `src/components/products/product-card.tsx`
   - `src/components/products/stock-adjustment-dialog.tsx`
7. **Pages:**
   - `src/app/[locale]/(dashboard)/products/page.tsx`
8. **Translations:** `src/messages/[lang]/products.json`

### Task 4.3 — Image Upload

1. **Service:** `src/services/upload.service.ts`
2. **API Route:** `src/app/api/upload/route.ts`
3. **Component:** `src/components/shared/image-upload.tsx`
4. Configure Supabase Storage bucket

---

## Phase 5: Order & Transaction Management

### Task 5.1 — Order CRUD

1. **Types:** `src/types/order.types.ts`
2. **Schema:** `src/schemas/order.schema.ts`
3. **Service:** `src/services/order.service.ts`
4. **Hooks:** `src/hooks/use-orders.ts`
5. **API Routes:**
   - `src/app/api/orders/route.ts`
   - `src/app/api/orders/[id]/route.ts`
6. **Components:**
   - `src/components/orders/order-list.tsx`
   - `src/components/orders/order-detail.tsx`
   - `src/components/orders/order-status-badge.tsx`
   - `src/components/orders/order-timeline.tsx`
7. **Pages:**
   - `src/app/[locale]/(dashboard)/orders/page.tsx`
   - `src/app/[locale]/(dashboard)/orders/[id]/page.tsx`
8. **Utility:** `src/utils/generate-order-id.ts`
9. **Translations:** `src/messages/[lang]/orders.json`

### Task 5.2 — Manual POS Interface

1. **Components:**
   - `src/components/pos/pos-product-grid.tsx`
   - `src/components/pos/pos-cart.tsx`
   - `src/components/pos/pos-checkout-dialog.tsx`
2. **Page:** `src/app/[locale]/(dashboard)/pos/page.tsx`

---

## Phase 6: Reports & Analytics

### Task 6.1 — Sales Reports

1. **Types:** `src/types/report.types.ts`
2. **Service:** `src/services/report.service.ts`
3. **Hooks:** `src/hooks/use-reports.ts`
4. **API Routes:**
   - `src/app/api/reports/revenue/route.ts`
   - `src/app/api/reports/products/route.ts`
   - `src/app/api/reports/summary/route.ts`
5. **Components:**
   - `src/components/reports/report-filters.tsx`
   - `src/components/reports/revenue-report.tsx`
   - `src/components/reports/product-report.tsx`
   - `src/components/reports/export-button.tsx`
6. **Page:** `src/app/[locale]/(dashboard)/reports/page.tsx`
7. **Translations:** `src/messages/[lang]/reports.json`

---

## Phase 7: WhatsApp Bot Integration

### Task 7.1 — WhatsApp Management UI

1. **Types:** `src/types/whatsapp.types.ts`
2. **Service:** `src/services/whatsapp.service.ts`
3. **Hooks:** `src/hooks/use-whatsapp.ts`
4. **Context:** `src/contexts/whatsapp-context.tsx`
5. **API Routes:**
   - `src/app/api/whatsapp/status/route.ts`
   - `src/app/api/whatsapp/connect/route.ts`
   - `src/app/api/whatsapp/disconnect/route.ts`
   - `src/app/api/whatsapp/webhook/route.ts`
6. **Components:**
   - `src/components/whatsapp/qr-code-display.tsx`
   - `src/components/whatsapp/connection-status.tsx`
   - `src/components/whatsapp/message-log.tsx`
7. **Page:** `src/app/[locale]/(dashboard)/whatsapp/page.tsx`
8. **Translations:** `src/messages/[lang]/whatsapp.json`

### Task 7.2 — WhatsApp Bot Service (wa-service/)

1. Initialize Node.js project in `wa-service/`
2. Create bot client with whatsapp-web.js
3. Implement command handlers:
   - `/menu` — Fetch products from NexPOS API, format as menu
   - `/order` — Interactive order flow
   - `/cart` — Show current cart
   - `/checkout` — Finalize order
   - `/status` — Check order status
   - `/help` — Show command list
   - `/cancel` — Cancel pending order
4. Implement receipt formatter
5. Implement rate limiter
6. Create webhook endpoint to communicate with NexPOS API

---

## Phase 8: AI Integration

### Task 8.1 — Gemini AI Integration

1. **Types:** `src/types/ai.types.ts`
2. **Service:** `src/services/ai.service.ts`
3. **Hooks:** `src/hooks/use-ai-chat.ts`
4. **API Routes:**
   - `src/app/api/ai/chat/route.ts` (streaming)
   - `src/app/api/ai/analyze/route.ts`
5. **Components:**
   - `src/components/ai/ai-chat.tsx`
   - `src/components/ai/ai-message.tsx`
   - `src/components/ai/ai-suggested-prompts.tsx`
   - `src/components/ai/ai-summary-card.tsx`
6. **Page:** `src/app/[locale]/(dashboard)/ai-assistant/page.tsx`
7. **Translations:** `src/messages/[lang]/ai.json`
8. **Lib:** `src/lib/gemini.ts` — Gemini client initialization

---

## Phase 9: Settings & Admin

### Task 9.1 — Settings Pages

1. **Schema:** `src/schemas/settings.schema.ts`
2. **Service:** `src/services/user.service.ts`
3. **Components:**
   - `src/components/settings/store-settings-form.tsx`
   - `src/components/settings/profile-form.tsx`
   - `src/components/settings/team-management.tsx`
4. **Pages:**
   - `src/app/[locale]/(dashboard)/settings/page.tsx`
   - `src/app/[locale]/(dashboard)/settings/store/page.tsx`
   - `src/app/[locale]/(dashboard)/settings/team/page.tsx`
   - `src/app/[locale]/(dashboard)/settings/profile/page.tsx`
5. **Translations:** `src/messages/[lang]/settings.json`

### Task 9.2 — User Management (Superadmin)

1. **API Routes:** `src/app/api/users/route.ts`, `[id]/route.ts`
2. **Page:** `src/app/[locale]/(dashboard)/users/page.tsx`

---

## Phase 10: Testing & Polish

### Task 10.1 — Write Tests

Follow `docs/TESTING.md`:

1. Unit tests for all utility functions
2. Schema validation tests
3. API route integration tests
4. Component tests for critical forms
5. E2E tests for auth, products, orders

### Task 10.2 — Performance Optimization

1. Add `loading.tsx` for each route segment
2. Add `error.tsx` for error boundaries
3. Implement skeleton loading states
4. Lazy-load heavy components (charts, AI chat)
5. Optimize images (next/image, WebP)

### Task 10.3 — Final Polish

1. Cross-browser testing
2. Mobile responsive testing
3. Dark mode testing on all pages
4. Language switcher testing
5. Accessibility audit
6. SEO meta tags
7. 404 and error pages

---

## Code Generation Rules Reminder

When generating code, **ALWAYS** follow these rules:

1. **Translations:** NEVER hardcode UI text. Use `useTranslations()` from `next-intl`
2. **Types:** NEVER use `any`. Always define explicit types
3. **Fetch:** NEVER use `useEffect` for data fetching. Use TanStack React Query
4. **Colors:** NEVER hardcode hex values. Use CSS variables (`bg-primary`, etc.)
5. **Forms:** ALWAYS use react-hook-form + Zod validation
6. **Toast:** ALWAYS show toast on mutation success/failure with translated text
7. **API:** ALWAYS return `{ success, data, message }` format
8. **Auth:** ALWAYS validate session + role in API routes
9. **Files:** Place files in correct directories per AGENTS.md
10. **Naming:** kebab-case for files, camelCase for variables, PascalCase for types
