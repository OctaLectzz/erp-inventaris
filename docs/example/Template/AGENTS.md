# AGENTS.md — [Project Name]

> Important note: This `AGENTS.md` file acts as a permanent system prompt for AI Agents (like Cursor, Windsurf, Copilot, or Claude) in your IDE. Keep the contents of this file in English, as AI models process English instructions significantly more accurately and efficiently.

---

## 1. Project Overview

- **Name** : [Your project name]
- **Description** : [Brief description of the system or application]
- **Goal** : [Main objective, what problem this solves]
- **Target Users**: [Who will use this project, e.g., Admin, Customer, etc.]
- **Version** : [Current version, e.g., v1.0.0-dev]
- **Status** : [Active development / Maintenance / Production]

---

## 2. Tech Stack

- **Language** : [TypeScript / JavaScript / Python / etc.] (Additional notes, e.g., Strict Mode)
- **Framework** : [Next.js / React / Express / etc.]
- **Styling** : [Tailwind CSS / CSS Modules / etc.]
- **UI Library** : [shadcn/ui / MUI / Radix / etc.]
- **Database** : [PostgreSQL / MySQL / MongoDB / etc.]
- **ORM** : [Prisma / Drizzle / Mongoose / etc.]
- **Auth** : [NextAuth / Supabase Auth / Clerk / etc.]
- **State Management**: [Zustand / Redux / Context / etc.]
- **Data Fetching** : [React Query / SWR / Axios / etc.]
- **Package Manager** : [npm / yarn / pnpm / bun]
- **Deployment** : [Vercel / VPS / AWS / etc.]

---

## 3. Commands

```bash
# Development
[pm] run dev          # Run local development server
[pm] run build        # Build application for production
[pm] run start        # Start production build
[pm] run lint         # Run linter (ESLint)
[pm] run format       # Format code (Prettier)

# Package Management
[pm] install [package] # Mandatory command to install packages

# Database
[pm] run db:migrate   # Run database migrations
[pm] run db:push      # Sync schema to database
[pm] run db:studio    # Open database GUI
```

> [pm] = the package manager you are using: npm / yarn / pnpm / bun
> If there is a package manager that MUST NOT be used, state it here.
> Example: NEVER use npm — always use bun.

---

## 4. Project Structure

Architecture: [clean architecture / by feature / MVC / etc.]

```
src/
    app/           # [Folder purpose, e.g., Application routing]
    components/
      ui/          # [Purpose, e.g., Base UI components/shadcn]
      shared/      # [Purpose, e.g., Reusable components]
      [feature]/   # [Purpose, e.g., Feature-specific components]
    lib/           # [Purpose, e.g., External library initialization]
    types/         # [Purpose, e.g., Global TypeScript types]
    utils/         # [Purpose, e.g., Helper functions]
    services/      # [Purpose, e.g., External API calls]
```

Example

```
[root]/
  src/
    app/           # Next.js App Router (pages and API routes)
    components/
      ui/          # shadcn/ui components (ONLY here)
      shared/      # Reusable components across features
    layouts/       # Application layout wrappers
    lib/           # MANDATORY for external library initialization
    features/     # Feature-specific components (e.g., dashboard, POS)
    types/         # Global TypeScript types and interfaces
    utils/         # Helper and utility functions
    contexts/      # React Contexts
    providers/     # Global providers (QueryClient, Theme, i18n, Session)
    schemas/       # Zod validation schemas
    hooks/         # Custom React hooks
    services/      # External API calls, Gemini AI logic, WA Bot handlers
    messages/      # i18n dictionary files
      id/          # ID dictionary (e.g., common, auth, dashboard, etc.)
      en/          # EN dictionary (e.g., common, auth, dashboard, etc.)
    proxy.ts       # Next.js middleware (must be at src/ root to handle auth & i18n)
```

File Placement Rules:

