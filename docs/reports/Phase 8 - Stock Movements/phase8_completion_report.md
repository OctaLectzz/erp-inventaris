# Laporan Penyelesaian Phase 8: Stock IN/OUT Server Actions & Movement History

**Proyek**: Inventra Mini ERP Inventaris  
**Versi**: v0.1.0-dev  
**Tanggal**: 14 Oktober 2026  
**Status**: Selesai & Terverifikasi (Quality Gates 100% Passed)  
**Tautan Rencana Implementasi**: [phase8_stock_movements_plan.md](../../../.gemini/antigravity-ide/brain/db2fed11-2c2b-4a06-8742-59dea6724981/phase8_stock_movements_plan.md)

---

## 1. Hasil Audit Kontrak RPC & Skema Database

Sebelum memulai implementasi, telah dilakukan pemeriksaan _read-only_ mendalam terhadap basis data aktif PostgreSQL via Supabase MCP:

### A. Kontrak RPC `public.record_stock_movement`

- **Tanda Tangan Argumen**: `(p_product_id uuid, p_type text, p_quantity integer, p_note text) RETURNS json`
- **Karakteristik Keamanan**:
  - `SECURITY DEFINER` dengan `SET search_path = ''` untuk mitigasi pembajakan skema.
  - Hak eksekusi diberikan secara eksklusif kepada `authenticated`. Akses `anon` dan `PUBLIC` dicabut (`REVOKE`).
  - **Zero-Trust Actor Resolution**: Aktor pemanggil ditentukan secara otoritatif di dalam mesin database melalui `v_user_id := (SELECT auth.uid())`. Database tidak pernah mempercayai ID pengguna yang dipasok dari sisi client.
  - **Authoritative Role Enforcement**: Memeriksa fungsi pembantu `public.get_user_role(v_user_id) = 'admin_gudang'`. Upaya pemanggilan oleh pengguna dengan role `owner` menghasilkan `{ success: false, error: 'FORBIDDEN', message: 'Only warehouse administrators (admin_gudang) can mutate inventory' }`.
  - **Pessimistic Concurrency Lock**: Menjalankan `SELECT stock FROM public.products WHERE id = p_product_id FOR UPDATE` untuk mencegah _race condition_ dan pembacaan _phantom_ pada mutasi konkuren.
  - **Atomisitas Ganda**: Pembaruan stok produk (`UPDATE public.products SET stock = ...`) dan pencatatan buku besar riwayat (`INSERT INTO public.stock_movements (...)`) dibungkus dalam satu transaksi ACID tak terpisahkan.
  - **Envelope Respons**:
    - Berhasil: `{ success: true, data: { movement_id, product_id, type, quantity, stock_before, stock_after, note } }`
    - Gagal: `{ success: false, error: string, message: string }` (e.g. `'INSUFFICIENT_STOCK'`, `'INVALID_QUANTITY'`, `'EMPTY_NOTE'`).
    - _Aturan Krusial_: Supabase JS tidak melempar eksepsi ketika RPC mengembalikan status kegagalan terstruktur. Server Action wajib memvalidasi `!error && data?.success === true`.

### B. Skema & Relasi `public.stock_movements`

- **Kolom Tabel**:
  - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `product_id`: `uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT`
  - `user_id`: `uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT`
  - `type`: `text NOT NULL CHECK (type IN ('IN', 'OUT'))`
  - `quantity`: `integer NOT NULL CHECK (quantity > 0)`
  - `stock_before`: `integer NOT NULL CHECK (stock_before >= 0)`
  - `stock_after`: `integer NOT NULL CHECK (stock_after >= 0)`
  - `note`: `text NOT NULL CHECK (length(trim(note)) > 0)`
  - `created_at`: `timestamptz NOT NULL DEFAULT now()`
