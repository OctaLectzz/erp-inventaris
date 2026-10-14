# Catatan Penggunaan AI (AI Usage Disclosure & Audit) — Inventra

> Dokumen ini disusun untuk memenuhi persyaratan resmi pada **Take-Home Test Full Stack Engineer** — **PT. Syailendra Bumi Investama (DDistillers)** (Bagian 5: _Yang Dikumpulkan_).

---

## 1. Bagaimana AI Dipakai dalam Proyek Ini

Dalam pengembangan sistem **Inventra**, AI dimanfaatkan pada dua tingkatan arsitektural yang berbeda:

### A. AI sebagai Asisten Pemrograman Rekayasa (Engineering Pair-Programming)

- **Model / Asisten**: Google DeepMind Antigravity Coding Agent (berbasis model penalaran lanjut).
- **Peran**:
  - Membantu akselerasi penulisan _boilerplate_ arsitektur berlapis (Next.js 16 App Router, TypeScript strict types, Zod schemas, dan Tailwind CSS v4 styling).
  - Melakukan _scaffolding_ komprehensif untuk pengujian otomatis Vitest (44 file pengujian, 365+ test cases).
  - Membantu perumusan skema migrasi SQL PostgreSQL dan dokumentasi teknis mendalam (Diátaxis framework).
- **Filosofi & Kendali**: AI diperlakukan murni sebagai alat bantu akselerasi sintaksis. Seluruh keputusan arsitektur (seperti _pessimistic row locking_ `FOR UPDATE`, _zero-trust actor binding_, pemisahan kepedulian katalog vs mutasi fisik, dan konsolidasi RBAC 3-peran) ditentukan, diawasi, dan divalidasi penuh oleh kandidat engineer.

### B. AI sebagai Fitur Operasional Aplikasi (In-App AI Copilot)

- **Model**: `inventra` yang di-host secara privat melalui gateway **9Router** (`https://router.octalectzz.my.id/v1`) dengan protokol OpenAI-compatible.
- **Peran di Aplikasi**:
  1. **Draf Katalog Produk (`/assistant/draft`)**: Menerjemahkan nama produk atau deskripsi mentah menjadi draf produk berstandar industri kosmetik/atsiri (SKU deterministik, nama, kategori, unit, estimasi harga IDR, deskripsi, spesifikasi teknis).
  2. **Refiner Spesifikasi Teknis (`/assistant/refine`)**: Memperbaiki redaksi bahasa katalog, mengekstraksi atribut spesifikasi (kadar patchouli alcohol, kemurnian etanol, tipe botol), dan menyusun catatan gudang standar.
  3. **Tanya-Jawab Inventaris Faktual (`/assistant/qa`)**: Memberikan jawaban ringkas seputar status stok gudang terkini berdasarkan konteks inventaris langsung (_grounded retrieval_ $< 1\text{ KB}$).

---

## 2. Apa yang Diperiksa dan Divalidasi oleh Engineer

AI tidak pernah diberikan akses langsung untuk mengubah basis data atau memotong jalur logika bisnis. Seluruh kode yang dihasilkan AI melewati 7 pintu pemeriksaan ketat (_quality & security gates_):

1. **Validasi Skema Masukan (Zod Schemas)**:
   - Setiap masukan ke Server Actions divalidasi ketat oleh skema Zod di layer aplikasi (`src/schemas/`).
   - Contoh: Memastikan kuantitas mutasi adalah integer positif (`> 0`), nama produk tidak kosong, dan SKU memenuhi format yang valid.

2. **Zero-Trust Actor Identification**:
   - Memastikan bahwa AI tidak pernah menghasilkan kode yang menerima `userId` atau `userRole` dari formulir browser pengguna. Identitas dan peran pengguna selalu diambil langsung dari sesi terenkripsi server (`auth.uid()` dan `public.get_user_role()`).

3. **Integritas Imutabilitas Stok Katalog (Stock Immutability)**:
   - Memverifikasi bahwa antarmuka tambah/edit produk tidak memiliki field `stock`.
   - Menguji bahwa produk baru yang dibuat melalui draf AI selalu terkunci pada stok awal `0`. Mutasi stok hanya sah dilakukan melalui modul transaksi fisik resmi.

4. **Kepatuhan Row-Level Security (RLS) & Pessimistic Locking**:
   - Memastikan bahwa stored procedure mutasi stok (`record_stock_movement` dan `record_batch_stock_movements`) menggunakan `FOR UPDATE` untuk mencegah race condition, lost update, dan overdraft saat terjadi mutasi bersamaan.

