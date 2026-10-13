# DESIGN — NexPOS

> **Version:** 1.0.0-dev
> **Last Updated:** 2026-06-04

---

## 1. Design Philosophy

NexPOS follows a **Modern Minimalist** design philosophy with emphasis on:

- **Clarity:** Clean layouts with clear visual hierarchy
- **Efficiency:** Task-oriented interfaces that minimize clicks
- **Delight:** Subtle animations and micro-interactions that make the experience feel premium
- **Consistency:** Unified design language across all pages and components
- **Accessibility:** WCAG 2.1 AA compliant, inclusive design

---

## 2. Color System

### 2.1 Design Tokens (CSS Variables)

All colors are defined as CSS variables in `src/app/globals.css` using HSL values for shadcn/ui compatibility. **Never hardcode hex/rgb values in components.**

```css
/* ─── Light Mode (Default) ─────────────────────────── */
:root {
  /* Brand Colors */
  --primary: 222 47% 31%; /* Deep Navy Blue (#2A3F5F) */
  --primary-foreground: 210 40% 98%;

  --secondary: 174 62% 47%; /* Teal Accent (#2DB89A) */
  --secondary-foreground: 210 40% 98%;

  --accent: 38 92% 60%; /* Warm Amber (#F5A623) */
  --accent-foreground: 222 47% 11%;

  /* Semantic Colors */
  --destructive: 0 84% 60%; /* Red for errors/delete */
  --destructive-foreground: 0 0% 100%;

  --success: 142 76% 36%; /* Green for success states */
  --success-foreground: 0 0% 100%;

  --warning: 38 92% 50%; /* Amber for warnings */
  --warning-foreground: 222 47% 11%;

  --info: 199 89% 48%; /* Sky blue for info */
  --info-foreground: 0 0% 100%;

  /* Surface Colors */
  --background: 0 0% 100%; /* Pure White */
  --foreground: 222 47% 11%; /* Near Black */

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  --muted: 210 40% 96%; /* Light Gray */
  --muted-foreground: 215 16% 47%;

  /* Border & Input */
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 222 47% 31%;

  /* Sidebar */
  --sidebar-background: 220 30% 97%;
  --sidebar-foreground: 222 47% 31%;
  --sidebar-primary: 222 47% 31%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 174 62% 95%;
  --sidebar-accent-foreground: 174 62% 30%;
  --sidebar-border: 214 32% 91%;
  --sidebar-ring: 222 47% 31%;

  /* Chart Colors */
  --chart-1: 222 47% 31%;
  --chart-2: 174 62% 47%;
  --chart-3: 38 92% 60%;
  --chart-4: 142 76% 36%;
  --chart-5: 199 89% 48%;

  /* Misc */
  --radius: 0.625rem; /* 10px border-radius */
}

/* ─── Dark Mode ────────────────────────────────────── */
.dark {
  /* Brand Colors */
  --primary: 199 89% 60%; /* Bright Teal Blue */
  --primary-foreground: 222 47% 11%;

  --secondary: 174 62% 55%; /* Teal Accent (lighter) */
  --secondary-foreground: 222 47% 11%;

  --accent: 38 92% 65%; /* Warm Amber (brighter) */
  --accent-foreground: 222 47% 11%;

  /* Semantic Colors */
  --destructive: 0 62% 55%;
  --destructive-foreground: 0 0% 100%;

  --success: 142 76% 46%;
  --success-foreground: 0 0% 100%;

  --warning: 38 92% 55%;
  --warning-foreground: 222 47% 11%;

  --info: 199 89% 58%;
  --info-foreground: 222 47% 11%;

  /* Surface Colors */
  --background: 222 47% 7%; /* Very Dark Navy */
  --foreground: 210 40% 96%;

  --card: 222 47% 10%;
  --card-foreground: 210 40% 96%;

  --popover: 222 47% 10%;
  --popover-foreground: 210 40% 96%;

  --muted: 222 47% 15%;
  --muted-foreground: 215 16% 63%;

  /* Border & Input */
  --border: 222 47% 20%;
  --input: 222 47% 20%;
  --ring: 199 89% 60%;

  /* Sidebar */
  --sidebar-background: 222 47% 5%;
  --sidebar-foreground: 210 40% 96%;
  --sidebar-primary: 199 89% 60%;
  --sidebar-primary-foreground: 222 47% 7%;
  --sidebar-accent: 222 47% 15%;
  --sidebar-accent-foreground: 210 40% 96%;
  --sidebar-border: 222 47% 18%;
  --sidebar-ring: 199 89% 60%;

  /* Chart Colors */
  --chart-1: 199 89% 60%;
  --chart-2: 174 62% 55%;
  --chart-3: 38 92% 65%;
  --chart-4: 142 76% 46%;
  --chart-5: 280 65% 60%;
}
```