- **Constraint Integritas Delta**: `movements_delta_integrity` menjamin bahwa untuk tipe `IN`, `stock_after = stock_before + quantity`; dan untuk tipe `OUT`, `stock_after = stock_before - quantity`.
- **Temuan Kunci PostgREST Relationship Cache**:
  - PostgREST mengenali relasi langsung `stock_movements.product_id` ke `products(id)`, sehingga kueri `.select('*, products(...)')` berjalan mulus.
  - Namun relasi `user_id` mengarah ke `auth.users(id)` (bukan langsung `public.profiles(id)`). Upaya _embed_ langsung `.select('*, profiles(*)')` ditolak oleh PostgREST schema cache.
  - Diselesaikan secara arsitektural pada lapisan service (`stock-movement-service.ts`) dengan memetakan profil pemanggil dan fallback atribut peran tanpa memodifikasi skema SQL basis data.

---

## 2. Berkas yang Dibuat dan Diubah

### A. Berkas Baru (Created)

| Berkas                                               | Lapisan Arsitektur     | Tanggung Jawab                                                                                                                                                                                                                     |
| :--------------------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/stock-movement-service.ts`             | Service Layer          | Kueri data riwayat mutasi terpaginasi, validasi rentang tanggal ISO (`parseDateRangeBoundaries`), filter tipe mutasi, filter pencarian multi-atribut produk (SKU/Nama), dan atribusi pengguna.                                     |
| `src/app/actions/stock-actions.ts`                   | Server Actions         | Server Action `recordStockMovementAction` dengan validasi otorisasi server-boundary, skema Zod `stockMutationInputSchema`, pre-flight availability check, pemanggilan RPC `record_stock_movement`, dan `revalidatePath`.           |
| `src/features/movements/stock-mutation-dialog.tsx`   | Presentation (Feature) | Form modal interaktif untuk Admin Gudang dengan selektor produk, kartu pemilihan tipe IN/OUT, input kuantitas bilangan bulat positif, live feedback estimasi stok akhir, peringatan overdraft, dan textarea catatan.               |
| `src/features/movements/movement-table.tsx`          | Presentation (Feature) | Komponen tabel riwayat responsif untuk desktop dan tampilan card mobile, dilengkapi bilah filter (SKU/nama, tipe mutasi, tanggal mulai, tanggal akhir), tombol reset filter, pagination, dan trigger mutasi stok.                  |
| `src/app/[locale]/(dashboard)/movements/page.tsx`    | App Router (RSC)       | Server Component halaman riwayat pergerakan stok dengan guard `requireAuth`, pengambilan data terurut dari Supabase, dan header informatif.                                                                                        |
| `src/app/[locale]/(dashboard)/movements/loading.tsx` | App Router             | Loading skeleton UI teranimasi saat halaman riwayat mutasi dimuat.                                                                                                                                                                 |
| `src/app/[locale]/(dashboard)/movements/error.tsx`   | App Router             | Error boundary dengan tombol coba lagi saat terjadi kegagalan pengambilan data pergerakan stok.                                                                                                                                    |
| `tests/unit/stock-mutation-action.test.ts`           | Testing Layer          | Pengujian unit Server Action `recordStockMovementAction` (7 pengujian): penolakan anonim, penolakan peran `owner`, validasi Zod, penolakan produk hilang, penolakan overdraft, eksekusi RPC, dan penanganan kegagalan terstruktur. |
| `tests/unit/stock-movement-service.test.ts`          | Testing Layer          | Pengujian unit service riwayat stok (7 pengujian): batas tanggal ISO, validasi tanggal tidak logis, pemfilteran tipe mutasi, pemfilteran SKU/nama, dan paginasi.                                                                   |

### B. Berkas yang Diubah (Modified)

| Berkas                                                        | Lapisan                | Deskripsi Perubahan                                                                                                                                              |
| :------------------------------------------------------------ | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/inventory.ts`                                      | Domain Types           | Menambahkan antarmuka `StockMovementWithDetails`, `StockMovementFilters`, dan `StockMovementListResult`.                                                         |
| `src/proxy.ts`                                                | Edge Middleware        | Memperluas deteksi rute terproteksi (`isProtectedAppRoute`) mencakup `/movements` dan `/(id\|en)/movements`.                                                     |
| `src/features/dashboard/dashboard-nav.tsx`                    | Presentation (Feature) | Menambahkan tab navigasi "Mutasi Stok" (`links.movements`) dengan ikon `ArrowLeftRight` dan deteksi status aktif.                                                |
| `messages/id/dashboard.json` & `messages/en/dashboard.json`   | Internationalization   | Menambahkan namespace `movements` dan `mutationDialog` secara simetris dalam bahasa Indonesia dan Inggris.                                                       |
| `messages/id/validation.json` & `messages/en/validation.json` | Internationalization   | Menambahkan kunci terjemahan validasi error mutasi (`invalidMovementType`, `quantityMustBeInteger`, `quantityMustBePositive`, `noteMinLength`, `noteMaxLength`). |