- Built-in/library UI components MUST be placed in [folder/ui]
- TypeScript Types/Interfaces MUST be in [folder/types]
- Helpers and utilities MUST be in [folder/utils]
- NEVER create a new root folder without user confirmation.

---

## 5. Naming Conventions

```
# Files & Folders
- Components      : [kebab-case / PascalCase] (e.g., user-card.tsx)
- Non-components  : [kebab-case / camelCase] (e.g., use-auth.ts)
- Folders         : [kebab-case] (e.g., user-profile/)
- Pages           : [page.tsx / index.tsx]

# Inside Code
- Variables       : camelCase (e.g., userData, isLoading)
- Constants       : UPPER_SNAKE (e.g., MAX_RETRY, BASE_URL)
- Functions       : camelCase (e.g., getUserById, processOrder)
- Types/Interfaces: PascalCase (e.g., UserType, ApiResponse)
- CSS Classes     : kebab-case (e.g., user-card, nav-item)

# Git Branches
- New feature     : feat/[feature-name]
- Bug fix         : fix/[bug-name]
```

---

## 6. Code Conventions

```
# General Approach
- Apply [clean code / DRY] principles.
- If a logic/UI is used more than once, extract it into a separate function/component.
- Write all code, variables, and comments in [English / your preferred language].
- [Specific rules, e.g., NEVER hardcode UI text, always use an i18n library].

# TypeScript (if relevant)
- Use `strict: true`.
- NEVER use the `any` type.
- Always write the explicit return type of a function.

# Import Order
1. External libraries (React, Next.js, etc.)
2. Absolute internal imports (@/components, @/utils)
3. Relative imports (./Component, ../utils)
4. Types and Interfaces
5. Assets and styling

# Error Handling
- Always use `try-catch` blocks for asynchronous functions.
- Do not leave errors unhandled (log them or return an appropriate response).
```

---

## 7. Component Rules

```
# Component Structure Order
1. Imports
2. Types / Interfaces Definitions (Props)
3. Main Component Definition
4. Hooks (State, Refs, etc.)
5. Handlers (Event functions like onClick, onChange, etc.)
6. Return JSX
7. Exports

# Props Rules
- Always define props data types explicitly.
- Provide default values for optional props.

# Server vs Client Components (For Next.js/React Server Components)
- Default: Use Server Components.
- Use `use client` ONLY IF you need:
    - State/Lifecycle hooks (useState, useEffect)
    - Event listeners (onClick, onChange)
    - Browser APIs (window, localStorage)
```

---

## 8. Styling Rules

```
Styling Rules
- Use [Tailwind CSS / CSS Modules].
- DO NOT use inline styles unless the value is strictly dynamic.
- DO NOT use `!important`.

# Tailwind CSS (If using Tailwind)
- Use utility classes directly in JSX.
- Use `clsx` or `cn()` for conditional classes.
- Class order: layout > spacing > sizing > color > typography > state.

# Responsiveness & Theme
- Use a mobile-first approach.
- Ensure the application supports [Light / Dark mode]. Do not hardcode HEX color codes in components; use CSS variables.
```

---

## 9. API & Data Fetching Rules

```
# Fetching Approach
- Server fetch: For initial data / SEO.
- Client fetch: For dynamic interactions (Use [React Query / SWR], do not use `useEffect`).

# API Response Format
- All internal endpoints must return the following format:
  `{ success: boolean, data: T | null, message: string }`

# Error Handling
- Catch errors and return the appropriate HTTP status code (200, 400, 401, 404, 500).
- Do not expose error details or stack traces to the client.
```

---

## 10. State Management Rules

```
# State Hierarchy
1. Local state (useState): Used only within 1 component.
2. Lifted state: Passed down via props to 2-3 child components.
3. Global state: Use [Zustand / Redux] for application-wide state.

# Context Usage
- Use React Context ONLY for data that rarely changes (theme, language, user session).
- Avoid Context for frequently changing state as it triggers mass re-renders.
```

---

## 11. Performance Rules

