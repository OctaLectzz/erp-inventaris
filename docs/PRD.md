# PRD — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13
> **Author:** Development Team
> **Assessment:** PT. Syailendra Bumi Investama (DDistillers) — Take-Home Test FSE

---

## 1. Summary

Inventra is a Mini ERP Inventory Management application built as a take-home assessment for PT. Syailendra Bumi Investama (DDistillers). It enables warehouse administrators and business owners to manage product catalogs, record stock movements (IN/OUT), and trace inventory history. The application prioritizes data integrity, role-based access control, and clear traceability — not point-of-sale or customer-facing transactions.

---

## 2. Background

### Context

PT. Syailendra Bumi Investama (DDistillers) requires candidates to demonstrate full-stack engineering competence through a realistic inventory management scenario. The assessment evaluates business logic correctness, architecture quality, UI/UX design, security practices, and documentation — with a 40% weight on inventory business logic alone.

### Why Now

This is a time-boxed assessment (2×24 hours, estimated 12–14 hours of work). AI coding assistants are permitted but the candidate must fully understand all submitted code. The solution must be demonstrable with provisioned demo accounts and a staged Git history.

### Constraints

- **Timeline:** 2×24 hours from assignment.
- **AI Usage:** Permitted with mandatory disclosure of how AI was used, what was reviewed, and one example of an AI mistake and how it was corrected.
- **Stack:** Free choice (this project uses Next.js + Supabase).
- **Scope:** Inventory management only. POS, checkout, sales, and cash recording are explicitly excluded.

---

## 3. Objective

### Primary Objective

Build a functional, well-tested Mini ERP inventory application that demonstrates production-quality architecture, clean business logic, and thoughtful UI/UX design.

### Key Results

1. **Business logic correctness:** Stock mutations are atomic, validated, and traceable — stock consistency holds across all operations (stock = opening + total IN − total OUT).
2. **Code quality:** Clean TypeScript (strict mode, no `any`), layered architecture, shared Zod validation schemas, and meaningful unit tests.
3. **UI/UX:** Role-appropriate navigation, clear empty/error states, Indonesian default locale with English support, light/dark/system themes.
4. **Security:** Role-based access, protected routes, server-side validation, no exposed secrets.
5. **Documentation:** Comprehensive README, staged Git history, AI usage disclosure.

### Assessment Scoring Breakdown

| Aspect | Weight |
| :--- | :--- |
| Business logic (SKU, stock, mutations, history) | 40% |
| Architecture, state management, code quality, tests | 30% |
| UI/UX and summary (navigation, empty/error states) | 15% |
| Security and data handling | 10% |
| Documentation and Git history | 5% |

> Score 85+ = very strong. 70–84 = meets expectations. Below 70 = does not meet expectations.
> AI integration is bonus credit beyond the main scoring.

---

## 4. Market Segments

### Segment 1: Warehouse Administrator (`admin_gudang`)

- **Job:** Manage daily inventory operations — receiving goods, issuing stock, recording movements.
- **Problem:** Needs a reliable, simple interface to record stock changes with validation against current stock levels.
- **Constraint:** Must not be able to issue more stock than is available. Needs clear feedback on validation failures.

### Segment 2: Business Owner (`owner`)

- **Job:** Monitor inventory health — view catalogs, check stock levels, review movement history, and assess inventory value.
- **Problem:** Needs visibility into stock status, low-stock alerts, and summary metrics without direct mutation access (or with full access depending on role design).
- **Constraint:** Must see accurate, up-to-date data. Must not need technical knowledge to navigate the application.

---

## 5. Value Propositions

### For Warehouse Administrator

- **Who:** Warehouse admin managing incoming and outgoing goods.
- **Why:** Must track every stock change accurately with an audit trail; manual spreadsheets are error-prone.
- **What before:** Manual stock counting or spreadsheet tracking — prone to data entry errors, no validation, no movement history.
- **How:** Inventra provides validated stock IN/OUT forms with Zod schemas and React Hook Form, atomic database transactions, and automatic movement history recording.
- **What after:** Every stock change is validated, recorded, and traceable. Stock levels are always consistent.
- **Alternatives:** Manual spreadsheets or generic inventory tools. Inventra is purpose-built for this workflow with role-appropriate access and Indonesian language support.

### For Business Owner

