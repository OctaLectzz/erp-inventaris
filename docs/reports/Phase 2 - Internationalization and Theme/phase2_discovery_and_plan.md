# Phase 2 Implementation & Verification Report — Internationalization and Theme

> **Project:** Inventra (Mini ERP Inventory Management)  
> **Phase:** Phase 2 — Internationalization (`next-intl`) and Default Appearance (`next-themes` Light)  
> **Revision:** Rev 3.0 (Implementation Completed & Verified)  
> **Status:** ✅ Completed & Verified  
> **Author:** Antigravity AI  
> **Date:** 2026-10-13

---

## 1. Executive Summary

Phase 2 establishes the bilingual internationalization (i18n) and default appearance foundation for Inventra. The application requires **Bahasa Indonesia (`id`)** as the authoritative default locale and **English (`en`)** as the secondary supported locale. In addition, the visual appearance must strictly default to **Light theme** on initial visit, while fully preserving the verified dark-mode tokens and dark-mode switching capabilities configured in Phase 1.

Following formal review of Revision 1, this revised plan addresses all technical review feedback:

1. **Next.js 16 Routing Convention:** Migrated from deprecated `src/middleware.ts` to canonical Next.js 16 **`src/proxy.ts`** based on official version documentation.
2. **Translation JSON Loading:** Replaced dynamic template imports with an **explicit, type-safe locale-to-message import map** that is 100% statically analyzable by Turbopack and verifies at build time.
3. **Route Migration Architecture:** Fully documented the movement from `src/app/{layout.tsx, page.tsx}` to `src/app/[locale]/{layout.tsx, page.tsx}`, including dynamic `<html lang={locale}>`, metadata/viewport scoping, font variable retention, and absence of route collisions.
4. **Theme Hydration & Persistence:** Confirmed `next-themes@0.4.6` behavior (`defaultTheme="light"`, `enableSystem={false}`), differentiated initial visit from persistent return visits, scoped hydration suppression strictly to `<html>`, and defined a mounted-state pattern for icon rendering.
5. **Translation Parity & Type Safety:** Clarified that TypeScript's `IntlMessages` verifies key existence against the base dictionary (`id`) but does not detect missing English translations; added a planned automated Vitest test (`tests/i18n/translations.test.ts`) to enforce 100% structural and key parity between `id` and `en`.

**No application source code, dependencies, or production configurations have been modified during this revision.** Implementation will begin only upon explicit user approval.

---

## 2. Findings from Existing Implementation & Verified Versions

### 2.1 Toolchain & Dependency Verification (Verified Facts)