---

## 3. Alur Server Action hingga RPC Basis Data

```
[Admin Gudang UI: StockMutationDialog]
       │
       ▼ (1. Validasi Client-side: Zod + Deteksi Overdraft)
[recordStockMovementAction(input, locale)]
       │
       ▼ (2. Autentikasi Server Boundary: requireAuth(locale))
  [Pemeriksaan Role: profile.role === 'admin_gudang']
       │  ├─ Bukan admin_gudang ──> Return { success: false, error: 'FORBIDDEN' }
       │  └─ Belum login ─────────> Return { success: false, error: 'UNAUTHORIZED' }
       ▼
  [Pemeriksaan Skema Zod: stockMutationInputSchema]
       │  └─ Tidak valid ─────────> Return { success: false, error: 'VALIDATION_ERROR', fieldErrors }
       ▼
  [Pre-flight Availability Check di Supabase Client]
       │  └─ OUT > stock ─────────> Return { success: false, error: 'INSUFFICIENT_STOCK' }
       ▼
  [supabase.rpc('record_stock_movement', params)]
       │ (Dieksekusi menggunakan JWT/kredensial pengguna aktif, BUKAN service_role)
       ▼
[PostgreSQL RPC: public.record_stock_movement]
  1. Identifikasi v_user_id := auth.uid()
  2. Verifikasi public.get_user_role(v_user_id) = 'admin_gudang'
  3. Kunci baris produk: SELECT stock FROM public.products FOR UPDATE
  4. Perhitungan & verifikasi ketersediaan (OUT <= stock, anti-overflow)
  5. UPDATE public.products SET stock = new_stock, updated_at = now()
  6. INSERT INTO public.stock_movements (ledger record)
  7. RETURN json { success: true, data: { ... } }
       │
       ▼
[Server Action menerima envelope hasil RPC]
  ├─ Gagal ──> Return structured error message
  └─ Berhasil:
       ├─ revalidatePath('/[locale]/dashboard')
       ├─ revalidatePath('/[locale]/inventory')
       ├─ revalidatePath('/[locale]/movements')
       └─ Return { success: true, data: ... }
       │
       ▼
[UI memperbarui status, menampilkan banner sukses, dan memuat ulang tabel]
```

---

## 4. Validasi Input & Pemeriksaan Hak Akses (RBAC)

