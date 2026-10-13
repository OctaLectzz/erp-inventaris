# Walkthrough — Inventra Dashboard UI/UX Refinement

Penyempurnaan antarmuka dan pengalaman pengguna (UI/UX) pada Inventra telah berhasil diimplementasikan secara komprehensif tanpa regresi fungsional. Seluruh 175 tes unit Vitest lulus 100% dan build Turbopack Next.js 16 bersih tanpa error.

---

## 1. Ringkasan Perubahan Utama

### 1.1 Enterprise App Shell & Persistent Sidebar
- **Desktop Sidebar:** Menggantikan top navigation lama dengan sidebar kiri setinggi layar penuh (`w-64`) yang dapat diciutkan (`w-18`) secara halus tanpa layout shift.
- **Header Dinamis:** Memuat breadcrumb lokasi halaman aktif (`Inventra / Dashboard`, `Inventra / Katalog Produk`, `Inventra / Riwayat Mutasi`), badge peran otoritatif, serta ringkasan identitas pengguna.
- **Mobile Drawer Sheet:** Navigasi mobile diakses melalui tombol hamburger yang memunculkan slide-over drawer berbasis `@radix-ui/react-dialog` dengan target sentuh ramah jari ($\ge 44 \times 44$ px).
- **Controls & Identitas:** Profil pengguna, tombol alih tema terang/gelap (`next-themes`), alih bahasa ID/EN (`next-intl`), dan tombol keluar disematkan secara rapi di footer sidebar.

### 1.2 Integrasi TanStack React Table pada Katalog Produk
- **Headless Table Engine:** Mengintegrasikan `@tanstack/react-table@8.21.2` stabil dengan tipe TypeScript yang ketat.
- **Column Sorting:** Header kolom interaktif (`SKU`, `Nama Produk`, `Kategori`, `Harga`, `Stok`) dengan indikator panah dinamis (Ascending/Descending).
- **Pencarian Multi-Atribut:** Input pencarian global instan yang mencocokkan kode SKU maupun nama produk secara *case-insensitive*.
- **Filter Terpadu:** Dropdown filter kategori dan filter kesehatan stok (`Semua`, `Stok Menipis < 5`, `Stok Normal ≥ 5`).
- **Column Visibility:** Dropdown menu *Tampilan Kolom* untuk menyembunyikan atau menampilkan kolom tertentu sesuai preferensi pengguna.
- **Paginasi Fleksibel:** Kontrol paginasi dengan pemilihan ukuran halaman (10, 20, 30, 50 baris per halaman) dan tombol lompat halaman.
- **Preservasi RBAC:** Kolom *Aksi (Edit)* hanya dirender untuk peran `admin_gudang`, sementara peran `owner` tetap dalam mode audit hanya-baca.

### 1.3 Penyempurnaan Dashboard & Aktivitas Mutasi
- **KpiStatCard Modular:** Menampilkan 4 metrik ringkasan dengan hierarki visual tegas (*Total Produk*, *Total Unit Stok*, *Total Valuasi Stok*, *Peringatan Stok Menipis*).
- **Feed Aktivitas Mutasi Terkini:** Menampilkan 5 transaksi mutasi inventaris fisik terbaru dengan timestamp terformat, badge tipe mutasi (IN / OUT), delta kuantitas, dan stok akhir.
- **Low-Stock Watchlist Terpadu:** Kartu pemantauan stok menipis ($< 5$ unit) dengan indikator visual ramah aksesibilitas.
- **Loading Skeletons:** Komponen fallback skeleton (`loading.tsx`) pada dashboard, katalog, dan riwayat mutasi untuk transisi navigasi yang mulus.

---

## 2. Bukti Visual & Rekaman Pengujian Browser

Sesi pengujian otomatis browser telah dijalankan dan terekam:

### Rekaman Interaksi Browser:
![Rekaman Sesi Browser](C:/Users/octav/.gemini/antigravity-ide/brain/213b8168-7698-4389-8820-d3d0bc2607ca/dashboard_ui_ux_demo_1791923342656.webp)

### Tangkapan Layar Tampilan Utama:

````carousel
![Dashboard Inventra](C:/Users/octav/.gemini/antigravity-ide/brain/213b8168-7698-4389-8820-d3d0bc2607ca/dashboard_id_1791923372315.png)
<!-- slide -->
![Katalog Produk TanStack Table](C:/Users/octav/.gemini/antigravity-ide/brain/213b8168-7698-4389-8820-d3d0bc2607ca/inventory_catalog_1791923392043.png)
<!-- slide -->
![Dropdown Tampilan Kolom](C:/Users/octav/.gemini/antigravity-ide/brain/213b8168-7698-4389-8820-d3d0bc2607ca/column_visibility_dropdown_1791923409912.png)
````

---

## 3. Hasil Verifikasi Otomatis

### 3.1 Vitest Unit Tests
```bash
npm run test:unit
```
```text
Test Files  15 passed (15)
     Tests  175 passed (175)
  Duration  7.94s
```
- Seluruh 171 tes lama tetap lulus 100% tanpa regresi.
- 4 tes baru untuk `catalog-table-columns.test.ts` memverifikasi aturan RBAC dan sorting.

### 3.2 Next.js Turbopack Production Build
```bash
npm run build
```
```text
▲ Next.js 16.4.0 (Turbopack)
✓ Compiled successfully in 7.6s
✓ Finished TypeScript in 9.8s
✓ Generating static pages using 7 workers (18/18) in 2.8s
Exit code: 0
```

### 3.3 ESLint & Prettier
- `npm run lint` menghasilkan 0 error.
- Format kode 100% konsisten dengan Prettier.
