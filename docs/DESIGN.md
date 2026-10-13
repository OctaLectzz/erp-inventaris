# DESIGN — Inventra

> **Version:** 0.1.0-dev
> **Last Updated:** 2026-10-13

---

## 1. Design Philosophy

Inventra follows a **Professional Minimal** design philosophy appropriate for a business inventory management tool:

- **Clarity:** Clean layouts with clear visual hierarchy for data-heavy screens.
- **Efficiency:** Task-oriented interfaces that minimize clicks for daily warehouse operations.
- **Trust:** Consistent, predictable patterns that convey reliability for business-critical data.
- **Accessibility:** High contrast ratios, clear focus indicators, keyboard navigation support.
- **Bilingual:** All UI elements support Indonesian (default) and English.

---

## 2. Brand Identity

| Token | Value | Usage |
| :--- | :--- | :--- |
| **Primary Navy** | `#0F2D4A` | Navigation, headings, primary actions, brand identity |
| **Accent Teal** | `#14B8A6` | Call-to-action buttons, links, active states, success indicators |
| **Pale Surface** | `#E6F4F2` | Subtle background tints, card highlights, hover states |
| **Main Text** | `#1F2937` | Body text, labels, descriptions |
| **Font** | Inter | All UI text (headings, body, labels, data) |

---

## 3. Color System

### 3.1 Design Tokens (CSS Variables)

All colors are defined as CSS variables in `src/app/globals.css` using oklch values for shadcn/ui compatibility. **Never hardcode hex/rgb values in components.**

The current `globals.css` uses shadcn's `mist` base color with oklch values. During Phase 1, the brand tokens (navy, teal, surface) will be mapped to the shadcn CSS variable system:

```css
/* ─── Planned Brand Token Mapping ─────────────── */
:root {
  /* Primary → Navy (#0F2D4A) */
  --primary: /* oklch equivalent of #0F2D4A */;
  --primary-foreground: /* white or light contrast */;

  /* Accent/Secondary → Teal (#14B8A6) */
  --accent: /* oklch equivalent of #14B8A6 */;
  --accent-foreground: /* dark contrast */;

  /* Surfaces */
  --background: /* white */;
  --foreground: /* oklch equivalent of #1F2937 */;
  --muted: /* oklch equivalent of #E6F4F2 */;

  /* Semantic */
  --destructive: /* red for errors/delete */;
  --success: /* green for success states */;
  --warning: /* amber for warnings */;
}
```

### 3.2 Semantic Color Usage

| Semantic Role | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `--primary` | Navy `#0F2D4A` | Lightened navy | Primary buttons, navigation, headings |
| `--primary-foreground` | White | Dark text | Text on primary backgrounds |
| `--accent` | Teal `#14B8A6` | Teal (adjusted) | CTAs, links, active indicators |
| `--background` | White | Dark navy | Page background |
| `--foreground` | `#1F2937` | Light gray | Body text |
| `--muted` | `#E6F4F2` | Dark surface | Subtle backgrounds, card tints |
| `--destructive` | Red | Light red | Error states, delete actions |
| `--border` | Light gray | Dark border | Borders, dividers |
| `--card` | White | Dark card | Card backgrounds |

### 3.3 Stock Status Colors

| Status | Color | Usage |
| :--- | :--- | :--- |
| **Low Stock** (< 5) | `--destructive` (red) | Badge, row highlight, alert |
| **Normal Stock** (5–49) | `--foreground` (default) | Standard display |
| **High Stock** (50+) | `--accent` (teal) | Optional positive indicator |
| **Stock IN** | Teal/green | Movement type badge |
| **Stock OUT** | Amber/orange | Movement type badge |

### 3.4 Color Rules

- All component colors MUST use CSS variables or Tailwind token classes.
- NEVER hardcode hex, rgb, or hsl values in component files.
- Always test both light and dark modes.
- Use shadcn's built-in `cn()` for conditional class application.

---

## 4. Typography

### 4.1 Font Stack

| Font | Variable | Usage |
| :--- | :--- | :--- |
| **Inter** | `--font-sans` | All UI text (primary font) |
| **Geist Mono** | `--font-geist-mono` | Code snippets, SKU display, monospaced data |

Inter is already configured in `src/app/layout.tsx` via `next/font/google`.

### 4.2 Type Scale

| Element | Tailwind Class | Weight | Usage |
| :--- | :--- | :--- | :--- |
| Page Title | `text-2xl` / `text-3xl` | `font-bold` | Page headings (h1) |
| Section Title | `text-xl` | `font-semibold` | Section headings (h2) |
| Card Title | `text-lg` | `font-semibold` | Card/dialog headings (h3) |
| Body | `text-sm` / `text-base` | `font-normal` | Paragraphs, descriptions |
| Label | `text-sm` | `font-medium` | Form labels, table headers |
| Caption | `text-xs` | `font-normal` | Timestamps, secondary info |
| SKU / Code | `text-sm font-mono` | `font-medium` | SKU values, product codes |
| Metric Value | `text-3xl` / `text-4xl` | `font-bold` | Dashboard summary numbers |

### 4.3 Typography Rules

- Use the type scale consistently. Do not invent ad-hoc font sizes.
- Use `font-mono` for SKU values and numeric codes.
- Large metric numbers on the dashboard use `text-3xl font-bold` or larger.
- All text must be legible in both light and dark modes.

---

