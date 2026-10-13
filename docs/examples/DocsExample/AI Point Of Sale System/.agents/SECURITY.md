# SECURITY — NexPOS

> **Version:** 1.0.0-dev
> **Last Updated:** 2026-06-04

---

## 1. Security Architecture Overview

NexPOS implements a **defense-in-depth** security strategy with multiple overlapping layers:

```
┌─────────────────────────────────────────────────┐
│              NETWORK LAYER                       │
│  HTTPS everywhere, CORS, Rate Limiting           │
├─────────────────────────────────────────────────┤
│              APPLICATION LAYER                   │
│  Middleware Auth, RBAC, CSRF Protection          │
├─────────────────────────────────────────────────┤
│              VALIDATION LAYER                    │
│  Zod Schema Validation, Input Sanitization       │
├─────────────────────────────────────────────────┤
│              DATA LAYER                          │
│  RLS Policies, Parameterized Queries (Prisma),   │
│  Encrypted Secrets                               │
├─────────────────────────────────────────────────┤
│              INFRASTRUCTURE LAYER                │
│  Supabase Security, Vercel Edge Network,         │
│  Environment Variable Isolation                  │
└─────────────────────────────────────────────────┘
```

---

## 2. Authentication Security

### 2.1 Supabase Auth Configuration

- **Auth Method:** Cookie-based sessions via `@supabase/ssr`
- **Cookie Settings:**
  - `HttpOnly: true` — Not accessible via JavaScript (XSS protection)
  - `Secure: true` — Only sent over HTTPS
  - `SameSite: Lax` — CSRF protection
  - `Path: /` — Available across the app
- **Session Duration:** 1 hour (with auto-refresh)
- **Refresh Token Rotation:** Enabled

### 2.2 Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Validated via Zod schema (client + server)

```typescript
// src/schemas/auth.schema.ts
const passwordSchema = z.string()
  .min(8, 'validation.password.minLength')
  .regex(/[A-Z]/, 'validation.password.uppercase')
  .regex(/[a-z]/, 'validation.password.lowercase')
  .regex(/[0-9]/, 'validation.password.number')
  .regex(/[^A-Za-z0-9]/, 'validation.password.special');
```

### 2.3 OAuth Security

- Google OAuth via Supabase (server-side flow)
- State parameter for CSRF protection (handled by Supabase)
- Callback URL whitelisted in Google Cloud Console & Supabase dashboard
- Only email and profile scopes requested (minimum privilege)

### 2.4 Session Management

- Session validation on every protected route via middleware
- Automatic session refresh before expiration
- Logout invalidates server-side session
- No sensitive data stored in localStorage (only cookies)

---

## 3. Authorization (RBAC)

### 3.1 Middleware Protection

```typescript
// src/middleware.ts — Simplified flow
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // 1. Refresh Supabase session
  // 2. If no session + protected route → redirect to /login
  // 3. If session + auth page → redirect to /dashboard
  // 4. Fetch user role from profile
  // 5. Check RBAC permissions for route
  // 6. If unauthorized → redirect to /unauthorized
}
```

### 3.2 Permission Enforcement Points

| Layer | Enforcement |
|:---|:---|
| **Middleware** | Route-level access control (page access) |
| **API Route** | Per-endpoint role check before processing |
| **UI** | Conditional rendering based on role (hide/disable elements) |
| **Database** | Row Level Security policies (defense in depth) |

### 3.3 API Route Protection Pattern

```typescript
// Every API route must validate auth and role
export async function GET(request: Request): Promise<Response> {
  // 1. Get session from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return apiResponse(null, 'Unauthorized', 401);
  }

  // 2. Fetch profile and check role
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id }
  });

  if (!hasPermission(profile.role, 'categories.read')) {
    return apiResponse(null, 'Forbidden', 403);
  }

  // 3. Proceed with business logic
}
```

---

## 4. Input Validation

### 4.1 Validation Strategy

**Double validation** — validate on both client AND server:

| Layer | Tool | Purpose |
|:---|:---|:---|
| Client-side | Zod + React Hook Form | UX (instant feedback) |
| Server-side (API) | Zod | Security (never trust client) |
| Database | Prisma schema constraints | Data integrity |

### 4.2 Validation Rules

```typescript
// ALWAYS validate request bodies in API routes
export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const result = createCategorySchema.safeParse(body);

  if (!result.success) {
    return apiResponse(
      null,
      'Validation failed',
      400,
      result.error.flatten()
    );
  }

  // Use result.data (validated + typed)
}
```

### 4.3 Input Sanitization

- Trim whitespace from string inputs
- Escape HTML in user-generated content
- Validate file uploads (type, size, extension)
- Validate URL parameters and query strings
- Use parameterized queries via Prisma (SQL injection prevention)

---

## 5. API Security

### 5.1 Rate Limiting

| Endpoint | Limit | Window |
|:---|:---|:---|
| Auth (login/register) | 5 requests | Per minute |
| API routes (general) | 60 requests | Per minute |
| File upload | 10 requests | Per minute |
| AI chat | 20 requests | Per minute |
| WhatsApp webhook | 100 requests | Per minute |

Implementation: Use Vercel's built-in rate limiting or `@upstash/ratelimit` with Redis.

### 5.2 CORS Configuration

