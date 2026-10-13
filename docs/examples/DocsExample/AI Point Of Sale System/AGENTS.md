# AGENTS.md — NexPOS

---

## 1. Project Overview

- **Name** : NexPOS (Omnichannel AI-Powered POS System)
- **Description** : A modern SaaS Point of Sale system integrating a web-based management dashboard with an automated WhatsApp ordering bot. It features Gemini AI for smart business analytics and sales reporting.
- **Goal** : To streamline retail operations by allowing customers to buy directly via WhatsApp and providing business owners with AI-driven insights and real-time inventory management.
- **Target Users**: Business owners, Admins, Operators, and Customers (via WhatsApp).
- **Version** : v1.0.0-dev
- **Status** : Active development

---

## 2. Tech Stack

- **Language** : TypeScript (Strict Mode)
- **Framework** : Next.js (App Router)
- **Styling** : Tailwind CSS
- **UI Library** : shadcn/ui
- **Database** : PostgreSQL (hosted on Supabase)
- **ORM** : Prisma
- **Auth** : Supabase Auth integration
- **Storage** : Supabase Storage
- **State Management**: TanStack React Query (Client State), Local State (useState)
- **i18n** : next-intl (ID/EN, default ID)
- **AI Engine** : Google Gemini API
- **WA Bot** : whatsapp-web.js (or equivalent)
- **Package Manager** : npm
- **Deployment** : Vercel (Web) / VPS (WhatsApp Service)

---

## 3. Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production build
npm run lint         # Run ESLint
npm run format       # Format code using Prettier

# Package Management
npm install [package] # Install new package (NEVER use yarn, pnpm, or bun)

# Database (Prisma)
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Sync schema with Supabase DB
npx prisma migrate dev # Run migrations
npx prisma studio    # Open Prisma GUI
```

> [pm] = package manager yang kamu pakai: npm / yarn / pnpm / bun
> Jika ada package manager yang TIDAK boleh dipakai, tulis juga di sini.
> Contoh: Never use npm — always use bun.

---

## 4. Project Structure

Architecture: clean architecture

```
[root]/
  src/
    app/           # Next.js App Router pages and API routes
    components/
      ui/          # shadcn/ui components (strictly here)
      shared/      # Reusable components across features
      [feature]/   # Feature-specific components (e.g., dashboard, POS)
    layouts/
    lib/           # REQUIRED for external library initialization
    types/         # Global TypeScript types and interfaces
    utils/         # Helper functions and utilities
    contexts/      # React Contexts
    providers/     # Global providers (QueryClient, Theme, i18n, Session)
    schemas/       # Zod validation schemas
    hooks/         # Custom React hooks
    services/      # External API calls, Gemini AI logic, WA Bot handlers
    messages/      # i18n dictionary files
      id/          # id dictionary (e.g., common, auth, dashboard, etc)
      en/          # en dictionary (e.g., common, auth, dashboard, etc)
    proxy.ts  # Next.js middleware (must be in src/ root to handle auth & i18n)
```

File placement rules:

- New UI components from shadcn are always in /src/components/ui
- TypeScript types are always in /src/types
- Helpers and utilities are always in /src/utils
- Contexts are always in /src/contexts/
- Providers are always in /src/providers/
- Schemas are always in /src/schemas
- Hooks are always in /src/hooks
- Do not create new folders without prior confirmation

---

## 5. Naming Conventions

```
# Files & Folders
- Components    : kebab-case    (e.g., user-card.tsx)
- Non-components: kebab-case    (e.g., use-auth.ts, format-currency.ts)
- Folders       : kebab-case    (e.g., user-profile/)
- Pages         : page.tsx, layout.tsx, route.ts
- Test files    : [name].test.ts

# In-Code
- Variables     : camelCase     (e.g., userData, isLoading)
- Constants     : UPPER_SNAKE   (e.g., MAX_RETRY, BASE_URL)
- Functions     : camelCase     (e.g., getUserById, processOrder)
- Types/Interfaces: PascalCase  (e.g., UserType, ApiResponse)
- Enums         : PascalCase    (e.g., UserRole, OrderStatus)
- CSS Classes   : kebab-case    (e.g., user-card, nav-item)

