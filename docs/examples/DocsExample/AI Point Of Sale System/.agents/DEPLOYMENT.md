# DEPLOYMENT — NexPOS

> **Version:** 1.0.0-dev
> **Last Updated:** 2026-06-04

---

## 1. Deployment Architecture

NexPOS uses a **dual-deployment** strategy:

| Component                | Platform         | Why                                                                    |
| :----------------------- | :--------------- | :--------------------------------------------------------------------- |
| **Web Application**      | Vercel           | Optimized for Next.js, serverless API routes, global CDN, auto-scaling |
| **WhatsApp Bot Service** | VPS (Linux)      | Requires persistent process + Puppeteer/Chromium for whatsapp-web.js   |
| **Database**             | Supabase (Cloud) | Managed PostgreSQL, built-in Auth, Storage, and RLS                    |
| **Storage**              | Supabase Storage | Images, file uploads                                                   |

```
┌───────────────┐     ┌──────────────┐     ┌────────────────┐
│   VERCEL       │     │  SUPABASE    │     │  VPS           │
│                │     │              │     │                │
│  Next.js App   │────▶│  PostgreSQL  │◀────│  WA Bot        │
│  + API Routes  │     │  Auth        │     │  (Node.js)     │
│  + Edge MW     │     │  Storage     │     │  (PM2)         │
│                │     │              │     │                │
└───────────────┘     └──────────────┘     └────────────────┘
```

---

## 2. Environment Setup

### 2.1 Environment Files

```
.env.example          # Template (committed to git)
.env.local            # Local development (gitignored)
.env.production       # Production values (set in Vercel dashboard)
.env.test             # Test environment (gitignored)
```

### 2.2 Required Environment Variables

```bash
# ═══════════════════════════════════════════════
# APP
# ═══════════════════════════════════════════════
NEXT_PUBLIC_APP_NAME="NexPOS"
NEXT_PUBLIC_APP_URL="https://your-domain.com"         # Production URL

# ═══════════════════════════════════════════════
# SUPABASE
# ═══════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."                # Safe for client

# ═══════════════════════════════════════════════
# DATABASE (Server-only)
# ═══════════════════════════════════════════════
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# ═══════════════════════════════════════════════
# AUTH (Server-only)
# ═══════════════════════════════════════════════
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# ═══════════════════════════════════════════════
# AI (Server-only)
# ═══════════════════════════════════════════════
GEMINI_API_KEY="AIzaSy..."

# ═══════════════════════════════════════════════
# WHATSAPP SERVICE (Server-only)
# ═══════════════════════════════════════════════
WA_SERVICE_URL="https://wa.your-domain.com"
WA_SERVICE_SECRET="your-shared-secret-token"
```

---

## 3. Web Application Deployment (Vercel)

### 3.1 Prerequisites

- [ ] Vercel account connected to GitHub/GitLab
- [ ] Supabase project created and configured
- [ ] Google OAuth credentials created
- [ ] Gemini API key obtained
- [ ] Domain configured (optional, Vercel provides \*.vercel.app)

### 3.2 Initial Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project
vercel link

# 4. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GEMINI_API_KEY
vercel env add WA_SERVICE_URL
vercel env add WA_SERVICE_SECRET
```

### 3.3 Build Configuration

```json
// vercel.json
{
  "buildCommand": "npx prisma generate && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"], // Singapore (closest to Indonesia)
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000" }
      ]
    }
  ]
}
```

### 3.4 Deployment Commands

```bash
# Preview deployment (PR/branch)
vercel

# Production deployment
vercel --prod

# Or: Push to main branch (auto-deploy via Vercel GitHub integration)
git push origin main
```

### 3.5 Post-Deployment Checklist

- [ ] Verify environment variables are set in Vercel dashboard
- [ ] Run `npx prisma db push` against production database
- [ ] Seed initial data (superadmin account, default categories)
- [ ] Verify OAuth callback URLs are whitelisted
- [ ] Test login flow (email + Google)
- [ ] Test API routes
- [ ] Verify images load from Supabase Storage
- [ ] Check dark/light mode
- [ ] Test both ID and EN languages

---

## 4. WhatsApp Bot Deployment (VPS)

### 4.1 Server Requirements

| Resource | Minimum          | Recommended      |
| :------- | :--------------- | :--------------- |
| CPU      | 1 vCPU           | 2 vCPU           |
| RAM      | 1 GB             | 2 GB             |
| Storage  | 20 GB SSD        | 40 GB SSD        |
| OS       | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Node.js  | 18.x             | 20.x LTS         |

### 4.2 Server Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Chromium (required by whatsapp-web.js / Puppeteer)
sudo apt install -y chromium-browser

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Clone the WA service
git clone https://github.com/your-org/nexpos-wa-service.git /opt/nexpos-wa
cd /opt/nexpos-wa

# 6. Install dependencies
npm install

# 7. Create .env file
cp .env.example .env
nano .env  # Set all required variables

# 8. Build TypeScript
npm run build

# 9. Start with PM2
pm2 start dist/index.js --name "nexpos-wa"
pm2 save
pm2 startup  # Enable auto-start on reboot
```

