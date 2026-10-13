# TESTING — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13

---

## 1. Testing Strategy

Inventra uses **Vitest** as its primary testing framework. Testing priorities align with the assessment scoring: business logic correctness (40%) and architecture/code quality (30%) together account for 70% of the grade. Tests focus on verifiable business logic, not superficial UI coverage.

### 1.1 Testing Pyramid

```
          ┌─────────────┐
          │   E2E Tests  │  (Out of scope for this assessment)
          │  (Playwright) │
        ┌─┴─────────────┴─┐
        │ Integration Tests │  Database operations (with test env)
      ┌─┴───────────────────┴─┐
      │     Unit Tests         │  Zod schemas, business logic,
      │  (Primary focus)       │  calculations, role checks
      └───────────────────────┘
```

### 1.2 Priority Order

1. **Zod validation schemas** — valid and invalid inputs, boundary cases.
2. **Stock mutation logic** — calculations, boundaries, atomicity expectations.
3. **SKU generation and validation** — uniqueness, format.
4. **Quantity validation** — positive integers, rejection of zero/negative/fractional.
5. **Inventory valuation calculations** — price conversion, total value.
6. **Role permission checks** — authorization logic.
7. **Integration tests** — database operations (only with a test environment).

---

## 2. Framework Configuration

### 2.1 Current Status

- `vitest` is installed as a dev dependency (`^3.2.7`).
- `@vitejs/plugin-react` is installed (`^4.7.0`).
- **Test configuration is not yet created** — this will be set up in Phase 6.

### 2.2 Planned Configuration

```typescript
// vitest.config.ts (planned)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // Use 'jsdom' for component tests
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      include: ['src/schemas/**', 'src/services/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2.3 Planned npm Scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

---

## 3. Test Categories

### 3.1 Zod Schema Tests

Test all validation schemas in `src/schemas/` for correctness:

```typescript
// Example: src/schemas/__tests__/stock-movement-schema.test.ts (planned)
import { describe, it, expect } from 'vitest'
import { stockMovementSchema } from '../stock-movement-schema'

