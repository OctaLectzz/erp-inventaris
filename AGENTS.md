# AGENTS.md — Inventra

> This file is the permanent system prompt for AI coding agents (Cursor, Windsurf, Copilot, Claude, Gemini, etc.). Keep all content in English for maximum accuracy.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## 1. Project Overview

- **Name**: Inventra
- **Description**: Mini ERP Inventory Management application for the PT. Syailendra Bumi Investama (DDistillers) take-home assessment.
- **Goal**: Simulate warehouse inventory management — catalog browsing, stock monitoring, stock IN/OUT recording, and full movement history traceability.
- **Target Users**: `admin_gudang` (Warehouse Admin) and `owner` (Business Owner).
- **Version**: v0.1.0-dev
- **Status**: Active development (Phase 0 — Documentation)

**Explicitly out of scope:** POS, checkout, sales transactions, customer orders, and cash recording.

---

## 2. Tech Stack

| Concern              | Technology                                            |
| :------------------- | :---------------------------------------------------- |
| **Language**         | TypeScript (strict mode)                              |
| **Framework**        | Next.js 16 App Router                                 |
| **Styling**          | Tailwind CSS v4                                       |
| **UI Library**       | shadcn/ui with Radix UI                               |
| **Database**         | PostgreSQL (Supabase)                                 |
| **Auth**             | Supabase Auth                                         |
| **SSR Auth**         | `@supabase/ssr`                                       |
| **i18n**             | `next-intl` (ID default, EN support)                  |
| **Theme**            | `next-themes` (light, dark, system)                   |
| **State Management** | Zustand (client-side UI state only)                   |
| **Validation**       | Zod schemas + React Hook Form + `@hookform/resolvers` |
| **Testing**          | Vitest                                                |
| **HTTP**             | Native `fetch` (no Axios)                             |
| **Package Manager**  | npm (never use yarn, pnpm, or bun)                    |
| **Deployment**       | Vercel (planned)                                      |

**Explicitly excluded:** Prisma, Axios, TanStack Query, any ORM.

---

## 3. Commands

```bash
# Development
npm run dev           # Start local dev server (Turbopack)
npm run build         # Build for production
npm run start         # Start production build
npm run lint          # Run ESLint

# Testing (planned — not yet configured)
# npm run test        # Run Vitest
# npm run test:watch  # Run Vitest in watch mode

# Database (planned — Supabase CLI)
# npx supabase db push
# npx supabase migration up
```

> NEVER use `yarn`, `pnpm`, or `bun`. NEVER run `npm audit fix --force`.

---

## 4. Project Structure

Architecture: Layered (Presentation → Application → Service → Data Access)

```
inventra/
├── AGENTS.md                 # This file — central agent instructions and index
├── docs/                     # Project documentation & references
│   ├── README.md             # Project overview and setup
│   ├── PRD.md                # Product requirements document
│   ├── ARCHITECTURE.md       # System architecture documentation
│   ├── DESIGN.md             # Design system and brand tokens
│   ├── SECURITY.md           # Security policies
│   ├── TESTING.md            # Test strategy
│   ├── DEPLOYMENT.md         # Deployment procedures
│   ├── TASK_INSTRUCTION.md   # Phased implementation roadmap
│   ├── DATABASE.md           # Database schema documentation
│   ├── API.md                # API contracts documentation
│   ├── CONTRIBUTING.md       # Contribution guidelines
│   ├── CHANGELOG.md          # Development changelog
│   ├── examples/             # Reference architecture & test brief
│   └── reports/              # Phase completion reports
├── src/
│   ├── app/                  # Next.js App Router (pages, layouts, routes)
│   │   ├── globals.css       # Tailwind v4 + shadcn CSS variables
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (ONLY here)
│   │   └── shared/           # Reusable cross-feature components
│   ├── features/             # Feature-specific components (planned)
│   ├── lib/                  # Library initialization (supabase clients, utils)
│   ├── schemas/              # Zod validation schemas (shared across layers)
│   ├── services/             # Business logic and data access
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # Zustand stores
│   ├── types/                # Global TypeScript types and interfaces
│   ├── messages/             # i18n dictionary files
│   │   ├── id/               # Indonesian translations
│   │   └── en/               # English translations
│   └── middleware.ts         # Auth + i18n middleware
├── supabase/
│   └── migrations/           # SQL migration files
├── public/                   # Static assets
├── .agents/                  # Workspace agent skills root
├── .claude/                  # Claude agent skills configuration
├── .hermes/                  # Hermes agent skills configuration
├── .vscode/                  # VS Code workspace settings
├── skills/                   # Local skills directory
├── skills-lock.json          # Skills manifest and lockfile
├── components.json           # shadcn/ui configuration
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js configuration
├── eslint.config.mjs         # ESLint configuration
└── .prettierrc               # Prettier configuration
```

