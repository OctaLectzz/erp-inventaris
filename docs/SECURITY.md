# SECURITY — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13

---

## 1. Security Overview

Inventra handles inventory data for a simulated business environment. While this is a take-home assessment, the application is designed with production-grade security practices. All security measures prioritize data integrity, access control, and secret protection.

**Key Principle:** Never trust the client. All authorization, validation, and data integrity checks happen server-side.

---

## 2. Authentication

### 2.1 Supabase Auth

- Authentication is managed by **Supabase Auth**.
- Session tokens are stored in HTTP-only cookies via `@supabase/ssr`.
- Sessions persist across page reloads.
- Session refresh happens automatically via middleware on every request.

### 2.2 Login Flow

```
1. User submits email/password via login form.
2. Server Action calls Supabase Auth signInWithPassword().
3. Supabase returns session tokens.
4. @supabase/ssr sets session cookies.
5. Middleware refreshes session on subsequent requests.
6. User is redirected to the dashboard.
```

### 2.3 Logout Flow

```
1. User triggers logout.
2. Server Action calls Supabase Auth signOut().
3. Session cookies are cleared.
4. User is redirected to the login page.
```

### 2.4 Public Registration

- **Public registration is DISABLED.**
- Only provisioned demo accounts can log in.
- Demo accounts are created via a seed script or Supabase dashboard.
- There is no sign-up page or public account creation endpoint.

### 2.5 Demo Account Provisioning

- Demo accounts are provisioned during initial setup (seed migration or manual creation in Supabase dashboard).
- Two demo accounts: one `admin_gudang` and one `owner`.
- Credentials are documented in the README for assessment reviewers.
- Demo accounts use strong-enough passwords for the assessment context but are not production secrets.

---

## 3. Authorization

### 3.1 Role-Based Access Control (RBAC)

| Role            | Code           | Capabilities                                                         |
| :-------------- | :------------- | :------------------------------------------------------------------- |
| Warehouse Admin | `admin_gudang` | Full CRUD on products, stock mutations, movement history view        |
| Business Owner  | `owner`        | Full read access, stock mutations, summary metrics, movement history |

### 3.2 Role Storage

- User roles are stored in the `profiles` table linked to `auth.users`.
- The role is read from the `profiles` table on the server, not from client-submitted data.
- Role changes require direct database access (no self-service role elevation).

### 3.3 Server-Side Role Checks

- **Middleware:** Checks session existence for all protected routes. Redirects unauthenticated users to the login page.
- **Server Actions / Route Handlers:** Verify the user's role before executing any business logic.
- **RLS Policies:** Database-level enforcement ensures users can only access rows permitted by their role.

### 3.4 Client-Side Role Rendering

- Navigation items and action buttons are conditionally rendered based on role.
- **This is cosmetic only.** Server-side enforcement is the authority.
- A user who manipulates the client-side UI will still be blocked by server-side and RLS checks.

### 3.5 Direct URL Protection

- **All `/(dashboard)` routes are protected by middleware.**
- Unauthenticated users attempting direct URL access are redirected to the login page.
- Authenticated users accessing routes outside their role's permissions receive a 403 response or redirect.

---

## 4. Row-Level Security (RLS)

### 4.1 RLS Policies (Planned)

| Table             | Policy                          | Description                                     |
| :---------------- | :------------------------------ | :---------------------------------------------- |
| `profiles`        | SELECT own profile              | Users can only read their own profile.          |
| `products`        | SELECT for authenticated        | All authenticated users can read products.      |
| `products`        | INSERT/UPDATE for authenticated | Authenticated users can create/update products. |
| `stock_movements` | SELECT for authenticated        | All authenticated users can read movements.     |
| `stock_movements` | INSERT for authenticated        | Authenticated users can create movements.       |

### 4.2 RLS Rules

- RLS is ENABLED on all tables.
- Policies use `auth.uid()` to identify the current user.
- No table allows anonymous (unauthenticated) access.
- DELETE operations are restricted or disabled at the RLS level for data integrity.
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — it must NEVER be exposed to the client.

---

## 5. Input Validation

