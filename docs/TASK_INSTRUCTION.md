# TASK INSTRUCTION — Inventra

> **Purpose:** Step-by-step implementation roadmap for AI coding agents building Inventra.
> **Last Updated:** 2026-10-13
>
> **MANDATORY:** Read root `AGENTS.md` and the relevant documentation under `docs/` before every phase. Execute only the phase explicitly approved by the user. Stop after completing a phase and report results. Never automatically start the next phase.

---

## Phase 0: Documentation and Engineering Standards

### Prerequisites

- Next.js project initialized with `create-next-app`.
- Core dependencies installed (Tailwind CSS v4, shadcn/ui, Supabase clients, next-intl, next-themes, Zustand, Vitest).
- TypeScript strict mode enabled.

### Tasks

- [x] Inspect repository state, `package.json`, Git status.
- [x] Read assessment brief (`docs/examples/Take_Home_Test_FSE.pdf`).
- [x] Read reference documentation templates.
- [x] Create or update all 13 root documentation files.
- [x] Document tech stack, conventions, Zod/RHF standards.
- [x] Document business requirements without POS features.
- [x] Document brand identity tokens.
- [x] Document database schema, API contracts, security, testing.
- [x] Document phased implementation roadmap.

### Acceptance Criteria

- `AGENTS.md` exists at the repository root. All other docs exist under `docs/`: `README.md`, `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, `TASK_INSTRUCTION.md`, `DATABASE.md`, `API.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.
- Tech stack is consistent across all documents (no Prisma, no Axios).
- Zod and React Hook Form are documented consistently.
- No template placeholders remain.
- No POS features are documented.
- Commands match existing `package.json` scripts.
- No application source code or dependencies were modified.

### Verification

```bash
# Check all files exist
ls AGENTS.md docs/PRD.md docs/ARCHITECTURE.md docs/DESIGN.md docs/SECURITY.md docs/TESTING.md docs/DEPLOYMENT.md docs/TASK_INSTRUCTION.md docs/DATABASE.md docs/API.md docs/CONTRIBUTING.md docs/CHANGELOG.md docs/README.md
```

### Stop Condition

Report changed files, assumptions, and unresolved questions. Wait for explicit user approval before Phase 1.

---

## Phase 1: Foundation — Brand Tokens, Font, and Base Layout

### Prerequisites

- Phase 0 approved.
- Root `AGENTS.md`, `docs/DESIGN.md`, and `docs/ARCHITECTURE.md` reviewed.

### Tasks

- [x] Map brand colors (Navy `#0F2D4A`, Teal `#14B8A6`, Surface `#E6F4F2`, Text `#1F2937`) to shadcn CSS variables in `globals.css`.
- [x] Update both `:root` (light) and `.dark` (dark mode) palettes.
- [x] Verify Inter font is the primary `--font-sans` (already configured).
- [x] Remove default Next.js boilerplate from `page.tsx`.
- [x] Create a minimal landing page or redirect to `/login`.
- [x] Verify `npm run build` and `npm run lint` pass.

### Acceptance Criteria

- Brand colors are mapped to CSS variables in `globals.css`.
- Dark mode palette is defined.
- Default boilerplate is removed.
- `npm run build` succeeds.
- `npm run lint` passes.

### Verification

```bash
npm run lint
npm run build
```

### Stop Condition

Report changed files. Wait for approval before Phase 2.

---

## Phase 2: Internationalization (next-intl)

### Prerequisites

- Phase 1 approved.
- `docs/ARCHITECTURE.md` Section 7 (i18n) reviewed.

### Tasks

- [ ] Configure `next-intl` with middleware-based locale detection.
- [ ] Set default locale to `id` (Indonesian), support `en` (English).
- [ ] Create translation file structure: `src/messages/{id,en}/`.
- [ ] Create initial translation files: `common.json`, `auth.json`.
- [ ] Set up `getTranslations()` for Server Components.
- [ ] Set up `useTranslations()` for Client Components.
- [ ] Add locale switcher component.
- [ ] Verify translations work in both locales.

### Acceptance Criteria

- `next-intl` is configured and functional.
- Indonesian is the default locale.
- Language switching works.
- At least `common` and `auth` translations exist in both locales.
- `npm run build` succeeds.

### Verification

