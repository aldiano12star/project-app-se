# 🎨 Aturan Desain Antarmuka (UI/UX) Saba ExploIT

Dokumen ini merupakan panduan tegas dan sumber kebenaran utama (*Single Source of Truth*) untuk pengembangan antarmuka pada aplikasi Saba ExploIT.

---

## 1. Aturan Pewarnaan Tema (Light & Dark Mode)

- **Light Mode Standards**:
  - Main Background: `#F8FAFC` (Soft Slate bersih, bukan abu-abu semen kusam).
  - Card Background: `#FFFFFF` (Pure White) untuk elevasi bersih tanpa shadow pekat.
  - Border: `#E2E8F0`.
  - Main Text: `#0F172A` (Deep Charcoal, bukan hitam pekat `#000000`). Secondary Text: `#64748B`.
- **Dark Mode Standards**:
  - Main Background: `#0B0F19` (Deep Navy / Midnight, dilarang keras `#000000` atau `#0F172A`).
  - Card Background: `#151D2A`.
  - Border: `#27344A`.
  - Main Text: `#E2E8F0` (Off-white, dilarang keras `#FFFFFF` untuk mencegah OLED halation dan silau mata).
  - Semantic Colors (Wajib Pastel di Dark Mode): Rose (`#FB7185`), Emerald (`#34D399`), Amber (`#FBBF24`), Danger (`#F87171`).
- **Naked Icons (Zero Decorative Wrappers)**:
  - Dilarang membungkus setiap ikon dalam kotak hiasan berwarna (`bg-blue-50 text-blue-600 rounded-xl p-2`).
  - Ikon harus bernapas alami (`naked icon`) menggunakan warna netral (`text-slate-500 dark:text-slate-400`).

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