### 4.3 PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "nexpos-wa",
      script: "dist/index.js",
      instances: 1, // Single instance (one WA session)
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      log_file: "/var/log/nexpos-wa/combined.log",
      error_file: "/var/log/nexpos-wa/error.log",
      out_file: "/var/log/nexpos-wa/output.log",
      time: true,
    },
  ],
};
```

### 4.4 Nginx Reverse Proxy (Optional)

```nginx
# /etc/nginx/sites-available/nexpos-wa
server {
    listen 443 ssl;
    server_name wa.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/wa.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wa.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. Database Deployment (Supabase)

### 5.1 Initial Setup

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema to Supabase (development)
npx prisma db push

# 3. Or run migrations (production)
npx prisma migrate deploy

# 4. Seed initial data
npx prisma db seed
```

### 5.2 Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Create default superadmin profile
  // (The actual Supabase Auth user must be created first via Supabase dashboard)
  await prisma.profile.upsert({
    where: { email: "superadmin@nexpos.com" },
    update: {},
    create: {
      userId: "supabase-auth-user-id-here", // Must match auth.users.id
      email: "superadmin@nexpos.com",
      fullName: "Super Admin",
      role: UserRole.SUPERADMIN,
    },
  });

  console.log("Seed completed successfully");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 5.3 Migration Workflow

```bash
# Development: Iterate on schema
npx prisma db push         # Quick push (no migration file)

# Production: Create migration
npx prisma migrate dev --name add_product_weight_field

# Deploy migration to production
npx prisma migrate deploy
```

### 5.4 Backup Strategy

- **Supabase Automated Backups:** Enabled by default (daily, 7-day retention on free tier)
- **Point-in-Time Recovery:** Available on Pro plan
- **Manual Backup:** `pg_dump` via Supabase CLI for critical operations

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  DIRECT_URL: ${{ secrets.DIRECT_URL }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test:run

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

---

## 7. Monitoring & Observability

### 7.1 Recommended Tools

| Tool                 | Purpose                  | Integration      |
| :------------------- | :----------------------- | :--------------- |
| **Vercel Analytics** | Web vitals, performance  | Built-in         |
| **Vercel Logs**      | Serverless function logs | Built-in         |
| **Sentry**           | Error tracking           | `@sentry/nextjs` |
| **Uptime Robot**     | Uptime monitoring        | External         |
| **PM2 Logs**         | WA service monitoring    | Built-in         |

### 7.2 Health Check Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET(): Promise<Response> {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch {
    return Response.json(
      { status: "unhealthy", timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
```

---

## 8. Rollback Procedure

### 8.1 Web Application (Vercel)

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote [deployment-url]
```

### 8.2 Database

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back [migration-name]

# Or restore from Supabase backup (via dashboard)
```

### 8.3 WhatsApp Service (VPS)

```bash
# Rollback to previous version
cd /opt/nexpos-wa
git log --oneline -5           # Find previous commit
git checkout [commit-hash]     # Checkout previous version
npm install
npm run build
pm2 restart nexpos-wa
```

---

## 9. Domain & SSL

### 9.1 Web Application

- Configured via Vercel Dashboard → Domains
- SSL/TLS automatically provisioned by Vercel (Let's Encrypt)
- Redirect HTTP → HTTPS (automatic)

### 9.2 WhatsApp Service

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d wa.your-domain.com

# Auto-renewal (cron)
sudo certbot renew --dry-run
```

---

## 10. Performance Optimization

### 10.1 Vercel Configuration

- **Region:** `sin1` (Singapore) — closest to Indonesian users
- **Edge Functions:** Middleware runs at the edge for minimal latency
- **ISR:** Use Incremental Static Regeneration for semi-static pages
- **Image Optimization:** Vercel's built-in image optimization via `next/image`

### 10.2 Database Performance

- **Connection Pooling:** Supabase PgBouncer (via `DATABASE_URL` with `?pgbouncer=true`)
- **Indexing:** Add indexes on frequently queried columns (storeId, status, createdAt)
- **Query Optimization:** Use Prisma's `select` and `include` to fetch only needed data

### 10.3 Caching Strategy

| Data           | Cache Strategy             | TTL        |
| :------------- | :------------------------- | :--------- |
| Product list   | TanStack Query `staleTime` | 30 seconds |
| Category list  | TanStack Query `staleTime` | 5 minutes  |
| Dashboard KPIs | TanStack Query `staleTime` | 1 minute   |
| User session   | Supabase cookie            | 1 hour     |
| Static pages   | ISR                        | 1 hour     |
