# TESTING — NexPOS

> **Version:** 1.0.0-dev
> **Last Updated:** 2026-06-04

---

## 1. Testing Strategy

### 1.1 Testing Pyramid

```
              ╱╲
             ╱  ╲
            ╱ E2E╲         ← Playwright (Critical user flows)
           ╱──────╲
          ╱ Integr. ╲      ← API route tests, Component integration
         ╱────────────╲
        ╱    Unit       ╲   ← Utils, Services, Business Logic
       ╱──────────────────╲
```

### 1.2 Coverage Priorities

| Priority      | Area                                                  | Target Coverage |
| :------------ | :---------------------------------------------------- | :-------------- |
| P0 (Critical) | Business logic (order calculations, stock management) | ≥ 90%           |
| P0 (Critical) | API routes (auth, CRUD, webhooks)                     | ≥ 85%           |
| P1 (High)     | Utility functions (formatters, validators)            | ≥ 95%           |
| P1 (High)     | Zod schemas (validation logic)                        | ≥ 90%           |
| P2 (Medium)   | React hooks (custom hooks)                            | ≥ 80%           |
| P2 (Medium)   | UI Components (interactive behavior)                  | ≥ 70%           |
| P3 (Low)      | Static UI Components (pure rendering)                 | As needed       |

---

## 2. Testing Tools

### 2.1 Tool Stack

| Tool                            | Purpose                        | Config File            |
| :------------------------------ | :----------------------------- | :--------------------- |
| **Vitest**                      | Unit & integration test runner | `vitest.config.ts`     |
| **React Testing Library**       | Component testing              | (via Vitest)           |
| **MSW (Mock Service Worker)**   | API mocking                    | `src/mocks/`           |
| **Playwright**                  | End-to-end testing             | `playwright.config.ts` |
| **@testing-library/user-event** | User interaction simulation    | (via RTL)              |
| **Faker.js**                    | Test data generation           | (per test file)        |

### 2.2 Installation

```bash
# Unit & Integration Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw @faker-js/faker

# E2E Testing
npm install -D @playwright/test
npx playwright install
```

### 2.3 Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/tests/",
        "src/components/ui/", // shadcn components (pre-tested)
        "**/*.d.ts",
        "src/messages/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

## 3. Test File Structure

### 3.1 File Naming

All test files are colocated next to the file they test:

```
src/
├── utils/
│   ├── format-currency.ts
│   └── format-currency.test.ts     ← Unit test
├── services/
│   ├── product.service.ts
│   └── product.service.test.ts     ← Integration test
├── hooks/
│   ├── use-products.ts
│   └── use-products.test.ts        ← Hook test
├── components/
│   ├── products/
│   │   ├── product-form.tsx
│   │   └── product-form.test.tsx   ← Component test
├── app/
│   └── api/
│       └── products/
│           ├── route.ts
│           └── route.test.ts       ← API route test
└── tests/
    ├── setup.ts                    ← Global test setup
    ├── factories/                  ← Test data factories
    │   ├── product.factory.ts
    │   ├── category.factory.ts
    │   ├── order.factory.ts
    │   └── user.factory.ts
    ├── mocks/                      ← MSW handlers
    │   ├── handlers.ts
    │   └── server.ts
    └── e2e/                        ← Playwright tests
        ├── auth.spec.ts
        ├── products.spec.ts
        ├── orders.spec.ts
        └── whatsapp.spec.ts
```

---

## 4. Unit Tests

### 4.1 Utility Function Tests

```typescript
// src/utils/format-currency.test.ts
import { describe, it, expect } from "vitest";
import { formatCurrency } from "./format-currency";

describe("formatCurrency", () => {
  it("should format IDR currency correctly", () => {
    expect(formatCurrency(50000, "IDR")).toBe("Rp 50.000");
  });

  it("should handle zero value", () => {
    expect(formatCurrency(0, "IDR")).toBe("Rp 0");
  });

  it("should handle decimal values", () => {
    expect(formatCurrency(50000.5, "IDR")).toBe("Rp 50.001");
  });

  it("should handle negative values", () => {
    expect(formatCurrency(-50000, "IDR")).toBe("-Rp 50.000");
  });
});
```

### 4.2 Schema Validation Tests

```typescript
// src/schemas/product.schema.test.ts
import { describe, it, expect } from "vitest";
import { createProductSchema } from "./product.schema";

describe("createProductSchema", () => {
  it("should validate a valid product", () => {
    const result = createProductSchema.safeParse({
      nameId: "Burger Deluxe",
      nameEn: "Deluxe Burger",
      sku: "BRG-001",
      price: 45000,
      stock: 25,
      categoryId: "uuid-here",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty product name", () => {
    const result = createProductSchema.safeParse({
      nameId: "",
      nameEn: "Deluxe Burger",
      sku: "BRG-001",
      price: 45000,
      stock: 25,
      categoryId: "uuid-here",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative price", () => {
    const result = createProductSchema.safeParse({
      nameId: "Burger",
      nameEn: "Burger",
      sku: "BRG-001",
      price: -100,
      stock: 25,
      categoryId: "uuid-here",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative stock", () => {
    const result = createProductSchema.safeParse({
      nameId: "Burger",
      nameEn: "Burger",
      sku: "BRG-001",
      price: 45000,
      stock: -5,
      categoryId: "uuid-here",
    });
    expect(result.success).toBe(false);
  });
});
```

