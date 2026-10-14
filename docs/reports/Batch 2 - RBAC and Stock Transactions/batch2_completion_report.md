# Laporan Penyelesaian Batch 2: Konsolidasi RBAC, Perbaikan KPI Dashboard & Transaksi Stok Multi-Item

**Proyek**: Inventra Mini ERP Inventaris  
**Versi**: v0.1.0-dev (Batch 2 Final)  
**Tanggal**: 14 Oktober 2026  
**Status**: Selesai & Terverifikasi (Quality Gates 100% Passed)  
**Referensi**: [rbac_and_kpi_review.md](../Dashboard%20UI%20UX%20Refinement/rbac_and_kpi_review.md)

---

## 1. Ringkasan Eksekutif & Cakupan Selesai

Batch 2 berfokus pada penguatan arsitektur hak akses (RBAC), penyempurnaan KPI dashboard tanpa pemotongan teks, penandaan rute roadmap mendatang, dan implementasi transaksi stok multi-item atomik (_all-or-nothing_) pada level basis data PostgreSQL.

Seluruh target cakupan telah diselesaikan secara tuntas dan terverifikasi secara empiris:

| Area Cakupan                   | Deskripsi Target                                                                                                                                        | Status     | Bukti Verifikasi                                                                                                                                                                          |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Konsolidasi RBAC**        | Menyatukan peran menjadi 3 peran final (`administrator`, `staff_gudang`, `auditor`) dengan pemetaan kompatibel peran warisan (`admin_gudang`, `owner`). | ✅ Selesai | Migrasi SQL `20261014000002_rbac_and_batch_transactions.sql` aktif di Supabase live, 10 unit test otorisasi, 5 live auth test, dan verifikasi sesi SSR.                                   |
| **B. Perbaikan KPI Dashboard** | Formatter IDR terpusat, label KPI tidak terpotong (`line-clamp-2`), nilai ringkas dengan tooltip nominal lengkap, tanpa tren fiktif.                    | ✅ Selesai | `src/lib/formatters.ts`, `kpi-stat-card.tsx` dengan Radix UI Tooltip, pengujian visual browser multi-viewport (390px, 768px, 1280px).                                                     |
| **C. Penandaan Roadmap**       | Label dan badge eksplisit untuk modul yang belum aktif (`/reports`, `/reports/products` sebagai Batch 3, `/assistant` sebagai Batch 4).                 | ✅ Selesai | Badge "Batch 3" dan "Batch 4" pada navigasi sidebar dan breadcrumb dengan tooltip informatif dan tanpa tautan palsu.                                                                      |
| **D. Transaksi Multi-Item**    | Pencatatan transaksi mutasi stok keranjang multi-item dengan jaminan atomisitas basis data (_all-or-nothing_) dan ledger audit.                         | ✅ Selesai | PostgreSQL RPC `public.record_batch_stock_movements` dengan kunci pesimistis terurut, Server Action `recordBatchStockMovementAction`, antarmuka `TransactionCartView` di `/transactions`. |

---

## 2. Arsitektur RBAC & Migrasi Database

### A. Tiga Peran Otoritatif Final

1. **`administrator`**: Akses penuh mengelola katalog, kategori, mutasi stok, akun pengguna, dan pengaturan sistem.
2. **`staff_gudang`**: Akses operasional untuk melihat katalog dan mencatat mutasi stok fisik (IN/OUT tunggal maupun batch multi-item); dilarang mengelola kategori atau peran pengguna.
3. **`auditor`**: Akses baca-saja (_read-only_) untuk dashboard, katalog, laporan valuasi, dan buku besar riwayat mutasi stok; diblokir mutlak dari eksekusi mutasi katalog/stok.

### B. Kompatibilitas Non-Destruktif