### 2.2 Color Usage Guide

| Token         | Light Mode     | Dark Mode        | Usage                                             |
| :------------ | :------------- | :--------------- | :------------------------------------------------ |
| `primary`     | Deep Navy Blue | Bright Teal Blue | Main actions, navigation highlights, links        |
| `secondary`   | Teal Accent    | Teal (lighter)   | Secondary actions, accents, tags                  |
| `accent`      | Warm Amber     | Amber (brighter) | Highlights, badges, attention-grabbing elements   |
| `destructive` | Red            | Muted Red        | Delete buttons, error states, critical alerts     |
| `success`     | Green          | Bright Green     | Success toasts, completed status, positive trends |
| `warning`     | Amber          | Bright Amber     | Warning alerts, low stock indicators              |
| `info`        | Sky Blue       | Sky Blue         | Info badges, tooltips, helper text                |
| `muted`       | Light Gray     | Dark Gray        | Disabled states, placeholder text, dividers       |
| `background`  | White          | Very Dark Navy   | Page backgrounds                                  |
| `card`        | White          | Dark Navy        | Card surfaces, modals, popovers                   |

### 2.3 Usage Rules

```
✅ CORRECT: className="bg-primary text-primary-foreground"
✅ CORRECT: className="text-muted-foreground"
✅ CORRECT: className="border-border"

❌ WRONG: className="bg-[#2A3F5F]"
❌ WRONG: style={{ color: '#2DB89A' }}
❌ WRONG: className="bg-blue-500"  // Use design tokens, not Tailwind defaults
```

---

## 3. Typography

### 3.1 Font Stack

