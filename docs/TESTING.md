# TESTING — Inventra Automated Test Suite & Quality Gates

> **Status:** 44 Test Files, 365 Automated Tests (100% PASS)  
> **Framework:** Vitest v3.2.7 + TypeScript Strict Mode  
> **Cakupan Dokumen:** Panduan lengkap pengujian unit & integrasi untuk memenuhi instruksi take-home test:  
> _"Unit test untuk logika penting: SKU, kuantitas mutasi, batas stok, pembaruan stok, nilai persediaan."_

---

## 1. Ringkasan Eksekutif & Hasil Pengujian

Inventra menerapkan piramida pengujian otomatis yang berfokus pada kebenaran logika bisnis (_business logic correctness_ — bobot 40%) dan integritas arsitektur kode (_code quality & persistence_ — bobot 30%):

```
┌────────────────────────────────────────────────────────┐
│                   HASIL QUALITY GATES                  │
├──────────────────────────┬─────────────────────────────┤
│ Total Test Files         │ 44 files passed (44/44)     │
│ Total Tests Executed     │ 365 passed (365/365)        │
│ Tests Failed             │ 0 failed                    │
│ TypeScript Compilation   │ 0 errors (npx tsc --noEmit) │
│ ESLint Code Analysis     │ 0 errors (npm run lint)     │
│ Prettier Code Style      │ 100% formatted              │
│ Turbopack Build          │ 54 static pages compiled    │
└──────────────────────────┴─────────────────────────────┘
```

### Perintah Menjalankan Pengujian

```bash
# Menjalankan seluruh test suite (unit + live integration)
npm test

# Menjalankan unit tests murni (isolasi cepat tanpa database)
npm run test:unit

# Menjalankan live integration tests (Supabase PostgreSQL + RLS + RPC)
npm run test:live

# Menjalankan pengujian dalam mode interaktif watch
npm run test:watch
```

---

<a id="unit-test-untuk-logika-penting"></a>

## 2. Unit Test untuk Logika Penting (Sesuai Syarat Take-Home Test)

Sesuai dokumen spesifikasi take-home test, berikut adalah pemetaan lengkap dan bukti pengujian untuk 5 logika bisnis paling penting:

### 2.1 Logika Penting 1: SKU (Kode Barang Unik)

