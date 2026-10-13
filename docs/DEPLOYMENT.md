# DEPLOYMENT — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13
>
> **Status:** Deployment steps below are **planned** and have not been verified in a live deployment. Steps labeled ⚠️ are unverified.

---

## 1. Environments

| Environment | Purpose | URL |
| :--- | :--- | :--- |
| **Local Development** | Development and testing | `http://localhost:3000` |
| **Production** | Assessment demo ⚠️ | TBD (Vercel) |

---

## 2. Prerequisites

### 2.1 Local Development

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | 18+ (LTS recommended) | Runtime |
| **npm** | 9+ (bundled with Node.js) | Package manager |
| **Git** | 2.30+ | Version control |
| **Supabase CLI** | Latest | Local DB and migrations (optional) |

### 2.2 Production ⚠️

| Service | Purpose |
| :--- | :--- |
| **Vercel** | Application hosting |
| **Supabase** | PostgreSQL database, Auth, storage |

---

## 3. Environment Variables

### 3.1 Variable Reference

| Variable | Required | Client-Safe | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Yes | Yes | Application display name |
| `NEXT_PUBLIC_APP_URL` | Yes | Yes | Application base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **No** | Supabase service role key (bypasses RLS) |

### 3.2 `.env.example`

```env
# App
NEXT_PUBLIC_APP_NAME="Inventra"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
```

### 3.3 Rules

- Copy `.env.example` to `.env.local` for local development.
- **NEVER commit `.env.local`** or any file containing secret values.
- Only `NEXT_PUBLIC_` prefixed variables are included in the client bundle.
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER appear in client-side code.

---

## 4. Local Development Setup

### 4.1 Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd inventra

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase project credentials

# 4. Start the development server
npm run dev
```

### 4.2 Supabase Setup

```bash
# Option A: Use Supabase Cloud (recommended for assessment)
# 1. Create a project at https://supabase.com
# 2. Copy project URL and keys to .env.local
# 3. Apply migrations via Supabase CLI or dashboard

# Option B: Use Supabase Local (for offline development)
# 1. Install Supabase CLI
npm install -g supabase

# 2. Initialize local Supabase
supabase init

# 3. Start local Supabase
supabase start

# 4. Apply migrations
supabase db push
```

### 4.3 Database Migrations

```bash
# Apply all migrations (planned)
supabase migration up

# Or apply individually
supabase db push
```

### 4.4 Demo Data Seeding

After migrations are applied, demo accounts and initial product data can be provisioned via:

1. The "Import from DummyJSON" action in the application UI.
2. The seed SQL script (planned: `supabase/seed.sql`).

---

## 5. Build and Verification

### 5.1 Build Commands

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Run tests (planned)
npm run test

# Build for production
npm run build
```

### 5.2 Pre-Deployment Checklist

- [ ] `npm run lint` passes with no errors.
- [ ] `npx tsc --noEmit` passes with no errors.
- [ ] `npm run test` passes (when configured).
- [ ] `npm run build` completes successfully.
- [ ] `.env.local` is not committed.
- [ ] No hardcoded secrets in source code.
- [ ] All database migrations are applied.
- [ ] Demo accounts are provisioned.

---

## 6. Production Deployment ⚠️

> **Warning:** The following steps are planned but have not been verified in a live deployment.

### 6.1 Vercel Deployment

```bash
# Option A: Vercel CLI
npm install -g vercel
vercel

# Option B: Git Integration
# 1. Connect repository to Vercel
# 2. Vercel auto-deploys on push to main
```

### 6.2 Vercel Environment Variables ⚠️

Set all environment variables in the Vercel project dashboard:

1. Go to Vercel Project → Settings → Environment Variables.
2. Add each variable from `.env.example` with production values.
3. Mark `SUPABASE_SERVICE_ROLE_KEY` as "Sensitive" (encrypted).
4. Ensure `NEXT_PUBLIC_APP_URL` points to the production URL.

### 6.3 Supabase Production Setup ⚠️

1. Create a production Supabase project (or use the same project).
2. Apply all migrations to the production database.
3. Provision demo accounts in the production database.
4. Verify RLS policies are active.

---

## 7. Rollback Procedures ⚠️

> **Warning:** These procedures are planned but have not been tested.

### 7.1 Application Rollback

- **Vercel:** Use Vercel's instant rollback feature to revert to a previous deployment.
- **Manual:** Revert the Git commit and push to trigger a new deployment.

### 7.2 Database Rollback

- SQL migrations do not have automatic rollback scripts.
- For destructive changes, create a new forward migration that undoes the change.
- Backup the database before applying migrations to production.
- Supabase provides point-in-time recovery (PITR) on paid plans.

---

## 8. Monitoring ⚠️

> **Note:** Monitoring is not configured for the assessment scope. The following are suggestions for production readiness.

- **Application logs:** Vercel provides built-in function logs.
- **Database monitoring:** Supabase dashboard provides query performance and connection metrics.
- **Error tracking:** Consider Sentry or similar for production error monitoring (not required for assessment).
