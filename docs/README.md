# Inventra

**Mini ERP Inventory Management** — Take-home assessment for PT. Syailendra Bumi Investama (DDistillers).

Inventra simulates warehouse inventory management: catalog browsing, stock monitoring, stock IN/OUT recording, and full movement history traceability.

> **Status:** Active development (Phase 0 — Documentation complete, awaiting Phase 1 approval).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Supabase Setup](#supabase-setup)
- [Testing](#testing)
- [Demo Accounts](#demo-accounts)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Assessment Scope](#assessment-scope)
- [Assumptions and Limitations](#assumptions-and-limitations)
- [AI Usage Disclosure](#ai-usage-disclosure)
- [Documentation](#documentation)

---

## Features

### Mandatory (Planned)

- **Login & Role-Based Access:** Provisioned demo accounts with `admin_gudang` and `owner` roles. Protected routes, including direct URL access. Session persistence after reload.
- **Catalog & SKU:** Product catalog seeded from DummyJSON API. Unique SKU, name, category, unit, reference price (IDR), and stock per product.
- **Stock Mutations (IN/OUT):** Record stock IN (quantity added) and OUT (quantity removed) with positive integer validation. Stock OUT cannot exceed available stock. Atomic transactions ensure data consistency.
- **Movement History & Traceability:** Complete movement log with timestamp, product/SKU, type, quantity, stock before/after, user, and note. Filterable by SKU, type, and date.
- **Inventory Summary:** Dashboard metrics — unique SKU count, total units, low-stock items (< 5), and estimated inventory value (IDR).
- **Internationalization:** Indonesian (default) and English.
- **Theming:** Light, dark, and system theme modes.
- **Unit Tests:** Vitest tests for SKU validation, quantity validation, stock boundaries, stock calculations, inventory valuation, and role permissions.

### Optional (Planned)

- **AI Integration:** AI-powered stock condition summary (server-side only).

### Explicitly Out of Scope

POS, checkout, sales transactions, customer orders, and cash recording.

---

## Tech Stack

| Concern | Technology |
| :--- | :--- |
| Language | TypeScript (strict mode) |
| Framework | Next.js 16 App Router |
| Styling | Tailwind CSS v4 |
| UI Library | shadcn/ui with Radix UI |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| SSR Auth | `@supabase/ssr` |
| i18n | `next-intl` (ID default, EN support) |
| Theme | `next-themes` (light, dark, system) |
| State | Zustand (client-side UI state) |
| Validation | Zod + React Hook Form + `@hookform/resolvers` |
| Testing | Vitest |
| HTTP | Native `fetch` |
| Package Manager | npm |
| Deployment | Vercel (planned) |

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (bundled with Node.js)
- **Git** 2.30+
- A **Supabase** project (free tier is sufficient)

> **Important:** Never use `yarn`, `pnpm`, or `bun`.

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd inventra

# Install dependencies
npm install
```

---

## Environment Variables

```bash
# Copy the example file
cp .env.example .env.local
```

Fill in your Supabase project credentials in `.env.local`:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Application name (default: `Inventra`) |
| `NEXT_PUBLIC_APP_URL` | Application URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (server-only) |

> **Never** commit `.env.local` or any file containing secret values.

---

## Development

```bash
# Start the development server (Turbopack)
npm run dev

# Build for production
npm run build

# Start production build
npm run start

# Run ESLint
npm run lint
```

The development server runs at [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup

### Option A: Supabase Cloud (Recommended)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL and keys to `.env.local`.
3. Apply SQL migrations from `supabase/migrations/` via the Supabase SQL Editor or CLI.

### Option B: Supabase Local

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db push
```

### Database Migrations

Migrations are located in `supabase/migrations/` and should be applied in order:

1. `001_initial_schema.sql` — Tables, indexes, constraints.
2. `002_rls_policies.sql` — Row-level security policies.
3. `003_functions.sql` — Database functions (atomic stock mutations).

> **Note:** Migrations are planned but not yet created. They will be implemented in Phase 4.

---

## Testing

```bash
# Run all tests (planned — not yet configured)
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

> **Note:** Vitest is installed (`^3.2.7`) but test configuration and scripts are pending (Phase 6).

---

## Demo Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| Warehouse Admin | `admin@inventra.demo` | *(set during provisioning)* | Full CRUD, stock mutations |
| Business Owner | `owner@inventra.demo` | *(set during provisioning)* | Full read, stock mutations, metrics |

> Demo accounts will be provisioned in Phase 5. Passwords will be documented here after creation.

---

## Architecture

Inventra uses a **layered architecture** built on Next.js App Router:

```
Presentation  →  Application  →  Service  →  Data Access
(React/shadcn)   (Server Actions,  (Business   (Supabase
                  Zod, Auth)        Logic)      PostgreSQL)
```

Key architectural decisions:

- **Server-first:** Default to Server Components. Client components only when React hooks or browser APIs are needed.
- **Shared validation:** Zod schemas in `src/schemas/` used by both React Hook Form (client UX) and Server Actions (authoritative validation).
- **Atomic mutations:** Stock updates and movement history insertion happen in a single database transaction via a PostgreSQL function.
- **No client trust:** Stock values, role checks, and authorization are always computed server-side.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

---

## Project Structure

```
inventra/
├── src/
│   ├── app/            # Next.js App Router (pages, layouts)
│   ├── components/
│   │   ├── ui/         # shadcn/ui components
│   │   └── shared/     # Reusable components
│   ├── features/       # Feature-specific components
│   ├── schemas/        # Zod validation schemas
│   ├── services/       # Business logic
│   ├── lib/            # Library initialization (Supabase, utils)
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # Zustand stores
│   ├── types/          # TypeScript types
│   ├── messages/       # i18n translation files
│   └── middleware.ts   # Auth + i18n middleware
├── supabase/
│   └── migrations/     # SQL migration files
└── public/             # Static assets
```

---

## Assessment Scope

This application fulfills the **Mini ERP Inventaris** take-home test requirements:

| Module | Status |
| :--- | :--- |
| A. Login & Role | Planned (Phase 5) |
| B. Catalog & SKU | Planned (Phase 7) |
| C. Stock Mutations (IN/OUT) | Planned (Phase 8) |
| D. Movement History & Traceability | Planned (Phase 8) |
| E. Inventory Summary | Planned (Phase 7) |
| F. AI Integration (Optional) | Planned (Phase 10) |

**Assessment scoring:**

| Aspect | Weight |
| :--- | :--- |
| Business logic (SKU, stock, mutations, history) | 40% |
| Architecture, state, code quality, tests | 30% |
| UI/UX and summary | 15% |
| Security and data handling | 10% |
| Documentation and Git history | 5% |

---

## Assumptions and Limitations

### Assumptions

- DummyJSON API (`https://dummyjson.com/products`) is available and stable for initial data import.
- IDR conversion rate for DummyJSON USD prices is fixed at a documented rate in the codebase.
- Demo accounts are provisioned via seed scripts, not public registration.
- Both roles (`admin_gudang` and `owner`) can perform stock mutations.
- Low stock threshold is strictly below 5 units.

### Known Limitations

- **Traceability** is browsable movement history, not a tamper-proof audit trail (as specified in the assessment brief).
- No real-time updates (could be added with Supabase Realtime in a future phase).
- No file upload or product image management (DummyJSON thumbnails are used).
- No automated E2E tests (unit tests only).
- Migration files are not yet created (planned for Phase 4).
- Test configuration is not yet set up (planned for Phase 6).

---

## AI Usage Disclosure

> **Required by assessment:** Document how AI was used, what was reviewed, and one example of an AI mistake and its correction.

### How AI Was Used

- AI coding assistants were used for documentation generation, code scaffolding, and architectural planning.
- All AI-generated output was reviewed, edited, and verified by the developer.
- AI was not used as a substitute for understanding — all architectural decisions and business logic were understood before acceptance.

### What Was Reviewed

- Every generated document was read in full and cross-referenced against the assessment brief.
- Code patterns were verified against official documentation (Next.js, Supabase, shadcn/ui).
- Business logic rules were validated against the assessment scenarios.

### AI Mistake Example

*(To be documented during implementation phases — a concrete example will be added when one occurs.)*

---

## Documentation

| Document | Description |
| :--- | :--- |
| [AGENTS.md](../AGENTS.md) | Agent system prompt — project rules and conventions |
| [PRD.md](./PRD.md) | Product requirements document |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design decisions |
| [DESIGN.md](./DESIGN.md) | Design system and brand tokens |
| [SECURITY.md](./SECURITY.md) | Security policies |
| [TESTING.md](./TESTING.md) | Test strategy |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment procedures |
| [TASK_INSTRUCTION.md](./TASK_INSTRUCTION.md) | Phased implementation roadmap |
| [DATABASE.md](./DATABASE.md) | Database schema documentation |
| [API.md](./API.md) | API contracts |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](./CHANGELOG.md) | Development changelog |

---

## License

This project is a take-home assessment submission and is not licensed for public use.