- Database check constraint `profiles_role_check` diperluas: `CHECK (role IN ('admin_gudang', 'owner', 'administrator', 'staff_gudang', 'auditor'))`.
- Akun legacy `admin_gudang` dipetakan otomatis setara hak `administrator`.
- Akun legacy `owner` dipetakan otomatis setara hak `auditor`.
- Helper otorisasi terpusat di `src/types/auth.ts`:
  - `canManageCatalog(role)`: `administrator | admin_gudang`
  - `canManageCategories(role)`: `administrator | admin_gudang`
  - `canMutateStock(role)`: `administrator | admin_gudang | staff_gudang`
  - `isAuditorRole(role)`: `auditor | owner`
  - `canManageUsers(role)`: `administrator`

### C. Migrasi SQL Terapan (`supabase/migrations/20261014000002_rbac_and_batch_transactions.sql`)

1. **Constraint Profiles**: Memperbarui check constraint untuk 5 role.
2. **Trigger Default User**: Mengubah trigger `public.handle_new_user()` agar pengguna baru terdaftar default sebagai `auditor` (kebijakan _least privilege_).
3. **RLS Policies**: Mengubah `products_insert_admin` dan `products_update_admin` agar mengizinkan `administrator`.
4. **RPC Tunggal**: Memperbarui `public.record_stock_movement` agar mengotorisasi `administrator` dan `staff_gudang`.
5. **Backfill Profil**: Memperbarui profil `admin@inventra.demo` menjadi `administrator`, dan `owner@inventra.demo` menjadi `auditor`.
6. **Penyediaan Akun Demo Baru**: Akun `staff@inventra.demo` diprovisioning via `scripts/seed-demo-users.ts` dengan role `staff_gudang`.

### D. Rencana Rollback Migrasi (Disiapkan)

Jika diperlukan pengembalian skema:

```sql
-- Rollback RPC batch
DROP FUNCTION IF EXISTS public.record_batch_stock_movements(text, jsonb, text);

-- Kembalikan hak akses RPC tunggal ke admin_gudang saja
-- Kembalikan RLS public.products ke admin_gudang saja
-- Kembalikan default trigger handle_new_user ke admin_gudang/owner
-- Restore check constraint profiles_role_check ke ('admin_gudang', 'owner')
```

---

## 3. Penyempurnaan KPI Dashboard & Formatter Terpusat

### A. Modul Formatter Terpusat (`src/lib/formatters.ts`)

- `formatCurrencyIDR(amount, options)`:
  - Mode Standar: Menghasilkan `Rp 215.753.800` menggunakan `Intl.NumberFormat('id-ID')`.
  - Mode Ringkas (`compact: true`): Menghasilkan `Rp 215,8 jt` atau `Rp 1,2 M` untuk tampilan kartu KPI yang hemat ruang dan anti-wrapping.
- `formatNumber(value, locale)`: Pemformat angka lokal dengan pemisah ribuan standar.

### B. Desain Anti-Truncation pada KPI Stat Card

- Mengganti kelas Tailwind `truncate` pada judul KPI dengan `line-clamp-2 min-h-[2rem] leading-snug`.
- Menghilangkan risiko label terpotong (_clipped_) pada layar sempit/mobile.
- Mengintegrasikan komponen Radix UI `TooltipProvider`, `Tooltip`, `TooltipTrigger`, dan `TooltipContent`:
  - Nilai KPI ringkas (`Rp 215,8 jt`) dapat di-hover atau di-tap pada perangkat seluler untuk memunculkan tooltip nominal presisi penuh: `Rp 215.753.800`.
- Memastikan tidak ada indikator tren atau sparkline fiktif. Seluruh metrik bersumber langsung dari agregasi murni data Supabase live.

---

## 4. Penandaan Rute Roadmap Mendatang

Agar tidak terjadi kebingungan operasional bagi pengguna dan penilai:

- Rute `/reports` dan `/reports/products`: Ditandai dengan badge outline `Batch 3` dan status badge di navigasi sidebar.
- Rute `/assistant`: Ditandai dengan badge outline `Batch 4` sebagai roadmap AI eksplisit.
- Navigasi sidebar dilengkapi tooltip penjelas bahwa fitur-fitur tersebut dijadwalkan pada batch rilis berikutnya, tanpa adanya link mati (_broken link_) atau data analitik tiruan.

