# Design Specification: UI Ergonomics, Anti-Glare Palette, and Micro-Interactions

- **Date**: 2026-11-06
- **Topic**: UI/UX Visual Ergonomics, Off-White Anti-Glare Palette, Soft UI, and Native Micro-Interactions
- **Status**: APPROVED (Ready for Implementation Planning)
- **Document Path**: `docs/superpowers/specs/2026-11-06-ui-ergonomics-and-micro-interactions-design.md`

---

## 1. Intent & The Why

Aplikasi Saba ExploIT (SE-Core) digunakan secara rutin oleh pengurus dan anggota organisasi untuk mengelola kas, rapat, presensi, dan profil organisasi. Evaluasi ergonomi visual menunjukkan perlunya perombakan palet warna dan interaksi taktil:

- Latar putih murni (`#FFFFFF`) pada mode terang menghasilkan *glare* dan kontras berlebih yang cepat membuat mata lelah.
- Latar gelap (`.dark`) memerlukan saturasi aksen yang lebih tenang (diredam ~20-25%) agar tidak berpendar (*halation*) atau menyilaukan di lingkungan minim cahaya.
- Ketiadaan umpan balik fisik (*tactile micro-interactions*) membuat aplikasi terasa kaku.

Inisiatif ini merombak visual antarmuka menjadi **Ergonomis & Ramah Mata (Anti-Glare)** serta menyuntikkan **Micro-Interactions yang Hidup & Luwes** setara aplikasi native iOS / macOS, dengan tetap menjaga performa, kesederhanaan kode, dan kepatuhan penuh terhadap aturan RBAC.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals

1. **Ergonomic Anti-Glare Palette**:
   - **Mode Terang**: Latar belakang aplikasi beralih ke *Apple Soft Neutral* (`#F5F5F7`), kartu kontainer putih bersih (`#FFFFFF`) dengan border halus (`#E4E4E7`), teks utama arang gelap (`#18181B`), dan teks sekunder netral (`#52525B`).
   - **Mode Gelap**: Latar belakang beralih ke *Warm Charcoal* (`#121214`), kartu kontainer abu-abu gelap hangat (`#1C1C1F`), border (`#27272A`), teks utama abu terang lembut (`#E4E4E7`), dan aksen merah Saba Red diredam 25% (`#E05355`).
2. **Soft UI Curvature**:
   - Menyelaraskan kelengkungan kontainer kartu menjadi `rounded-2xl` (termasuk utility `@utility card-solid`), serta elemen tombol dan input menjadi `rounded-xl`.
3. **Tactile Micro-Interactions (Spring Physics)**:
   - Efek membal fisik pegas pada tombol dan elemen interaktif (`active:scale-[0.97]` dengan kurva transisi *cubic-bezier(0.16, 1, 0.3, 1)*).
   - Efek melayang halus (*elevation lift* `hover:-translate-y-0.5`) dan pendaran garis tepi tipis saat disentuh atau diarahkan kursor di desktop.
4. **Haptic Vibration Feedback**:
   - Utilitas `src/lib/haptic.ts`:
     - `haptic.tap()` (getaran mikro 10ms) untuk pergantian tab di `BottomNav.tsx` dan pembukaan modal.
     - `haptic.success()` (pola ritmis `[15, 40, 25]`ms) untuk pelunasan kas sukses di `InvoiceTrackerSection.tsx` dan scan QR presensi sukses di `AttendanceScannerModal.tsx`.
5. **Fluid Motion & Delight**:
   - Animasi hitung naik angka saldo (*number count-up* ~600ms dengan kurva `easeOutQuart`) via hook `src/hooks/useCountUp.ts` pada kartu kas dan saldo dompet.
   - Letupan partikel konfeti mikro saat transaksi kas berhasil diselesaikan oleh Bendahara, serta *celebratory zero-state* pada anggota yang bebas tunggakan di `InvoiceListCard.tsx`.

### Non-Goals

- **Tidak ada widget Daily Streak atau Check-in XP**: Sesuai keputusan pengguna, aplikasi tetap fokus murni sebagai alat produktivitas dan operasional profesional tanpa gamifikasi gim.
- **Tidak mengubah skema database atau backend logic**: Semua pembaruan murni berada pada lapisan desain, CSS tokens, hooks, dan presentational UI.
- **Tidak mengubah RBAC**: Pelunasan tagihan tetap berada di bawah wewenang Bendahara/Operator (`InvoiceTrackerSection.tsx`).

### Anti-Goals

