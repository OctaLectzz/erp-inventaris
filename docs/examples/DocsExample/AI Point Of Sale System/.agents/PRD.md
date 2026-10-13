# PRD — NexPOS (Product Requirements Document)

> **Version:** 1.0.0-dev
> **Last Updated:** 2026-06-04
> **Status:** Draft — Awaiting Approval
> **Author:** AI Architect

---

## 1. Executive Summary

**NexPOS** is an Omnichannel AI-Powered Point of Sale (POS) system that unifies a modern web-based management dashboard with an automated WhatsApp ordering bot. It empowers business owners to sell through WhatsApp while gaining deep, AI-driven insights into their operations via Google Gemini.

### 1.1 Vision Statement

> Democratize retail technology by giving small-to-medium businesses an intelligent, multi-channel sales platform that turns their existing WhatsApp into a fully automated storefront — while providing enterprise-grade analytics powered by AI.

### 1.2 Business Objectives

| Objective                            | Success Metric                                               |
| :----------------------------------- | :----------------------------------------------------------- |
| Enable WhatsApp-based ordering       | ≥ 90% of orders processed without manual intervention        |
| Provide real-time inventory tracking | Stock levels updated within 1 second of transaction          |
| Deliver AI-powered analytics         | Business insights generated in < 5 seconds                   |
| Support multi-role operations        | Role-based dashboard with zero unauthorized access incidents |
| Bilingual support (ID/EN)            | 100% UI text coverage in both languages                      |

---

## 2. Target Users & Personas

### 2.1 Superadmin

- **Who:** Platform owner / SaaS operator
- **Goals:** Manage all tenants, global settings, system health, and user accounts across the platform
- **Permissions:** Full system access — CRUD all entities, manage roles, view all analytics, system configuration

### 2.2 Admin (Business Owner)

- **Who:** Shop/store owner using NexPOS for their business
- **Goals:** Manage their store's products, view sales reports, connect WhatsApp, configure AI analytics
- **Permissions:** Full access within their own store — product CRUD, category CRUD, order management, reports, WhatsApp settings, AI analysis

### 2.3 Operator (Cashier / Staff)

- **Who:** Staff assigned to handle day-to-day operations
- **Goals:** Process orders, update stock, view assigned dashboards
- **Permissions:** Limited access — process orders, view products (read-only CRUD), view limited reports. Cannot access settings, WhatsApp config, or AI analytics

### 2.4 Customer (WhatsApp User)

- **Who:** End customer purchasing via WhatsApp
- **Goals:** Browse menu, place orders, receive receipts, get help
- **Permissions:** Interact only through WhatsApp bot commands

---

## 3. Feature Specifications

### 3.1 Authentication & Authorization

#### 3.1.1 Login Methods

| Method         | Description                                     |
| :------------- | :---------------------------------------------- |
| Email/Password | Manual credential-based login via Supabase Auth |
| Google OAuth   | One-click sign-in via Google account            |

#### 3.1.2 Role-Based Access Control (RBAC)

```
Superadmin > Admin > Operator
```

- Each role has a predefined set of permissions stored in the database
- Middleware validates role on every protected route
- Unauthorized access attempts are logged and redirected

#### 3.1.3 Session Management

- Cookie-based sessions using `@supabase/ssr`
- Session refresh handled automatically via middleware
- Idle timeout: 30 minutes (configurable)
- Concurrent session support with device tracking

#### 3.1.4 User Stories

| ID      | Story                                                                | Priority |
| :------ | :------------------------------------------------------------------- | :------- |
| AUTH-01 | As a user, I can register with email/password                        | P0       |
| AUTH-02 | As a user, I can login with Google OAuth                             | P0       |
| AUTH-03 | As a superadmin, I can assign roles to users                         | P0       |
| AUTH-04 | As a user, I am redirected to my role-specific dashboard after login | P0       |
| AUTH-05 | As a user, I can reset my password via email                         | P1       |
| AUTH-06 | As a user, I can update my profile information                       | P1       |
| AUTH-07 | As an admin, I can invite operators to my store                      | P1       |

---

### 3.2 Dashboard

