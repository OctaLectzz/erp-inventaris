# SECURITY — [Project Name]

> This file contains the application's security protocols and standards.

> **Version:** [v1.0.0]
> **Last Updated:** [YYYY-MM-DD]

---

## 1. Security Architecture

[Explanation of defense strategy, e.g., Defense-in-depth]

## 2. Authentication & Session

- **Auth Provider:** [e.g., NextAuth / Supabase Auth]
- **Session Strategy:** [JWT / Database Sessions, expiration time]
- **Password Rules:** [Password complexity requirements]

## 3. Authorization (RBAC)

- **Roles:** [List of roles, e.g., Admin, User]
- **Enforcement:** [How middleware or APIs check access rights]

## 4. Input Validation

- **Client-side:** [e.g., Zod + React Hook Form]
- **Server-side:** [Re-validation in API routes]

## 5. Data Security

- **Environment Variables:** [Rules for storing secret keys]
- **Database:** [Encryption, Row Level Security if using Supabase]

## 6. API Security

- **Rate Limiting:** [Request limits per IP]
- **CORS:** [Allowed domains]
