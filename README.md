# Inventra — Mini ERP Inventaris

**Mini ERP Inventory Management System**  
Take-Home Assessment untuk Posisi **Full Stack Engineer** di **PT. Syailendra Bumi Investama (DDistillers)**.

Inventra adalah sistem simulasi manajemen persediaan gudang modern berbasis web yang mencakup pengelolaan katalog produk terstandarisasi, pemantauan status stok dan barang menipis (*low stock*), pencatatan transaksi barang masuk (*Stock IN*) dan keluar (*Stock OUT*) secara atomik ACID, serta penelusuran riwayat mutasi (*traceability*) buku besar persediaan.

> **Status Proyek**: Selesai & Terverifikasi Penuh (**Phase 9: Final QA & Assessment Submission Passed**).  
> **Kandidat / Pengembang**: Octaviano (OctaLectzz)  
> **Waktu Pengerjaan**: 13–14 Oktober 2026 (~12–14 jam kerja efektif terstruktur)

---

## Daftar Isi

1. [Fitur Utama yang Telah Diimplementasikan](#fitur-utama-yang-telah-diimplementasikan)
2. [Tech Stack](#tech-stack)
3. [Prasyarat & Instalasi](#prasyarat--instalasi)
4. [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
5. [Setup Basis Data Supabase & Migrasi](#setup-basis-data-supabase--migrasi)
6. [Menjalankan Aplikasi Lokal](#menjalankan-aplikasi-lokal)
7. [Akun Demo & Akses Evaluator](#akun-demo--akses-evaluator)
8. [Menjalankan Pengujian (Quality Gates)](#menjalankan-pengujian-quality-gates)
9. [Arsitektur & Integritas Bisnis](#arsitektur--integritas-bisnis)
10. [Sumber Data Katalog & Konversi Harga](#sumber-data-katalog--konversi-harga)
11. [Keamanan & Pembatasan Akses (RBAC & RLS)](#keamanan--pembatasan-akses-rbac--rls)
12. [Batasan yang Diketahui](#batasan-yang-diketahui)
13. [Transparansi Penggunaan AI (AI Usage Disclosure)](#transparansi-penggunaan-ai-ai-usage-disclosure)
14. [Indeks Dokumentasi Proyek](#indeks-dokumentasi-proyek)

---

## Fitur Utama yang Telah Diimplementasikan

Sesuai dengan *Brief Ringkas Take-Home Test Mini ERP Inventaris*:

### 1. Modul A — Autentikasi & Role-Based Access Control (RBAC)
- **Multi-Role Separation**: Membedakan wewenang secara otoritatif antara peran **Admin Gudang** (`admin_gudang`) dan **Business Owner** (`owner`).
- **Direct URL & Action Guarding**: Proteksi rute berlapis pada tingkat Edge Middleware (`src/proxy.ts`) dan Server Components (`requireAuth`). Akses tidak sah dialihkan otomatis ke halaman login.
- **Session Persistence**: Sesi login berbasis cookie HTTP-only yang sinkron dengan `@supabase/ssr`, bertahan utuh saat muat ulang (*reload*) halaman.
- **Evaluator Quick-Access Chips**: Tombol akses cepat demo satu-klik pada halaman login untuk evaluator tanpa perlu mengetik kredensial manual.

### 2. Modul B — Katalog Produk & Standarisasi SKU
- **Sumber Data DummyJSON**: 30 produk awal disinkronkan langsung dari `dummyjson.com/products`.
- **SKU Unik & Terstandarisasi**: Format SKU tersusun rapi (`CAT-NAM-001`), divalidasi unik (*case-insensitive*) dan dilindungi constraint basis data.
- **Kelengkapan Atribut**: Setiap item memuat SKU, Nama Produk, Kategori, Satuan (`pcs`/`box`), Harga Referensi (Rupiah), dan Stok Terkini.
- **Imutabilitas Stok Katalog**: Form tambah dan ubah produk secara ketat **hanya memodifikasi metadata katalog**. Modifikasi kolom stok dicegah oleh database trigger `trg_protect_product_stock`.

### 3. Modul C — Mutasi Masuk/Keluar (Stock IN / Stock OUT)
- **Validasi Kuantitas Ketat**: Kuantitas wajib berupa bilangan bulat positif (`> 0`). Angka 0, negatif, maupun desimal ditolak seketika oleh Zod dan PostgreSQL.
- **Pencegahan Overdraft (Anti-Stockout)**: Transaksi mutasi keluar (*Stock OUT*) yang melebihi sisa stok tersedia ditolak seketika dengan kode `INSUFFICIENT_STOCK`.
- **Atomisitas ACID Ganda**: Mutasi dieksekusi melalui prosedur PostgreSQL RPC `public.record_stock_movement` dengan kunci baris pesimistik (`FOR UPDATE`). Perubahan stok dan penambahan log mutasi terjadi dalam satu transaksi atomik. Jika salah satu gagal, data tidak berubah sama sekali.
- **Konsistensi Rumus Stok**: Dijamin matematis oleh constraint basis data:  
  $$\text{Stok Akhir} = \text{Stok Awal} + \text{Total IN} - \text{Total OUT}$$

### 4. Modul D — Riwayat & Penelusuran (Traceability)
- **Tabel Riwayat Komprehensif**: Menampilkan Timestamp (terformat lokal), SKU & Nama Produk, Tipe Mutasi (`IN` hijau / `OUT` merah), Kuantitas, Transisi Stok (`Stok Sebelum → Stok Sesudah`), Pengguna Eksekutor, dan Catatan/Referensi Operasional.
- **Filter Interaktif**: Pencarian dinamis multi-atribut (SKU/Nama/Catatan), filter tipe pergerakan (Semua, Masuk, Keluar), dan filter rentang tanggal ISO.
- **Responsive Table & Card Layout**: Tampilan tabel komprehensif pada desktop dan kartu modular pada layar seluler.

### 5. Modul E — Ringkasan Inventaris (Dashboard KPIs)
- **Total SKU Unik**: Jumlah item aktif dalam katalog (30 SKU).
- **Total Unit Stok**: Akumulasi stok fisik aktual di gudang (1.648 unit).
- **Barang Low Stock**: Penandaan otomatis item dengan stok di bawah ambang batas kritis ($< 5$ unit) beserta kartu pantau *Low Stock Watchlist*.
- **Estimasi Nilai Persediaan**: Valuasi aktual persediaan berbasis akumulasi $\sum (\text{stok} \times \text{harga})$ dalam mata uang Rupiah.

### 6. Fitur Rekayasa Tambahan (Enterprise Polish)
- **Dwibahasa Penuh (i18n)**: Dukungan Bahasa Indonesia (default) dan Bahasa Inggris melalui `next-intl`.
- **Multi-Tema**: Mode Terang (*Light*), Gelap (*Dark*), dan Sistem (*System*) via `next-themes` dengan palet warna kontras tinggi OKLCH.
- **Mode Audit untuk Owner**: Saat login sebagai Business Owner, tombol tindakan tulis dinonaktifkan dengan penanda visual *Mode Audit (Read-Only)*.

---

## Tech Stack

| Lapisan | Teknologi | Alasan Pemilihan & Catatan |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server Components, Server Actions, Partial Prerendering, Turbopack. |
| **Bahasa** | TypeScript (Strict Mode) | Type-safety mutlak, zero `any` pada domain logic. |
| **Styling** | Tailwind CSS v4 | Engine CSS v4 berbasis token tema modern `@theme inline`. |
| **UI Components** | shadcn/ui & Radix UI | Komponen aksesibel, responsif, dialog modal, dan primitives. |
| **Database** | PostgreSQL (Supabase Cloud) | Transaksi ACID, Row-Level Security, RPC Functions, Triggers. |
| **Auth** | Supabase Auth (`@supabase/ssr`) | SSR cookie-based authentication yang stateless dan aman. |
| **Internationalization** | `next-intl` | Arsitektur dictionary bilingual (ID & EN) tersinkronisasi. |
| **Theming** | `next-themes` | Manajemen tema tanpa kedipan flash dengan persistensi local storage. |
| **Validation** | Zod + React Hook Form | Skema validasi tunggal yang dibagikan antara form client dan server action. |
| **Testing** | Vitest 3 | 197 tes otomatis (unit & live integration test suite). |
| **Package Manager** | npm | Manajer paket tunggal yang divalidasi. |

---

## Prasyarat & Instalasi

### Prasyarat Sistem
- **Node.js**: Versi 20+ LTS (diuji pada v24.21.0 dan v20.x).
- **npm**: Versi 9+ atau 10+.
- **Git**: Versi 2.30+.
- Koneksi internet untuk sinkronisasi ke Supabase Cloud.

### Langkah Instalasi

```bash
# 1. Clone repository inventra
git clone https://github.com/OctaLectzz/erp-inventaris.git
cd erp-inventaris

# 2. Pasang seluruh dependensi resmi via npm
npm install
```

> **Peringatan Penting**: Proyek ini dikonfigurasi secara eksklusif menggunakan `npm`. Dilarang menggunakan `yarn`, `pnpm`, atau `bun`.

---

## Konfigurasi Environment Variables

Salin berkas template lingkungan `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi konfigurasi berikut pada `.env.local`:

```env
# Application Metadata
NEXT_PUBLIC_APP_NAME="Inventra"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase Public Configuration (Aman diekspos ke browser client)
NEXT_PUBLIC_SUPABASE_URL="https://vwzlvsggpuvmkubkzfzp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-supabase-anon-key>"

# Supabase Privileged Configuration (SERVER-ONLY — DILARANG ADA DI BROWSER)
SUPABASE_SERVICE_ROLE_KEY="<your-supabase-service-role-key>"

# Demo Accounts Configuration (Digunakan untuk seed script dan test)
DEMO_ADMIN_EMAIL="admin@inventra.demo"
DEMO_ADMIN_PASSWORD="<your-demo-admin-password>"
DEMO_OWNER_EMAIL="owner@inventra.demo"
DEMO_OWNER_PASSWORD="<your-demo-owner-password>"
```

> **Kebijakan Keamanan**: Kunci `SUPABASE_SERVICE_ROLE_KEY` dan kata sandi asli **tidak pernah dicatat** ke dalam riwayat commit Git.

---

## Setup Basis Data Supabase & Migrasi

Seluruh skema basis data tersimpan secara deklaratif dan berurutan pada direktori `supabase/migrations/`:

1. `20261013000001_initial_schema.sql`: Definisi tabel `profiles`, `products`, `stock_movements`, enum peran, indeks performa, dan constraint delta matematis.
2. `20261013000002_rls_policies.sql`: Kebijakan *Row-Level Security* (RLS) pada seluruh tabel dan fungsi trigger pelindung imutabilitas stok (`prevent_direct_stock_modification`).
3. `20261013000003_stock_mutation_rpc.sql`: Prosedur transaksi atomik `record_stock_movement` dengan kunci baris pesimistik `FOR UPDATE`.

### Cara Menjalankan Sinkronisasi Katalog (Opsional / Reset)
Jika ingin melakukan sinkronisasi ulang 30 produk dari DummyJSON:

```bash
npx tsx scripts/sync-catalog.ts
```

---

## Menjalankan Aplikasi Lokal

```bash
# Jalankan development server Next.js (Turbopack)
npm run dev

# ATAU kompilasi dan jalankan bundle produksi:
npm run build
npm run start
```

Akses aplikasi pada peramban Anda di: **`http://localhost:3000`**

---

## Akun Demo & Akses Evaluator

Untuk memudahkan proses evaluasi tanpa memerlukan input manual, halaman login (`/id/login`) telah dilengkapi dengan **Evaluator Quick-Login Chips**:

| Tombol Evaluator | Akun / Email | Peran (*Role*) | Wewenang & Batasan Akses |
| :--- | :--- | :--- | :--- |
| **"Admin Gudang"** | `admin@inventra.demo` | `admin_gudang` | **Akses Penuh**: Melihat dashboard, menambah produk baru, mencatat mutasi stok (IN/OUT), melihat seluruh riwayat pergerakan. |
| **"Business Owner"** | `owner@inventra.demo` | `owner` | **Mode Audit (Read-Only)**: Melihat dashboard metriks, melihat katalog produk, melihat riwayat mutasi. Aksi tambah produk dan mutasi stok dinonaktifkan/ditolak. |

---

## Menjalankan Pengujian (Quality Gates)

Proyek ini dilengkapi dengan rangkaian pengujian komprehensif (197 tes otomatis) yang memvalidasi integritas logika bisnis:

```bash
# 1. Jalankan Unit Tests (Domain, Schema, Zod, State, Service logic)
npm run test:unit
# Hasil: 14 test files, 171 tests passed

# 2. Jalankan Live Integration Tests (terhadap PostgreSQL Supabase aktif)
npm run test:live
# Hasil: 2 test files, 26 tests passed (termasuk verifikasi RLS dan uji konkurensi)

# 3. Jalankan Seluruh Test Suite (197 tests)
npm run test

# 4. Jalankan Pemeriksaan Type TypeScript Strict
npx tsc --noEmit

# 5. Jalankan Linter ESLint
npm run lint

# 6. Jalankan Verifikasi Formatting Prettier
npx prettier --check "src/**/*.{ts,tsx,css}" "tests/**/*.ts"

# 7. Jalankan Kompilasi Build Produksi
npm run build
```

---

## Arsitektur & Integritas Bisnis

Inventra mengadopsi **Layered Clean Architecture**:

```
Presentation Layer (Next.js App Router, shadcn/ui, Radix, Tailwind v4)
         │
         ▼
Application Boundary (Server Actions: stock-actions, product-actions, auth-actions)
         │  ├─ Validasi Skema Zod
         │  ├─ Validasi Hak Akses (requireAuth + RBAC)
         │  └─ Pre-flight Availability Check
         ▼
Service Layer (Domain Calculation, Date Parsing, Business Rules)
         │
         ▼
Data Access & Security Layer (PostgreSQL Supabase, RLS, Functions, Triggers)
   ├─ public.record_stock_movement (ACID Atomic RPC + FOR UPDATE Row Lock)
   ├─ public.prevent_direct_stock_modification (Database Trigger)
   └─ public.stock_movements (Append-Only Ledger)
```

### Jaminan Konkurensi & Atomisitas Mutasi
1. Ketika mutasi masuk atau keluar dieksekusi, prosedur RPC menjalankan `SELECT stock FROM public.products WHERE id = p_product_id FOR UPDATE`.
2. Permintaan paralel pada baris produk yang sama akan diantrekan secara berurutan (*serialized*).
3. Pengujian live konkurensi membuktikan bahwa 3 permintaan `OUT 5` paralel pada stok `12` secara akurat menghasilkan **2 mutasi sukses** dan **1 mutasi gagal**, menyisakan stok tepat **2 unit** tanpa kebocoran data.

---

## Sumber Data Katalog & Konversi Harga

- **Sumber Data**: 30 produk diambil dari endpoint publik `https://dummyjson.com/products`.
- **Konversi Kurs Mata Uang**: Mengingat harga produk pada DummyJSON dinyatakan dalam USD, sistem mengonversinya ke mata uang Rupiah (IDR) menggunakan rumus standar pasar:
  $$\text{Harga IDR} = \text{round}(\text{DummyJSON Price USD} \times 16.000)$$
- **Total Nilai Valuasi Awal**: Rp 6.251.910.720 (~Rp 6,25 Miliar) dari 1.648 unit persediaan.

---

## Keamanan & Pembatasan Akses (RBAC & RLS)

1. **Zero Client Trust**: Hak akses tidak pernah ditentukan semata-mata oleh atribut browser. Server Actions dan PostgreSQL RPC mengekstrak identitas pengguna dari JWT session yang sah via `auth.uid()`.
2. **Keterisolasian Service Role**: Kunci `SUPABASE_SERVICE_ROLE_KEY` memiliki penanda `import 'server-only'` di `src/lib/supabase/admin.ts` dan tidak pernah disertakan ke dalam bundel JavaScript client.
3. **Imutabilitas Buku Besar**: Hak `INSERT/UPDATE/DELETE` langsung pada tabel `stock_movements` dicabut dari semua peran operasional. Riwayat mutasi bersifat *append-only* murni.

---

## Batasan yang Diketahui

1. **Traceability Bukan Legal Audit Log**: Sesuai brief uji ("Traceability di tes ini adalah riwayat untuk penelusuran, bukan audit trail yang aman dari perubahan forensik"), riwayat mutasi difokuskan pada penelusuran operasional gudang.
2. **Gambar Produk**: Menggunakan URL thumbnail publik langsung dari DummyJSON CDN tanpa penyimpanan lokal bucket S3/Supabase Storage.
3. **Integrasi AI (Modul F)**: Modul F dialokasikan sebagai fitur penyempurnaan opsional (Phase 10). Berdasarkan ketentuan resmi brief: *"Tidak mengerjakan tidak mengurangi nilai."*

---

## Transparansi Penggunaan AI (AI Usage Disclosure)

Sesuai instruksi Bagian 5 pada berkas acuan `Take_Home_Test_FSE.pdf`:

### 1. Bagaimana AI Digunakan
AI Coding Assistant (Antigravity) digunakan sebagai mitra *pair-programming* untuk:
- Merancang dokumentasi arsitektur bertahap (PRD, Arsitektur, Skema DB, API, Standar Keamanan).
- Melakukan scaffolding komponen UI berbasis shadcn/ui dan Tailwind CSS v4.
- Menyusun skrip uji komprehensif Vitest dan pengujian konkurensi database live.
- Menjalankan audit kepatuhan regresi dan verifikasi otomatis via browser subagent.

### 2. Apa yang Diperiksa oleh Insinyur / Developer
- Memeriksa kebenaran formula matematika mutasi stok dan ambang batas *low stock* ($< 5$).
- Memvalidasi skrip migrasi SQL dan memastikan isolasi RLS tidak memiliki kebocoran akses.
- Memverifikasi bahwa tidak ada kunci rahasia (*secret keys*) yang bocor ke bundle client browser.
- Meninjau diff Git secara teliti sebelum melakukan finalisasi pekerjaan.

### 3. Contoh Nyata Kekeliruan AI dan Penanganannya
- **Kekeliruan AI**: Saat menghubungkan tabel `stock_movements` dengan profil pengguna untuk menampilkan nama pembuat mutasi di tabel riwayat, AI mencoba menulis kueri Supabase relasional `.select('*, profiles(*)')`. PostgREST langsung menolak kueri tersebut dengan error schema cache, karena relasi foreign key `user_id` di database mengarah ke tabel `auth.users(id)` (bukan langsung `public.profiles(id)`).
- **Penanganan Mandiri**: Developer mendeteksi penolakan ini, menolak opsi merusak skema migrasi database yang sudah berjalan, dan merevisi logika data access di `src/services/stock-movement-service.ts` agar mengambil data riwayat dan memetakan atribut nama serta peran pengguna secara aman di lapisan service application. Solusi ini diverifikasi melalui unit test `tests/unit/stock-movement-service.test.ts` yang lulus 100%.

---

## Indeks Dokumentasi Proyek

Dokumentasi teknis lengkap tersedia di direktori `docs/`:

| Dokumen | Deskripsi & Isi Dokumen |
| :--- | :--- |
| [AGENTS.md](./AGENTS.md) | Pedoman utama agen coding, arsitektur, dan ringkasan status implementasi. |
| [docs/PRD.md](./docs/PRD.md) | Product Requirements Document, persona pengguna, dan batasan cakupan sistem. |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Detail arsitektur berlapis, Server Components, dan diagram alur mutasi stok. |
| [docs/DESIGN.md](./docs/DESIGN.md) | Desain visual, palet warna brand (Deep Navy, Electric Teal), dan tipografi. |
| [docs/SECURITY.md](./docs/SECURITY.md) | Kebijakan keamanan data, audit RLS, dan matriks hak akses RBAC. |
| [docs/DATABASE.md](./docs/DATABASE.md) | Skema tabel relasional PostgreSQL, indeks, trigger, dan RPC atomik. |
| [docs/API.md](./docs/API.md) | Kontrak antarmuka Server Actions dan envelope respons `{ success, data, error }`. |
| [docs/TESTING.md](./docs/TESTING.md) | Strategi pengujian unit, live integration, dan matriks skenario batas. |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Panduan deployment ke Vercel dan Supabase Cloud. |
| [docs/reports/Phase 9 - Final QA and Submission/requirements_traceability_matrix.md](./docs/reports/Phase%209%20-%20Final%20QA%20and%20Submission/requirements_traceability_matrix.md) | Matriks penelusuran seluruh persyaratan take-home test (100% PASS). |
| [docs/reports/Phase 9 - Final QA and Submission/security_review.md](./docs/reports/Phase%209%20-%20Final%20QA%20and%20Submission/security_review.md) | Laporan audit keamanan 10 kontrol. |
| [docs/reports/Phase 9 - Final QA and Submission/submission_checklist.md](./docs/reports/Phase%209%20-%20Final%20QA%20and%20Submission/submission_checklist.md) | Lembar periksa deliverable dan skenario uji submission. |
| [docs/reports/Phase 9 - Final QA and Submission/phase9_final_qa_report.md](./docs/reports/Phase%209%20-%20Final%20QA%20and%20Submission/phase9_final_qa_report.md) | Laporan akhir komprehensif penjaminan kualitas Phase 9. |