```bash
npm run build
npm run dev
# Manually verify locale switching in browser
```

### Stop Condition

Report changed files. Wait for approval before Phase 3.

---

## Phase 3: Global Theme Provider (next-themes)

### Prerequisites

- Phase 2 approved.
- `docs/DESIGN.md` and `docs/ARCHITECTURE.md` Section 8 (Theme) reviewed.

### Tasks

- [ ] Configure `next-themes` with `attribute="class"` for Tailwind v4 dark mode.
- [ ] Create a theme provider wrapper component.
- [ ] Add theme toggle component (light/dark/system).
- [ ] Verify dark mode CSS variables are applied correctly.
- [ ] Test both light and dark modes visually.

### Acceptance Criteria

- Theme switching between light, dark, and system works.
- No flash of incorrect theme on page load.
- CSS variables change correctly between modes.
- `npm run build` succeeds.

### Verification

```bash
npm run build
npm run dev
# Manually verify theme switching in browser
```

### Stop Condition

Report changed files. Wait for approval before Phase 4.

---

## Phase 4: Supabase Clients, SQL Schema, and RLS

### Prerequisites

- Phase 3 approved.
- `docs/DATABASE.md`, `docs/SECURITY.md`, and `docs/ARCHITECTURE.md` Section 4 (Supabase Client) reviewed.
- Supabase project created and credentials available.

### Tasks

- [ ] Create `.env.example` with all required variable names (no values).
- [ ] Create Supabase client factories in `src/lib/supabase/`:
  - `server.ts` — Server Component / Server Action client.
  - `client.ts` — Browser client.
  - `middleware.ts` — Middleware client.
- [ ] Create middleware (`src/middleware.ts`) for session refresh.
- [ ] Write SQL migration `001_initial_schema.sql`:
  - `profiles` table (linked to `auth.users`).
  - `products` table with SKU uniqueness and stock constraints.
  - `stock_movements` table with all constraints.
  - Indexes.
- [ ] Write SQL migration `002_rls_policies.sql`:
  - Enable RLS on all tables.
  - Create policies per `docs/DATABASE.md` Section 5.
- [ ] Write SQL migration `003_functions.sql`:
  - `record_stock_movement()` atomic function.
- [ ] Apply migrations to the Supabase project (with explicit user authorization).
- [ ] Verify database schema is correct.

### Acceptance Criteria

- Supabase client factories exist and are correctly typed.
- Middleware refreshes sessions.
- SQL schema matches `docs/DATABASE.md`.
- RLS is enabled on all tables.
- Atomic stock mutation function exists.
- `.env.example` is created (no secret values).
- `.env.local` is NOT committed.
- `npm run build` succeeds.

### Verification

```bash
npm run build
# Verify migrations applied in Supabase dashboard
# Verify RLS is enabled on all tables
```

### Stop Condition

Report changed files. Wait for approval before Phase 5.

---

## Phase 5: Authentication and Role-Based Route Protection

### Prerequisites

- Phase 4 approved.
- `docs/SECURITY.md` and `docs/ARCHITECTURE.md` Section 9 (Role Auth) reviewed.
- Supabase project configured with Auth.

### Tasks

- [ ] Create login page at `src/app/(auth)/login/page.tsx`.
- [ ] Create login form with React Hook Form + Zod (`loginSchema`).
- [ ] Create login Server Action using Supabase Auth `signInWithPassword`.
- [ ] Create sign-out Server Action.
- [ ] Update middleware to protect `/(dashboard)` routes.
- [ ] Add role checking in middleware or layout.
- [ ] Provision demo accounts (`admin@inventra.demo`, `owner@inventra.demo`).
- [ ] Create `profiles` entries for demo accounts with appropriate roles.
- [ ] Verify unauthenticated redirect to login.
- [ ] Verify direct URL protection.
- [ ] Verify session persistence after reload.
- [ ] Add demo account credentials display on the login page.

### Acceptance Criteria

- Login works with demo accounts.
- Logout clears the session.
- Unauthenticated users are redirected to `/login`.
- Direct URL access to protected routes is blocked.
- Session persists after page reload.
- Role is readable from the `profiles` table.
- `npm run build` succeeds.

### Verification

```bash
npm run build
npm run dev
# Test login with demo accounts
# Test direct URL access when logged out
# Test session persistence after reload
```