```css
/* Primary Font: Inter (modern, clean, highly readable) */
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

/* Monospace: JetBrains Mono (for code, receipts, order IDs) */
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

### 3.2 Type Scale

| Element    | Size             | Weight         | Line Height | Usage                        |
| :--------- | :--------------- | :------------- | :---------- | :--------------------------- |
| `h1`       | 2rem (32px)      | 700 (Bold)     | 1.2         | Page titles                  |
| `h2`       | 1.5rem (24px)    | 600 (Semibold) | 1.3         | Section headers              |
| `h3`       | 1.25rem (20px)   | 600 (Semibold) | 1.4         | Card titles, subsections     |
| `h4`       | 1.125rem (18px)  | 500 (Medium)   | 1.4         | Sub-headings                 |
| `body`     | 0.875rem (14px)  | 400 (Regular)  | 1.6         | Default body text            |
| `body-sm`  | 0.8125rem (13px) | 400 (Regular)  | 1.5         | Secondary text, descriptions |
| `caption`  | 0.75rem (12px)   | 400 (Regular)  | 1.4         | Labels, timestamps, metadata |
| `overline` | 0.6875rem (11px) | 600 (Semibold) | 1.5         | Overline text, small labels  |

### 3.3 Font Loading

Load fonts via `next/font/google` in the root layout for optimal performance:

```typescript
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
```

---

## 4. Layout System

### 4.1 Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│ HEADER (64px)                                            │
│ ┌─────┐ ┌─────────────┐        ┌───┐ ┌───┐ ┌───┐ ┌───┐│
│ │ ☰   │ │ Search...   │        │🌐 │ │🌓 │ │🔔 │ │👤 ││
│ └─────┘ └─────────────┘        └───┘ └───┘ └───┘ └───┘│
├────────┬─────────────────────────────────────────────────┤
│SIDEBAR │ MAIN CONTENT                                    │
│(240px) │                                                 │
│        │ ┌─────────────────────────────────────────────┐ │
│ 🏠 Home│ │ PAGE HEADER                                 │ │
│ 📦 Prod│ │ Title              [+ New] [Filter] [Export]│ │
│ 📂 Cat │ └─────────────────────────────────────────────┘ │
│ 📋 Ord │                                                 │
│ 💰 POS │ ┌──────────────────────────────────────────── ┐ │
│ 📊 Rep │ │                                             │ │
│ 🤖 AI  │ │          PAGE CONTENT                       │ │
│ 💬 WA  │ │                                             │ │
│ ⚙ Sett│ │                                             │ │
│        │ │                                             │ │
│        │ └─────────────────────────────────────────────┘ │
├────────┴─────────────────────────────────────────────────┤
│ FOOTER (optional - only on public pages)                 │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Responsive Breakpoints

| Breakpoint       | Width   | Layout Change                                      |
| :--------------- | :------ | :------------------------------------------------- |
| Mobile (default) | < 640px | Sidebar collapsed (hamburger menu), single column  |
| sm               | 640px+  | Sidebar as overlay (sheet), 1 column grid          |
| md               | 768px+  | Sidebar as overlay, 2 column grid where applicable |
| lg               | 1024px+ | Sidebar expanded (permanent), full layout          |
| xl               | 1280px+ | Wider content area, 3-4 column grids               |

### 4.3 Grid System

- Use CSS Grid with Tailwind (`grid grid-cols-*`) for page-level layouts
- Use Flexbox for component-level alignment
- Standard content max-width: `max-w-7xl` (1280px)
- Standard page padding: `p-6` (24px)
- Card gap: `gap-6` (24px)
- Form field gap: `gap-4` (16px)

---

## 5. Component Design Standards

### 5.1 Card Pattern

```
┌──────────────────────────┐
│ Card Header              │  ← border-b, p-6
│ Title     [Action Button]│
├──────────────────────────┤
│                          │  ← p-6
│  Card Content            │
│                          │
├──────────────────────────┤
│ Card Footer              │  ← border-t, p-6
│              [Cancel][OK]│
└──────────────────────────┘

Styles: bg-card, rounded-lg, border border-border, shadow-sm
Hover: shadow-md transition-shadow duration-200
```

### 5.2 Data Table Pattern

```
┌──────────────────────────────────────────────────────┐
│ Filters Row                                          │
│ [Search...] [Category ▼] [Status ▼]   [+ New Item]  │
├──────────────────────────────────────────────────────┤
│ # │ Name          │ Category │ Price  │ Stock│ Actions│
├───┼───────────────┼──────────┼────────┼──────┼────────┤
│ 1 │ Product A     │ Food     │ Rp50k  │ 25   │ ⋯     │
│ 2 │ Product B     │ Drink    │ Rp30k  │ 12   │ ⋯     │
│ 3 │ Product C     │ Snack    │ Rp15k  │ ⚠️ 3 │ ⋯     │
├──────────────────────────────────────────────────────┤
│ Showing 1-10 of 45          [← 1 2 3 4 5 →]         │
└──────────────────────────────────────────────────────┘

- Alternating row backgrounds (zebra striping via even:bg-muted/50)
- Low stock highlighted with warning color
- Action column: dropdown with Edit, Delete, View
- Skeleton loading state for each row
```

### 5.3 Form Pattern

```
┌─────────────────────────────────────────┐
│ Form Title                              │
│                                         │
│ Label *                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Input value                         │ │
│ └─────────────────────────────────────┘ │
│ Helper text or error message            │
│                                         │
│ Label                                   │
│ ┌─────────────────────────────────────┐ │
│ │ Select option...              ▼     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌───────┐  ┌─────────────────────────┐  │
│ │Upload │  │ Preview image           │  │
│ │Image  │  │                         │  │
│ └───────┘  └─────────────────────────┘  │
│                                         │
│              [Cancel]  [Save Changes]   │
└─────────────────────────────────────────┘