| Skenario Pengujian / Kondisi                    | Lapisan Pemeriksaan                          | Hasil & Perilaku Sistem                                                                              |
| :---------------------------------------------- | :------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Pengguna Tanpa Sesi (Anonim)**                | Server Boundary (`requireAuth`) & Middleware | Akses ditolak (`UNAUTHORIZED`), dialihkan ke `/login`.                                               |
| **Pengguna dengan Role `owner`**                | Server Action (`stock-actions.ts`)           | Aksi ditolak dengan error `FORBIDDEN`. Tombol form disembunyikan di UI dengan label Mode Audit.      |
| **Kuantitas = 0**                               | Zod Schema (`.positive()`)                   | Ditolak dengan pesan `quantityMustBePositive`.                                                       |
| **Kuantitas Negatif (-5)**                      | Zod Schema (`.positive()`)                   | Ditolak dengan pesan `quantityMustBePositive`.                                                       |
| **Kuantitas Desimal (2.5)**                     | Zod Schema (`.int()`)                        | Ditolak dengan pesan `quantityMustBeInteger`.                                                        |
| **Tipe Mutasi Tidak Dikenal ('TRANSFER')**      | Zod Schema (`.enum(['IN', 'OUT'])`)          | Ditolak dengan pesan `invalidMovementType`.                                                          |
| **Catatan Kurang dari 3 Karakter**              | Zod Schema (`.min(3)`)                       | Ditolak dengan pesan `noteMinLength`.                                                                |
| **Stok OUT Melebihi Kuantitas Tersedia**        | Pre-flight Guard & Database RPC Lock         | Ditolak seketika dengan kode `INSUFFICIENT_STOCK`. Nilai stok di database sama sekali tidak berubah. |
| **Pemanggilan Langsung RPC oleh Pemilik Usaha** | Internal PostgreSQL RPC Guard                | Mengembalikan status `FORBIDDEN` dari dalam fungsi SQL tanpa mengubah data.                          |

---

## 5. Halaman & Filter Riwayat Pergerakan Stok

1. **Rute Terproteksi**: Tersedia secara dwibahasa di `/[locale]/movements` (misal `/id/movements` dan `/en/movements`), dilindungi oleh edge proxy middleware `src/proxy.ts`.
2. **Kolom Data Ditampilkan**:
   - **Waktu Transaksi**: Diformat terlokalisasi sesuai bahasa aktif (contoh: `14 Okt 2026, 02:15`).
   - **SKU Produk**: Kode SKU monospace dengan sorotan warna _brand primary_.
   - **Nama Produk**: Nama lengkap produk beserta badge kategori.
   - **Tipe Mutasi**: Badge semantik hijau (`IN`) atau merah/rose (`OUT`) dengan ikon arah panah.
   - **Kuantitas**: Nilai mutasi bertanda (`+10` atau `-3` unit).
   - **Stok (Sebelum → Sesudah)**: Transisi stok aktual yang tercatat pada buku besar (contoh: `10 → 20`).
   - **Pengguna**: Nama dan peran pengguna yang mengeksekusi mutasi.
   - **Catatan / Referensi**: Alasan mutasi operasional.
3. **Filter Interaktif**:
   - Pencarian multi-atribut: SKU, nama produk, atau kata kunci catatan.
   - Pilihan tipe transaksi: Semua, Masuk (IN), Keluar (OUT).
   - Pemilihan rentang tanggal: Tanggal Mulai dan Tanggal Akhir dengan validasi format dan validasi `Tanggal Mulai <= Tanggal Akhir`.
   - Tombol Reset Filter untuk mengembalikan ke tampilan riwayat utuh.
4. **Navigasi Tab Terpadu**:
   - Komponen `DashboardNav` kini memiliki 3 tab terintegrasi: **Dashboard**, **Katalog Produk**, dan **Mutasi Stok**.

---

## 6. Bukti Tidak Ada Mutasi Stok Langsung Melalui Aplikasi

Sistem menerapkan prinsip _defense in depth_ berlapis untuk menjamin imutabilitas mutasi langsung:

1. **Tidak Ada Kolom `stock` di Form Master Produk**:
   - `productCatalogInputSchema` dan `productCatalogUpdateSchema` sama sekali tidak memuat properti `stock`.
2. **Tidak Ada `UPDATE products SET stock` dari Lapisan Aplikasi**:
   - Tidak ada fungsi pada seluruh kode sumber `src/` yang menjalankan `.update({ stock: ... })`.
3. **Penegakan Hak Akses Kolom PostgreSQL**:
   - `GRANT UPDATE (sku, name, category, unit, price, description, image_url) ON public.products TO authenticated` secara eksplisit mengecualikan kolom `stock`.