5. **Server-Only Security Boundary**:
   - Memastikan modul pemanggil gateway AI (`src/lib/ai/nine-router-client.ts`) memiliki direktif `import 'server-only'` agar kunci API rahasia `NINE_ROUTER_API_KEY` tidak pernah bocor ke bundel JavaScript browser.

6. **Sliding-Window Rate Limiting & Error Sanitization**:
   - Memverifikasi adanya pembatas laju panggilan (10 permintaan per menit per sesi) serta pembersihan pesan error internal agar tidak membocorkan endpoint gateway atau stack trace.

7. **Verifikasi Empiris Pengujian Otomatis (365 Test Cases)**:
   - Setiap fungsi domain, skema, aksi otorisasi, dan prosedur RPC basis data wajib lolos pengujian otomatis Vitest dengan tingkat keberhasilan 100% PASS sebelum dianggap valid.

---

## 3. Satu Contoh Nyata Kekeliruan AI dan Penanganannya

### Deskripsi Masalah (Kekeliruan AI)

Pada fase awal perancangan fitur penambahan produk baru dan asisten draf katalog, AI menghasilkan kode formulir produk (`product-form-dialog.tsx`) dan skema Zod (`productSchema`) yang menyertakan input field:

```typescript
// KEKELIRUAN AWAL OLEH AI:
export const productSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(2),
  category: z.string(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0).default(0), // <--- KEKELIRUAN FATAL!
  description: z.string().optional()
})
```

Selain itu, asisten AI mengusulkan agar pengguna dapat langsung memasukkan angka "Stok Awal" (misal: 100 unit) saat mendaftarkan produk baru di katalog, lalu langsung melakukan `INSERT INTO products (sku, name, price, stock) VALUES (..., 100)`.

### Bahaya & Analisis Dampak

Jika usulan AI ini dibiarkan:

1. **Merusak Integritas Buku Besar (Audit Ledger Integrity)**: Stok fisik bertambah 100 unit secara gaib tanpa ada catatan di tabel `stock_movements`.
2. **Melanggar Aturan Traceability**: Riwayat mutasi tidak mencatat siapa yang memasukkan barang, kapan barang masuk, berapa stok sebelumnya (apakah 0 $\to$ 100), dan apa dokumen referensinya.
3. **Membuka Celah Manipulasi Stok**: Siapapun yang memiliki akses edit katalog dapat memanipulasi jumlah stok tanpa melalui prosedur mutasi fisik pergudangan.

### Langkah Penanganan & Koreksi oleh Engineer

Engineer menolak implementasi tersebut dan melakukan perbaikan berlapis:

1. **Mencabut Atribut Stok dari Skema & Formulir Katalog**:
   - Kolom `stock` dihapus sepenuhnya dari `productInputSchema` dan formulir antarmuka katalog. Administrator hanya berhak mengelola metadata produk (SKU, nama, kategori, satuan, harga, deskripsi).
2. **Memaksa Stok Produk Baru Bernilai 0 di Basis Data**:
   - Ditambahkan trigger PostgreSQL `trg_protect_product_stock` pada tabel `products` yang secara mutlak menolak pembaruan kolom `stock` melalui query `UPDATE` biasa, dan mewajibkan setiap produk baru yang di-insert memiliki `stock = 0`.
3. **Mewajibkan Stok Masuk via Transaksi Mutasi Resmi**:
   - Jika gudang menerima stok awal barang tersebut, staf gudang atau administrator wajib mencatatnya melalui modul **Stock IN** (`record_stock_movement` atau keranjang batch `/transactions`) dengan kuantitas dan nomor dokumen penerimaan (PO/DO). Dengan demikian, riwayat mencatat transisi persis `0 → 100` lengkap dengan aktor dan waktu.
4. **Membuat Regression Unit Tests**:
   - Dibuat rangkaian pengujian otomatis pada `tests/ai/stock-immutability.test.ts` dan `tests/unit/product-catalog-schema.test.ts` untuk memastikan bahwa manipulasi stok melalui skema katalog ditolak secara permanen.

---

## 4. Kesimpulan

Penggunaan AI dalam proyek Inventra telah dijalankan secara bertanggung jawab, transparan, dan teruji secara ketat. Kombinasi antara kecepatan asistensi AI dan ketegasan kendali rekayasa perangkat lunak menghasilkan sistem ERP mini yang berkinerja tinggi, aman, dan patuh 100% terhadap seluruh aturan kunci penilaian take-home test.