# Git Branches
- Feature       : feat/[feature-name]
- Bug fix       : fix/[bug-name]
- Hotfix        : hotfix/[name]
- Refactor      : refactor/[name]
```

---

## 6. Code Conventions

```
# General Approach
- Apply clean code and DRY principles.
- Avoid duplication; extract to functions/components if used > 1 time.
- Write readable, maintainable English code (all variables/logic in English).
- NEVER hardcode UI text; ALWAYS use `next-intl` translations.

# TypeScript
- Use `strict: true` in tsconfig.
- NEVER use the 'any' type.
- Always explicitly write function return types.
- Use `interface` for objects, `type` for unions/intersections.

# Import Order
1. External libraries (React, Next.js, etc.)
2. Absolute internals (@/components, @/utils)
3. Relative internals (./Component, ../utils)
4. Types and Interfaces
5. Assets and styles

# Export Pattern
- Use named exports for components and functions.
- Use default exports ONLY for `page.tsx` and `layout.tsx`.

# Error Handling
- Always use try-catch block for async functions.
- Do not leave caught errors unhandled.
- Write informative error messages and log them properly.

# UI Text & Translations
- NEVER hardcode UI strings (buttons, labels, messages, titles, toast, etc.).
- ALWAYS use `next-intl` translation helpers:
    - `t('common.submit')`
    - `t('auth.login')`
    - `t('dashboard.title')`
- Each UI text must have a translation key in `messages/[lang]/...`
- All variable names, function names, and logic must be in English.
```

---

## 7. Component Rules

```
# Component Structure Order
1. Imports (External first, internal absolute, relative, then types)
2. Types / Interfaces (Component Props definitions)
3. Component Definition (Main functional component)
4. Hooks (React Query, next-intl, useState, etc.)
5. Handlers & Local Functions (Event handlers, derived state calculations)
6. Return JSX (The UI rendering block)
7. Export (If not using inline named exports)

# Props Rules
- Always explicitly type component props.
- Provide default values for optional props.

# Server vs Client Components
- Default: Use Server Components.
- Use 'use client' ONLY IF needing:
    - useState / useEffect / other hooks
    - Event listeners (onClick, onChange)
    - Browser APIs (localStorage, window)
    - Libraries lacking SSR support

# Component Sizing
- Separate into its own file if used in multiple places.
- Can be combined in one file if strictly used only by one parent component.
```

---

## 8. Styling Rules

```
# Styling Approach
- Use Tailwind CSS.
- NO inline styles unless the value is strictly dynamic (e.g., calculated width).
- NO `!important`.

# Tailwind CSS
- Use utility classes directly in JSX.
- Use `clsx` or `cn()` (from shadcn utils) for conditional classes.
- Extract to components if identical classes are reused.
- Class order: layout > spacing > sizing > color > typography > state.

# Responsive Design
- Mobile-first approach.
- Breakpoints: sm (640px) / md (768px) / lg (1024px) / xl (1280px).

# Dark Mode & Design Tokens
- Default mode is Light, but the app MUST fully support Dark Mode.
- Use `dark:` prefix or CSS variables.
- Always test UI in both Light and Dark modes.
- Use predefined CSS variables for colors (Primary, Secondary, Background). Do not hardcode hex codes in components.
```

---

## 9. API & Data Fetching Rules

```
# Server vs Client Fetching
- Server fetch : Initial page load data (SEO/performance).
- Client fetch : Highly interactive data or data that changes post-load.
- NEVER use `useEffect` for data fetching. ALWAYS use TanStack React Query.

# API Response Format
- ALL internal API routes must return consistently:
  `{ success: boolean, data: T | null, message: string }`

# API Error Handling
- Catch errors, return appropriate HTTP status codes (200, 400, 401, 404, 500).
- Do NOT expose sensitive error details or stack traces to the client.

# Fetch Functions Location
- Keep all fetch functions/axios calls in `src/services/`.
- Don’t write the fetch function directly inside the component.

# Environment
- Use `.env` variables for ALL URLs and API keys.
- Never hardcode URLs or secrets.
```

---

## 10. State Management Rules

```
# State Hierarchy
1. Local state (useState): Used only within 1 component.
2. Lifted state: Passed down to 2-3 closely related components.
3. Global state: Used across the app (Auth, Theme, Locale).