4. **Pencegahan Trigger Database**:
   - Pemicu `trg_protect_product_stock` (`prevent_direct_stock_modification`) pada tabel `products` secara otomatis melempar eksepsi bila ada modifikasi stok langsung di luar RPC `record_stock_movement`.
5. **Penegakan Buku Besar**:
   - Hak `INSERT`, `UPDATE`, dan `DELETE` pada tabel `stock_movements` dicabut total dari pengguna aplikasi (`authenticated` hanya memiliki hak `SELECT`). Semua pencatatan ledger dieksekusi secara otomatis oleh RPC atomik.

---

## 7. Hasil Pengujian Unit, Integrasi & Quality Gates

Semua perintah pemeriksaan otomatis telah dijalankan dan lulus 100%:

| Kategori Pengujian         | Perintah Eksekusi      | Target / Cakupan                             |           Hasil & Status            |
| :------------------------- | :--------------------- | :------------------------------------------- | :---------------------------------: |
| **Unit Testing**           | `npm run test:unit`    | 14 berkas uji unit (171 tes)                 |    ✅ **171 / 171 Lulus (100%)**    |
| **Live Integration Tests** | `npm run test:live`    | 2 berkas uji live Supabase (25 tes)          |     ✅ **25 / 25 Lulus (100%)**     |
| **TypeScript Strictness**  | `npx tsc --noEmit`     | Seluruh codebase TypeScript (Strict Mode)    |           ✅ **0 Error**            |
| **ESLint Standards**       | `npm run lint`         | Aturan Next.js 16 & React Hooks              |      ✅ **0 Error, 0 Warning**      |
| **Prettier Formatting**    | `npx prettier --check` | Seluruh berkas `src/`, `tests/`, `messages/` |     ✅ **Format Bersih & Rapi**     |
| **Production Build**       | `npm run build`        | Turbopack Production Build (App Router)      | ✅ **Compiled Cleanly (18 Routes)** |

---

## 8. Catatan Pengujian Konkurensi (_Concurrency_)

- Desain RPC `public.record_stock_movement` menggunakan klausa `SELECT stock FROM public.products WHERE id = p_product_id FOR UPDATE`.
- Mekanisme ini menempatkan kunci baris eksklusif (_row-level pessimistic write lock_) di PostgreSQL untuk mencegah _lost updates_ dan _race condition_ pada saat beberapa operator gudang memasukkan transaksi untuk produk yang sama secara simultan.
- Pengujian simulasi konkurensi di `tests/supabase/rpc-logic-simulation.test.ts` telah memverifikasi bahwa skenario mutasi simultan memproses antrean secara sekuensial dan menolak permintaan jika stok tersisa tidak lagi mencukupi.

---

## 9. Masalah yang Belum Selesai (_Open Issues_)

- **Tidak Ada Masalah Terbuka**: Seluruh fungsionalitas yang ditargetkan pada Phase 8 telah selesai, terintegrasi, dan teruji tanpa regresi pada fungsionalitas fase-fase sebelumnya.

---

## 10. Konfirmasi Batasan Fase

- [x] **Tidak ada migrasi database atau perubahan skema SQL**: Skema DDL dan kebijakan RLS dipertahankan utuh sesuai audit awal.
- [x] **Tidak ada fitur POS, kasir, atau penjualan**: Batasan cakupan inventaris murni tetap dipatuhi.
- [x] **Tidak ada mutasi destruktif pada data demo seed**: 30 produk seed DummyJSON tetap aman dan utuh.
- [x] **Tidak ada penambahan dependensi npm**: Tetap menggunakan pustaka resmi yang telah disetujui.
- [x] **Tidak ada eksekusi Git commit atau push**: Seluruh berkas siap untuk ditinjau oleh pengguna.
- [x] **Tidak memulai Phase 9**: Pengerjaan berhenti di akhir Phase 8 untuk menunggu persetujuan eksplisit dari pengguna.

---

_Laporan ini menandai penyelesaian resmi Phase 8. Sistem berada dalam kondisi stabil dan siap untuk peninjauan pengguna._