---

## 5. Transaksi Stok Multi-Item & Jaminan Atomisitas

### A. PostgreSQL Atomic RPC Function (`public.record_batch_stock_movements`)

- **Tanda Tangan**: `(p_type text, p_items jsonb, p_note text) RETURNS json`
- **Karakteristik Keamanan & Zero-Trust**:
  - `SECURITY DEFINER` dengan `SET search_path = ''`.
  - Hanya dapat dieksekusi oleh peran `authenticated` yang memiliki role `administrator`, `admin_gudang`, atau `staff_gudang`.
  - Aktor pemanggil ditentukan otoritatif via `auth.uid()`, tidak dapat dipalsukan.
- **Pencegahan Deadlock & Race Condition (Pessimistic Concurrency Lock)**:
  - Seluruh UUID produk target dikumpulkan ke dalam array dan dikunci sekaligus menggunakan:
    ```sql
    PERFORM 1 FROM public.products WHERE id = ANY(v_seen_ids) ORDER BY id FOR UPDATE;
    ```
  - Klausa `ORDER BY id` menjamin akuisisi kunci baris dilakukan secara deterministik, mengeliminasi risiko _deadlock_ saat transaksi multi-item konkuren berjalan paralel.
- **Jaminan Atomisitas All-or-Nothing**:
  - Validasi menyeluruh dijalankan pada seluruh item sebelum mutasi pertama diterapkan:
    - Kuantitas setiap item wajib bilangan bulat positif (`> 0`).
    - Catatan referensi wajib minimal 3 karakter non-kosong.
    - Untuk tipe `OUT`: Jika salah satu item meminta kuantitas yang melebihi stok yang ada, transaksi langsung dibatalkan (`ROLLBACK` terstruktur) dan menghasilkan kode error `INSUFFICIENT_STOCK`. Tidak ada produk lain dalam batch yang berkurang stoknya.
  - Jika seluruh item valid, UUID batch baru digenerate (`v_batch_id := gen_random_uuid()`), stok diperbarui, dan entri buku besar `public.stock_movements` dibuat dengan mencantumkan nomor referensi batch pada kolom catatan.

### B. Validasi Schema & Server Action

- `src/schemas/inventory-schema.ts`:
  - `batchStockItemSchema`: Validasi UUID produk, kuantitas positif (1 s.d. 1.000.000).
  - `batchStockMutationSchema`: Validasi array item (1 s.d. 100 item), deduplikasi produk (UUID unik per batch), dan catatan (min 3 karakter).
- `src/app/actions/stock-actions.ts`:
  - `recordBatchStockMovementAction`: Menjalankan autentikasi server boundary, verifikasi RBAC via `canMutateStock`, pre-flight check katalog, pemanggilan RPC batch, serta `revalidatePath` untuk dashboard, katalog, riwayat pergerakan, dan formulir transaksi.

### C. Antarmuka Interaktif Keranjang Transaksi (`src/features/transactions/transaction-cart-view.tsx`)

- Pemilih tipe mutasi: Tombol radio tersegmentasi yang jelas antara **Masuk (IN)** dan **Keluar (OUT)**.
- Selektor produk katalog dengan filter pencarian instan dan penampil stok saat ini.
- Input kuantitas dengan validasi live dan estimasi stok akhir (_stock before → stock after_).
- Peringatan instan jika kuantitas keluar melebihi stok fisik tersedia.
- Tabel keranjang transaksi interaktif dengan kolom: SKU, Nama Produk, Stok Saat Ini, Kuantitas (+/-), Estimasi Stok Akhir, dan Tombol Hapus Baris.
- Panel ringkasan: Total baris SKU, total unit fisik, dan input catatan referensi dokumen (contoh: Surat Jalan / Nomor PO).
- Tombol eksekusi dengan status loading spinner (_"Memproses di Database..."_).
- Penanganan khusus peran **Auditor**: Menampilkan banner audit hanya-baca dan menonaktifkan tombol eksekusi transaksi.