### Stop Condition

Report changed files. Wait for approval before Phase 6.

---

## Phase 6: Vitest and Core Unit Tests

### Prerequisites

- Phase 5 approved.
- `docs/TESTING.md` reviewed.

### Tasks

- [ ] Create `vitest.config.ts` with path aliases and environment configuration.
- [ ] Add test scripts to `package.json`: `test`, `test:watch`, `test:coverage`.
- [ ] Install Zod, React Hook Form, and `@hookform/resolvers` (if not already installed — requires explicit authorization).
- [ ] Create Zod schemas in `src/schemas/`:
  - `auth-schema.ts` — login form validation.
  - `product-schema.ts` — product validation.
  - `stock-movement-schema.ts` — stock mutation validation.
- [ ] Write Zod schema tests:
  - Valid inputs pass.
  - Invalid inputs (zero, negative, fractional, empty) are rejected.
  - Boundary values are tested.
- [ ] Write stock calculation unit tests:
  - Stock IN increases stock.
  - Stock OUT decreases stock.
  - Stock OUT > available is rejected.
  - Stock consistency invariant holds.
- [ ] Write SKU validation tests.
- [ ] Write inventory valuation tests.
- [ ] Write role permission tests.
- [ ] Run all tests and verify they pass.

### Acceptance Criteria

- Vitest is configured and runnable.
- Zod schemas exist for auth, products, and stock movements.
- All planned unit tests pass.
- `npm run test` exits cleanly.
- `npm run build` succeeds.

### Verification

```bash
npm run test
npm run build
```

### Stop Condition

Report test results (pass/fail counts). Wait for approval before Phase 7.

---

## Phase 7: Dashboard and Inventory Catalog

### Prerequisites

- Phase 6 approved.
- `docs/DESIGN.md`, `docs/PRD.md` Section 6, and `docs/ARCHITECTURE.md` reviewed.

### Tasks

- [ ] Create dashboard layout (`src/app/(dashboard)/layout.tsx`) with sidebar navigation.
- [ ] Create dashboard page with summary metrics:
  - Unique SKU count.
  - Total units.
  - Low-stock items (stock < 5).
  - Estimated inventory value (IDR).
- [ ] Create inventory catalog page (`src/app/(dashboard)/inventory/page.tsx`).
- [ ] Build product data table with columns: SKU, Name, Category, Unit, Price (IDR), Stock, Status.
- [ ] Implement "Import from DummyJSON" action.
- [ ] Implement low-stock highlighting (stock < 5).
- [ ] Implement search/filter for products.
- [ ] Implement "Reset Demo Data" action.
- [ ] Translate all UI text with `next-intl`.
- [ ] Verify both light and dark modes.
- [ ] Verify responsive layout (mobile/desktop).

### Acceptance Criteria

- Dashboard shows accurate summary metrics.
- Product catalog displays imported products.
- Low-stock items are visually highlighted.
- DummyJSON import works and persists data.
- Demo reset works and re-seeds data.
- All text uses translation keys.
- Light and dark modes work.
- `npm run build` succeeds.

### Verification

```bash
npm run build
npm run dev
# Manually verify dashboard metrics
# Import from DummyJSON
# Verify low-stock highlighting
# Test reset demo data
# Switch between light/dark/system themes
# Switch between ID/EN locales
```

### Stop Condition

Report changed files and any visual issues. Wait for approval before Phase 8.

---

## Phase 8: Stock IN/OUT, Movement History, and Filters

### Prerequisites

- Phase 7 approved.
- `docs/PRD.md` Section 6.1.C/D, `docs/API.md` Section 4, and `docs/DATABASE.md` Section 6 reviewed.

### Tasks

- [ ] Create stock movement form page or dialog.
- [ ] Build Stock IN form with React Hook Form + Zod:
  - Product selector.
  - Quantity input (positive integer validation).
  - Note/reference field (required).
