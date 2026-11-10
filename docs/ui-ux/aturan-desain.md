# 🎨 Aturan Desain Antarmuka (UI/UX) Saba ExploIT

Dokumen ini merupakan panduan tegas dan sumber kebenaran utama (*Single Source of Truth*) untuk pengembangan antarmuka pada aplikasi Saba ExploIT.

---

## 1. Aturan Pewarnaan Tema (Light & Dark Mode)

- **Light Mode Standards**:
  - Main Background: `#F5F5F7` (Apple Soft Neutral anti-glare, mencegah silau mata).
  - Card Background: `#FFFFFF` (Pure White) dengan garis tepi halus (`#E4E4E7`).
  - Border: `#E4E4E7`.
  - Main Text: `#18181B` (Zinc-900 Charcoal, bukan hitam pekat `#000000`). Secondary Text: `#52525B`. Muted: `#71717A`.
- **Dark Mode Standards**:
  - Main Background: `#121214` (Warm Charcoal, dilarang keras `#000000` atau biru dingin).
  - Card Background: `#1C1C1F` (Charcoal Elevated).
  - Border: `#27272A`.
  - Main Text: `#E4E4E7` (Soft Light Zinc, dilarang keras `#FFFFFF` untuk mencegah OLED halation dan silau mata).
  - Brand Accent Saba Red: Terkunci solid di `#E11D2A` (hover `#BE123C`) baik di Light Mode maupun Dark Mode untuk mencegah pergeseran warna ke nuansa merah muda/pink.
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
- **Kelengkungan Sudut (Soft UI Curvature)**:
  - Kontainer kartu utama wajib menggunakan kelengkungan `rounded-2xl` (standar utility `@utility card-solid`).
  - Tombol aksi dan formulir input menggunakan `rounded-xl`.
- **Micro-Interactions Taktil**:
  - Gunakan class `@utility touch-bounce` (`active:scale-[0.97]` dengan kurva pegas elastis) pada tombol dan elemen interaktif untuk memberikan *tactile feedback*.
  - Gunakan `@utility card-hover` (`hover:-translate-y-0.5` dengan pendaran halus di desktop) pada kartu rangkuman informasi.
  - Gunakan `@utility input-soft` (`focus:ring-4 focus:ring-primary/15`) untuk umpan balik fokus formulir yang mekar lembut.