---

## 6. Bukti Verifikasi & Quality Gates

### A. Rangkuman Hasil Pengujian Vitest

Perintah: `npm test`  
Hasil: **28 Test Files PASSED, 266 Tests PASSED (100% SUCCESS)**.

```
 RUN  v3.2.7 C:/Experience/Projects/inventra

 ✓ tests/i18n/translations.test.ts (30 tests)
 ✓ tests/supabase/rpc-logic-simulation.test.ts (21 tests)
 ✓ tests/unit/stock-movement-service.test.ts (7 tests)
 ✓ tests/unit/stock-mutation-domain.test.ts (15 tests)
 ✓ tests/unit/product-catalog-schema.test.ts (9 tests)
 ✓ tests/unit/stock-mutation-action.test.ts (7 tests)
 ✓ tests/unit/product-service.test.ts (8 tests)
 ✓ tests/auth/auth-schema.test.ts (9 tests)
 ✓ tests/auth/live-auth.test.ts (5 tests)
   ✓ should authenticate live Administrator account and verify authoritative profile role
   ✓ should authenticate live Staff Gudang account and verify authoritative profile role
   ✓ should authenticate live Auditor account and verify authoritative profile role
   ✓ should reject invalid password for known account
 ✓ tests/supabase/sql-syntax-and-contract.test.ts (23 tests)
 ✓ tests/auth/auth-actions.test.ts (5 tests)
 ✓ tests/unit/settings-support.test.ts (3 tests)
 ✓ tests/unit/stock-ledger-domain.test.ts (8 tests)
 ✓ tests/unit/category-schema.test.ts (9 tests)
 ✓ tests/unit/batch-stock-mutation-action.test.ts (5 tests)
 ✓ tests/auth/auth-service.test.ts (11 tests)
 ✓ tests/unit/catalog-domain.test.ts (11 tests)
 ✓ tests/supabase/live-batch-transactions.test.ts (5 tests)
   ✓ 1. Rejects batch stock mutation by anonymous caller (Zero-Trust)
   ✓ 2. Rejects batch stock mutation by Auditor role (RBAC Enforcement)
   ✓ 3. Executes atomic Batch Stock IN for Staff Gudang and updates all product stocks
   ✓ 4. ENFORCES ATOMIC ALL-OR-NOTHING: If one item exceeds available stock in OUT, entire batch is rolled back
   ✓ 5. Executes valid Batch Stock OUT for Administrator and creates audit ledger entries
 ✓ tests/unit/batch-stock-schema.test.ts (7 tests)
 ✓ tests/unit/rbac-authorization.test.ts (10 tests)
 ✓ tests/unit/inventory-summary.test.ts (7 tests)
 ✓ tests/unit/formatters.test.ts (13 tests)
 ✓ tests/unit/sidebar-navigation.test.ts (3 tests)
 ✓ tests/unit/logout-confirmation.test.ts (3 tests)
 ✓ tests/unit/responsive-dashboard.test.ts (3 tests)
 ✓ tests/unit/demo-accounts-fill.test.ts (3 tests)
 ✓ tests/unit/catalog-table-columns.test.ts (4 tests)
 ✓ tests/supabase/live-integration.test.ts (22 tests)

 Test Files  28 passed (28)
      Tests  266 passed (266)
```

### B. TypeScript Strict Verification

Perintah: `npx tsc --noEmit`  
Hasil: **Exit Code 0 (Zero errors)**.

### C. ESLint Verification

Perintah: `npm run lint`  
Hasil: **Exit Code 0 (Zero errors)**.

### D. Prettier Code Formatting

Perintah: `npx prettier --write "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}" "scripts/**/*.{ts,tsx}"`  
Hasil: **100% Clean formatting** sesuai standar `.prettierrc`.