### 4.3 Business Logic Tests

```typescript
// src/utils/generate-order-id.test.ts
import { describe, it, expect, vi } from "vitest";
import { generateOrderId } from "./generate-order-id";

describe("generateOrderId", () => {
  it("should generate order ID in correct format", () => {
    vi.setSystemTime(new Date("2026-06-04"));
    const orderId = generateOrderId(1);
    expect(orderId).toBe("NX-20260604-0001");
    vi.useRealTimers();
  });

  it("should pad sequence number to 4 digits", () => {
    vi.setSystemTime(new Date("2026-06-04"));
    const orderId = generateOrderId(42);
    expect(orderId).toBe("NX-20260604-0042");
    vi.useRealTimers();
  });
});
```

---

## 5. Integration Tests

### 5.1 API Route Tests

```typescript
// src/app/api/products/route.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import { createProductFactory } from "@/tests/factories/product.factory";

// Mock Prisma
vi.mock("@/lib/prisma");

// Mock Supabase Auth
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: "test-user-id" } },
      })),
    },
  })),
}));

describe("Products API", () => {
  describe("GET /api/products", () => {
    it("should return paginated products", async () => {
      const mockProducts = createProductFactory.buildList(5);
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
      vi.mocked(prisma.product.count).mockResolvedValue(5);

      const request = new Request(
        "http://localhost/api/products?page=1&pageSize=10",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(5);
    });

    it("should return 401 for unauthenticated requests", async () => {
      // Override mock to return no user
      // ...test implementation
    });
  });

  describe("POST /api/products", () => {
    it("should create a product with valid data", async () => {
      // ...test implementation
    });

    it("should return 400 for invalid data", async () => {
      // ...test implementation
    });

    it("should return 403 for operators", async () => {
      // ...test implementation
    });
  });
});
```

### 5.2 Hook Tests

```typescript
// src/hooks/use-products.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from './use-products';

function createWrapper(): React.FC<{ children: React.ReactNode }> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useProducts', () => {
  it('should fetch products successfully', async () => {
    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

---

## 6. Component Tests

### 6.1 Component Testing Approach

```typescript
// src/components/products/product-form.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from './product-form';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ProductForm', () => {
  it('should render all required fields', () => {
    render(<ProductForm onSubmit={vi.fn()} categories={[]} />);

    expect(screen.getByLabelText(/products.nameId/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/products.nameEn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/products.price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/products.stock/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} categories={[]} />);

    await user.click(screen.getByRole('button', { name: /common.save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/validation.required/i)).toBeInTheDocument();
  });

  it('should call onSubmit with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} categories={mockCategories} />);

    await user.type(screen.getByLabelText(/products.nameId/i), 'Burger');
    await user.type(screen.getByLabelText(/products.nameEn/i), 'Burger');
    await user.type(screen.getByLabelText(/products.price/i), '45000');
    await user.type(screen.getByLabelText(/products.stock/i), '25');
    // ...select category

    await user.click(screen.getByRole('button', { name: /common.save/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
```

---

## 7. End-to-End Tests

### 7.1 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 7.2 E2E Test Scenarios

```typescript
// src/tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/id/login");

    await page.fill('[data-testid="email-input"]', "admin@nexpos.test");
    await page.fill('[data-testid="password-input"]', "TestPass123!");
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/id/login");

    await page.fill('[data-testid="email-input"]', "wrong@email.com");
    await page.fill('[data-testid="password-input"]', "wrongpass");
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/id/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

// src/tests/e2e/products.spec.ts
test.describe("Product Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/id/login");
    await page.fill('[data-testid="email-input"]', "admin@nexpos.test");
    await page.fill('[data-testid="password-input"]', "TestPass123!");
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/dashboard/);
  });

  test("should create a new product", async ({ page }) => {
    await page.goto("/id/products");
    await page.click('[data-testid="add-product-button"]');

    await page.fill('[data-testid="product-name-id"]', "Burger Baru");
    await page.fill('[data-testid="product-name-en"]', "New Burger");
    await page.fill('[data-testid="product-price"]', "45000");
    await page.fill('[data-testid="product-stock"]', "25");
    // Select category...

    await page.click('[data-testid="save-button"]');

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });
});
```

---

## 8. Test Data

### 8.1 Factory Pattern

```typescript
// src/tests/factories/product.factory.ts
import { faker } from "@faker-js/faker";

import type { Product } from "@/types/product.types";

export function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: faker.string.uuid(),
    storeId: faker.string.uuid(),
    categoryId: faker.string.uuid(),
    sku: faker.string.alphanumeric(8).toUpperCase(),
    nameId: faker.commerce.productName(),
    nameEn: faker.commerce.productName(),
    descriptionId: faker.commerce.productDescription(),
    descriptionEn: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10000, max: 500000 })),
    discountPrice: null,
    costPrice: null,
    stock: faker.number.int({ min: 0, max: 100 }),
    minStockThreshold: 5,
    unit: "pcs",
    weight: null,
    status: "ACTIVE",
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export const createProductFactory = {
  build: createMockProduct,
  buildList: (count: number, overrides?: Partial<Product>): Product[] =>
    Array.from({ length: count }, () => createMockProduct(overrides)),
};
```

---

## 9. NPM Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## 10. CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```