- [ ] Build Stock OUT form with additional available stock display.
- [ ] Create Server Actions for stock mutations calling the `record_stock_movement` RPC.
- [ ] Verify atomic stock mutation (stock + history in one transaction).
- [ ] Verify Stock OUT rejection when quantity > available stock.
- [ ] Verify invalid inputs (0, negative, fractional) are rejected.
- [ ] Verify stock and history are unchanged on rejection.
- [ ] Create movement history page with data table.
- [ ] Implement filters: SKU search, movement type (IN/OUT/All), date range.
- [ ] Display movement details: timestamp, product/SKU, type, quantity, stock before → after, user, note.
- [ ] Implement pagination.
- [ ] Translate all text and validation messages.
- [ ] Run all existing tests.

### Acceptance Criteria

- Stock IN increases product stock and creates a movement record.
- Stock OUT decreases product stock and creates a movement record.
- Stock OUT > available stock is rejected without changes.
- Invalid quantities are rejected without changes.
- Movement history shows all required columns.
- Filters (SKU, type, date) work correctly.
- Assessment example scenarios (from PRD) all pass.
- All tests pass.
- `npm run build` succeeds.

### Verification

```bash
npm run test
npm run build
# Manually test all scenarios from PRD Section 6.5:
# - Receive 10 units (stock 4 → 14)
# - Issue 3 units (stock 14 → 11)
# - Issue 12 units from stock 11 → REJECTED
# - Quantity 0, -1, 3.5 → REJECTED
# - Reload → data persists, session intact
```

### Stop Condition

Report test results and manual verification outcomes. Wait for approval before Phase 9.

---

## Phase 9: QA, Documentation, and Assessment Submission

### Prerequisites

- Phase 8 approved.
- All mandatory features implemented and tested.

### Tasks

- [x] Run full test suite and verify all tests pass.
- [x] Run `npm run build` and verify no errors.
- [x] Run `npm run lint` and verify no errors.
- [x] Test all assessment scenarios end-to-end.
- [x] Review and update `docs/README.md` and root `README.md`:
  - Verified setup instructions.
  - Demo account credentials.
  - Test commands.
  - Architecture summary.
  - Assumptions and known limitations.
  - AI usage disclosure (how AI was used, what was reviewed, one mistake example).
- [x] Update `docs/CHANGELOG.md` with implemented features.
- [x] Review Git history for logical, staged commits.
- [x] Verify no secrets in Git history.
- [x] Verify responsive design on mobile and desktop.
- [x] Verify both locales (ID/EN).
- [x] Verify all three theme modes (light/dark/system).
- [x] Verify empty states and error states.
- [x] Complete browser QA flow verification via subagent recording.

### Acceptance Criteria

- All tests pass.
- Build succeeds.
- Lint passes.
- All assessment scenarios verified.
- README is comprehensive and accurate.
- CHANGELOG reflects actual implementation.
- Git history is clean and logical.
- No secrets exposed.
- UI is polished in both themes and locales.

### Verification

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

### Stop Condition

Report final status. The assessment is ready for submission.

---

## Phase 10: Optional Improvements (Post-Mandatory)

### Prerequisites

- Phase 9 approved.
- All mandatory features passing.
- Extra time available.

### Tasks (pick based on available time)

- [ ] AI Integration (Module F from assessment):
  - Stock condition summary using a free AI API (server-side only).
  - API key stored in environment variable, never exposed to client.
- [ ] Enhanced dashboard charts (using recharts or similar).
- [ ] Export movement history to CSV.
- [ ] Product image display from DummyJSON thumbnails.
- [ ] Advanced filtering and sorting.
- [ ] Skeleton loading states.
- [ ] Toast notification improvements.
- [ ] Accessibility audit and fixes.
- [ ] Performance optimization (if needed).

### Acceptance Criteria

- Optional features work correctly without breaking mandatory features.
- All existing tests still pass.
- Build succeeds.

### Stop Condition

Report what was added. This phase has no fixed end — improvements continue as time allows.

---

## Cross-Phase Rules

These rules apply to **every** phase:

1. Read root `AGENTS.md` before starting work.
2. Check `git status` and `git diff` before modifying files.
3. Execute only the approved phase.
4. Stop and report after completing the phase.
5. Never automatically start the next phase.
6. Never install dependencies without explicit authorization.
7. Never alter database schema without explicit authorization.
8. Never overwrite `.env.local`.
9. Never commit secrets.
10. Never use TypeScript `any`.
11. Never run `npm audit fix --force`.
12. Do not make claims about tests, builds, or deployments unless verified.
13. Do not commit automatically — wait for user approval.