#### 3.2.1 Overview (Home)

The dashboard provides a role-aware overview of the business:

**Admin Dashboard:**

- Total Revenue (today / this week / this month / this year)
- Total Orders (with trend indicator)
- Total Products & Categories count
- Low Stock Alerts (products below threshold)
- Recent Orders list (last 10)
- Revenue Chart (line chart, filterable by period)
- Top Selling Products (bar chart, top 5)
- WhatsApp Bot status indicator (connected / disconnected)

**Operator Dashboard:**

- Today's Orders count & list
- Pending Orders queue
- Quick order processing actions

**Superadmin Dashboard:**

- Total active stores
- Total users by role
- System health metrics
- Recent activity logs

#### 3.2.2 User Stories

| ID      | Story                                                   | Priority |
| :------ | :------------------------------------------------------ | :------- |
| DASH-01 | As an admin, I can see my business KPIs at a glance     | P0       |
| DASH-02 | As an admin, I can filter dashboard data by time period | P0       |
| DASH-03 | As an operator, I see only my relevant task queue       | P0       |
| DASH-04 | As a superadmin, I can monitor all stores' performance  | P1       |

---

### 3.3 Category Management

#### 3.3.1 Features

- **CRUD Operations:** Create, Read, Update, Delete categories
- **Fields:** Name (ID/EN), Description (ID/EN), Image, Status (active/inactive), Sort Order
- **Relationships:** One category can have many products
- **Soft Delete:** Categories are soft-deleted; products within are hidden from WhatsApp menu
- **Bulk Actions:** Activate/Deactivate multiple categories

#### 3.3.2 User Stories

| ID     | Story                                                         | Priority |
| :----- | :------------------------------------------------------------ | :------- |
| CAT-01 | As an admin, I can create a new product category              | P0       |
| CAT-02 | As an admin, I can edit category details                      | P0       |
| CAT-03 | As an admin, I can deactivate a category (soft delete)        | P0       |
| CAT-04 | As an admin, I can reorder categories for display             | P1       |
| CAT-05 | As an admin, I can see how many products are in each category | P1       |

---

### 3.4 Product Management

#### 3.4.1 Features

- **CRUD Operations:** Create, Read, Update, Delete products
- **Fields:**
  - Name (ID/EN)
  - Description (ID/EN)
  - SKU (auto-generated or manual)
  - Price (base price)
  - Discount Price (optional)
  - Stock Quantity
  - Minimum Stock Threshold (for alerts)
  - Category (foreign key)
  - Images (multiple, stored in Supabase Storage)
  - Status (active / inactive / out_of_stock)
  - Unit (e.g., pcs, kg, liter)
  - Weight (optional)
- **Stock Management:**
  - Auto-decrement on order completion
  - Low stock notifications
  - Stock adjustment log (audit trail)
- **Search & Filter:** By name, category, status, price range, stock level
- **Pagination:** Server-side with configurable page size
- **Bulk Actions:** Activate/Deactivate, Bulk price update

#### 3.4.2 User Stories

| ID      | Story                                               | Priority |
| :------ | :-------------------------------------------------- | :------- |
| PROD-01 | As an admin, I can add a new product with images    | P0       |
| PROD-02 | As an admin, I can edit product details and pricing | P0       |
| PROD-03 | As an admin, I can manage product stock levels      | P0       |
| PROD-04 | As an admin, I receive alerts when stock is low     | P0       |
| PROD-05 | As an operator, I can view products (read-only)     | P0       |
| PROD-06 | As an admin, I can search and filter products       | P1       |
| PROD-07 | As an admin, I can bulk-update product status       | P1       |
| PROD-08 | As an admin, I can upload multiple product images   | P1       |

---

### 3.5 Order & Transaction Management

#### 3.5.1 Order Lifecycle

```
NEW → CONFIRMED → PROCESSING → COMPLETED → (CANCELLED)
```

#### 3.5.2 Features