describe('stockMovementSchema', () => {
  // Valid inputs
  it('accepts valid stock IN', () => {
    const result = stockMovementSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'IN',
      quantity: 10,
      note: 'Received from supplier',
    })
    expect(result.success).toBe(true)
  })

  // Boundary: quantity = 1 (minimum valid)
  it('accepts quantity of 1', () => {
    const result = stockMovementSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'IN',
      quantity: 1,
      note: 'Single unit',
    })
    expect(result.success).toBe(true)
  })

  // Invalid: quantity = 0
  it('rejects quantity of 0', () => {
    const result = stockMovementSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'IN',
      quantity: 0,
      note: 'Should fail',
    })
    expect(result.success).toBe(false)
  })

  // Invalid: negative quantity
  it('rejects negative quantity', () => {
    const result = stockMovementSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'OUT',
      quantity: -5,
      note: 'Should fail',
    })
    expect(result.success).toBe(false)
  })

  // Invalid: fractional quantity
  it('rejects fractional quantity', () => {
    const result = stockMovementSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'IN',
      quantity: 3.5,
      note: 'Should fail',
    })
    expect(result.success).toBe(false)
  })

  // Invalid: empty note
  it('rejects empty note', () => {
    const result = stockMovementSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'IN',
      quantity: 5,
      note: '',
    })
    expect(result.success).toBe(false)
  })

  // Invalid: missing fields
  it('rejects missing required fields', () => {
    const result = stockMovementSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
```

### 3.2 Stock Mutation Logic Tests

Test the service-layer business logic for stock calculations:

```typescript
// Example test plan for inventory-service (planned)
describe('Stock Mutation Logic', () => {
  // Stock IN
  it('increases stock correctly on stock IN')
  it('records correct stock_before and stock_after for IN')

  // Stock OUT
  it('decreases stock correctly on stock OUT')
  it('records correct stock_before and stock_after for OUT')

  // Boundary: stock OUT = available stock
  it('allows stock OUT equal to available stock')

  // Boundary: stock OUT > available stock
  it('rejects stock OUT exceeding available stock')
  it('does not modify stock when OUT is rejected')
  it('does not create movement record when OUT is rejected')

  // Consistency
  it('maintains stock = opening + SUM(IN) - SUM(OUT)')
})
```

### 3.3 SKU Validation Tests

```typescript
// Example test plan (planned)
describe('SKU Validation', () => {
  it('generates unique SKUs')
  it('rejects empty SKU')
  it('rejects duplicate SKU')
  it('accepts valid SKU format')
})
```

### 3.4 Inventory Valuation Tests

```typescript
// Example test plan (planned)
describe('Inventory Valuation', () => {
  it('calculates total value correctly (sum of price × stock)')
  it('handles zero stock items')
  it('handles zero price items')
  it('converts DummyJSON USD prices to IDR')
})
```

### 3.5 Role Permission Tests

```typescript
// Example test plan (planned)
describe('Role Permissions', () => {
  it('allows admin_gudang to perform stock mutations')
  it('allows owner to view inventory')
  it('allows owner to perform stock mutations')
  it('denies unauthenticated access to protected routes')
})
```

### 3.6 React Hook Form Integration Tests

When useful, test that Zod schemas integrate correctly with React Hook Form:

```typescript
// Example: verify schema + resolver integration (planned)
describe('Form Validation Integration', () => {
  it('resolver correctly maps Zod errors to form field errors')
  it('form submits successfully with valid data')
  it('form displays field-level errors for invalid data')
})
```

> These tests are lower priority than pure business logic tests and may require `jsdom` environment.

---

## 4. Integration Tests

### 4.1 Database Integration Tests

Integration tests verify that service-layer logic works correctly with a real database. These tests require a **test Supabase environment** (separate project or local Supabase):

```typescript
// Example test plan (planned — requires test database)
describe('Database Integration', () => {
  it('inserts a product and retrieves it')
  it('records a stock movement atomically')
  it('rejects stock OUT exceeding available stock at database level')
  it('enforces non-negative stock constraint')
  it('RLS prevents unauthenticated access')
})
```

### 4.2 Integration Test Rules

- Integration tests are run **only** when a test database environment is available.
- **NEVER write to a production database during tests.**
- Each test should clean up its own data (or use transactions that roll back).
- Integration tests are optional for the assessment — unit tests take priority.

---

## 5. What NOT to Test

- Simple presentational components with no logic.
- shadcn/ui component internals.
- Third-party library behavior (Supabase client, next-intl, next-themes).
- CSS/styling output.
- Framework routing mechanics.

---

## 6. Test File Organization

```
src/
├── schemas/
│   ├── product-schema.ts
│   ├── product-schema.test.ts          # Schema unit tests
│   ├── stock-movement-schema.ts
│   └── stock-movement-schema.test.ts   # Schema unit tests
├── services/
│   ├── inventory-service.ts
│   ├── inventory-service.test.ts       # Business logic unit tests
│   ├── catalog-service.ts
│   └── catalog-service.test.ts         # Import logic tests
└── types/
    └── ...
```

> Tests are co-located with their source files for discoverability. Alternative: a `__tests__/` directory within each feature folder.

---

## 7. Test Data Conventions

- Use factory functions to create consistent test data.
- Do NOT use random data in tests — use deterministic values.
- Define test constants for boundary values:

```typescript
// Example test constants (planned)
export const TEST_PRODUCT = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  sku: 'TST-001',
  name: 'Test Product',
  category: 'Test',
  unit: 'pcs',
  price: 150000, // IDR
  stock: 10,
}

export const LOW_STOCK_THRESHOLD = 5
```

---

## 8. Test Commands

```bash
# Run all tests (planned — not yet configured)
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run a specific test file
npx vitest run src/schemas/stock-movement-schema.test.ts
```

---

## 9. Honesty Policy

- Do NOT invent test results or coverage percentages.
- Do NOT claim tests pass unless they have been actually run and verified.
- Document which tests are planned vs. implemented.
- If tests fail, report the failure honestly and fix it.
