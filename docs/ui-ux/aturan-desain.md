# 🎨 Aturan Desain Antarmuka (UI/UX) Saba ExploIT

Dokumen ini merupakan panduan tegas dan sumber kebenaran utama (*Single Source of Truth*) untuk pengembangan antarmuka pada aplikasi Saba ExploIT.

---

## 1. Aturan Pewarnaan Tema Terang (Light Mode)

- **Wajib Gunakan Surface Container / Pastel Cerah**:
  - Latar belakang elemen card/panel pada mode terang **wajib** menggunakan token `bg-surface-container`, `bg-card`, atau warna pastel cerah bergaris tepi tegas, contoh:
    - `bg-rose-50 border border-rose-200/80` (aksen brand/penting)
    - `bg-surface-container border border-edge` (kontainer umum)
    - `bg-emerald-50 border border-emerald-200/80` (status sukses)
- **DILARANG Menggunakan Warna Gelap Kusam Tanpa Prefix**:
  - Dilarang keras menuliskan warna abu-abu gelap/hitam kusam seperti `bg-slate-800`, `bg-slate-900`, `bg-gray-800` langsung pada mode terang!
  - Setiap warna gelap **wajib berawalan prefix `dark:`**, contoh:
    ```tsx
    // ❌ SALAH (membuat tampilan light mode terlihat kotor/kontras rusak)
    className="bg-slate-800 text-white"

    // ✅ BENAR
    className="bg-surface-container dark:bg-slate-800 text-ink dark:text-slate-100 border border-edge"
    ```
- **Matte Pebble Finish & Anti-Glare**:
  - Latar belakang utama aplikasi dikalibrasi ke warna Matte Pebble `#EDF0F5` (variabel `--saba-surface`) untuk mencegah efek silau layar putih murni.

---

## 2. Standar Responsivitas & Navigasi

- **Pemisahan Navigasi Mobile vs Desktop**:
  - **Navigasi Bawah (Bottom Navigation Bar)**:
    - Wajib memiliki class `md:hidden` agar otomatis tersembunyi saat layar dibuka di perangkat desktop (lebar $\ge 768\text{px}$).
  - **Sidebar Navigasi Desktop**:
    - Wajib menggunakan class `hidden md:flex` dan posisi fixed `fixed left-0 top-0 bottom-0 w-64` agar terisolasi rapi dan tidak saling tumpang tindih dengan konten utama.
  - **Top Header**:
    - Menggunakan padding responsif: `md:pl-64` jika sidebar desktop aktif, sehingga konten header sejajar sempurna dengan area kerja.

---

## 3. Ergonomi & Aksesibilitas Touch Target

- **Ukuran Area Sentuh Minimal**:
  - Seluruh tombol, link navigasi, dan input form wajib memiliki area sentuh minimal **44px** (`min-h-[44px]` atau `h-11`) untuk mematuhi standar ergonomi mobile dan WCAG 2.1.
- **Micro-Interactions**:
  - Gunakan `active:scale-[0.98]` atau `transition-all` pada elemen interaktif untuk memberikan *tactile feedback* saat disentuh.