### E. Next.js 16 (Turbopack) Production Build

Perintah: `npm run build`  
Hasil: **Exit Code 0 (Sukses mengompilasi 36/36 rute statis dan dinamis, termasuk modul `/transactions`)**.

### F. Pengujian Browser Multi-Viewport (Browser Subagent E2E)

Pengujian interaktif otomatis telah dijalankan menggunakan subagent browser dengan hasil:

1. **Form Login & Demo Chips**: Menampilkan 3 kartu demo evaluasi (`Administrator`, `Staf Gudang`, `Auditor`). Auto-fill kredensial dan submit login berfungsi sempurna.
2. **Dashboard KPI & Tooltip**: Nilai ringkas IDR ditampilkan rapi, label tidak terpotong, dan hover tooltip menampilkan nominal lengkap presisi hingga digit rupiah terakhir.
3. **Keranjang Transaksi Multi-Item**: Penambahan item ke keranjang, kalkulasi delta kuantitas, validasi catatan referensi, dan tombol transaksi atomik berfungsi lancar.
4. **Uji Responsivitas Seluler (390x844)**: Navigasi hamburger drawer membuka menu mobile dengan chip role yang jelas tanpa pergeseran layout (_no horizontal overflow_).
5. **Uji Pembatasan Peran Auditor**: Sesi login Auditor menampilkan banner peringatan audit hanya-baca dan tombol mutasi dinonaktifkan secara tepat.

---

## 7. Rekaman & Tangkapan Layar Pengujian

Seluruh artefak tangkapan layar dan rekaman sesi pengujian tersimpan pada direktori artefak lokal:

- **Tangkapan Layar Login (3 Role Chips)**: `C:\Users\octav\.gemini\antigravity-ide\brain\97bb5eb8-12d7-4727-a7da-44d78d96b4ee\login_page_1791979969338.png`
- **Tangkapan Layar Transaksi Keranjang Multi-Item**: `C:\Users\octav\.gemini\antigravity-ide\brain\97bb5eb8-12d7-4727-a7da-44d78d96b4ee\transactions_page_1791980016453.png`
- **Tangkapan Layar Keranjang Terisi & Catatan Referensi**: `C:\Users\octav\.gemini\antigravity-ide\brain\97bb5eb8-12d7-4727-a7da-44d78d96b4ee\transactions_cart_filled_1791980036923.png`
- **Tangkapan Layar Responsif Mobile (390x844)**: `C:\Users\octav\.gemini\antigravity-ide\brain\97bb5eb8-12d7-4727-a7da-44d78d96b4ee\mobile_responsive_view_1791980049021.png`
- **Tangkapan Layar Drawer Navigasi Mobile**: `C:\Users\octav\.gemini\antigravity-ide\brain\97bb5eb8-12d7-4727-a7da-44d78d96b4ee\mobile_drawer_open_1791980063983.png`
- **Tangkapan Layar Pembatasan Akses Auditor (Read-Only)**: `C:\Users\octav\.gemini\antigravity-ide\brain\97bb5eb8-12d7-4727-a7da-44d78d96b4ee\auditor_transactions_readonly_1791980144852.png`
- **Rekaman Video WebP Sesi Pengujian Browser**: `C:\Users\octav\.gemini\antigravity-ide\brain\97bb5eb8-12d7-4727-a7da-44d78d96b4ee\batch2_browser_verification_1791979949175.webp`

---

## 8. Status & Pintu Tinjauan (Review Gate)

Sesuai instruksi dan batasan kerja:

- **TIDAK ADA git commit, push, atau deployment yang dilakukan.**
- **TIDAK ADA dependensi baru pihak ketiga yang diinstal.**
- Seluruh cakupan Batch 2 telah selesai 100% dan terverifikasi secara empiris.
- Pekerjaan dihentikan di sini untuk menunggu tinjauan dan persetujuan pengguna sebelum memulai Batch 3 (Dashboard Analitik & Laporan Lanjutan).
