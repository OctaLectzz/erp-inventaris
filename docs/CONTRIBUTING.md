# CONTRIBUTING — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13

---

## 1. Getting Started

### 1.1 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (bundled with Node.js) — **never use yarn, pnpm, or bun**
- **Git** 2.30+
- A **Supabase** project (for database and auth)

### 1.2 Setup

```bash
git clone <repository-url>
cd inventra
npm install
cp .env.example .env.local
# Fill in Supabase credentials in .env.local
npm run dev
```

---

## 2. Coding Conventions

### 2.1 Language

- Write all code, variables, comments, and documentation in **English**.
- UI text is never hardcoded — always use `next-intl` translation keys.

### 2.2 TypeScript

- `strict: true` is mandatory.
- **Never** use the `any` type.
- Always write explicit function return types.
- Use `interface` for object shapes, `type` for unions and intersections.
- Infer form input types from Zod schemas with `z.infer<typeof schema>`.

### 2.3 Import Order

Enforced by Prettier with `@ianvs/prettier-plugin-sort-imports`:

1. React, Next.js
2. Third-party libraries
3. Absolute internal imports (`@/components`, `@/lib`, etc.)
4. Relative imports
5. Types and interfaces
6. CSS and assets

### 2.4 Error Handling

- Always use `try-catch` for async operations.
- Never leave caught errors unhandled — log or return an appropriate response.
- Never expose stack traces or internal error details to clients.

---

## 3. Naming Conventions

| Element             | Convention         | Example                    |
| :------------------ | :----------------- | :------------------------- |
| Component files     | kebab-case         | `stock-movement-form.tsx`  |
| Non-component files | kebab-case         | `use-inventory.ts`         |
| Folders             | kebab-case         | `stock-movements/`         |
| Pages               | Next.js convention | `page.tsx`, `layout.tsx`   |
| Schema files        | kebab-case         | `product-schema.ts`        |
| Test files          | co-located         | `product-schema.test.ts`   |
| Variables           | camelCase          | `stockBefore`, `isLoading` |
| Constants           | UPPER_SNAKE        | `LOW_STOCK_THRESHOLD`      |
| Functions           | camelCase          | `getProductBySku()`        |
| Types/Interfaces    | PascalCase         | `Product`, `StockMovement` |
| Enums               | PascalCase         | `MovementType`, `UserRole` |
| CSS Variables       | kebab-case         | `--color-navy`             |

---

## 4. File Placement Rules

| File Type            | Location                  |
| :------------------- | :------------------------ |
| shadcn/ui components | `src/components/ui/`      |
| Shared components    | `src/components/shared/`  |
| Feature components   | `src/features/{feature}/` |
| Zod schemas          | `src/schemas/`            |
| Business logic       | `src/services/`           |
| TypeScript types     | `src/types/`              |
| Custom hooks         | `src/hooks/`              |
| Zustand stores       | `src/stores/`             |
| i18n messages        | `src/messages/{locale}/`  |
| SQL migrations       | `supabase/migrations/`    |

**Never** create a new root folder without prior discussion.

---

## 5. Formatting and Linting

### 5.1 Prettier

Configuration in `.prettierrc`:

- Print width: 150
- No semicolons
- Single quotes
- No trailing commas
- Import sorting via `@ianvs/prettier-plugin-sort-imports`
- Tailwind class sorting via `prettier-plugin-tailwindcss`

### 5.2 ESLint

Configuration in `eslint.config.mjs`:

- `eslint-config-next/core-web-vitals` rules
- `eslint-config-next/typescript` rules

### 5.3 Running Checks

```bash
npm run lint          # Run ESLint
npx prettier --check . # Check formatting (planned)
```

---

## 6. Styling Rules

- Use Tailwind CSS v4 utility classes directly in JSX.
- Use `cn()` from `@/lib/utils` for conditional classes.
- **No** inline styles unless the value is strictly dynamic.
- **No** `!important`.
- **No** hardcoded hex/rgb color values — use CSS variables and Tailwind tokens.
- Mobile-first responsive approach.
- Class order: layout → spacing → sizing → color → typography → state.
- Support both light and dark modes.

---

## 7. Validation Rules

- Define Zod schemas in `src/schemas/` — never inside components or route handlers.
- Integrate with React Hook Form via `@hookform/resolvers/zod`.
- Validate all user input on the server, even when client-side validation exists.
- Treat all client-submitted data as untrusted.
- Never trust client-submitted `stock_before`, `stock_after`, or role claims.
- Translate user-facing validation messages through `next-intl`.

---

## 8. Testing

- Framework: **Vitest**.
- Test business logic, Zod schemas, stock calculations, and role checks.
- Do **not** test simple presentational components or third-party library internals.
- **Never** write to a production database during tests.
- **Never** invent test results or coverage percentages.

```bash
npm run test          # Run all tests (planned)
npm run test:watch    # Watch mode (planned)
```

---

## 9. Git Conventions

### 9.1 Commit Messages

```
feat     : [new feature description]
fix      : [bug fix description]
refactor : [code refactoring description]
style    : [styling/formatting changes]
docs     : [documentation updates]
test     : [adding/modifying tests]
chore    : [config/tooling changes]
```

### 9.2 Rules

- Keep commits logical and specific — one concern per commit.
- **Never** commit `.env`, `.env.local`, or any file containing secrets.
- **Never** commit `node_modules/`.
- Review `git diff` before committing.
- Do not bundle unrelated changes into a single commit.

### 9.3 Branch Naming

```
feat/[feature-name]
fix/[bug-name]
docs/[topic]
```

---

## 10. What NOT to Do

- Do not use `any` in TypeScript.
- Do not hardcode UI text — use `next-intl`.
- Do not hardcode colors — use CSS variables.
- Do not install Prisma or Axios.
- Do not introduce any form library other than React Hook Form.
- Do not run `npm audit fix --force`.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Do not bypass input validation.
- Do not modify database schema without explicit discussion.
- Do not delete files without confirmation.