| Kriteria Uji                   | File Pengujian Utama                                                                                                                                                                                                               | Metode & Skenario                                                                                                              | Status  |
| :----------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- | :-----: |
| **Format & Batasan SKU**       | [product-catalog-schema.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/product-catalog-schema.test.ts)                                                                                                                | Memvalidasi SKU minimal 3 karakter, alfanumerik bertanda hubung, konversi otomatis ke huruf kapital (_uppercase_).             | ✅ PASS |
| **Keunikan SKU (Uniqueness)**  | [product-catalog-schema.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/product-catalog-schema.test.ts)<br>[live-integration.test.ts](file:///c:/Experience/Projects/inventra/tests/supabase/live-integration.test.ts) | Menolak SKU duplikat secara _case-insensitive_ (`CAT-001` vs `cat-001`). Diverifikasi pada 30 produk aktif dengan 0 duplikasi. | ✅ PASS |
| **Generasi SKU Deterministik** | [catalog-domain.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/catalog-domain.test.ts)                                                                                                                                | Menguji fungsi `generateDeterministicSku` saat sinkronisasi katalog DummyJSON agar idempotensial dan konsisten.                | ✅ PASS |

```typescript
// Contoh asersi keunikan dan format SKU:
expect(skuSet.has(skuLower)).toBe(false)
expect(result.data.sku).toBe('ATS-NLM-050')
```

---

### 2.2 Logika Penting 2: Kuantitas Mutasi (Positive Integer Only)

| Kriteria Uji                    | File Pengujian Utama                                                                                              | Metode & Skenario                                                                             | Status  |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :-----: |
| **Kuantitas Positif Bulat**     | [stock-mutation-domain.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/stock-mutation-domain.test.ts) | Memastikan kuantitas wajib integer `> 0`. Menerima nilai 1, 10, 100 unit.                     | ✅ PASS |
| **Penolakan Kuantitas Nol (0)** | [take-home-scenarios.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/take-home-scenarios.test.ts)     | Nilai 0 ditolak oleh Zod (`quantityMustBePositive`) dan domain kalkulasi tanpa mengubah stok. | ✅ PASS |
| **Penolakan Kuantitas Negatif** | [stock-mutation-domain.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/stock-mutation-domain.test.ts) | Nilai negatif (-1, -5, -50) ditolak seketika (`INVALID_QUANTITY`).                            | ✅ PASS |
| **Penolakan Desimal / Pecahan** | [take-home-scenarios.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/take-home-scenarios.test.ts)     | Angka pecahan (2.5, 3.5, 0.1) ditolak (`quantityMustBeInteger`).                              | ✅ PASS |
| **Penolakan NaN & Infinity**    | [stock-mutation-domain.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/stock-mutation-domain.test.ts) | Nilai bukan angka (`NaN`, `Infinity`) ditolak aman tanpa crash.                               | ✅ PASS |

---

### 2.3 Logika Penting 3: Batas Stok & Anti-Overdraft (Zero-Stockout Lock)

| Kriteria Uji                           | File Pengujian Utama                                                                                                      | Metode & Skenario                                                                                                    | Status  |
| :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------- | :-----: |
| **Pencegahan Overdraft Mutasi Keluar** | [stock-mutation-domain.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/stock-mutation-domain.test.ts)         | Stok 10, mutasi OUT 11 unit $\to$ Ditolak (`INSUFFICIENT_STOCK`).                                                    | ✅ PASS |
| **Pengeluaran Persis Habis (Stok 0)**  | [stock-mutation-domain.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/stock-mutation-domain.test.ts)         | Stok 10, mutasi OUT 10 unit $\to$ Diizinkan, sisa stok menjadi persis 0.                                             | ✅ PASS |
| **Pengeluaran dari Stok Nol**          | [stock-mutation-domain.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/stock-mutation-domain.test.ts)         | Stok 0, mutasi OUT 1 unit $\to$ Ditolak seketika (`INSUFFICIENT_STOCK`).                                             | ✅ PASS |
| **All-or-Nothing Batch Rollback**      | [live-batch-transactions.test.ts](file:///c:/Experience/Projects/inventra/tests/supabase/live-batch-transactions.test.ts) | Dalam keranjang 3 barang, jika barang ke-3 melebihi stok, seluruh mutasi di-rollback atomik tanpa perubahan parsial. | ✅ PASS |

---

### 2.4 Logika Penting 4: Pembaruan Stok & Integritas Transisi (Stock Consistency)

| Kriteria Uji                            | File Pengujian Utama                                                                                          | Metode & Skenario                                                                                             | Status  |
| :-------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------ | :-----: |
| **Transisi Stok Bertambah (Stock IN)**  | [take-home-scenarios.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/take-home-scenarios.test.ts) | Terima 10 unit, stok awal 4 $\to$ Stok menjadi 14; buku besar mencatat `4 → 14`.                              | ✅ PASS |
| **Transisi Stok Berkurang (Stock OUT)** | [take-home-scenarios.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/take-home-scenarios.test.ts) | Keluarkan 3 unit dari stok 14 $\to$ Stok menjadi 11; buku besar mencatat `14 → 11`.                           | ✅ PASS |
| **Rumus Konsistensi Stok Matematis**    | [take-home-scenarios.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/take-home-scenarios.test.ts) | Menguji rumus wajib: $\text{Stok Saat Ini} = \text{Stok Pembuka} + \text{Total Masuk} - \text{Total Keluar}$. | ✅ PASS |
| **Imutabilitas Stok Katalog**           | [stock-immutability.test.ts](file:///c:/Experience/Projects/inventra/tests/ai/stock-immutability.test.ts)     | Memastikan stok tidak dapat diubah melalui manipulasi formulir atau API katalog biasa.                        | ✅ PASS |
| **Pessimistic Concurrency Lock**        | [live-integration.test.ts](file:///c:/Experience/Projects/inventra/tests/supabase/live-integration.test.ts)   | 2 mutasi bersamaan pada baris yang sama ditangani sekuensial dengan lock `FOR UPDATE` tanpa lost updates.     | ✅ PASS |

---

### 2.5 Logika Penting 5: Nilai Persediaan (Inventory Valuation & Low Stock)

| Kriteria Uji                           | File Pengujian Utama                                                                                                                                                                                                     | Metode & Skenario                                                                                                             | Status  |
| :------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :-----: |
| **Kalkulasi Valuasi Total**            | [inventory-summary.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/inventory-summary.test.ts)                                                                                                                | Menghitung $\sum (\text{harga} \times \text{stok})$ dengan presisi integer matematis tanpa pembulatan mengambang.             | ✅ PASS |
| **Penanda Barang Low Stock (< 5)**     | [inventory-summary.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/inventory-summary.test.ts)<br>[live-integration.test.ts](file:///c:/Experience/Projects/inventra/tests/supabase/live-integration.test.ts) | Menguji bahwa hanya barang dengan stok 0, 1, 2, 3, 4 unit yang dihitung sebagai low stock (`stock < 5`).                      | ✅ PASS |
| **Pemformatan Mata Uang Rupiah (IDR)** | [formatters.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/formatters.test.ts)                                                                                                                              | Memvalidasi pemformatan Rupiah penuh (`Rp 15.000`), nilai negatif (`-Rp 50.000`), dan notasi ringkas kartu KPI (`Rp 6,43 M`). | ✅ PASS |
| **Konversi Harga USD ke IDR**          | [catalog-domain.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/catalog-domain.test.ts)                                                                                                                      | Memverifikasi kurs tetap $1\text{ USD} = 16.000\text{ IDR}$ untuk data dari DummyJSON.                                        | ✅ PASS |

---

## 3. Verifikasi Contoh Skenario Ringkas Verbatim (PDF Brief Halaman 2)

Dibuat khusus pada [tests/unit/take-home-scenarios.test.ts](file:///c:/Experience/Projects/inventra/tests/unit/take-home-scenarios.test.ts) untuk menguji setiap skenario tabel ringkas take-home test:

```typescript
describe('Take-Home Test Brief Ringkas - Verbatim Scenarios Verification', () => {
  // Skenario 1: Terima 10 unit, stok awal 4 -> Stok 14; riwayat mencatat 4 -> 14
  it('increments stock from 4 to 14 and records transition 4 -> 14') // PASS

  // Skenario 2: Keluarkan 3 unit dari stok 14 -> Stok 11; riwayat mencatat 14 -> 11
  it('decrements stock from 14 to 11 and records transition 14 -> 11') // PASS

  // Skenario 3: Keluarkan 12 unit dari stok 11 -> Ditolak; stok dan riwayat tidak berubah
  it('rejects overdraft mutation without modifying stock or state') // PASS

  // Skenario 4: Kuantitas nol, negatif, atau desimal -> Ditolak tanpa perubahan
  it('rejects quantity of 0, negative, and decimal without state mutation') // PASS

  // Skenario 5: Muat ulang setelah mutasi; akses halaman beda role -> Data dan sesi utuh
  it('verifies strict role isolation and session persistence according to RBAC matrix') // PASS
})
```

---

## 4. Matriks Direktori File Pengujian (44 Test Suites)

```
tests/
├── ai/
│   ├── ai-guardrails.test.ts           # Rate limit sliding-window & sanitasi pesan error
│   ├── ai-inventory-qa.test.ts         # Q&A faktual stok gudang dengan batasan payload < 1KB
│   ├── ai-rbac.test.ts                 # Otorisasi peran penggunaan AI assistant
│   ├── ai-schemas.test.ts              # Validasi Zod schema draf AI produk
│   ├── nine-router-client.test.ts      # Klien gateway 9Router server-only
│   └── stock-immutability.test.ts      # Penguncian stok produk baru AI wajib bernilai 0
├── auth/
│   ├── auth-actions.test.ts            # Server Action login, logout, sesi profil
│   ├── auth-schema.test.ts             # Skema login & validasi kredensial
│   ├── auth-service.test.ts            # Service layer otorisasi pengguna & cookie
│   └── live-auth.test.ts               # Integrasi live auth Supabase akun demo
├── i18n/
│   └── translations.test.ts            # Keselarasan 1:1 kunci kamus ID & EN (8 namespace)
├── supabase/
│   ├── live-batch-transactions.test.ts # Transaksi atomik multi-item batch live PostgreSQL
│   ├── live-integration.test.ts        # Concurrency pessimistic lock FOR UPDATE live DB
│   ├── rpc-logic-simulation.test.ts    # Simulasi logika stored procedure PostgreSQL
│   └── sql-syntax-and-contract.test.ts # Kontrak fungsi migrasi SQL & database constraint
└── unit/
    ├── analytics-domain.test.ts        # Kalkulasi analitik pergerakan mutasi
    ├── batch-stock-mutation-action.test.ts # Server Action mutasi batch
    ├── batch-stock-schema.test.ts      # Skema validasi keranjang 1-100 item
    ├── catalog-domain.test.ts          # Sinkronisasi DummyJSON & deterministik SKU
    ├── catalog-table-columns.test.ts   # Kolom tabel katalog & badge stok
    ├── category-schema.test.ts         # Skema Zod master kategori produk
    ├── date-boundaries.test.ts         # Batas rentang tanggal filter laporan
    ├── demo-accounts-fill.test.ts      # Verifikasi chip akses cepat akun demo
    ├── formatters.test.ts              # Format mata uang IDR & angka
    ├── image-dropzone-validation.test.ts # Validasi gambar & magic bytes upload
    ├── inventory-summary.test.ts       # Metrik ringkasan KPI & low stock
    ├── logout-confirmation.test.ts     # Konfirmasi dialog logout
    ├── product-catalog-schema.test.ts  # Skema metadata produk katalog
    ├── product-service.test.ts         # Data access service katalog produk
    ├── rbac-authorization.test.ts      # Pembatasan wewenang antar peran
    ├── rbac-menu-filtering.test.ts     # Penyaringan menu sidebar berdasarkan peran
    ├── rbac-reports.test.ts            # Proteksi akses laporan analitik
    ├── reports-domain.test.ts          # Pemrosesan data laporan per produk
    ├── responsive-dashboard.test.ts    # Perilaku layout responsive dashboard
    ├── settings-support.test.ts        # Pengaturan profil & preferensi
    ├── sidebar-navigation.test.ts      # Navigasi & rute aktif sidebar
    ├── stock-ledger-domain.test.ts     # Domain buku besar mutasi riwayat
    ├── stock-movement-service.test.ts  # Service layer mutasi persediaan
    ├── stock-mutation-action.test.ts   # Server Action mutasi tunggal
    ├── stock-mutation-domain.test.ts   # Kalkulasi mutasi matematis murni
    ├── system-actions.test.ts          # Aksi sistem sinkronisasi demo DummyJSON
    ├── take-home-scenarios.test.ts     # Skenario ringkas verbatim brief PDF
    ├── user-schema.test.ts             # Skema manajemen pengguna sistem
    └── website-settings-schema.test.ts # Skema konfigurasi branding website
```