# Context usage
- Use Context ONLY for infrequently changing data (theme, locale, session).
- Avoid Context for rapidly changing states.
```

---

## 11. Performance Rules

```
# Code Splitting
- Use dynamic imports for large components that aren’t immediately visible
- Lazy-load pages and components that are rarely accessed

# Image Optimization
- Always use the Next.js Image component (next/image)
- Specify the width and height for each image
- Use the WebP or AVIF format for new images
- Do not use standard HTML `img` tags

# Re-render Optimization
- Use `useMemo` for computationally intensive calculations
- Use `useCallback` for functions passed as props
- Don’t overuse memoization; profile your code first before optimizing

# Bundle Size
- Import only what you need, not the entire library
  Correct: import { debounce } from ‘lodash’
  Incorrect: import _ from 'lodash'

# SSR and SSG
- Use Server-Side Rendering by default to reduce client-side JavaScript
- Use Static Generation for pages whose data rarely changes
- Use ISR for pages that require periodic revalidation

# Media & Code
- Always use `next/image` for images, define width/height.
- Use dynamic imports (`next/dynamic`) for heavy, non-critical components.
- Import only needed modules (e.g., `import { format } from 'date-fns'`, not the whole library).
```

---

## 12. Git Rules

```
# Commit Message Format
feat     : [new feature description]
fix      : [bug fix description]
refactor : [refactor description]
style    : [styling/formatting changes]
docs     : [documentation updates]
test     : [adding/modifying tests]
chore    : [config/tooling changes]

# Rules
- NEVER commit `.env` or any secret files.
- Keep one commit per specific logical change.

# Example
feat: add user authentication with Google OAuth
fix: resolve infinite scroll not triggering on mobile
refactor: extract user card into reusable component
```

---

## 13. Features

```
# Completed
- [ ] Initialize Next.js, Tailwind, shadcn/ui
- [ ] Setup Prisma & Supabase DB connection

# In-Progress
- [ ] Implement NextAuth (RBAC: Superadmin, Admin, Operator)
- [ ] Setup next-intl for ID/EN localization

# Planned
- [ ] Build Dashboard Layout & Dark Mode toggle
- [ ] Category & Product Management CRUD
- [ ] WhatsApp Bot integration (webhook & command handlers)
- [ ] Orders & Transactions module
- [ ] Gemini AI Integration for analytics
```

---

## 14. Testing

```
# Testing Approach
- Framework: Vitest / React Testing Library
- E2E: Playwright (planned)

# What to Test
- All utility and helper functions.
- Complex business logic (Order calculations, AI prompt generations).
- API endpoints (Happy path and exact error handling).
- Webhook handlers (Critical for WA Bot).

# Coverage Target
- Prioritize Business Logic > APIs > UI Components.
```

---

## 15. Do Not

```
# Structure
- DO NOT create new root folders without confirmation.
- DO NOT delete files without confirmation
- DO NOT move files without confirmation
- DO NOT change the existing folder structure
- DO NOT modify the database schema without confirmation.

# Code
- DO NOT use the ‘any’ type in TypeScript
- DO NOT use inline styles for static values.
- DO NOT hardcode text in UI; use translations (`next-intl`).
- DO NOT write code logic/variables in Indonesian; use English.
- DO NOT hardcode values that should come from environment variables
- DO NOT commit .env files or files containing secrets
- DO NOT install new packages without confirmation
- DO NOT remove or modify existing features without clear instructions

# Prohibited Patterns
- DO NOT use useEffect for data fetching
- DO NOT use inline styles for values that can use utility classes

# Database
- DO NOT run commands that modify or delete production data
- DO NOT create database migrations without confirmation
- DO NOT expose database credentials to the client side

# Security
- DO NOT expose API keys to the client.
- DO NOT commit `.env` files.
- DO NOT bypass input validation (Always use Zod).
```

---

## 16. Environment Variables

```
# Setup
- Copy .env.example to .env for local development
- Never commit the .env or .env.local files to the repository

# Public
NEXT_PUBLIC_APP_NAME="NexPOS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database (Supabase)
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[db]?schema=public"
DIRECT_URL="postgresql://[user]:[password]@[host]:[port]/[db]?schema=public"

# Auth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI
GEMINI_API_KEY="your-gemini-api-key"

# WhatsApp integration
WA_SERVICE_URL="http://your-wa-bot-service-url"
```

---