```typescript
// next.config.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

### 5.3 API Response Security

- Never expose stack traces or internal errors to clients
- Use generic error messages for 500 errors
- Log detailed errors server-side only
- Return consistent error format

```typescript
// ✅ CORRECT: Generic user-facing error
return apiResponse(null, 'An error occurred while processing your request', 500);

// ❌ WRONG: Exposing internal details
return apiResponse(null, `Database connection failed: ${error.message}`, 500);
```

---

## 6. Data Security

### 6.1 Environment Variables

```
# ──── NEVER EXPOSE THESE TO CLIENT ────
DATABASE_URL=...            # Server-only
DIRECT_URL=...              # Server-only
GOOGLE_CLIENT_SECRET=...    # Server-only
GEMINI_API_KEY=...          # Server-only
WA_SERVICE_URL=...          # Server-only
WA_SERVICE_SECRET=...       # Server-only

# ──── SAFE FOR CLIENT (NEXT_PUBLIC_*) ────
NEXT_PUBLIC_APP_NAME=...    # Public
NEXT_PUBLIC_APP_URL=...     # Public
NEXT_PUBLIC_SUPABASE_URL=...     # Public (safe for Supabase)
NEXT_PUBLIC_SUPABASE_ANON_KEY=.. # Public (safe, restricted by RLS)
```

### 6.2 Database Security

- **Row Level Security (RLS):** Enabled on all tables
- **Parameterized Queries:** Prisma handles this automatically
- **Connection Pooling:** Via Supabase's PgBouncer for connection limits
- **Principle of Least Privilege:** Database user has minimal required permissions
- **No direct client-to-DB:** All access goes through API routes

### 6.3 File Upload Security

```typescript
// Upload validation rules
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_REQUEST = 5;

// Validation before upload
function validateFile(file: File): boolean {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) return false;
  if (file.size > MAX_FILE_SIZE) return false;
  // Check magic bytes for content validation
  return true;
}
```

### 6.4 Sensitive Data Handling

- Passwords are hashed by Supabase Auth (bcrypt)
- API keys and secrets only accessed server-side
- Customer phone numbers are stored but not displayed in full (masked in UI)
- Audit logs capture who did what and when
- No PII in client-side logs or error messages

---

## 7. WhatsApp Service Security

### 7.1 Communication Security

- WA Service ↔ NexPOS API communication uses shared secret token
- All webhook requests must include `X-WA-Service-Secret` header
- Webhook endpoint validates the secret before processing

```typescript
// API route: /api/whatsapp/webhook
export async function POST(request: Request): Promise<Response> {
  const serviceSecret = request.headers.get('X-WA-Service-Secret');

  if (serviceSecret !== process.env.WA_SERVICE_SECRET) {
    return apiResponse(null, 'Unauthorized', 401);
  }

  // Process webhook...
}
```

### 7.2 Message Security

- Rate limit incoming messages per customer phone number
- Sanitize all incoming message content
- Validate command patterns before processing
- Log all interactions for audit
- Block malicious patterns (e.g., injection attempts in messages)

---

## 8. AI (Gemini) Security

### 8.1 Prompt Safety

- All AI prompts are constructed server-side
- User input is sanitized before injection into prompts
- System prompts are hardcoded and not modifiable by users
- Response filtering for harmful content

### 8.2 Data Privacy

- Only send aggregated/anonymized data to Gemini
- Never send customer PII (phone numbers, names) to AI
- Store AI chat history with user consent
- Implement data retention policies for AI conversations

### 8.3 Rate Limiting

- Per-user AI request limits (20/minute)
- Token-based cost tracking
- Graceful degradation if API limits exceeded

---

## 9. Security Headers

```typescript
// next.config.ts — Security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];
```

---

## 10. Security Monitoring & Incident Response

### 10.1 Logging

| Event | Log Level | Storage |
|:---|:---|:---|
| Successful login | INFO | Application logs |
| Failed login attempt | WARN | Application logs + Audit table |
| Unauthorized access attempt | WARN | Application logs + Audit table |
| API rate limit exceeded | WARN | Application logs |
| Database error | ERROR | Application logs |
| Security rule violation | CRITICAL | Application logs + Alert |

### 10.2 Audit Trail

All CRUD operations on critical entities are logged to `AuditLog`:

```typescript
await prisma.auditLog.create({
  data: {
    storeId,
    userId: profile.id,
    action: 'product.update',
    entity: 'Product',
    entityId: productId,
    oldValues: previousProduct,
    newValues: updatedProduct,
    ipAddress: request.headers.get('x-forwarded-for'),
  },
});
```

### 10.3 Vulnerability Prevention Checklist

- [ ] SQL Injection → Prisma parameterized queries
- [ ] XSS → React auto-escaping + Content-Security-Policy
- [ ] CSRF → SameSite cookies + Supabase CSRF tokens
- [ ] Broken Auth → Supabase Auth + middleware + server validation
- [ ] Sensitive Data Exposure → Environment variables + server-only access
- [ ] Broken Access Control → RBAC middleware + API role checks
- [ ] Security Misconfiguration → Security headers + env validation
- [ ] Injection → Zod validation + input sanitization
- [ ] Insecure File Upload → Type/size validation + magic byte checking