```
# General Optimization
- Use dynamic imports for heavy components that are not immediately visible.
- Use built-in framework Image components (like `next/image`) with predefined dimensions.
- Avoid excessive re-renders; use `useMemo` or `useCallback` wisely (always profile first).

# Bundle Size
- Do not import an entire library if you only need a portion of it.
  Correct: `import { format } from 'date-fns'`
  Wrong  : `import moment from 'moment'`
```

---

## 12. Git Rules

> Every time the Agent finishes making changes or adding code,
> commit directly to GitHub before moving to the next task.
> This is crucial so the user can compare old and new code
> and undo if the results do not meet expectations.

```
# Format Pesan Commit
# Commit Message Format
feat     : [description of new feature]
fix      : [description of bug fix]
refactor : [description of code refactor]
style    : [changes to styling/formatting]
docs     : [documentation update]

# Mandatory Rules
- NEVER commit `.env` files or secrets.
- Keep commits specific and logical (do not bundle unrelated features into 1 commit).
```

---

## 13. Features

```
# Completed
- [x] [Feature that is already working]

# In-Progress
- [ ] [Feature currently being developed]

# Planned
- [ ] [Future feature]
```

---

## 14. Testing

```
# Approach
- Framework: [Vitest / Jest / Playwright]
- Focus testing on: Complex business logic, Utility functions, API endpoints.
- Do not test: Highly simple presentational UI components.
```

---

## 15. Do Not

> IF USER INSTRUCTIONS ARE AMBIGUOUS, STOP AND ASK FIRST. DO NOT MAKE ASSUMPTIONS.

```
# File Structure
- PROHIBITED to create a new root folder without confirmation.
- PROHIBITED to delete or move files without confirmation.
- PROHIBITED to alter the database schema without explicit instructions.

# Code
- PROHIBITED to use the `any` type (TypeScript).
- PROHIBITED to hardcode UI text if the project uses i18n (multi-language).
- PROHIBITED to hardcode values that should be fetched from `.env`.
- PROHIBITED to install new packages/libraries without user permission.

# Security
- PROHIBITED to expose API Keys to the client-side (browser).
- PROHIBITED to bypass data input validation.
```

---

## 16. Environment Variables

```
# Guidelines
- Copy `.env.example` to `.env` for local development.
- Variables with the prefix [NEXT_PUBLIC_ / VITE_] are safe for the client.

# Public
[PREFIX]_APP_NAME="App Name"
[PREFIX]_APP_URL="http://localhost:3000"

# Secret (Server-Only)
DATABASE_URL="postgresql://..."
[API_SECRET_KEY]="..."
```

---

### Explanation and How to Use `AGENTS.md`

The `AGENTS.md` file (sometimes named `.cursorrules`, `.windsurfrules`, or `CLAUDE.md`) essentially acts as a Permanent System Prompt for the AI Assistant inside your IDE.

Here is why each section is important:

1. **Project Overview & Tech Stack**: Provides the "world context" where the AI operates. The AI won't offer a solution using Mongoose if it knows you are using Prisma and PostgreSQL.
2. **Commands**: Commands: Prevents the AI from giving incorrect commands (e.g., telling you to run `yarn install` when you must use `npm`).
3. **Structure & Naming Conventions**: Prevents the AI from creating messily named files (e.g., suddenly creating a `UserProfile.js` file in a project that requires `user-profile.tsx`).
4. **Rules (Code, Component, Styling, etc)**: Locks in the coding style. If you hate inline styles, this rule will force the AI to always use Tailwind.
5. **Section "Do Not"**: This is the most crucial part for autonomous AIs (those that can type and run commands on their own). These are the guardrails so the AI doesn't break the database, delete files without permission, or leak API keys.

**Implementation Tips:**
Save this file in the outermost directory (root) of your codebase. If you are using Cursor IDE, you can also copy-paste the contents of this file into the `Cursor Settings > General > Rules for AI` menu, or save it as a `.cursorrules` file.
