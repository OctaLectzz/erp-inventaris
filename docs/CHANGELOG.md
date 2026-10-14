# CHANGELOG — Inventra

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [v0.1.0-dev] — 2026-10-14

### Phase 9 — Final QA, Security Review & Assessment Submission (2026-10-14)

#### Added

- `docs/reports/Phase 9 - Final QA and Submission/requirements_traceability_matrix.md` — 100% PASS requirements traceability matrix across Modules A–E.
- `docs/reports/Phase 9 - Final QA and Submission/security_review.md` — 10-point security audit report covering RLS, secret isolation, and npm audit analysis.
- `docs/reports/Phase 9 - Final QA and Submission/submission_checklist.md` — Complete verification checklist for take-home assessment deliverables and 5 core scenarios.
- `docs/reports/Phase 9 - Final QA and Submission/phase9_final_qa_report.md` — Executive QA report with empirical live concurrency and browser E2E verification.
- `README.md` and updated `docs/README.md` — Submission-ready documentation with setup instructions, evaluator demo access, quality gates, and AI usage disclosure.
- Live PostgreSQL concurrency test `Scenario 10` in `tests/supabase/live-integration.test.ts` verifying pessimistic row lock (`FOR UPDATE`) serialization under parallel mutations.

#### Fixed

- Code style and Tailwind class sorting across 6 files in compliance with `.prettierrc`.
- Cleaned up isolated browser test artifacts, returning live Supabase inventory to 30 products and 0 movements.

### Phase 8 — Stock IN/OUT Server Actions & Movement History (2026-10-14)

- Implemented `recordStockMovementAction` Server Action calling atomic PostgreSQL RPC `record_stock_movement`.
- Built interactive `StockMutationDialog` with live stock preview, positive integer validation, and overdraft prevention.
- Built responsive `MovementTable` with SKU/Name search, type filter (IN/OUT/All), and ISO date range boundaries.
- Protected movement routes at `/[locale]/movements` via edge proxy and Server Component guards.

### Phase 7 — Dashboard KPIs & Inventory Catalog (2026-10-13)

- Real-time inventory KPIs via pure domain calculation `calculateInventorySummary` (SKU count, total units, low stock < 5, IDR valuation).
- Low Stock Watchlist card highlighting items requiring restocking.
- Responsive catalog data table with instant search, category filtering, and stock level filtering.
- Modal add/edit product forms with strict stock immutability enforcement.

### Phase 6 — Vitest & Core Unit Tests (2026-10-13)

- Comprehensive test suite covering SKU validation, stock boundaries, ledger domain, and inventory valuation.

### Phase 5 — Authentication & Role-Based Route Protection (2026-10-13)

- Multi-role authentication with Supabase SSR cookies.
- Server boundary authorization (`requireAuth`) and authoritative RBAC via `public.profiles`.
- One-click demo evaluator chips on login form for `admin_gudang` and `owner`.

### Phase 4 — Supabase Integration & RLS (2026-10-13)

- Applied migrations `001_initial_schema`, `002_rls_policies`, and `003_stock_mutation_rpc` to Supabase cloud.
- Seeded 30 initial products from DummyJSON with USD to IDR conversion.
- Created trigger `trg_protect_product_stock` preventing direct stock modification.

### Phase 3 — Theme Provider & Dark Mode (2026-10-13)

- Integrated `next-themes` with light, dark, and system modes.
- OKLCH high-contrast tokens in `globals.css`.

### Phase 2 — Internationalization (next-intl) (2026-10-13)

- Bilingual dictionary architecture (ID/EN) across 7 namespaces.
- Dynamic segment routing at `src/app/[locale]/` with canonical proxy middleware.

### Phase 1 — Foundation & Brand Tokens (2026-10-13)

- Deep Navy, Electric Teal, Warm Surface brand tokens mapped to Tailwind v4.

### Phase 0 — Documentation and Engineering Standards (2026-10-13)

#### Added

- `AGENTS.md` — Agent system prompt with project rules, tech stack, conventions, and Zod/RHF standards.
- `PRD.md` — Product requirements document with JTBD value propositions and assessment scoring breakdown.
- `ARCHITECTURE.md` — System architecture with layered design, Supabase client patterns, Zod/RHF integration, service boundaries, i18n, theming, role authorization, and data flow diagrams.
- `DESIGN.md` — Design system with brand identity, color tokens, typography, spacing, component patterns, page layouts, and accessibility standards.
- `SECURITY.md` — Security policies covering authentication, RBAC, RLS, input validation, environment secrets, data integrity, and traceability limitations.
- `TESTING.md` — Test strategy with Vitest configuration, test categories (schema, business logic, SKU, valuation, role, integration), and honesty policy.
- `DATABASE.md` — Database schema documentation for `profiles`, `products`, and `stock_movements` tables with constraints, indexes, RLS policies, and atomic stock mutation function.
- `API.md` — API contracts for Server Actions (auth, catalog, stock mutations, movement history, summary) with validation boundaries, error handling, and atomicity semantics.
- `DEPLOYMENT.md` — Deployment documentation for local setup, environment variables, build commands, and planned Vercel deployment.
- `TASK_INSTRUCTION.md` — Phased implementation roadmap (Phase 0–10) with prerequisites, tasks, acceptance criteria, verification commands, and stop conditions.
- `CONTRIBUTING.md` — Contribution guidelines covering coding conventions, naming, formatting, testing, and Git rules.
- `CHANGELOG.md` — This file.
- `README.md` — Project overview with setup instructions, architecture summary, and assessment context.

#### Pre-existing (from project initialization)

- Next.js 16.4.0 with App Router and Turbopack.
- React 19.3.0.
- TypeScript with `strict: true`.
- Tailwind CSS v4 with `@tailwindcss/turbopack`.
- shadcn/ui (`radix-vega` style, `mist` base color) with `button` component.
- `@supabase/supabase-js` and `@supabase/ssr` installed.
- `next-intl`, `next-themes`, `zustand` installed.
- `vitest` and `@vitejs/plugin-react` installed (dev dependencies).
- Prettier with import sorting and Tailwind class sorting.
- ESLint with Next.js core web vitals and TypeScript rules.
- Inter font configured as `--font-sans`.