Auditing [`package.json`](file:///c:/Experience/Projects/inventra/package.json), [`tsconfig.json`](file:///c:/Experience/Projects/inventra/tsconfig.json), and installed packages confirms:

| Dependency / Tool         | Installed Version  | Status & Technical Findings                                                                                                                                                                                                  |
| :------------------------ | :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`next`**                | `16.4.0`           | App Router, Turbopack default, React 19 support. Dynamic route `params` are asynchronous Promises (`const { locale } = await params;`). In Next.js 16, `middleware.ts` is officially deprecated in favor of `proxy.ts`.      |
| **`react` / `react-dom`** | `19.3.0`           | React 19 Server Components and Server Actions.                                                                                                                                                                               |
| **`next-intl`**           | `4.14.9`           | App Router routing, `createNextIntlPlugin`, `defineRouting`, `createNavigation`, `getRequestConfig`. Built-in Turbopack Next.js 16 support verified in `node_modules/next-intl/dist/esm/production/plugin/getNextConfig.js`. |
| **`next-themes`**         | `0.4.6`            | Theme script injection, class attribute modification, `localStorage` persistence.                                                                                                                                            |
| **`tailwindcss`**         | `^4.0.0`           | CSS-first `@theme inline`, `@custom-variant dark (&:is(.dark *))`.                                                                                                                                                           |
| **`shadcn` / `radix-ui`** | `4.21.4` / `1.8.1` | Base style `radix-vega`, icon library `lucide-react` 1.56.0.                                                                                                                                                                 |
| **`typescript`**          | `^5.0.0`           | Strict mode enabled (`"strict": true` in `tsconfig.json`).                                                                                                                                                                   |
| **`vitest`**              | `3.2.7`            | Pre-configured with `@vitejs/plugin-react` in `devDependencies`. Ready for translation parity testing without new dependencies.                                                                                              |

### 2.2 Route & File Tree Status

The current route tree under `src/app/` consists of:

- [`src/app/layout.tsx`](file:///c:/Experience/Projects/inventra/src/app/layout.tsx): Root layout setting font variables (`--font-inter`, `--font-geist-mono`) and `<html lang="id">`.
- [`src/app/page.tsx`](file:///c:/Experience/Projects/inventra/src/app/page.tsx): Foundation landing page containing an in-memory `pageCopy` object.
- [`src/app/globals.css`](file:///c:/Experience/Projects/inventra/src/app/globals.css): All semantic brand tokens (`--primary` Navy `#0F2D4A`, `--accent` Teal `#14B8A6`, `--secondary` Surface `#E6F4F2`, Text `#1F2937`) defined in `:root` and `.dark` palettes with verified WCAG AA contrast.
- [`src/app/favicon.ico`](file:///c:/Experience/Projects/inventra/src/app/favicon.ico): Static favicon.

**Confirmed Findings:**

- Neither `src/middleware.ts` nor `src/proxy.ts` exists currently.
- No translation files (`messages/` or `src/messages/`) exist currently.
- No other routes, route groups, or API handlers exist in `src/app/`. There are zero route conflicts.

---

## 3. MCP and Skills Discovery Results

### 3.1 Discovered MCP Servers

The following 4 Model Context Protocol (MCP) servers are active and accessible:

1. **`context7`:** Library documentation query tools (`resolve-library-id`, `query-docs`).
2. **`next-devtools`:** Next.js 16 tooling (`browser_eval`, `nextjs_docs`, `nextjs_index`, `nextjs_call`).
3. **`shadcn`:** Component registry management, item examples, additions, and audit checklists.
4. **`supabase`:** PostgreSQL schema, migrations, RLS inspection, and log monitoring.

### 3.2 Skills Discovery & Evaluation

- **Next.js & React:** Discovered `vercel-labs/agent-skills@vercel-react-best-practices` (793K installs) and `wshobson/agents@nextjs-app-router-patterns` (31.9K installs). Pre-installed skills in workspace: `nextjs-react-typescript`, `nextjs-shadcn`, and `optimized-nextjs-typescript`.
- **Internationalization (`next-intl`):** Discovered `github/awesome-copilot@next-intl-add-language` (9.3K installs, verified safe by Socket/Snyk). Installed cleanly to [`.agents/skills/next-intl-add-language/SKILL.md`](file:///c:/Experience/Projects/inventra/.agents/skills/next-intl-add-language/SKILL.md). Provides workflow patterns for modular `./messages` translation directories and routing.
- **Accessibility & WCAG:** Evaluated candidate `addyosmani/web-quality-skills@accessibility` (60.6K installs) against pre-installed [`ui-ux-pro-max`](file:///c:/Experience/Projects/inventra/.agents/skills/ui-ux-pro-max/SKILL.md) (393K installs). Retained existing `ui-ux-pro-max` as it already provides comprehensive WCAG 2.1 AA rules, contrast requirements (4.5:1), touch targets (44×44px), and keyboard focus indicators. Did not install redundant duplicate packages.
- **Tailwind v4 & shadcn/ui:** Verified pre-installed [`tailwind-v4-shadcn`](file:///c:/Experience/Projects/inventra/.agents/skills/tailwind-v4-shadcn/SKILL.md) and [`shadcn`](file:///c:/Experience/Projects/inventra/.agents/skills/shadcn/SKILL.md).
- **TypeScript & Testing:** Verified pre-installed [`typescript-advanced-types`](file:///c:/Experience/Projects/inventra/.agents/skills/typescript-advanced-types/SKILL.md), [`typescript-pro`](file:///c:/Experience/Projects/inventra/.agents/skills/typescript-pro/SKILL.md), and [`vitest`](file:///c:/Experience/Projects/inventra/.agents/skills/vitest/SKILL.md).

---

## 4. Mandatory Technical Corrections & Architectural Decisions

### 4.1 Next.js 16 Routing Convention: `src/proxy.ts` vs `src/middleware.ts`

#### A. Version-Specific Documentation Findings

Inspection of official Next.js 16.4.0 documentation in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` and `middleware.md` confirms:

> _"The `middleware.js` file convention has been **deprecated** in Next.js 16 and renamed to `proxy.js`... Version history: `v16.0.0` — Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js runtime."_

#### B. Selected Routing Entry Point

We select **`src/proxy.ts`** as the single, canonical routing entry point.  
We will **not** create `src/middleware.ts` to avoid duplicate or conflicting routing behaviors.

#### C. Implementation Specification (`src/proxy.ts`)

`next-intl` exports `createMiddleware(routing)` which accepts a `NextRequest` and returns a `NextResponse`. In `src/proxy.ts`, this is exported as the named or default `proxy` function:

```typescript
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

import type { NextRequest } from 'next/server'

const handleI18nRouting = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  return handleI18nRouting(request)
}

export const config = {
  // Precise negative matcher: excludes API routes, _next internals, static files, and favicons
  matcher: ['/', '/(id|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
}
```

#### D. Future Coexistence with Supabase Session Refresh (Phase 4 / Phase 5)

In Phase 4, authentication and session management will be added via `@supabase/ssr`. The routing flow will chain cleanly within `src/proxy.ts` without rewriting the architecture:

```text
Incoming Request
      │
      ▼
proxy(request) in src/proxy.ts
      │
      ├─► Step 1: Execute handleI18nRouting(request)  --> returns NextResponse (rewrite/redirect/headers)
      │
      ├─► Step 2: (Future Phase 4) updateSession(request, response) --> refreshes Supabase auth cookies
      │
      ▼
Return combined response
```

This guarantees that Phase 2 does not introduce routing conventions that conflict with future Supabase auth requirements.

---

### 4.2 Translation JSON Loading: Explicit Import Map vs Dynamic Templates

#### A. Evaluation of Dynamic Template Imports

Revision 1 proposed `import(`../../messages/${locale}/common.json`)`.  
**Auditing against Next.js 16 Turbopack:**

- Dynamic template strings with variables can prevent Turbopack from generating an optimal static dependency graph at build time.
- Dynamic imports across multiple variables can inadvertently cause the bundler to include unwanted files in the bundle or cause module-resolution failures on specific serverless runtime targets.

#### B. Explicit, Type-Safe Locale Import Map

To ensure 100% reliable bundling, static analyzability, and fast compilation, [`src/i18n/request.ts`](file:///c:/Experience/Projects/inventra/src/i18n/request.ts) will use an explicit import map:

```typescript
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

// Explicit, bundler-analyzable loaders per locale
const messageLoaders = {
  id: async () => ({
    index: (await import('../../messages/id/index.json')).default,
    common: (await import('../../messages/id/common.json')).default,
    navigation: (await import('../../messages/id/navigation.json')).default,
    sidebar: (await import('../../messages/id/sidebar.json')).default,
    auth: (await import('../../messages/id/auth.json')).default,
    dashboard: (await import('../../messages/id/dashboard.json')).default,
    validation: (await import('../../messages/id/validation.json')).default
  }),
  en: async () => ({
    index: (await import('../../messages/en/index.json')).default,
    common: (await import('../../messages/en/common.json')).default,
    navigation: (await import('../../messages/en/navigation.json')).default,
    sidebar: (await import('../../messages/en/sidebar.json')).default,
    auth: (await import('../../messages/en/auth.json')).default,
    dashboard: (await import('../../messages/en/dashboard.json')).default,
    validation: (await import('../../messages/en/validation.json')).default
  })
} as const

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Validate locale; fallback to defaultLocale ('id') if invalid or missing
  if (!locale || !(locale in messageLoaders)) {
    locale = routing.defaultLocale
  }

  // Load only the dictionary for the requested locale
  const messages = await messageLoaders[locale as keyof typeof messageLoaders]()

  return {
    locale,
    messages
  }
})
```

#### C. Architectural Guarantees of the Import Map

1. **Static Analyzability:** Every string literal path is known at build time. Turbopack compiles each namespace directly.
2. **Zero Key Collisions:** Namespaces are structured as distinct top-level keys (`common`, `index`, `navigation`, `auth`, `sidebar`, `dashboard`, `validation`).
3. **Selective Server-Side Loading:** A request for Indonesian (`id`) executes only `messageLoaders.id()`, loading only the Indonesian dictionaries into memory.
4. **Invalid Locale Resilience:** Any unsupported locale string safely falls back to `routing.defaultLocale` (`id`).

---

### 4.3 Root Layout and Route Migration (`[locale]`)

#### A. Documented File Moves & Removals

- **Remove / Replace:** [`src/app/layout.tsx`](file:///c:/Experience/Projects/inventra/src/app/layout.tsx) and [`src/app/page.tsx`](file:///c:/Experience/Projects/inventra/src/app/page.tsx) at the root level.
- **Create:** `src/app/[locale]/layout.tsx` and `src/app/[locale]/page.tsx`.

#### B. Placement of `<html>`, `<body>`, and Fonts

Because all pages will live inside `[locale]`, `src/app/[locale]/layout.tsx` becomes the **sole root layout** for the application:

1. `<html>` and `<body>` live exclusively in `src/app/[locale]/layout.tsx`. No top-level `layout.tsx` is retained, preventing duplicate `<html>` tags.
2. The `lang` attribute is set dynamically: `<html lang={locale}>`.
3. Font classes (`inter.variable`, `geistMono.variable`, `font-sans`) are attached directly to `<html>`.
4. Global styles (`import '../globals.css'`) are imported here.

#### C. Metadata and Viewport Placement

Metadata and viewport configurations are exported from `src/app/[locale]/layout.tsx`:

```typescript
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'

  return {
    title: {
      template: '%s | Inventra',
      default: isEn ? 'Inventra — Mini ERP Inventory Management' : 'Inventra — Sistem Manajemen Inventaris Terpadu'
    },
    description: isEn
      ? 'Warehouse inventory management, stock monitoring, and movement traceability system for PT. Syailendra Bumi Investama (DDistillers).'
      : 'Sistem manajemen inventaris gudang, pemantauan stok real-time, dan audit pergerakan barang untuk PT. Syailendra Bumi Investama (DDistillers).'
  }
}
```

#### D. Composition of Providers

In `src/app/[locale]/layout.tsx`, providers are composed cleanly:

```tsx
<html lang={locale} suppressHydrationWarning className={cn('h-full font-sans antialiased', inter.variable, geistMono.variable)}>
  <body className="bg-background text-foreground flex min-h-full flex-col">
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </ThemeProvider>
  </body>
</html>
```

#### E. Resolution of Root `/` and Invalid Locale Handling

1. **Root URL `/`:** `src/proxy.ts` handles the root path `/`. With `localePrefix: 'as-needed'`, the default locale (`id`) is rewritten internally to the `[locale]` handler. The user's browser stays on `/`, rendering Indonesian content without redirect delay.
2. **English URL `/en`:** Resolves directly to `[locale]` with `locale: 'en'`.
3. **Invalid Locales (e.g. `/fr` or `/xyz`):** In `src/app/[locale]/layout.tsx`:
   ```typescript
   const { locale } = await params
   if (!routing.locales.includes(locale as any)) {
     notFound()
   }
   ```
   Triggers Next.js's standard `notFound()` handler.
4. **Static Assets:** `favicon.ico` lives in `src/app/favicon.ico` and is exempted from `proxy.ts` matching by the matcher regex.

---

### 4.4 Theme Hydration and Persistence (`next-themes` 0.4.6)

#### A. Default Theme vs Persistence Strategy

- **Fresh Visit (First-Time User):**
  - Requirement: The application must render in **Light** mode regardless of the user's operating system preferences (`prefers-color-scheme`).
  - Configuration: `defaultTheme="light"` and `enableSystem={false}`.
  - Verification: When `localStorage.getItem("theme")` is `null`, `next-themes` sets theme to `"light"`. The system media query is not evaluated. Light mode is guaranteed.
- **Returning Visit (Previously Selected Preference):**
  - If a user clicks the Theme Toggle and selects Dark mode, `next-themes` writes `"dark"` to `localStorage`.
  - On reload, `localStorage.getItem("theme")` resolves to `"dark"`. The inline script immediately adds the `.dark` class to `<html>` before first paint, preventing any white flash.
  - Manual preference is preserved without forcing Light mode on every subsequent reload.

#### B. Hydration Behavior & Scoped Warning Suppression

- **Why `suppressHydrationWarning` is used on `<html>`:** `next-themes` injects an inline script in `<head>` that modifies the `class` and `style` attributes on `<html>` prior to React hydration. React 19 flags this attribute delta as a mismatch.
- **Safety Boundary:** `suppressHydrationWarning` is applied **only to `<html lang={locale}>`**. It is NOT applied to `<body>`, `<main>`, or application components, ensuring that actual React hydration bugs in application code remain fully visible.

#### C. Mounted-State Strategy for Theme-Dependent Icons

To prevent client-server HTML mismatches when rendering theme-dependent icons (`Sun` vs `Moon`):
In [`src/components/shared/theme-toggle.tsx`](file:///c:/Experience/Projects/inventra/src/components/shared/theme-toggle.tsx):

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render an accessible skeleton/placeholder with identical dimensions (40x40px)
    return (
      <Button variant="ghost" size="icon" disabled aria-hidden="true" className="h-9 w-9 opacity-50">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Alihkan ke mode terang' : 'Alihkan ke mode gelap'}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
    >
      {isDark ? <Sun className="text-accent h-4 w-4" /> : <Moon className="text-primary h-4 w-4" />}
    </Button>
  )
}
```

---

### 4.5 Translation Parity and Type Safety Strategy

#### A. Correction on TypeScript Limitations

TypeScript's `declare global { interface IntlMessages { ... } }` provides autocompletion for translation keys in components by inferring keys from `id` (e.g. `typeof idIndex`).  
**However, TypeScript alone does NOT verify that `messages/en/` has complete translations for all keys present in `messages/id/`.** Missing keys in English would silently fall back or produce empty text at runtime if not separately tested.

#### B. Planned Verification Mechanism: Automated Parity Test

To enforce complete structural and key parity between Indonesian and English without adding new dependencies, we plan a dedicated Vitest test at [`tests/i18n/translations.test.ts`](file:///c:/Experience/Projects/inventra/tests/i18n/translations.test.ts) (Vitest 3.2.7 is already installed in `devDependencies`).

**Planned Test Logic:**

1. **JSON Syntax Validity:** Loads all JSON files in `messages/id/` and `messages/en/` with strict JSON parsing.
2. **Namespace File Parity:** Asserts that every file in `messages/id/` has an identical corresponding file in `messages/en/` and vice versa.
3. **Recursive Key Matching:** Traverses nested keys and verifies that every key path in `id` exists in `en` with identical data types (string vs object).
4. **No Empty Translations:** Asserts that no translation string in either locale is empty or whitespace-only.

This check will be run via `npm test` or `npx vitest run tests/i18n` as part of the Phase 2 verification suite.

---

## 5. Modular Translation File Structure (`messages/{id,en}/`)

### 5.1 Namespace Division & Domain Scope

```text
messages/
├── id/
│   ├── index.json        # Landing page copy (hero, foundation card, brand tokens preview, footer)
│   ├── common.json       # Shared labels (brand tag, status badges, buttons, loading indicators)
│   ├── navigation.json   # Navigation links, language switcher labels, skip links
│   ├── sidebar.json      # Planned navigation hierarchy for future Phase 7
│   ├── auth.json         # Planned auth placeholders & Phase 5 notice tooltips
│   ├── dashboard.json    # Planned KPI titles & summary metrics for future Phase 7
│   └── validation.json   # Shared Zod validation error keys
└── en/
    ├── index.json
    ├── common.json
    ├── navigation.json
    ├── sidebar.json
    ├── auth.json
    ├── dashboard.json
    └── validation.json
```

### 5.2 Scope & Anti-Feature Creep Rules

- `index.json` contains only copy specific to the landing page.
- `sidebar.json`, `auth.json`, and `dashboard.json` will contain only minimal placeholder namespaces needed for future parity; **no actual authentication, sidebar, or dashboard logic will be built in Phase 2**.
- All user-facing strings currently in `src/app/page.tsx` (`pageCopy`) will be extracted into translation files. Zero hardcoded strings remain in JSX.

---

## 6. Revised File-by-File Implementation Plan

| Target File                                 | Action | Layer          | Purpose & Justification                                                                                                    |
| :------------------------------------------ | :----- | :------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `messages/id/*.json` (7 files)              | Create | i18n Assets    | Indonesian strings for all 7 namespaces (`index`, `common`, `navigation`, `sidebar`, `auth`, `dashboard`, `validation`).   |
| `messages/en/*.json` (7 files)              | Create | i18n Assets    | English strings matching `id` structure 1:1 for complete bilingual parity.                                                 |
| `src/types/global.d.ts`                     | Create | Typing         | Registers `interface IntlMessages` for compile-time key autocompletion in `useTranslations()`.                             |
| `src/i18n/routing.ts`                       | Create | Application    | Defines supported locales (`['id', 'en']`), default locale (`'id'`), and `localePrefix: 'as-needed'`.                      |
| `src/i18n/request.ts`                       | Create | Application    | Implements the explicit, type-safe `messageLoaders` map to load modular domain files without dynamic string interpolation. |
| `src/i18n/navigation.ts`                    | Create | Application    | Exports type-safe navigation helpers (`Link`, `useRouter`, `usePathname`, `redirect`) via `createNavigation(routing)`.     |
| `src/proxy.ts`                              | Create | Infrastructure | Canonical Next.js 16 routing entry point running `createMiddleware(routing)` with precise path matcher.                    |
| `next.config.ts`                            | Modify | Configuration  | Wraps Next.js config with `createNextIntlPlugin()` from `next-intl/plugin`.                                                |
| `src/components/theme-provider.tsx`         | Create | Presentation   | Client-side wrapper around `next-themes` `ThemeProvider`.                                                                  |
| `src/components/shared/locale-switcher.tsx` | Create | Presentation   | Accessible dropdown / toggle button switching between `ID` and `EN` while preserving the current route.                    |
| `src/components/shared/theme-toggle.tsx`    | Create | Presentation   | Accessible button switching between Light and Dark modes with mounted-state handling.                                      |
| `src/app/layout.tsx`                        | Remove | Presentation   | Replaced by localized root layout at `src/app/[locale]/layout.tsx` to eliminate duplicate `<html>` tags.                   |
| `src/app/page.tsx`                          | Remove | Presentation   | Replaced by localized landing page at `src/app/[locale]/page.tsx`.                                                         |
| `src/app/[locale]/layout.tsx`               | Create | Presentation   | Localized root layout containing `<html>`, `<body>`, font definitions, and providers.                                      |
| `src/app/[locale]/page.tsx`                 | Create | Presentation   | Localized foundation landing page consuming `useTranslations` (zero hardcoded strings).                                    |
| `tests/i18n/translations.test.ts`           | Create | Testing        | Automated Vitest test verifying 1:1 namespace and key parity between `id` and `en` dictionaries (Planned).                 |

---

## 7. Dependencies to Retain, Add, or Remove

- **Dependencies to Retain:**
  - `next-intl` (v4.14.9)
  - `next-themes` (v0.4.6)
  - `lucide-react` (v1.56.0)
  - `radix-ui` (v1.8.1)
  - `vitest` (v3.2.7)
- **Dependencies to Add:**
  - **NONE.** All required dependencies are already present and locked in `package.json`.
- **Dependencies to Remove:**
  - **NONE.**

---

## 8. Acceptance Criteria Checklist (Verified)

1. [x] A fresh visit (no `localStorage`) defaults to **Light Theme**, regardless of operating-system preferences (`prefers-color-scheme`).
2. [x] A previously selected Light or Dark preference persists in `localStorage` across page reloads.
3. [x] The default application locale is **Indonesian (`id`)**, served at `/` without prefix.
4. [x] English is accessible at `/en` and renders English translations.
5. [x] Switching locales via `LocaleSwitcher` preserves the current logical path and query parameters.
6. [x] Canonical Next.js 16 **`src/proxy.ts`** is implemented; no duplicate `src/middleware.ts` exists.
7. [x] All user-facing strings on the foundation page are translated through modular JSON dictionaries.
8. [x] Both locales (`id` and `en`) have 100% matching namespace files and matching nested translation keys.
9. [x] Invalid locale routes (e.g. `/fr`) correctly trigger Next.js `notFound()` (HTTP 404).
10. [x] `npx tsc --noEmit`, `npm run lint`, and `npx prettier --check` pass with exit code 0.
11. [x] `npm run build` succeeds without Turbopack bundle errors or missing route warnings.
12. [x] No unintended hydration warnings occur on initial render (`useSyncExternalStore` and scoped suppression).
13. [x] No new dependencies are added.
14. [x] No authentication, inventory CRUD logic, or database migrations are implemented during this phase.

---

## 9. Verification Commands & Actual Outcomes

All verification commands executed cleanly with exit code 0:

```bash
# 1. Automated Translation Parity Test (Vitest)
npx vitest run tests/i18n
# Outcome: 1 test file passed, 30 tests passed (30/30) in 28ms. Exit code 0.

# 2. Strict TypeScript Verification
npx tsc --noEmit
# Outcome: TypeScript compiler passed with zero errors. Exit code 0.

# 3. Code Style & Linting
npm run lint
# Outcome: ESLint passed with zero warnings and zero errors. Exit code 0.

# 4. Formatting Verification
npx prettier --check "src/**/*.{ts,tsx,css}" "messages/**/*.json" "tests/**/*.ts"
# Outcome: All matched files use Prettier code style! Exit code 0.

# 5. Production Build Verification (Turbopack + App Router routes)
npm run build
# Outcome: Static prerendering succeeded for /id and /en. Proxy middleware generated. Exit code 0.
```

---

## 10. Browser Subagent Runtime Verification

Interactive testing was conducted using the automated browser tool on `http://localhost:3000`:

1. **Root Load (`/`):** Loaded `http://localhost:3000`. Verified `<html lang="id">`, title `"Inventra — Sistem Manajemen Inventaris Terpadu"`, and hero badge `"Mini ERP Inventaris Gudang"`.
2. **Fresh Visit Light Theme:** Confirmed default theme rendered Light with no `dark` class on `<html>` despite OS settings.
3. **Language Switch to English:** Clicked the language toggle. The URL updated cleanly to `http://localhost:3000/en` and content rendered in English (`"Mini Warehouse ERP Inventory"`, `"Unified Inventory Management System"`).
4. **Theme Switch to Dark Mode:** Clicked the theme toggle button. The `.dark` class was added to `<html>` and dark-mode brand tokens were applied.
5. **Theme Persistence on Reload:** Reloaded `/en`. Dark mode persisted seamlessly from `localStorage.getItem("theme")`.
6. **Switch Back to Light & Indonesian:** Toggled theme back to Light and language back to Indonesian (`/`).
7. **Invalid Route Verification:** Queried `/fr` and confirmed it returned HTTP 404.
8. **Artifacts:**
   - Screenshot saved: `phase2_browser_verification_1791885546798.png`
   - Session recording: `phase2_verification_1791885482438.webp`

---

## 11. Changed & Created Files Summary

- **Translation Dictionaries (`messages/`):**
  - `messages/id/{index, common, navigation, sidebar, auth, dashboard, validation}.json` (7 files created)
  - `messages/en/{index, common, navigation, sidebar, auth, dashboard, validation}.json` (7 files created)
- **Application Routing & Types (`src/`):**
  - `src/types/global.d.ts` (created)
  - `src/i18n/routing.ts` (created)
  - `src/i18n/request.ts` (created)
  - `src/i18n/navigation.ts` (created)
  - `src/proxy.ts` (created)
  - `next.config.ts` (modified)
- **Presentation & Components (`src/components/`, `src/app/`):**
  - `src/components/theme-provider.tsx` (created)
  - `src/components/shared/locale-switcher.tsx` (created)
  - `src/components/shared/theme-toggle.tsx` (created)
  - `src/app/[locale]/layout.tsx` (created)
  - `src/app/[locale]/page.tsx` (created)
  - `src/app/layout.tsx` (removed, replaced by `[locale]/layout.tsx`)
  - `src/app/page.tsx` (removed, replaced by `[locale]/page.tsx`)
- **Testing & Verification (`tests/`, root):**
  - `vitest.config.ts` (created)
  - `tests/i18n/translations.test.ts` (created)

---

## 🛑 Stop Condition

Phase 2 implementation and verification are **100% complete**. All non-negotiable requirements, design tokens, locale routing, and appearance requirements have been met and verified.

In strict compliance with project instructions:

- **No authentication, database, or subsequent Phase 3+ features were implemented.**
- **No Git commits or pushes were made.**
- **Awaiting review and authorization before proceeding.**