- Use shadcn/ui Form components (react-hook-form + Zod)
- Required fields marked with asterisk (*)
- Real-time validation with error messages below inputs
- Loading state on submit button (spinner + disabled)
- All labels and placeholders use translations
```

### 5.4 Dialog / Modal Pattern

```
┌─ Overlay (bg-black/50) ─────────────────────────────────┐
│                                                          │
│   ┌────────────────────────────────────────────────┐     │
│   │ Dialog Title                              [✕]  │     │
│   │ Description text goes here                     │     │
│   ├────────────────────────────────────────────────┤     │
│   │                                                │     │
│   │  Dialog Content                                │     │
│   │                                                │     │
│   ├────────────────────────────────────────────────┤     │
│   │                    [Cancel]  [Confirm]          │     │
│   └────────────────────────────────────────────────┘     │
│                                                          │
└──────────────────────────────────────────────────────────┘

- Confirm dialogs for destructive actions (delete)
- Smooth open/close animation (scale + fade)
- Trap focus within dialog
- Close on Escape key or overlay click
```

---

## 6. Animation & Micro-interactions

### 6.1 Transition Standards

| Type               | Duration                 | Easing                           | Usage                 |
| :----------------- | :----------------------- | :------------------------------- | :-------------------- |
| Hover effects      | 150ms                    | ease-in-out                      | Buttons, cards, links |
| Modal/Dialog       | 200ms                    | ease-out (open), ease-in (close) | Dialogs, sheets       |
| Page transitions   | 300ms                    | ease-in-out                      | Route changes         |
| Sidebar collapse   | 200ms                    | ease-in-out                      | Sidebar toggle        |
| Fade in            | 300ms                    | ease-out                         | New content appearing |
| Toast notification | 300ms slide + 200ms fade | ease-out                         | Toasts                |
| Skeleton pulse     | 1.5s infinite            | ease-in-out                      | Loading states        |

### 6.2 Animation Rules

```
✅ DO:
- Use CSS transitions (Tailwind: transition-*, duration-*)
- Animate opacity, transform, background-color
- Use will-change sparingly for known animations
- Respect prefers-reduced-motion

❌ DON'T:
- Animate layout properties (width, height, top, left) — causes reflow
- Use animation duration > 500ms for UI interactions
- Create distracting or gratuitous animations
- Block user interaction during animations
```

### 6.3 Loading States

| State           | Component           | Animation        |
| :-------------- | :------------------ | :--------------- |
| Page loading    | Skeleton components | Pulse animation  |
| Data loading    | Table skeleton rows | Pulse + shimmer  |
| Button loading  | Spinner + disabled  | Rotate animation |
| Image loading   | Blur placeholder    | Fade-in on load  |
| Infinite scroll | Bottom spinner      | Rotate + fade    |

---

## 7. Icon System

### 7.1 Icon Library: Lucide React

All icons come from `lucide-react`. Consistent sizing:

| Context                   | Size | Class         |
| :------------------------ | :--- | :------------ |
| Sidebar nav               | 20px | `h-5 w-5`     |
| Buttons (with text)       | 16px | `h-4 w-4`     |
| Status indicators         | 14px | `h-3.5 w-3.5` |
| Page header icons         | 24px | `h-6 w-6`     |
| Empty state illustrations | 48px | `h-12 w-12`   |

### 7.2 Icon Naming Convention

Use descriptive icon imports:

```typescript
import {
  LayoutDashboard, // Dashboard
  Package, // Products
  FolderOpen, // Categories
  ShoppingCart, // Orders / POS
  BarChart3, // Reports
  Bot, // AI Assistant
  MessageCircle, // WhatsApp
  Settings, // Settings
  Users, // Team / Users
  LogOut, // Logout
  Sun, // Light mode
  Moon, // Dark mode
  Globe, // Language
  Bell, // Notifications
  Search, // Search
  Plus, // Add/Create
  Pencil, // Edit
  Trash2, // Delete
  MoreHorizontal, // More actions
  ChevronDown, // Dropdown
  AlertTriangle, // Warning
  CheckCircle, // Success
  XCircle, // Error
  Info, // Info
} from "lucide-react";
```

---

## 8. Status & Badge Design

### 8.1 Order Status Badges

| Status     | Color                                | Icon         |
| :--------- | :----------------------------------- | :----------- |
| NEW        | `bg-info/10 text-info`               | Circle       |
| CONFIRMED  | `bg-primary/10 text-primary`         | CheckCircle  |
| PROCESSING | `bg-warning/10 text-warning`         | Clock        |
| COMPLETED  | `bg-success/10 text-success`         | CheckCircle2 |
| CANCELLED  | `bg-destructive/10 text-destructive` | XCircle      |

### 8.2 Payment Status Badges

| Status   | Color                            |
| :------- | :------------------------------- |
| PENDING  | `bg-warning/10 text-warning`     |
| PAID     | `bg-success/10 text-success`     |
| PARTIAL  | `bg-info/10 text-info`           |
| REFUNDED | `bg-muted text-muted-foreground` |

### 8.3 Product Status Badges

| Status       | Color                                |
| :----------- | :----------------------------------- |
| ACTIVE       | `bg-success/10 text-success`         |
| INACTIVE     | `bg-muted text-muted-foreground`     |
| OUT_OF_STOCK | `bg-destructive/10 text-destructive` |

---

## 9. Dark Mode Design

### 9.1 Implementation

- Use `next-themes` for theme management
- `ThemeProvider` wraps the app with `attribute="class"` and `defaultTheme="light"`
- Theme toggle in the header (Sun/Moon icon)
- System preference detection supported

### 9.2 Dark Mode Rules

```
✅ DO:
- Test every component in both light and dark modes
- Use CSS variables (not hardcoded colors) so dark mode works automatically
- Ensure sufficient contrast in dark mode (4.5:1 minimum)
- Use slightly reduced shadow intensity in dark mode

