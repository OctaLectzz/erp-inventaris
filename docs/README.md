# Inventra — Mini ERP Inventaris

**Mini ERP Inventory Management System with Multi-Item Atomic Transactions & 9Router AI Copilot**  
Take-Home Assessment untuk Posisi **Full Stack Engineer** di **PT. Syailendra Bumi Investama (DDistillers)**.

Inventra adalah sistem simulasi manajemen persediaan gudang modern berbasis web yang mencakup pengelolaan katalog produk terstandarisasi, master kategori produk, pemantauan status stok dan barang menipis (*low stock*), pencatatan mutasi stok fisik masuk (*Stock IN*) dan keluar (*Stock OUT*) baik tunggal maupun transaksi keranjang multi-item (*batch*) bergaransi ACID, buku besar mutasi persediaan (*traceability audit ledger*), analitik arus pergerakan barang interaktif, serta asisten cerdas berbasis AI (**9Router**) untuk penyusunan draf katalog, penyempurnaan spesifikasi teknis, dan tanya-jawab operasional gudang.

> **Status Proyek**: Selesai & Terverifikasi Penuh (**Batch 5: Final QA, Security Hardening & Submission Readiness Passed**).  
> **Kandidat / Pengembang**: Octaviano (OctaLectzz)  
> **Repository GitHub**: [https://github.com/OctaLectzz/erp-inventaris](https://github.com/OctaLectzz/erp-inventaris)  
> **Kondisi Pengujian**: 42 File Pengujian, 355 Tes Otomatis (100% PASS), 0 TypeScript Error, 0 ESLint Error, Turbopack Build 54 Halaman Bersih.

---

## Daftar Isi

1. [Fitur Utama yang Telah Diimplementasikan](#1-fitur-utama-yang-telah-diimplementasikan)
2. [Tech Stack & Arsitektur](#2-tech-stack--arsitektur)
3. [Persyaratan Lingkungan & Versi Runtime](#3-persyaratan-lingkungan--versi-runtime)
4. [Cara Instalasi & Menjalankan Aplikasi](#4-cara-instalasi--menjalankan-aplikasi)
5. [Konfigurasi Supabase & Environment Variables](#5-konfigurasi-supabase--environment-variables)
6. [Setup Basis Data & Menjalankan Migrasi](#6-setup-basis-data--menjalankan-migrasi)
7. [Akun Demo & Akses Evaluator](#7-akun-demo--akses-evaluator)
8. [Matriks Hak Akses (Role-Based Access Control)](#8-matriks-hak-akses-role-based-access-control)
9. [Menjalankan Pengujian (Quality Gates)](#9-menjalankan-pengujian-quality-gates)
10. [AI Assistant 9Router & Batasan Keamanan](#10-ai-assistant-9router--batasan-keamanan)
11. [Panduan Demonstrasi Lokal (Evaluator Walkthrough)](#11-panduan-demonstrasi-lokal-evaluator-walkthrough)
12. [Batasan Fitur, Asumsi & Pekerjaan Lanjutan](#12-batasan-fitur-asumsi--pekerjaan-lanjutan)
13. [Transparansi Penggunaan AI (AI Usage Disclosure)](#13-transparansi-penggunaan-ai-ai-usage-disclosure)
14. [Indeks Dokumentasi Proyek](#14-indeks-dokumentasi-proyek)

---

## 1. Fitur Utama yang Telah Diimplementasikan

Sesuai dengan *Brief Ringkas Take-Home Test Mini ERP Inventaris* beserta roadmap Batch 1–5:

### Modul A — Autentikasi & Role-Based Access Control (RBAC)
- **Otorisasi 3-Peran Utama Konsolidasi**:
  - `administrator`: Akses penuh mencakup katalog, kategori, mutasi stok fisik, AI commit, manajemen pengguna (`/users`), dan pengaturan sistem (`/settings/website`).
  - `staff_gudang`: Akses operasional untuk mutasi stok fisik tunggal (`/movements`) dan multi-item (`/transactions`), pembuatan draf AI; dibatasi dari perubahan master katalog/kategori/laporan.
  - `auditor`: Akses pemantauan hanya-baca (*read-only*) untuk katalog, dashboard, laporan analitik, riwayat mutasi, dan AI Q&A; dibatasi dari mutasi fisik atau modifikasi data.
  - Kompatibilitas penuh terhadap peran legacy (`admin_gudang` dan `owner`).
- **Proteksi Berlapis**: Penegakan otorisasi di Edge Middleware (`src/proxy.ts`), Server Components (`requireAuth` & `requireRole`), Server Actions, dan Row-Level Security (RLS) PostgreSQL.
- **Session Persistence**: Autentikasi cookie HTTP-only sinkron via `@supabase/ssr` tanpa kebocoran token ke client bundle.
- **Evaluator Quick-Access Chips**: Tombol akses cepat demo satu-klik pada formulir login untuk pengujian cepat evaluator tanpa input manual.

### Modul B — Katalog Produk & Master Kategori
- **Standardisasi SKU Unik**: SKU terstruktur rapi (misal: `CAT-NAM-001`), divalidasi unik secara *case-insensitive* dan dijaga oleh constraint basis data.
- **Master Kategori Terintegrasi**: Tabel master `categories` dengan slug unik dan relasi `ON DELETE RESTRICT` pada produk. Kategori yang masih digunakan tidak dapat dihapus sembarangan.
- **Imutabilitas Stok Katalog**: Formulir tambah dan ubah produk secara ketat **hanya mengelola metadata katalog**. Kolom `stock` tidak diekspos pada skema form dan dijaga oleh database trigger `trg_protect_product_stock` (stok produk baru wajib bernilai 0).
- **Upload Gambar Aman**: Dukungan Supabase Storage (`product-images`) dengan validasi ukuran (< 2MB), MIME type (`image/jpeg`, `image/png`, `image/webp`), verifikasi magic bytes konten file, serta sanitasi protokol URL manual (`http://` atau `https://`).

### Modul C — Mutasi Stok Tunggal & Transaksi Keranjang Multi-Item
- **Validasi Kuantitas Ketat**: Kuantitas wajib bilangan bulat positif (`> 0`). Angka 0, negatif, atau desimal ditolak seketika oleh Zod dan database constraint.
- **Pencegahan Overdraft (Anti-Stockout)**: Mutasi keluar (*Stock OUT*) yang melebihi stok tersedia ditolak seketika (`INSUFFICIENT_STOCK`).
- **Transaksi Keranjang Multi-Item Atomik (`/transactions`)**:
  - Pengguna dapat menyusun daftar mutasi multi-produk (1–100 item) dalam satu keranjang.
  - Dieksekusi melalui PostgreSQL RPC `record_batch_stock_movements` dengan *ordered pessimistic row locking* (`FOR UPDATE`).
  - **Garansi All-or-Nothing ACID**: Jika salah satu produk dalam batch mengalami overdraft atau error, seluruh transaksi di-rollback secara otomatis tanpa mutasi parsial.
- **Mutasi Tunggal Cepat (`/movements`)**: Dialog mutasi langsung pada tabel inventaris untuk operasional harian.

### Modul D — Riwayat Buku Besar Persediaan (Traceability Ledger)
- **Buku Besar Lengkap**: Menampilkan waktu terformat lokal, SKU, Nama Produk, Tipe Mutasi (`IN` hijau / `OUT` merah), Kuantitas, Transisi Stok (`Stok Sebelum → Stok Sesudah`), Pengguna Eksekutor, dan Catatan Dokumen Referensi / Nomor Batch.
- **Pencarian & Pemfilteran Komprehensif**: Filter SKU/Nama/Catatan, filter tipe pergerakan, dan filter rentang tanggal ISO.
- **Tampilan Responsif**: Mode tabel desktop dan mode kartu modular pada layar seluler (390px).

### Modul E — Dashboard KPI, Analitik Arus & Laporan Produk
- **Ringkasan Eksekutif KPI**: Total SKU terdaftar, Total Unit Stok Fisik, Total Valuasi Persediaan ($\sum \text{stok} \times \text{harga}$) dalam format kompak Rupiah dengan tooltip nilai presisi, serta Kartu Pantau Stok Kritis (*Low Stock Watchlist* $< 5$ unit).
- **Visualisasi Arus Mutasi Interaktif (`/reports`)**:
  - Grafik grouped bar chart SVG murni tanpa dependensi eksternal (`MovementFlowChart`).
  - Pemfilteran rentang waktu dinamis: Hari Ini, 7 Hari, 30 Hari, Tahun Ini, Kustom, dan Semua Periode.
  - Metrik periodik: Total IN, Total OUT, Net Flow, dan Total Transaksi.
- **Analisis Pergerakan Per Produk (`/reports/products` & `/reports/products/[id]`)**:
  - Tabel direktori produk dengan mini sparkline tren mutasi.
  - Halaman detail produk individual yang menampilkan riwayat buku besar mutasi khusus untuk produk tersebut.

### Modul F — AI Assistant Terintegrasi 9Router (`/assistant`)
- **Draf Katalog Produk**: Mengubah nama produk atau catatan mentah menjadi draf katalog lengkap (SKU, nama, kategori, unit, estimasi harga, deskripsi, spesifikasi) dengan stok awal terkunci `0`.
- **Refiner Deskripsi & Spesifikasi**: Menyempurnakan ringkasan teknis, mengekstraksi atribut spesifikasi, dan memformat catatan gudang.
- **Tanya Jawab Inventaris Gudang (Q&A)**: Asisten tanya jawab interaktif yang menjawab pertanyaan operasional hanya berdasarkan data faktual gudang terkini (< 1KB payload aman).

---

## 2. Tech Stack & Arsitektur

| Lapisan / Komponen | Teknologi | Keterangan & Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.4.0 (App Router) | Server Components, Server Actions, Partial Prerendering, Turbopack Engine. |
| **Bahasa** | TypeScript 5 (Strict Mode) | Strict type-safety, zero `any` pada domain logic, interface lengkap. |
| **Styling** | Tailwind CSS v4 | Engine CSS v4 modern berbasis `@theme inline` dan CSS variables. |
| **UI Components** | shadcn/ui & Radix UI | Komponen aksesibel, WCAG compliant, fokus trap, dan responsive sheet/dialog. |
| **Database** | PostgreSQL 15+ (Supabase) | Transaksi ACID, RLS Policies, Database Triggers, Atomic RPC Stored Procedures. |
| **Auth** | Supabase Auth (`@supabase/ssr`) | SSR cookie-based stateless authentication, aman dari XSS/CSRF. |
| **Storage** | Supabase Storage (`product-images`) | Bucket publik untuk aset gambar produk dengan RLS upload khusus admin. |
| **Internationalization** | `next-intl` | Arsitektur bilingual dictionary (ID default, EN) tersinkronisasi 1:1. |
| **Theming** | `next-themes` | Mode Terang, Gelap, dan Sistem tanpa efek flash dengan token OKLCH. |
| **Validation** | Zod + React Hook Form | Single source of truth skema validasi antara input form dan Server Action. |
| **AI Gateway** | 9Router OpenAI-Compatible | Gateway AI privat di `https://router.octalectzz.my.id/v1` (Model: `inventra`). |
| **Testing** | Vitest 3.2.7 | 42 file tes otomatis (355 unit & live integration tests). |
| **Package Manager** | npm | Manajer paket tunggal resmi (dilarang menggunakan yarn, pnpm, atau bun). |

### Arsitektur Berlapis (Layered Architecture)

```
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                   │
│   Server/Client Components, Layouts, shadcn/ui,        │
│   React Hook Form, next-intl, next-themes              │
├────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                    │
│   Server Actions (src/app/actions/*), Middleware,      │
│   Zod Schemas (src/schemas/*), Auth Guards             │
├────────────────────────────────────────────────────────┤
│                     SERVICE LAYER                      │
│   Business Domain Logic, Analytics Calculations,       │
│   9Router AI Client, Data Orchestrators                │
├────────────────────────────────────────────────────────┤
│                   DATA ACCESS LAYER                    │
│   Supabase Server Client, Row-Level Security (RLS),    │
│   PostgreSQL RPC (record_batch_stock_movements)        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Persyaratan Lingkungan & Versi Runtime

- **Node.js**: Versi 20+ LTS (diuji pada v20.x dan v24.x LTS).
- **npm**: Versi 9+ atau 10+.
- **Git**: Versi 2.30+.
- **Koneksi Internet**: Diperlukan untuk komunikasi dengan Supabase Cloud dan 9Router AI Gateway.
- **Sistem Operasi**: Windows, macOS, atau Linux.

---

## 4. Cara Instalasi & Menjalankan Aplikasi

```bash
# 1. Clone repository
git clone https://github.com/OctaLectzz/erp-inventaris.git
cd erp-inventaris

# 2. Pasang dependensi menggunakan npm
npm install

# 3. Siapkan environment file
cp .env.example .env.local
# Edit .env.local dan isi kredensial Supabase serta 9Router Anda

# 4. Jalankan server pengembangan lokal (Turbopack)
npm run dev

# 5. Akses aplikasi di browser
# Buka http://localhost:3000
```

### Script `package.json` yang Tersedia

```bash
npm run dev           # Memulai development server lokal (Turbopack)
npm run build         # Mengompilasi build produksi Next.js
npm run start         # Menjalankan build produksi secara lokal
npm run lint          # Menjalankan ESLint
npm test              # Menjalankan seluruh test suite Vitest (unit & live)
npm run test:unit     # Menjalankan unit test saja (tanpa live database)
npm run test:live     # Menjalankan pengujian live integrasi database
```

---

## 5. Konfigurasi Supabase & Environment Variables

Salin `.env.example` menjadi `.env.local` pada root direktori:

```bash
cp .env.example .env.local
```

### Penjelasan Variabel Lingkungan

| Variabel | Keterangan & Lingkup | Contoh / Nilai Standar |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Nama aplikasi untuk display UI | `Inventra` |
| `NEXT_PUBLIC_APP_URL` | URL basis aplikasi lokal/produksi | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL endpoint proyek Supabase (Publik) | `https://your-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable anon key Supabase (Publik) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER-ONLY** Secret key untuk bypass RLS (seeding & admin) | `eyJhbGciOi...` |
| `DEMO_ADMIN_EMAIL` | Email akun demo Administrator | `admin@inventra.demo` |
| `DEMO_ADMIN_PASSWORD` | Kata sandi akun demo Administrator | `*kata-sandi-demo-anda*` |
| `DEMO_STAFF_EMAIL` | Email akun demo Staf Gudang | `staff@inventra.demo` |
| `DEMO_STAFF_PASSWORD` | Kata sandi akun demo Staf Gudang | `*kata-sandi-demo-anda*` |
| `DEMO_OWNER_EMAIL` | Email akun demo Auditor / Owner | `owner@inventra.demo` |
| `DEMO_OWNER_PASSWORD` | Kata sandi akun demo Auditor / Owner | `*kata-sandi-demo-anda*` |
| `NINE_ROUTER_BASE_URL` | **SERVER-ONLY** Endpoint gateway 9Router | `https://router.octalectzz.my.id/v1` |
| `NINE_ROUTER_API_KEY` | **SERVER-ONLY** Kunci otorisasi Bearer 9Router | `sk-9r-...` |
| `NINE_ROUTER_MODEL` | **SERVER-ONLY** Model AI yang digunakan | `inventra` |

> **PERINGATAN KEAMANAN**: Variabel berlabel **SERVER-ONLY** tidak boleh diberi prefix `NEXT_PUBLIC_`. File `.env.local` telah terdaftar pada `.gitignore` dan tidak boleh di-commit ke dalam repositori publik.

---

## 6. Setup Basis Data & Menjalankan Migrasi

Aplikasi menggunakan 6 file migrasi SQL berurutan di bawah direktori `supabase/migrations/`:

```
supabase/migrations/
├── 20261013000001_initial_schema.sql             # Tabel profiles, products, stock_movements, constraint
├── 20261013000002_rls_policies.sql               # RLS policies, stock immutability triggers, get_user_role
├── 20261013000003_stock_mutation_rpc.sql         # RPC mutasi tunggal atomik (record_stock_movement)
├── 20261014000001_categories_and_storage.sql     # Master categories, FK RESTRICT, Storage product-images
├── 20261014000002_rbac_and_batch_transactions.sql# Konsolidasi RBAC 3-peran, RPC batch (record_batch_stock_movements)
└── 20261015000001_website_settings_and_rbac.sql # Tabel website_settings, kebijakan RBAC sistem
```

### Cara Menjalankan Migrasi

#### Opsi A: Menggunakan Supabase Dashboard (Direkomendasikan untuk Evaluator)
1. Buka dashboard proyek Supabase Anda.
2. Navigasikan ke menu **SQL Editor**.
3. Buka dan jalankan file migrasi di atas satu per satu sesuai urutan timestamp.

#### Opsi B: Menggunakan Supabase CLI
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

---

## 7. Akun Demo & Akses Evaluator

Untuk mempermudah peninjauan assessment, sistem menyediakan **Quick-Access Demo Chips** pada formulir login (`/login`). Evaluator cukup mengklik salah satu chip untuk mengisi formulir secara otomatis dari server tanpa perlu mengetik kredensial manual:

| Peran Sistem | Email Akun Demo | Kewenangan Utama |
| :--- | :--- | :--- |
| **Administrator** | `admin@inventra.demo` | **Akses Penuh**: Kelola katalog, master kategori, mutasi stok fisik, AI commit katalog, manajemen user, dan pengaturan sistem. |
| **Staf Gudang** | `staff@inventra.demo` | **Akses Operasional**: Pencatatan mutasi stok tunggal & batch IN/OUT, draf AI (salin draf); dibatasi dari kelola katalog/kategori/laporan. |
| **Auditor** | `auditor@inventra.demo` | **Akses Audit (Read-Only)**: Pemantauan katalog, dashboard KPI, laporan arus mutasi, riwayat ledger, dan AI Q&A; dibatasi dari mutasi fisik. |
| *Owner (Legacy)* | `owner@inventra.demo` | Kompatibilitas mundur dengan izin setara auditor / pengawas eksekutif. |
| *Admin Gudang (Legacy)* | `admingudang@inventra.demo` | Kompatibilitas mundur dengan izin setara administrator gudang. |

---

## 8. Matriks Hak Akses (Role-Based Access Control)

| Modul / Fitur | Administrator (`administrator`) | Staf Gudang (`staff_gudang`) | Auditor (`auditor`) |
| :--- | :---: | :---: | :---: |
| **Dashboard & KPI Persediaan** | ✅ Baca | ✅ Baca | ✅ Baca |
| **Katalog Produk** | ✅ Tambah / Edit / Baca | 👁️ Hanya-Baca | 👁️ Hanya-Baca |
| **Master Kategori Produk** | ✅ Tambah / Edit / Hapus | 👁️ Hanya-Baca | 👁️ Hanya-Baca |
| **Mutasi Stok Tunggal (`/movements`)** | ✅ Eksekusi IN / OUT | ✅ Eksekusi IN / OUT | ❌ Akses Ditolak |
| **Transaksi Keranjang Batch (`/transactions`)** | ✅ Eksekusi Batch | ✅ Eksekusi Batch | 👁️ Simulasi (Submit Dinonaktifkan) |
| **Buku Besar Riwayat Mutasi** | ✅ Baca Lengkap | ✅ Baca Lengkap | ✅ Baca Lengkap |
| **Laporan & Analitik Arus (`/reports`)** | ✅ Baca & Filter | ❌ Akses Ditolak | ✅ Baca & Filter |
| **Detail Laporan Produk (`/reports/products`)** | ✅ Baca & Filter | ❌ Akses Ditolak | ✅ Baca & Filter |
| **AI Generator Draf Produk** | ✅ Buat & Simpan ke Katalog | ✅ Buat (Salin Clipboard) | ❌ Akses Ditolak |
| **AI Refiner Spesifikasi** | ✅ Gunakan | ✅ Gunakan | ❌ Akses Ditolak |
| **AI Tanya Jawab Inventaris (Q&A)** | ✅ Gunakan | ❌ Akses Ditolak | ✅ Gunakan |
| **Manajemen Pengguna (`/users`)** | ✅ Tambah / Edit / Hapus | ❌ Akses Ditolak | ❌ Akses Ditolak |
| **Pengaturan Sistem & Branding** | ✅ Ubah Pengaturan | ❌ Akses Ditolak | ❌ Akses Ditolak |

---

## 9. Menjalankan Pengujian (Quality Gates)

Inventra memiliki rangkaian pengujian otomatis komprehensif menggunakan **Vitest** dengan tingkat keberhasilan **100% PASS**:

```bash
# Menjalankan seluruh test suite (unit + live integration)
npm test

# Menjalankan pengujian TypeScript secara ketat
npx tsc --noEmit

# Menjalankan analisis linting kode
npm run lint

# Memeriksa kepatuhan pemformatan kode Prettier
npx prettier --check .

# Memverifikasi build produksi Next.js
npm run build
```

### Hasil Verifikasi Quality Gates (Batch 5)

- **Total Test Files**: 42 file passed (42/42).
- **Total Tests**: 355 tests passed (355/355, 0 failed).
- **TypeScript Static Check**: Clean (0 error).
- **ESLint Analysis**: Clean (0 error).
- **Prettier Code Style**: Clean (100% formatted).
- **Turbopack Production Build**: Clean (54/54 static pages compiled successfully).

---

## 10. AI Assistant 9Router & Batasan Keamanan

Fitur kecerdasan buatan terintegrasi dengan gateway **9Router** (`https://router.octalectzz.my.id/v1`) menggunakan model `inventra`. Fitur ini dirancang dengan prinsip *Defense in Depth*:

1. **Server-Only Execution**: Klien HTTP 9Router (`src/lib/ai/nine-router-client.ts`) dilindungi oleh direktif `import 'server-only'`. Kunci API tidak pernah bocor ke bundel browser.
2. **Stock Immutability Guard**: Draf produk yang dihasilkan AI memiliki stok default `0`. Penyimpanan produk baru mendelegasikan ke `createProductAction` yang mengabaikan atribut stok.
3. **No Direct Database Writes**: Asisten AI tidak memiliki wewenang atau jalur langsung untuk mengubah tabel atau mengeksekusi mutasi stok.
4. **Sliding-Window Rate Limiting**: Mekanisme pembatas laju panggilan membatasi maksimal 10 permintaan per menit per sesi pengguna (`checkAiRateLimit`).
5. **Prompt Injection Neutralization**: Input pengguna disanitasi dari karakter kontrol dan dibungkus dalam delimiter khusus `<<<USER_DATA>>>` dan `<<<INVENTORY_CONTEXT>>>`.
6. **Output Schema Validation**: Respons JSON dari AI diparsing dan divalidasi ketat menggunakan skema Zod sebelum ditampilkan ke antarmuka pengguna.
7. **Pembersihan Error**: Seluruh pesan kesalahan sistem internal disanitasi (`sanitizeAiErrorMessage`) sehingga tidak membocorkan stack trace atau URL gateway ke pengguna.

---

## 11. Panduan Demonstrasi Lokal (Evaluator Walkthrough)

Evaluator dapat menguji fungsionalitas utama aplikasi dalam 5–10 menit:

1. **Jalankan Aplikasi**: Pastikan server berjalan via `npm run dev` dan buka `http://localhost:3000`.
2. **Skenario 1 — Login sebagai Administrator**:
   - Di halaman `/login`, klik chip **Administrator** dan tekan **Masuk ke Sistem**.
   - Buka menu **Katalog Produk** (`/inventory`): coba tambah produk baru (perhatikan bahwa input stok awal tidak tersedia; produk baru selalu dimulai dari stok 0).
   - Buka menu **Transaksi Mutasi** (`/transactions`): pilih beberapa produk, masukkan kuantitas IN, beri catatan referensi, dan klik **Eksekusi Transaksi Atomik**. Stok produk akan bertambah secara instan.
   - Buka menu **AI Asisten** (`/assistant/draft`): masukkan prompt nama produk (misal: "Minyak Kayu Putih 100ml"), klik buat draf, lalu simpan ke katalog.
3. **Skenario 2 — Uji Pencegahan Overdraft & All-or-Nothing**:
   - Di menu `/transactions`, pilih tipe **Stock OUT**.
   - Masukkan kuantitas yang sengaja melebihi stok tersedia untuk salah satu item.
   - Sistem akan memblokir submit pada antarmuka, dan PostgreSQL RPC akan menolak transaksi secara all-or-nothing jika dipaksakan.
4. **Skenario 3 — Login sebagai Auditor**:
   - Lakukan logout, lalu pada `/login` klik chip **Auditor** dan tekan masuk.
   - Buka `/inventory`: perhatikan tombol tambah produk dan tombol aksi edit dinonaktifkan dengan banner *Mode Pantau (Read-Only)*.
   - Buka `/transactions`: perhatikan tombol submit mutasi dinonaktifkan dengan peringatan hak akses.
   - Buka `/reports`: amati grafik arus pergerakan mutasi SVG dan filter periode interaktif.
   - Buka `/assistant/qa`: tanyakan status stok barang gudang (misal: "Produk apa saja yang stoknya di bawah 5 unit?").

---

## 12. Batasan Fitur, Asumsi & Pekerjaan Lanjutan

### Batasan Eksplisit (Out of Scope)
Sesuai arahan spesifikasi teknis, fitur-fitur berikut **eksplisit berada di luar cakupan**:
- Modul Point of Sale (POS) dan mesin kasir.
- Checkout belanja publik dan pesanan pelanggan (*customer orders*).
- Pembayaran, pencatatan kas, dan jurnal akuntansi finansial umum.

### Asumsi & Catatan Teknis
- **AI Rate Limiter**: Rate limiter saat ini berjalan secara in-memory. Pada penyebaran serverless terdistribusi multi-instans (misal: banyak lambda Vercel), sinkronisasi global membutuhkan Redis/Upstash terpusat.
- **Penyimpanan Gambar**: Membutuhkan bucket Supabase Storage bernama `product-images` dengan batas ukuran 2MB.

---

## 13. Transparansi Penggunaan AI (AI Usage Disclosure)

Sesuai instruksi transparansi take-home test:
- **Pengembangan Proyek**: Pengembang menggunakan agentic AI coding assistants (Google DeepMind Antigravity) sebagai partner pair-programming untuk arsitektur berlapis, pembuatan test case, dan penulisan dokumentasi teknis.
- **Fitur Aplikasi**: Fitur AI Assistant di dalam aplikasi diintegrasikan secara langsung dengan gateway **9Router** privat kandidat (`https://router.octalectzz.my.id/v1`) menggunakan model `inventra`.
- Seluruh kode, skema basis data, constraint SQL, dan logika bisnis telah diaudit, divalidasi, dan diuji secara empiris dengan 355 pengujian otomatis.

---

## 14. Indeks Dokumentasi Proyek

Dokumentasi teknis mendalam tersusun terstruktur di dalam direktori `docs/`:

| Dokumen | Deskripsi & Isi |
| :--- | :--- |
| [docs/PRD.md](docs/PRD.md) | Product Requirements Document, persona, dan JTBD. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arsitektur sistem monolit modular, Server Actions, dan alur data. |
| [docs/DATABASE.md](docs/DATABASE.md) | Skema PostgreSQL, indeks, trigger, RLS, dan RPC procedures. |
| [docs/SECURITY.md](docs/SECURITY.md) | Kebijakan keamanan, otorisasi sesi, proteksi stok, dan RLS matrix. |
| [docs/DESIGN.md](docs/DESIGN.md) | Desain antarmuka, token warna HSL/OKLCH, tipografi, dan tema. |
| [docs/TESTING.md](docs/TESTING.md) | Strategi pengujian otomatis, matriks edge-case, dan evaluasi Vitest. |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Prosedur build produksi dan panduan deployment Vercel. |
| [docs/API.md](docs/API.md) | Kontrak antarmuka Server Actions dan amplop respons. |
| [docs/reports/](docs/reports/) | Laporan audit lengkap tiap batch (Batch 0–5). |