- **Who:** Business owner needing inventory visibility.
- **Why:** Must understand stock health at a glance — what's low, what's the total value, what moved recently.
- **What before:** Asking warehouse staff for verbal updates or reviewing raw spreadsheets.
- **How:** Inventra provides a dashboard with summary metrics (unique SKUs, total units, low-stock items, estimated inventory value) and filterable movement history.
- **What after:** Real-time inventory visibility without requiring technical skill or interrupting warehouse operations.
- **Alternatives:** Generic ERP systems (overkill) or manual reports (delayed). Inventra is scoped and simple.

---

## 6. Solution

### 6.1 Mandatory Modules

#### A. Login & Role-Based Access

- Simulated login with provisioned demo accounts (no public registration).
- Two roles: `admin_gudang` and `owner`.
- Page access restricted per role, including direct URL access.
- Session persists after normal page reload.
- Supabase Auth for session management.

#### B. Catalog & SKU

- Initial product data sourced from `https://dummyjson.com/products`.
- Each product has: unique SKU, name, category, unit, reference price (converted to IDR), and stock quantity.
- Inventory data persists across page reloads (Supabase PostgreSQL).
- Explicit demo data reset mechanism available.

#### C. Stock Mutations (IN/OUT)

- Record stock IN (quantity added) and stock OUT (quantity removed).
- Quantities must be positive integers. Zero, negative, fractional, and malformed values are rejected.
- Stock OUT cannot exceed available stock.
- Failed validation must not change stock or create history records.
- Stock update and movement history insertion are atomic (single transaction).
- Required note/reference for each mutation.

#### D. Movement History & Traceability

- Movement records contain: timestamp, product/SKU, movement type (IN/OUT), quantity, stock before, stock after, user who performed the action, and note/reference.
- Filterable by SKU, movement type, and date range.
- Traceability is a browsable history log, not a tamper-proof audit trail.

#### E. Inventory Summary

- Summary metrics: unique SKU count, total units across all products, low-stock item count, estimated inventory value.
- Low stock threshold: strictly below 5 units.
- Price conversion: DummyJSON USD prices converted to IDR.

### 6.2 Optional Module

#### F. AI Integration (Bonus)

- AI-powered stock condition summary.
- API key used via server-side only.
- Free/trial API (e.g., DAHL with 100M free tokens).
- Not completing this module does not reduce the score.

### 6.3 Validation Rules

| Input | Accepted | Rejected |
| :--- | :--- | :--- |
| Quantity | Positive integers (1, 2, 10, …) | 0, -1, 3.5, null, undefined, "" |
| Stock OUT quantity | ≤ current stock | > current stock |
| SKU | Unique, non-empty string | Duplicate, empty |
| Note/reference | Non-empty string | Empty |

### 6.4 Stock Consistency Rule

```
current_stock = opening_stock + SUM(stock_in) - SUM(stock_out)
```

This invariant must hold at all times. The server is the authority — clients never compute or submit `stock_before` or `stock_after`.

### 6.5 Example Scenarios (from Assessment Brief)

| Scenario | Expected Result |
| :--- | :--- |
| Receive 10 units, opening stock 4 | Stock = 14; history records 4 → 14 |
| Issue 3 units from stock 14 | Stock = 11; history records 14 → 11 |
| Issue 12 units from stock 11 | Rejected; stock and history unchanged |
| Quantity: 0, negative, or decimal | Rejected; no changes |
| Reload after mutation; access different role page | Data and session intact; access per role |

---

## 7. Release

### Deliverables

1. **Repository** with staged, logical Git commit history.
2. **README** with setup instructions, demo accounts, architecture summary, assumptions, and AI usage disclosure.
3. **Unit tests** covering SKU validation, quantity validation, stock boundaries, stock calculations, and inventory valuation.
4. **Live demo link** (if available).

### Non-Functional Requirements

- Indonesian as default locale; English as secondary.
- Light, dark, and system theme support.
- Responsive design (mobile-first).
- No exposed secrets in client bundle or Git history.

### Assumptions and Open Questions

- **Assumption:** DummyJSON API is available and stable for initial data import.
- **Assumption:** IDR conversion rate for DummyJSON prices is fixed at a reasonable rate (documented in code).
- **Assumption:** Demo accounts are provisioned via seed script, not through a public registration flow.
- **Open:** Exact role-based page access matrix (which pages does `owner` see vs `admin_gudang`?) — will be defined in Phase 5 based on assessment brief context.
- **Open:** Whether `owner` can also perform stock mutations or is read-only — defaulting to full access for both roles (both can mutate), with UI navigation differences.