❌ DON'T:
- Use pure black (#000) as dark background — use deep navy (var(--background))
- Use the same shadow values for both modes
- Forget to style focus rings for dark mode
```

---

## 10. Responsive Design Strategy

### 10.1 Mobile-First Approach

All base styles target mobile. Use breakpoint prefixes to add complexity:

```html
<!-- Example: KPI Cards Grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

### 10.2 Mobile-Specific Patterns

| Desktop Pattern    | Mobile Adaptation                        |
| :----------------- | :--------------------------------------- |
| Sidebar navigation | Bottom tab bar or hamburger menu (Sheet) |
| Data tables        | Card-based list view                     |
| Multi-column forms | Single column stack                      |
| Horizontal filters | Expandable filter drawer                 |
| Action buttons row | Floating action button (FAB)             |

---

## 11. Accessibility Standards

### 11.1 WCAG 2.1 AA Checklist

- [ ] All interactive elements are keyboard-focusable
- [ ] Focus indicators are visible (ring-2 ring-ring)
- [ ] Color is never the sole indicator of meaning
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Touch targets are ≥ 44×44px on mobile
- [ ] Contrast ratios ≥ 4.5:1 for text, ≥ 3:1 for UI elements
- [ ] Skip navigation link is available
- [ ] ARIA landmarks are properly used
- [ ] Dynamic content changes are announced

### 11.2 Focus Management

```css
/* Focus visible style for keyboard users only */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: var(--radius);
}
```

---

## 12. WhatsApp Message Design

### 12.1 Menu Response Format

```
🛍️ *PRODUCT MENU* 🛍️

━━━━━━━━━━━━━━━━━━━
📂 *FOOD*
━━━━━━━━━━━━━━━━━━━
1. 🍔 Burger Deluxe
   💰 Rp 45.000
   📦 Stock: 25

2. 🍕 Pizza Margherita
   💰 Rp 65.000
   📦 Stock: 12

━━━━━━━━━━━━━━━━━━━
📂 *DRINKS*
━━━━━━━━━━━━━━━━━━━
3. ☕ Americano
   💰 Rp 25.000
   📦 Stock: 50

━━━━━━━━━━━━━━━━━━━
Type /order to start ordering!
```

### 12.2 Receipt Format

```
═══════════════════════
     📝 ORDER RECEIPT
═══════════════════════
Order: NX-20260604-0015
Date: 04 Jun 2026, 14:30

───────────────────────
Items:
1x Burger Deluxe    Rp 45.000
2x Americano        Rp 50.000
───────────────────────
Subtotal:           Rp 95.000
Tax (10%):          Rp  9.500
───────────────────────
TOTAL:              Rp104.500
───────────────────────

Payment: Cash
Status: ✅ COMPLETED

Thank you for your order! 🙏
═══════════════════════
```