### 5.1 Defense in Depth

Input validation happens at multiple layers:

```
Client (React Hook Form + Zod)  →  UX feedback
Server (Zod re-validation)      →  Authoritative validation
Database (constraints, checks)  →  Last line of defense
```

### 5.2 Validation Rules

- **All user input is validated on the server**, even when client-side validation exists.
- **All client-submitted data is treated as untrusted.**
- Quantities: must be positive integers. Zero, negative, fractional, empty, and malformed values are rejected.
- Stock OUT: quantity must not exceed current stock (checked against the database, not client-submitted values).
- SKU: must be unique and non-empty.
- Notes: must be non-empty strings.

### 5.3 What Is Never Trusted From the Client

- `stock_before` or `stock_after` values — always computed server-side.
- User role claims — always read from the `profiles` table server-side.
- Product stock levels — always read from the database.
- Disabled UI controls are NOT authorization — server-side checks are mandatory.

---

## 6. Environment Secrets

### 6.1 Secret Management

| Variable                        | Visibility  | Purpose                               |
| :------------------------------ | :---------- | :------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client-safe | Supabase project URL                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe | Supabase anonymous key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only | Bypasses RLS — admin operations only  |

### 6.2 Secret Rules

- `.env.local` is gitignored and NEVER committed.
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER appear in client-side code, client bundles, or browser-accessible routes.
- Only `NEXT_PUBLIC_` prefixed variables are included in the client bundle by Next.js.
- API keys for optional AI integration are server-only.
- `.env.example` contains variable names without values.

---

## 7. Data Integrity

### 7.1 Atomic Stock Mutations

- Stock updates and movement history insertion happen in a **single database transaction**.
- If any part of the mutation fails, the entire operation is rolled back.
- No partial state changes: stock and history are always consistent.

### 7.2 Stock Consistency Invariant

```
current_stock = opening_stock + SUM(stock_in) - SUM(stock_out)
```

- This invariant is enforced by atomic transactions, not by client-side calculations.
- The database has a CHECK constraint ensuring stock is never negative.

### 7.3 Concurrency

- Stock OUT operations use `WHERE stock >= quantity` in the UPDATE statement to prevent race conditions.
- If two concurrent requests try to reduce stock below zero, only one will succeed.

---

## 8. Traceability Limitations

As specified in the assessment brief:

> "Traceability in this test is browsable history for investigation, not a tamper-proof audit trail."

- Movement history records are created alongside stock mutations.
- History records are not cryptographically signed or append-only.
- Users with database access could theoretically modify history records.
- This is acceptable for the assessment scope but would need enhancement for production use.

---

## 9. Transport Security

- All communication with Supabase uses HTTPS (enforced by Supabase).
- The application is deployed over HTTPS (Vercel provides automatic TLS).
- No sensitive data is transmitted over unencrypted channels.

---

## 10. Error Handling Security

- Internal error details, stack traces, and database error messages are NEVER exposed to clients.
- Client-facing error messages use translation keys resolved to user-friendly text.
- Server-side errors are logged for debugging but not returned to the browser.
- Database query errors return a generic "operation failed" message.

---

## 11. Security Checklist

| Check                                         | Status                      |
| :-------------------------------------------- | :-------------------------- |
| Supabase Auth for session management          | Planned                     |
| HTTP-only session cookies via `@supabase/ssr` | Planned                     |
| Public registration disabled                  | Planned                     |
| Demo accounts provisioned via seed script     | Planned                     |
| RLS enabled on all tables                     | Planned                     |
| Server-side input validation (Zod)            | Planned                     |
| Server-side role checks                       | Planned                     |
| Middleware-based route protection             | Planned                     |
| Direct URL access protection                  | Planned                     |
| Environment secrets not in Git                | Configured (`.gitignore`)   |
| `SUPABASE_SERVICE_ROLE_KEY` server-only       | Planned                     |
| Atomic stock mutations                        | Planned                     |
| No client-trusted stock values                | Planned                     |
| Error details not exposed to clients          | Planned                     |
| HTTPS transport                               | Planned (Vercel + Supabase) |