## 5. Spacing and Layout

### 5.1 Spacing Scale

Use Tailwind's default spacing scale. Preferred spacers:

| Token | Value | Usage |
| :--- | :--- | :--- |
| `gap-1` / `p-1` | 4px | Tight internal spacing |
| `gap-2` / `p-2` | 8px | Compact element spacing |
| `gap-3` / `p-3` | 12px | Standard form field gaps |
| `gap-4` / `p-4` | 16px | Card padding, section gaps |
| `gap-6` / `p-6` | 24px | Page section spacing |
| `gap-8` / `p-8` | 32px | Major section separation |

### 5.2 Layout Patterns

| Pattern | Implementation |
| :--- | :--- |
| **Dashboard Layout** | Sidebar (collapsible) + main content area |
| **Content Area** | Max-width container with horizontal padding |
| **Card Grid** | CSS Grid with responsive columns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) |
| **Data Table** | Full-width with horizontal scroll on mobile |
| **Form Layout** | Single-column stack with consistent label/input spacing |

### 5.3 Responsive Breakpoints

| Breakpoint | Tailwind | Usage |
| :--- | :--- | :--- |
| Mobile | Default (< 640px) | Single column, collapsed sidebar |
| Tablet | `sm:` (640px) | Two-column grids |
| Desktop | `md:` (768px) | Sidebar visible, multi-column layouts |
| Wide | `lg:` (1024px) | Full dashboard layout |
| Ultra-wide | `xl:` (1280px) | Wider content area |

---

## 6. Component Patterns

### 6.1 Buttons

| Variant | Usage | Example |
| :--- | :--- | :--- |
| `default` (primary) | Primary actions | "Record Stock IN", "Save" |
| `secondary` | Secondary actions | "Cancel", "Reset Filters" |
| `destructive` | Dangerous actions | "Delete", "Reset Demo Data" |
| `outline` | Tertiary actions | "Export", "View Details" |
| `ghost` | Inline actions | Icon buttons, table row actions |

### 6.2 Forms

- Use shadcn `<Form>` components with React Hook Form integration.
- Labels always above inputs (stacked layout).
- Error messages appear below the input field in `text-destructive text-xs`.
- Required fields marked with a subtle indicator.
- Submit button disabled during form submission (loading state).

### 6.3 Data Tables

- Use a consistent data table component built on shadcn's `<Table>`.
- Sortable column headers where appropriate.
- Pagination for large datasets.
- Empty state with a clear message and optional action.
- Row actions via dropdown menu or inline buttons.
- Low-stock rows highlighted with a subtle background tint.

### 6.4 Cards (Dashboard Metrics)

- Each metric card shows: icon, label, value, optional trend indicator.
- Consistent card sizing across the grid.
- Use `--card` / `--card-foreground` for background and text.

### 6.5 Badges

| Badge | Color | Usage |
| :--- | :--- | :--- |
| Stock IN | Teal/green variant | Movement type indicator |
| Stock OUT | Orange/amber variant | Movement type indicator |
| Low Stock | Red/destructive variant | Stock status warning |
| Role badge | Muted variant | User role display |

### 6.6 Toast Notifications

- Use shadcn's toast system (sonner when installed).
- Success: brief confirmation message.
- Error: translated error message.
- Position: top-right.

---

## 7. Page Layouts

### 7.1 Login Page

- Centered card on a subtle background.
- Application logo/name at the top.
- Email and password fields.
- Demo account credentials displayed below the form.
- Language and theme toggles accessible.

### 7.2 Dashboard

- Summary metrics in a card grid (SKU count, total units, low-stock count, inventory value).
- Recent stock movements table below metrics.
- Quick action buttons (Stock IN, Stock OUT).

### 7.3 Inventory Catalog

- Searchable, filterable product table.
- Columns: SKU, Name, Category, Unit, Price (IDR), Stock, Status.
- Low-stock items highlighted.
- Actions: View details, Stock IN, Stock OUT.

### 7.4 Stock Movement Form

- Product selector.
- Movement type (IN/OUT) toggle.
- Quantity input with real-time validation.
- Current stock display (read-only, fetched from server).
- Note/reference field (required).
- Submit with confirmation.

### 7.5 Movement History

- Filterable data table.
- Filters: SKU search, movement type (IN/OUT/All), date range.
- Columns: Timestamp, Product/SKU, Type, Quantity, Stock Before → After, User, Note.
- Pagination.

---

## 8. Iconography

- Use `lucide-react` for all icons (already installed).
- Consistent icon sizing: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-6 w-6` for navigation.
- Use semantic icons (e.g., `PackagePlus` for Stock IN, `PackageMinus` for Stock OUT, `AlertTriangle` for low stock).

---

## 9. Motion and Animation

- Keep animations subtle and purposeful.
- Use `tw-animate-css` (already installed) for standard transitions.
- Page transitions: minimal or none (server components).
- Interactive feedback: hover state transitions (150ms), focus ring animations.
- Loading states: skeleton placeholders for data tables and cards.
- Toast notifications: slide-in from top-right.

---

## 10. Accessibility

- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text.
- Focus indicators: visible focus ring on all interactive elements.
- Keyboard navigation: all interactive elements reachable via Tab.
- Screen reader support: proper ARIA labels, semantic HTML.
- Form errors: associated with inputs via `aria-describedby`.
- Skip-to-content link for keyboard users.
