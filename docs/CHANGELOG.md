# CHANGELOG — Inventra

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

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