- **Order Sources:** WhatsApp Bot, Manual Entry (POS)
- **Order Details:**
  - Order ID (auto-generated, format: `NX-YYYYMMDD-XXXX`)
  - Customer Name & Phone
  - Order Items (product, qty, price, subtotal)
  - Total Amount
  - Discount (if applicable)
  - Tax (configurable)
  - Payment Method (Cash, Transfer, E-Wallet)
  - Payment Status (pending, paid, partial)
  - Order Status
  - Notes
  - Timestamps (created, updated, completed)
  - Source (whatsapp / manual)
- **Manual POS:** Admin/Operator can create orders manually via a POS interface
- **Order History:** Full searchable history with filters

#### 3.5.3 User Stories

| ID     | Story                                                  | Priority |
| :----- | :----------------------------------------------------- | :------- |
| ORD-01 | As a customer (WA), I can place an order via WhatsApp  | P0       |
| ORD-02 | As an admin, I can view and manage all orders          | P0       |
| ORD-03 | As an operator, I can process pending orders           | P0       |
| ORD-04 | As an admin, I can create manual orders (POS mode)     | P0       |
| ORD-05 | As an admin, I can filter orders by status/date/source | P1       |
| ORD-06 | As an admin, I can cancel or refund an order           | P1       |
| ORD-07 | As an admin, I can view order audit trail              | P2       |

---

### 3.6 WhatsApp Bot Integration

#### 3.6.1 Architecture

- WhatsApp Web session managed via `whatsapp-web.js`
- Bot runs as a service connected to the Next.js backend via API
- QR code displayed in dashboard for initial pairing
- Auto-reconnect on disconnection
- Session persistence (LocalAuth strategy)

#### 3.6.2 Bot Commands

| Command     | Description             | Response                                                             |
| :---------- | :---------------------- | :------------------------------------------------------------------- |
| `/menu`     | Show product catalog    | Formatted menu with categories, products, stock, prices              |
| `/order`    | Start order flow        | Interactive ordering wizard (item selection, quantity, confirmation) |
| `/cart`     | View current cart       | List of items added, subtotal                                        |
| `/checkout` | Finalize order          | Order summary, payment instructions, confirmation                    |
| `/status`   | Check order status      | Current status of most recent / specified order                      |
| `/help`     | Show available commands | List of all commands with descriptions                               |
| `/cancel`   | Cancel pending order    | Cancellation confirmation                                            |
| `/receipt`  | Get receipt             | Formatted receipt for completed order                                |

#### 3.6.3 Bot Behavior Rules