- **Hindari Animasi Lambat / Berat**: Durasi animasi micro-interactions dibatasi 150ms–300ms (kecuali count-up 600ms) agar antarmuka terasa gesit dan tidak menunda pekerjaan pengguna.
- **Hindari Perusakan Global CSS**: Tidak menerapkan `button:active` secara liar di tag HTML global yang berpotensi merusak toggle switch, icon buttons, atau pagination table. Menggunakan utility class terukur (`touch-bounce`, `input-soft`).
- **Hindari Pelanggaran Standar Touch Target**: Menjaga area sentuh minimal 44px (`min-h-[44px]` / `h-11`) sesuai WCAG 2.1 di `docs/ui-ux/aturan-desain.md`.

---

## 3. Design Tokens & Implementation Architecture

### A. Palet Warna di `src/app/globals.css`

```css
/* Mode Terang (Default :root) */
:root {
  --saba-surface: #F5F5F7;
  --saba-card: #FFFFFF;
  --saba-edge: #E4E4E7;
  --saba-surface-container-low: #EFEFF2;
  --saba-surface-container: #FFFFFF;
  --saba-surface-container-high: #E4E4E7;
  --saba-ink: #18181B;
  --saba-ink-secondary: #52525B;
  --saba-ink-muted: #71717A;
  --saba-primary: #E11D2A;
  --saba-primary-hover: #BE123C;
  --saba-primary-subtle: #FEE2E2;
}

/* Mode Gelap (.dark) */
.dark {
  --saba-surface: #121214;
  --saba-card: #1C1C1F;
  --saba-edge: #27272A;
  --saba-surface-container-low: #161618;
  --saba-surface-container: #242428;
  --saba-surface-container-high: #323238;
  --saba-ink: #E4E4E7;
  --saba-ink-secondary: #A1A1AA;
  --saba-ink-muted: #71717A;
  --saba-primary: #E05355; /* Desaturated Warm Crimson (~25% softer) */
  --saba-primary-hover: #F87171;
  --saba-primary-subtle: #450A0A;
  --saba-success: #34D399;
  --saba-warning: #FBBF24;
  --saba-info: #38BDF8;
}
```

### B. Utility Classes Ergonomis di `globals.css`

- `@utility touch-bounce`: `transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);` & `&:active { transform: scale(0.97); }`
- `@utility card-hover`: `transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);` & `@media (hover: hover) { &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -4px rgba(0,0,0,0.06); } }`
- `@utility input-soft`: `transition: all 0.2s ease;` & `&:focus { outline: none; box-shadow: 0 0 0 3px rgba(225, 29, 42, 0.15); border-color: var(--saba-primary); }`

### C. Modul & Hook Baru

1. `src/lib/haptic.ts`: Fungsi pembungkus aman `navigator.vibrate` untuk web mobile dan PWA.
2. `src/hooks/useCountUp.ts`: Hook animasi angka desimal/rupiah berbasis `requestAnimationFrame` dengan easing `easeOutQuart`.
3. `src/lib/confetti.ts`: Pemicu partikel mikro canvas ringan tanpa dependensi eksternal berat.

### D. Titik Sentuh Terintegrasi (Core Touchpoints)

1. **`BottomNav.tsx`**: Integrasi `haptic.tap()` dan transisi spring membal saat tab disentuh.
2. **`DigitalWalletCard.tsx`**: Hitung naik saldo dompet `useCountUp`, border beam halus, dan elevasi saat disentuh.
3. **`PublicCashLedger.tsx`**: Hitung naik saldo kas utama, ringkasan pemasukan/pengeluaran, dan hover melayang.
4. **`InvoiceTrackerSection.tsx` & `TreasurerPanel.tsx`**: Pemicu konfeti mikro dan `haptic.success()` saat pelunasan tagihan selesai.
5. **`InvoiceListCard.tsx`**: Tampilan status lunas yang meriah dengan micro-sparkle saat anggota tidak memiliki tunggakan kas.
6. **`AttendanceScannerModal.tsx`**: `haptic.success()` saat verifikasi presensi QR KTA berhasil.
7. **`docs/ui-ux/aturan-desain.md`**: Memperbarui aturan desain acuan proyek agar sinkron 100%.

---

## 4. Verification & Testing Criteria

1. `npx tsc --noEmit` & `npm run build`: Kompilasi Turbopack Next.js 16 berhasil tanpa error tipe data maupun regresi CSS.
2. Uji visual peramban: Kontras mode terang dan mode gelap terverifikasi bebas dari silau (#FFFFFF latar hilang, aksen dark mode ramah retina).
3. Uji interaksi: Tombol merespons sentuhan dengan elastisitas `active:scale-[0.97]`, angka saldo menghitung naik dengan mulus, dan getaran haptik bekerja pada perangkat mobile yang mendukung.