**File Placement Rules:**

- Project documentation MUST reside in `docs/` (except root `AGENTS.md`).
- shadcn/ui components MUST be in `src/components/ui/`.
- Zod schemas MUST be in `src/schemas/` — never inside components or route handlers.
- Business logic MUST be in `src/services/`.
- TypeScript types MUST be in `src/types/`.
- Custom hooks MUST be in `src/hooks/`.
- Zustand stores MUST be in `src/stores/`.
- NEVER create a new root folder without user confirmation.

---

## 5. Documentation Index

The project documentation resides in the `docs/` directory. All agents must consult the corresponding document for in-depth requirements and specifications:

| Document                                 | Purpose & Scope                                                                                                          |
| :--------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| [Project README](docs/README.md)         | High-level system overview, prerequisites, setup instructions, architecture summary, and assessment scope                |
| [Product Requirements](docs/PRD.md)      | Target personas (`admin_gudang`, `owner`), core inventory features, out-of-scope boundaries, and JTBD value propositions |
| [Architecture](docs/ARCHITECTURE.md)     | Layered architecture, Server Components/Actions, state hierarchy, i18n, theming, and data flow diagrams                  |
| [Design System](docs/DESIGN.md)          | Brand tokens (Deep Navy, Electric Teal, Warm Surface), typography, responsive layout, and accessible UI patterns         |
| [Security](docs/SECURITY.md)             | Supabase Auth, Row-Level Security (RLS) policies, RBAC, input validation boundaries, and audit logging limitations       |
| [Testing](docs/TESTING.md)               | Vitest configuration, unit/integration test specifications, edge-case test matrix, and honesty policy                    |
| [Deployment](docs/DEPLOYMENT.md)         | Local development setup, environment variables, production build verification, and Vercel deployment procedures          |
| [Task Roadmap](docs/TASK_INSTRUCTION.md) | Phased implementation roadmap (Phases 0–10) with prerequisites, tasks, acceptance criteria, and stop conditions          |
| [Database](docs/DATABASE.md)             | PostgreSQL schema (`profiles`, `products`, `stock_movements`), indexes, RLS policies, and atomic mutation RPC function   |
| [API Contracts](docs/API.md)             | Server Action interfaces, input schemas, return envelopes (`{ success, data, error }`), and atomicity guarantees         |
| [Contributing](docs/CONTRIBUTING.md)     | Contribution standards, code style, naming conventions, Prettier formatting, testing, and Git workflow                   |
| [Changelog](docs/CHANGELOG.md)           | Chronological log of changes, versions, and assessment milestones                                                        |

---

## 6. Execution Workflow

All AI agents must strictly follow this sequential execution protocol for every development task:

1. **Read root `AGENTS.md`**: Understand overarching project constraints, conventions, and rules.
2. **Read `docs/TASK_INSTRUCTION.md`**: Check the current phase, tasks, prerequisites, and acceptance criteria.
3. **Read relevant documentation under `docs/`**: Review detailed architecture, design, database, or API docs before writing code.
4. **Inspect existing source and configuration**: Verify `git status`, `git diff`, and current project state before making any modifications.
5. **Implement only the approved phase**: Execute strictly the work authorized by the user for that specific phase.
6. **Run appropriate checks**: Verify functionality, run linter (`npm run lint`), build (`npm run build`), or tests (`npm run test`), and report actual outputs.
7. **Inspect Git diff and summarize changes**: Verify that only intended files were modified and no secrets or junk files were created.
8. **Stop and wait for approval**: Present results and await explicit user approval before moving to the next phase. Never proceed autonomously across phase boundaries.