- All responses are formatted as WhatsApp-friendly text (emojis, line breaks, bold)
- Multi-language support (responds in customer's detected language or default ID)
- Rate limiting: Max 30 messages per minute per customer
- Invalid commands receive a friendly fallback with `/help` suggestion
- Order confirmation requires explicit customer reply (e.g., "YES")
- Auto-send receipt upon order completion

#### 3.6.4 User Stories

| ID    | Story                                                    | Priority |
| :---- | :------------------------------------------------------- | :------- |
| WA-01 | As an admin, I can connect my WhatsApp via QR code       | P0       |
| WA-02 | As a customer, I can view the product menu via `/menu`   | P0       |
| WA-03 | As a customer, I can place an order via `/order`         | P0       |
| WA-04 | As a customer, I receive an auto-generated receipt       | P0       |
| WA-05 | As an admin, I can see WhatsApp connection status        | P0       |
| WA-06 | As a customer, I can check my order status via `/status` | P1       |
| WA-07 | As a customer, I can get help via `/help`                | P1       |
| WA-08 | As an admin, I can view WhatsApp conversation logs       | P2       |
| WA-09 | As an admin, I can customize bot response templates      | P2       |

---

### 3.7 Sales Reports & Analytics

#### 3.7.1 Report Types

| Report               | Description                             | Filters                               |
| :------------------- | :-------------------------------------- | :------------------------------------ |
| Revenue Report       | Total revenue over time                 | Day / Week / Month / Year, Date Range |
| Sales Volume         | Number of orders over time              | Day / Week / Month / Year, Date Range |
| Product Performance  | Best/worst sellers by revenue/quantity  | Category, Date Range                  |
| Category Performance | Revenue breakdown by category           | Date Range                            |
| Payment Method       | Revenue by payment type                 | Date Range                            |
| Customer Report      | Repeat customers, order frequency       | Date Range                            |
| Profit & Loss        | Revenue minus cost (if COGS configured) | Date Range                            |

#### 3.7.2 Visualization

- Line charts for trends (revenue, orders over time)
- Bar charts for comparisons (top products, categories)
- Pie/Donut charts for distributions (payment methods, order sources)
- Data tables with export (CSV, PDF)
- KPI cards with trend indicators (▲ up, ▼ down, % change)

#### 3.7.3 User Stories

| ID     | Story                                                       | Priority |
| :----- | :---------------------------------------------------------- | :------- |
| RPT-01 | As an admin, I can view daily/weekly/monthly/yearly revenue | P0       |
| RPT-02 | As an admin, I can see top-selling products                 | P0       |
| RPT-03 | As an admin, I can filter reports by date range             | P0       |
| RPT-04 | As an admin, I can export reports to CSV                    | P1       |
| RPT-05 | As an admin, I can see revenue by payment method            | P1       |
| RPT-06 | As an admin, I can compare performance across periods       | P2       |

---

### 3.8 Gemini AI Integration

#### 3.8.1 AI Features

| Feature                   | Description                                                                |
| :------------------------ | :------------------------------------------------------------------------- |
| **Sales Analysis**        | Natural language Q&A about sales data ("What was my best day last month?") |
| **Trend Prediction**      | AI-generated forecasts based on historical data                            |
| **Inventory Suggestions** | Restock recommendations based on sales velocity                            |
| **Report Summaries**      | AI-generated executive summaries of reports                                |
| **Anomaly Detection**     | Flag unusual patterns (e.g., sudden sales drop)                            |
| **Business Advisor**      | Contextual suggestions for pricing, promotions, inventory                  |

#### 3.8.2 AI Chat Interface

- Dedicated AI assistant page within dashboard
- Conversational interface (chat-style)
- Context-aware: AI has access to store's sales data, inventory, and order history
- Suggested prompts for common queries
- Response streaming for real-time feel
- Chat history persistence

#### 3.8.3 User Stories

| ID    | Story                                                     | Priority |
| :---- | :-------------------------------------------------------- | :------- |
| AI-01 | As an admin, I can ask AI questions about my sales data   | P0       |
| AI-02 | As an admin, I can get AI-generated report summaries      | P0       |
| AI-03 | As an admin, I can see AI-powered restock recommendations | P1       |
| AI-04 | As an admin, I can get trend forecasts from AI            | P1       |
| AI-05 | As an admin, I can interact with AI via a chat interface  | P1       |

---

### 3.9 Settings & Configuration

#### 3.9.1 Store Settings

- Store Name, Logo, Address, Phone
- Currency & Tax configuration
- Operating hours
- Notification preferences

#### 3.9.2 User Management

- View all users in the store
- Invite new operators
- Change user roles
- Deactivate users

#### 3.9.3 WhatsApp Settings

- Connection management (connect/disconnect)
- Bot response templates customization
- Auto-reply toggle
- Business hours for bot

#### 3.9.4 User Stories

| ID     | Story                                                  | Priority |
| :----- | :----------------------------------------------------- | :------- |
| SET-01 | As an admin, I can update my store information         | P1       |
| SET-02 | As an admin, I can manage my team (operators)          | P1       |
| SET-03 | As an admin, I can configure tax and currency settings | P1       |
| SET-04 | As a superadmin, I can manage platform-wide settings   | P1       |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric                        | Target                          |
| :---------------------------- | :------------------------------ |
| Page Load (FCP)               | < 1.5 seconds                   |
| Time to Interactive (TTI)     | < 3 seconds                     |
| API Response (P95)            | < 500ms                         |
| WhatsApp Bot Response         | < 3 seconds                     |
| AI Response (streaming start) | < 2 seconds                     |
| Concurrent Users              | Support 100+ simultaneous users |

### 4.2 Scalability

- Horizontal scaling via Vercel serverless functions
- Database connection pooling via Supabase
- CDN for static assets
- Lazy loading for heavy components

### 4.3 Reliability

- 99.5% uptime target
- Auto-reconnect for WhatsApp sessions
- Graceful error handling with user-friendly messages
- Data backup via Supabase automated backups

### 4.4 Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios ≥ 4.5:1

### 4.5 Internationalization

- Full bilingual support: Indonesian (ID) and English (EN)
- Indonesian as default language
- Language switcher in header
- All UI strings via `next-intl` translation files
- Date/time formatting per locale
- Currency formatting per locale (IDR default)

### 4.6 Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+
- Mobile browsers (responsive design)

---

## 5. Data Model Summary

### 5.1 Core Entities

```
User (extends Supabase Auth)
├── Profile
├── Store (Admin owns a Store)
│   ├── Category
│   │   └── Product
│   │       └── ProductImage
│   ├── Order
│   │   └── OrderItem
│   ├── Customer (WhatsApp contacts)
│   ├── WhatsAppSession
│   └── AuditLog
└── Role / Permission
```

### 5.2 Key Relationships

- **User ↔ Store:** Many-to-many (user can be in multiple stores, store has many users)
- **Store ↔ Category:** One-to-many
- **Category ↔ Product:** One-to-many
- **Product ↔ ProductImage:** One-to-many
- **Store ↔ Order:** One-to-many
- **Order ↔ OrderItem:** One-to-many
- **OrderItem ↔ Product:** Many-to-one
- **Order ↔ Customer:** Many-to-one

---

## 6. Release Phases

### Phase 1 — Foundation (MVP Core)

- [x] Project setup (Next.js, Tailwind, shadcn/ui, Prisma, Supabase)
- [ ] Authentication (Email/Password + Google OAuth)
- [ ] RBAC (Superadmin, Admin, Operator)
- [ ] Dashboard layout with dark/light mode
- [ ] Internationalization (ID/EN)
- [ ] Category CRUD
- [ ] Product CRUD with image upload

### Phase 2 — Commerce

- [ ] Order management system
- [ ] Manual POS interface
- [ ] Basic sales reports (revenue, orders)
- [ ] Report filters (day/week/month/year)

### Phase 3 — WhatsApp

- [ ] WhatsApp Bot service setup
- [ ] QR code pairing UI
- [ ] Bot commands (/menu, /order, /help, /status)
- [ ] Auto-receipt generation
- [ ] Connection status monitoring

### Phase 4 — Intelligence

- [ ] Gemini AI integration
- [ ] AI chat interface
- [ ] AI report summaries
- [ ] Trend predictions
- [ ] Inventory suggestions

### Phase 5 — Polish & Scale

- [ ] Advanced reports (P&L, customer analytics)
- [ ] Export (CSV, PDF)
- [ ] Notification system
- [ ] Performance optimization
- [ ] E2E testing suite
- [ ] Production deployment

---

## 7. Assumptions & Constraints

### Assumptions

1. Business owners have a dedicated phone number for WhatsApp Bot
2. Products have fixed pricing (no complex variant/modifier system in v1)
3. Single-currency support per store (multi-currency in future)
4. Internet connectivity is reliable for the WhatsApp service host

### Constraints

1. WhatsApp Web library is unofficial — risk of API changes or account bans
2. Gemini AI API has rate limits and costs per request
3. Supabase free tier has connection limits (may need paid plan for production)
4. WhatsApp service must run on a VPS (cannot run on Vercel serverless)

---

## 8. Glossary

| Term       | Definition                                           |
| :--------- | :--------------------------------------------------- |
| **NexPOS** | The product name — Omnichannel AI-Powered POS System |
| **POS**    | Point of Sale                                        |
| **RBAC**   | Role-Based Access Control                            |
| **CRUD**   | Create, Read, Update, Delete                         |
| **WA Bot** | WhatsApp Bot — automated message handler             |
| **Gemini** | Google's AI model used for analytics                 |
| **SKU**    | Stock Keeping Unit — unique product identifier       |
| **COGS**   | Cost of Goods Sold                                   |
| **FCP**    | First Contentful Paint                               |
| **TTI**    | Time to Interactive                                  |
| **RLS**    | Row Level Security (Supabase/PostgreSQL)             |