---

## 7. Implementation Phase Status

The following represents the verified implementation status against the project roadmap in [docs/TASK_INSTRUCTION.md](docs/TASK_INSTRUCTION.md):

| Phase        | Description                            | Status       | Verification & Evidence                                                                                                                                                                                                                                                                                                               |
| :----------- | :------------------------------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Phase 0**  | Documentation & Standards              | ✅ Completed | All 12 project documents created and organized under `docs/`; root `AGENTS.md` active as project hub. Verified via report at `docs/reports/Phase 0 - Documentation and Engineering Standards/phase0_completion_report.md`.                                                                                                            |
| **Phase 1**  | Foundation (Tokens, Layout)            | ✅ Completed | Brand tokens (#0F2D4A, #14B8A6, #E6F4F2, #1F2937) mapped in `globals.css`, Inter font set in `layout.tsx`, shadcn Card added, foundation landing preview in `page.tsx`. Verified via `tsc`, `lint`, and `build`.                                                                                                                      |
| **Phase 2**  | Internationalization (`next-intl`)     | ✅ Completed | Bilingual dictionary architecture (ID/EN) across 7 namespaces, canonical Next.js 16 proxy at `src/proxy.ts`, dynamic segment at `src/app/[locale]/`, 30 Vitest tests passed. Verified via report at `docs/reports/Phase 2 - Internationalization and Theme/phase2_completion_report.md`.                                              |
| **Phase 3**  | Theme Provider (`next-themes`)         | ✅ Completed | `next-themes` integrated with `attribute="class"`, default light theme enforced, dark mode persistence in `localStorage` verified, OKLCH high-contrast tokens, mobile `touch-manipulation`. Verified via report at `docs/reports/Phase 3 - Theme Provider and Dark Mode Polish/phase3_completion_report.md`.                          |
| **Phase 4**  | Supabase Integration & RLS             | ✅ Completed | Schema migrations (001, 002, 003) applied to live Supabase (`vwzlvsggpuvmkubkzfzp`); SSR and admin client factories implemented; 30 DummyJSON products synced with stock protection; demo accounts provisioned; 95 Vitest tests passed. Verified via report at `docs/reports/Phase 4 - Supabase Integration/phase4_batch2_report.md`. |
| **Phase 5**  | Auth & Role-Based Route Protection     | ✅ Completed | Server Actions & Supabase SSR cookie auth implemented; multi-layer protection in `proxy.ts` and layout boundary; authoritative RBAC from `public.profiles`; login & demo evaluator chips; 124 Vitest tests passed. Verified via report at `docs/reports/Phase 5 - Authentication and RBAC/phase5_completion_report.md`.               |
| **Phase 7**  | Dashboard & Inventory Catalog          | ✅ Completed | Live Supabase dashboard metrics via pure domain `calculateInventorySummary`; Low Stock Watchlist card; responsive catalog table with search, category & stock filters; modal add/edit product forms with strict stock immutability; authoritative RBAC (`admin_gudang` write, `owner` read-only); 182 Vitest tests passed (157 unit / 25 live). Verified via report at `docs/reports/Phase 7 - Dashboard and Inventory Catalog/phase7_completion_report.md`. |
| **Phase 8**  | Stock IN/OUT & Movement History        | ✅ Completed | Atomic stock mutation Server Action (`recordStockMovementAction`) via PostgreSQL RPC `record_stock_movement` with pessimistic `FOR UPDATE` lock; authoritative RBAC (`admin_gudang` write, `owner` read-only); traceable movement history page with SKU/name, mutation type, and date range filters; modal dialog with live stock preview and overdraft prevention; 196 Vitest tests passed (171 unit / 25 live); Turbopack build verified. Verified via report at `docs/reports/Phase 8 - Stock Movements/phase8_completion_report.md`. |
| **Phase 9**  | QA, Final Docs & Assessment Submission | ✅ Completed | All take-home test requirements verified (100% PASS in RTM); 197 Vitest tests passed (171 unit / 26 live); pessimistic lock concurrency verified empirically on live PostgreSQL; browser E2E flows validated via subagent; 10-point security audit verified; docs/README.md & root README.md updated with evaluator demo access; code formatted with Prettier; Turbopack build clean. Verified via report at `docs/reports/Phase 9 - Final QA and Submission/phase9_final_qa_report.md`. |
| **Batch 2**  | RBAC, KPI & Multi-Item Transactions    | ✅ Completed | Consolidated RBAC to 3 roles (`administrator`, `staff_gudang`, `auditor`); centralized IDR formatters with compact notation and full precision Radix Tooltip; unclipped KPI cards (`line-clamp-2`); roadmap badges for Batch 3 & 4; atomic PostgreSQL RPC `record_batch_stock_movements` with pessimistic row locking and all-or-nothing rollback verified empirically; interactive `TransactionCartView` at `/transactions`; 266 Vitest tests passed (100% PASS); Turbopack build clean; multi-viewport browser E2E verified. Verified via report at `docs/reports/Batch 2 - RBAC and Stock Transactions/batch2_completion_report.md`. |
| **Phase 10** | Optional Enhancements (AI Integration) | ⏳ Planned   | Stretch goal; strictly optional and pending user approval.                                                                                                                                                                                                                                                                            |

---

## 8. Agent Resources and Skills

### Discovered Agent Directories

Inspection of the repository revealed the following agent and tooling directories:

| Directory  | Purpose Based on Content                                                | Key Files & Registries                                                                                                                   |
| :--------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/` | Workspace customization root for AI coding agents (Antigravity, Cursor) | Contains `skills/` with 24 specialized skill packages                                                                                    |
| `.claude/` | Claude Code agent workspace configuration                               | Contains `skills/` mirroring skill packages for Claude environments                                                                      |
| `.hermes/` | Hermes agent runtime workspace configuration                            | Contains `skills/` including extended reference guides under `supabase-postgres-best-practices/references/`                              |
| `skills/`  | Project-level skills directory                                          | Contains 23 skill packages tracked in `skills-lock.json`                                                                                 |
| `.vscode/` | VS Code workspace configuration                                         | Contains [settings.json](.vscode/settings.json) with Tailwind IntelliSense, Prettier, Headwind, class regex, and TypeScript SDK settings |

### Discovered Skill Resources

The following skills are installed and available in the workspace (located under `.agents/skills/`):

- **Browser Automation:** [.agents/skills/agent-browser/SKILL.md](.agents/skills/agent-browser/SKILL.md) — Playwright/CLI browser automation for QA and testing.
- **Agent Instructions:** [.agents/skills/agents-md/SKILL.md](.agents/skills/agents-md/SKILL.md) — Guidelines for concise, reference-backed AGENTS.md authoring.
- **AI Media Generation:** [.agents/skills/ai-image-generation/SKILL.md](.agents/skills/ai-image-generation/SKILL.md) — Image generation via inference CLI.
- **Architecture Blueprints:** [.agents/skills/architecture-blueprint-generator/SKILL.md](.agents/skills/architecture-blueprint-generator/SKILL.md) — Automated architecture analysis and documentation.
- **Code Review:** [.agents/skills/code-review/SKILL.md](.agents/skills/code-review/SKILL.md) — Parallel standards and specification code review workflow.
- **Product Requirements:** [.agents/skills/create-prd/SKILL.md](.agents/skills/create-prd/SKILL.md) — Lean PRD creation with JTBD templates.
- **Technical Documentation:** [.agents/skills/documentation-writer/SKILL.md](.agents/skills/documentation-writer/SKILL.md) — Diátaxis framework documentation writing.
- **Skill Discovery:** [.agents/skills/find-skills/SKILL.md](.agents/skills/find-skills/SKILL.md) — Agent skill discovery and installation assistant.
- **Frontend Design:** [.agents/skills/frontend-design/SKILL.md](.agents/skills/frontend-design/SKILL.md) — Aesthetic direction, typography, and distinctive visual design.
- **Markdown Authoring:** [.agents/skills/markdown-doc-writer/SKILL.md](.agents/skills/markdown-doc-writer/SKILL.md) — Structured technical markdown document authoring.
- **Next.js & TypeScript:** [.agents/skills/nextjs-react-typescript/SKILL.md](.agents/skills/nextjs-react-typescript/SKILL.md) — Next.js App Router, React 19, TypeScript conventions.
- **Next.js + shadcn:** [.agents/skills/nextjs-shadcn/SKILL.md](.agents/skills/nextjs-shadcn/SKILL.md) — Polished shadcn/ui components and layout composition.
- **Supabase Auth:** [.agents/skills/nextjs-supabase-auth/SKILL.md](.agents/skills/nextjs-supabase-auth/SKILL.md) — `@supabase/ssr` authentication and cookie management.
- **Full-Stack Stack:** [.agents/skills/nextjs-typescript-tailwindcss-supabase/SKILL.md](.agents/skills/nextjs-typescript-tailwindcss-supabase/SKILL.md) — Stack integration patterns for Next.js, Tailwind, and Supabase.
- **Performance Optimization:** [.agents/skills/optimized-nextjs-typescript/SKILL.md](.agents/skills/optimized-nextjs-typescript/SKILL.md) — Performance optimization, security, and clean architecture.
- **shadcn Tooling:** [.agents/skills/shadcn/SKILL.md](.agents/skills/shadcn/SKILL.md) — Component registry management, additions, and styling.
- **Supabase Core:** [.agents/skills/supabase/SKILL.md](.agents/skills/supabase/SKILL.md) — Supabase platform, client usage, queries, and auth.
- **Postgres Best Practices:** [.agents/skills/supabase-postgres-best-practices/SKILL.md](.agents/skills/supabase-postgres-best-practices/SKILL.md) — PostgreSQL schema design, indexing, RLS, and transactions.
- **Tailwind v4 Setup:** [.agents/skills/tailwind-v4-shadcn/SKILL.md](.agents/skills/tailwind-v4-shadcn/SKILL.md) — Tailwind CSS v4 `@theme inline` setup and CSS variable tokens.
- **Advanced Types:** [.agents/skills/typescript-advanced-types/SKILL.md](.agents/skills/typescript-advanced-types/SKILL.md) — Generics, conditional types, and utility types.
- **TypeScript Pro:** [.agents/skills/typescript-pro/SKILL.md](.agents/skills/typescript-pro/SKILL.md) — Type guards, branded types, and strict type safety.
- **UI/UX Pro Max:** [.agents/skills/ui-ux-pro-max/SKILL.md](.agents/skills/ui-ux-pro-max/SKILL.md) — Design intelligence, accessibility, responsive systems, and layout tokens.
- **Vitest Testing:** [.agents/skills/vitest/SKILL.md](.agents/skills/vitest/SKILL.md) — Vitest configuration, unit/mock testing, and test runner management.
- _(Note on Prisma)_: [.agents/skills/prisma-next-supabase/SKILL.md](.agents/skills/prisma-next-supabase/SKILL.md) exists in the skill bundle, but Prisma is **explicitly excluded** from this project by architectural decision.

### Instruction Precedence Rules

If instructions across different files or skills conflict, apply the following order of precedence:

1. **Root `AGENTS.md` (Top Priority):** Hard architectural exclusions (no Prisma, no Axios, npm only, no ORM), security boundaries, and the sequential Phase Execution Protocol override all external skill advice.
2. **Project Documentation (`docs/`):** Authoritative business requirements (`docs/PRD.md`), architectural layers (`docs/ARCHITECTURE.md`), database schema (`docs/DATABASE.md`), and API contracts (`docs/API.md`) take precedence over general skill recommendations.
3. **Domain Skills (`.agents/skills/`):** Implementation details, component patterns, and testing techniques are adopted to execute approved tasks within the boundaries set above.

---

## 9. Naming Conventions

```
# Files & Folders
- Components      : kebab-case    (e.g., stock-movement-form.tsx)
- Non-components  : kebab-case    (e.g., use-inventory.ts)
- Folders         : kebab-case    (e.g., stock-movements/)
- Pages           : page.tsx, layout.tsx, route.ts
- Schemas         : kebab-case    (e.g., product-schema.ts)
- Test files      : [name].test.ts

# In-Code
- Variables       : camelCase     (e.g., stockBefore, isLoading)
- Constants       : UPPER_SNAKE   (e.g., LOW_STOCK_THRESHOLD, MAX_QUANTITY)
- Functions       : camelCase     (e.g., getProductBySku, recordStockMovement)
- Types/Interfaces: PascalCase    (e.g., Product, StockMovement, UserRole)
- Enums           : PascalCase    (e.g., MovementType, UserRole)
- CSS Variables   : kebab-case    (e.g., --color-navy, --color-teal)

# Git Branches
- Feature         : feat/[feature-name]
- Bug fix         : fix/[bug-name]
- Docs            : docs/[topic]
```

---

## 10. Code Conventions

### General

- Apply clean code and DRY principles.
- Write all code, variables, and comments in English.
- NEVER hardcode UI text; ALWAYS use `next-intl` translation keys.
- NEVER hardcode hex/rgb color values in components; use CSS variables and Tailwind tokens.

### TypeScript

- `strict: true` is mandatory in `tsconfig.json`.
- NEVER use the `any` type.
- Always write explicit function return types.
- Use `interface` for objects, `type` for unions and intersections.

### Import Order (enforced by Prettier)

1. React, Next.js
2. Third-party libraries
3. Absolute internal imports (`@/components`, `@/lib`, etc.)
4. Relative imports
5. Types and interfaces
6. CSS and assets

### Error Handling

- Always use `try-catch` for async operations.
- Never leave caught errors unhandled — log or return an appropriate response.
- Never expose stack traces or internal error details to clients.

---

## 11. Zod and React Hook Form Standards

These rules apply across the entire codebase:

### Schema Definition

- Define reusable, typed Zod schemas in `src/schemas/`.
- Keep validation schemas **separate** from UI components and database access code.
- Infer TypeScript input types from Zod schemas with `z.infer<typeof schema>`.

### Form Integration

- Integrate Zod with React Hook Form via `@hookform/resolvers/zod`.
- Use `useForm<SchemaType>({ resolver: zodResolver(schema) })`.
- Do NOT introduce any form library other than React Hook Form.

### Validation Rules

- Validate positive integer quantities: reject zero, negative, fractional, missing, and malformed values.
- Validate stock OUT against **authoritative database stock** — never trust client-submitted quantities.
- Do NOT trust client-submitted `stock_before` or `stock_after` values.
- Do NOT rely on disabled UI controls as authorization enforcement.
- Translate user-facing validation messages through `next-intl`.

### Server-Side Validation

- Validate **all** user input on the server, even when client-side validation exists.
- Treat all client-submitted data as untrusted.
- Avoid duplicating validation logic when a shared Zod schema can be safely reused on both client and server.
- Database constraints and transaction-safe server logic remain mandatory — Zod does not replace them.

### Atomicity

- Keep stock mutation and movement history insertion atomic (database transactions).
- Invalid mutations must NOT change stock or create history records.

---

## 12. Component Rules

```
# Component Structure Order
1. Imports
2. Types / Interface definitions (Props)
3. Main component definition
4. Hooks (state, refs, form, i18n)
5. Handlers (event functions)
6. Return JSX
7. Exports

# Props Rules
- Always define props types explicitly.
- Provide default values for optional props.

# Server vs Client Components
- Default: Use Server Components.
- Use 'use client' ONLY when needing:
    - useState, useEffect, or other React hooks
    - Event listeners (onClick, onChange)
    - Browser APIs (localStorage, window)
    - React Hook Form
    - Zustand stores
```

---

## 13. Styling Rules

- Use Tailwind CSS v4 utility classes directly in JSX.
- Use `cn()` from `@/lib/utils` for conditional classes.
- NO inline styles unless the value is strictly dynamic.
- NO `!important`.
- Mobile-first responsive approach.
- Class order: layout → spacing → sizing → color → typography → state.
- Both light and dark modes must be fully supported. Use CSS variables from the design system.
- See [docs/DESIGN.md](docs/DESIGN.md) for brand tokens and color system.

---

## 14. State Management Rules

```
# State Hierarchy
1. Local state (useState): Used only within 1 component.
2. Lifted state: Passed via props to 2–3 child components.
3. Zustand stores: Shared client-side UI state (sidebar, dialogs, filters).
4. Server state: Fetched via Server Components or route handlers.

# Rules
- Use Zustand ONLY for client-side UI state that must persist across components.
- Use React Context ONLY for rarely-changing data (theme, locale).
- NEVER use Zustand for server-fetched data caching.
```

---

## 15. API & Data Fetching Rules

```
# Approach
- Server Components: For initial data loading (SEO, performance).
- Server Actions / Route Handlers: For mutations and dynamic interactions.
- Native fetch: For any HTTP requests. NEVER use Axios.

# Response Format
- All internal handlers must return:
  { success: boolean, data: T | null, error: string | null }

# Error Handling
- Catch errors, return appropriate HTTP status codes (200, 400, 401, 403, 404, 500).
- Never expose internal error details or stack traces to clients.
```

---

## 16. Git Rules

```
# Commit Message Format
feat     : [new feature description]
fix      : [bug fix description]
refactor : [code refactoring description]
style    : [styling/formatting changes]
docs     : [documentation updates]
test     : [adding/modifying tests]
chore    : [config/tooling changes]

# Rules
- NEVER commit .env, .env.local, or any secret files.
- Keep commits logical and specific.
- Do NOT automatically commit — wait for explicit user approval.
```

---

## 17. Testing

```
# Framework
- Vitest (planned — dependency installed, configuration pending)

# What to Test
- Zod validation schemas (valid and invalid inputs)
- SKU generation and uniqueness
- Quantity validation (positive integers, boundaries)
- Stock mutation calculations (IN/OUT, boundaries)
- Inventory valuation calculations
- Role permission checks
- Service-layer business logic

# What NOT to Test
- Simple presentational components with no logic
- Third-party library internals

# Rules
- NEVER write to a production database during tests.
- Do NOT invent test results or coverage percentages.
```

See [docs/TESTING.md](docs/TESTING.md) for full testing strategy and specifications.

---

## 18. Do Not

> IF USER INSTRUCTIONS ARE AMBIGUOUS, STOP AND ASK FIRST. DO NOT MAKE ASSUMPTIONS.

```
# Agent Operating Rules
- DO NOT start a phase without explicit user approval.
- DO NOT automatically proceed to the next phase after completing one.
- DO NOT install dependencies without authorization.
- DO NOT alter database schema or remote resources without explicit authorization.
- DO NOT overwrite .env.local.
- DO NOT commit secrets.
- DO NOT make claims about tests, builds, migrations, or deployment unless verified.
- DO NOT commit automatically — wait for explicit user approval.

# File Structure
- DO NOT create a new root folder without confirmation.
- DO NOT delete or move files without confirmation.
- DO NOT modify database schema without explicit instructions.

# Code
- DO NOT use the `any` type in TypeScript.
- DO NOT use inline styles for static values.
- DO NOT hardcode UI text; use next-intl translations.
- DO NOT hardcode values that should come from environment variables.
- DO NOT hardcode hex/rgb colors; use CSS variables.
- DO NOT install new packages without confirmation.
- DO NOT introduce Prisma or Axios.
- DO NOT introduce any form library other than React Hook Form.
- DO NOT run `npm audit fix --force`.

# Security
- DO NOT expose API keys or Supabase service role key to the client.
- DO NOT bypass input validation.
- DO NOT trust client-submitted stock values.
```

---

## 19. Environment Variables

```
# Setup
- Copy .env.example to .env.local for local development.
- Variables prefixed with NEXT_PUBLIC_ are safe for client-side usage.
- NEVER commit .env or .env.local files.

# Public (Client-Safe)
NEXT_PUBLIC_APP_NAME="Inventra"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# Secret (Server-Only)
SUPABASE_SERVICE_ROLE_KEY=""
```

---

## 20. Phase Execution Protocol

Before every implementation phase:

1. Read root `AGENTS.md`, `docs/TASK_INSTRUCTION.md`, and relevant documentation under `docs/`.
2. Check `git status` and `git diff` before modifying files.
3. Execute **only** the phase explicitly approved by the user.
4. Stop after completing a phase and report results.
5. Never automatically start the next phase.
6. Report changed files, assumptions, and unresolved questions.
