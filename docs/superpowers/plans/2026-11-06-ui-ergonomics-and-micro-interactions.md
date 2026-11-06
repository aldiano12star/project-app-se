# UI Ergonomics and Micro-Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merombak palet visual antarmuka menjadi ergonomis ramah mata (Apple Soft Neutral #F5F5F7 & Warm Charcoal #121214) dan menyematkan tactile micro-interactions (spring physics, haptic feedback, count-up numbers, dan micro-confetti) di seluruh titik sentuh utama aplikasi.

**Architecture:** Menerapkan CSS custom variables dan utility classes Tailwind v4 di `globals.css` untuk token palet anti-glare dan tactile classes. Menyediakan utilitas haptik independen di `src/lib/haptic.ts`, utilitas konfeti mikro canvas di `src/lib/confetti.ts`, dan custom hook `src/hooks/useCountUp.ts`. Mengintegrasikan utilitas ini ke komponen core touchpoints (BottomNav, Kas, Ledger, Scanner, Modals) tanpa mengubah skema database maupun logika backend/RBAC.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (@theme & @utility), React 19, TypeScript, Lucide Icons.

**Spec:** `docs/superpowers/specs/2026-11-06-ui-ergonomics-and-micro-interactions-design.md`

## Global Constraints

- Light Mode background wajib `#F5F5F7` (Apple Soft Neutral), card `#FFFFFF`, border `#E4E4E7`, ink `#18181B`.
- Dark Mode background wajib `#121214` (Warm Charcoal), card `#1C1C1F`, border `#27272A`, ink `#E4E4E7`, aksen Saba Red diredam 25% ke `#E05355`.
- Tidak boleh menggunakan global CSS yang merusak tag `button:active` HTML murni secara liar; wajib menggunakan utility classes terukur (`touch-bounce`, `card-hover`, `input-soft`).
- Seluruh elemen tombol navigasi dan form wajib mempertahankan area sentuh minimal 44px (`min-h-[44px]` / `h-11`) sesuai aturan `docs/ui-ux/aturan-desain.md`.
- Tidak mengubah skema database Prisma maupun logika RBAC pada server actions.
- Semua utilitas browser API (`navigator.vibrate`, `window`, `document`) wajib aman terhadap SSR (Server-Side Rendering).

## Review Focus

1. **SSR Safety pada Browser APIs**: Memastikan pemanggilan `navigator.vibrate` dan manipulasi canvas konfeti dibungkus `typeof window !== "undefined"` sehingga tidak melempar error saat SSR / prerendering Next.js.
2. **Kepatuhan Nilai Saldo Negatif**: Memastikan hook `useCountUp` menangani angka nol (`0`), angka desimal, dan nominal minus/defisit tanpa crash atau glitch teks NaN.
3. **Penyelarasan Curvature**: Memastikan class `card-solid` dan kontainer kartu menggunakan `rounded-2xl` secara konsisten tanpa merusak elemen anak yang memiliki overflow.
4. **Isolasi RBAC Pelunasan Kas**: Memastikan pemicu konfeti dan haptik pada pelunasan kas hanya dipanggil setelah server action `quickSettleInvoice` mengembalikan `success: true`.
5. **Mobile Touch Handling**: Memastikan efek hover pada kartu menggunakan `@media (hover: hover)` agar tidak menimbulkan efek "hover nyangkut" (*sticky hover state*) pada layar sentuh ponsel.

---

### Task 1: Design Tokens, Anti-Glare Palette & CSS Utility Classes

**Files:**
- Modify: `src/app/globals.css:15-115`
- Modify: `docs/ui-ux/aturan-desain.md:7-25`
- Test: Verify compilation via `npx tsc --noEmit` and build styles check

**Interfaces:**
- Produces: CSS variables `--saba-surface`, `--saba-card`, `--saba-edge`, `--saba-primary` (dark mode desaturated), and utility classes `@utility touch-bounce`, `@utility card-hover`, `@utility input-soft`, `@utility card-solid`.

- [ ] **Step 1: Perbarui variabel warna di `src/app/globals.css`**
  Ganti nilai `:root` dan `.dark`:
  - `:root`: `--saba-surface: #F5F5F7;`, `--saba-card: #FFFFFF;`, `--saba-edge: #E4E4E7;`, `--saba-surface-container-low: #EFEFF2;`, `--saba-surface-container: #FFFFFF;`, `--saba-surface-container-high: #E4E4E7;`, `--saba-ink: #18181B;`, `--saba-ink-secondary: #52525B;`, `--saba-ink-muted: #71717A;`
  - `.dark`: `--saba-surface: #121214;`, `--saba-card: #1C1C1F;`, `--saba-edge: #27272A;`, `--saba-surface-container-low: #161618;`, `--saba-surface-container: #242428;`, `--saba-surface-container-high: #323238;`, `--saba-ink: #E4E4E7;`, `--saba-ink-secondary: #A1A1AA;`, `--saba-ink-muted: #71717A;`, `--saba-primary: #E05355;`, `--saba-primary-hover: #F87171;`

- [ ] **Step 2: Tambahkan utility classes interaktif di `src/app/globals.css`**
  - Perbarui `@utility card-solid`: ubah `border-radius: 0.75rem;` menjadi `border-radius: 1rem;` (`rounded-2xl`).
  - Tambahkan `@utility touch-bounce`:
    ```css
    @utility touch-bounce {
      transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      &:active {
        transform: scale(0.97);
      }
    }
    ```
  - Tambahkan `@utility card-hover`:
    ```css
    @utility card-hover {
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      @media (hover: hover) {
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.06);
        }
      }
    }
    ```
  - Tambahkan `@utility input-soft`:
    ```css
    @utility input-soft {
      transition: all 0.2s ease;
      &:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(225, 29, 42, 0.15);
        border-color: var(--saba-primary);
      }
    }
    ```

- [ ] **Step 3: Selaraskan panduan di `docs/ui-ux/aturan-desain.md`**
  Perbarui teks standar warna Light Mode (`#F5F5F7`) dan Dark Mode (`#121214` & `#E05355`) agar dokumentasi tetap menjadi Single Source of Truth.

- [ ] **Step 4: Verifikasi kompilasi CSS**
  Jalankan: `npx tsc --noEmit`
  Ekspektasi: Lolos tanpa error TypeScript.

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/globals.css docs/ui-ux/aturan-desain.md
  git commit -m "style: apply anti-glare color palette tokens and tactile utility classes"
  ```

---

### Task 2: Haptic Vibration Feedback Utility

**Files:**
- Create: `src/lib/haptic.ts`
- Test: `src/lib/__tests__/haptic.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export const haptic = {
    tap: () => void,
    success: () => void,
    warning: () => void,
  };
  ```

- [ ] **Step 1: Tulis tes unit untuk utilitas haptic**
  Buat `src/lib/__tests__/haptic.test.ts`:
  Verifikasi bahwa `haptic.tap()`, `haptic.success()`, dan `haptic.warning()` dapat dieksekusi tanpa melempar error saat `window` tidak memiliki `navigator.vibrate` (SSR simulation), serta memanggil `vibrate` dengan durasi yang tepat saat tersedia.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
  Jalankan: `npx tsx src/lib/__tests__/haptic.test.ts`
  Ekspektasi: Gagal karena `src/lib/haptic.ts` belum dibuat.

- [ ] **Step 3: Implementasikan `src/lib/haptic.ts`**
  Tulis fungsi aman dengan pengecekan `typeof window !== "undefined" && "vibrate" in navigator`:
  - `tap()` memanggil `navigator.vibrate(10)`
  - `success()` memanggil `navigator.vibrate([15, 40, 25])`
  - `warning()` memanggil `navigator.vibrate([20, 50, 20])`

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelolosan**
  Jalankan: `npx tsx src/lib/__tests__/haptic.test.ts`
  Ekspektasi: Lulus 100%.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/haptic.ts src/lib/__tests__/haptic.test.ts
  git commit -m "feat: implement SSR-safe mobile haptic vibration feedback utility"
  ```

---

### Task 3: Smooth Number Count-Up Hook

**Files:**
- Create: `src/hooks/useCountUp.ts`
- Test: `src/hooks/__tests__/useCountUp.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export function useCountUp(targetValue: number, durationMs?: number): number;
  ```

- [ ] **Step 1: Tulis tes unit untuk `useCountUp`**
  Buat `src/hooks/__tests__/useCountUp.test.ts`:
  Verifikasi bahwa fungsi mengembalikan angka target, mendukung nilai awal nol, menangani angka negatif (defisit), dan interpolasi berbasis waktu.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
  Jalankan: `npx tsx src/hooks/__tests__/useCountUp.test.ts`
  Ekspektasi: Gagal karena modul belum ada.

- [ ] **Step 3: Implementasikan `src/hooks/useCountUp.ts`**
  Gunakan `requestAnimationFrame` dengan kurva `easeOutQuart`:
  ```typescript
  // 1 - Math.pow(1 - progress, 4)
  ```
  Default durasi: 600ms. Otomatis berhenti ketika progress mencapai 1.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelolosan**
  Jalankan: `npx tsx src/hooks/__tests__/useCountUp.test.ts`
  Ekspektasi: Lulus.

- [ ] **Step 5: Commit**
  ```bash
  git add src/hooks/useCountUp.ts src/hooks/__tests__/useCountUp.test.ts
  git commit -m "feat: add useCountUp hook for smooth financial number interpolations"
  ```

---

### Task 4: Lightweight Canvas Micro-Confetti Utility

**Files:**
- Create: `src/lib/confetti.ts`
- Test: `src/lib/__tests__/confetti.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export function triggerMicroConfetti(options?: { originX?: number; originY?: number }): void;
  ```

- [ ] **Step 1: Tulis tes SSR & DOM safety untuk confetti**
  Buat `src/lib/__tests__/confetti.test.ts`:
  Verifikasi fungsi tidak melempar error saat dijalankan di runtime tanpa `document` (SSR).

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**
  Jalankan: `npx tsx src/lib/__tests__/confetti.test.ts`
  Ekspektasi: Gagal karena `triggerMicroConfetti` belum dibuat.

- [ ] **Step 3: Implementasikan `src/lib/confetti.ts`**
  Buat elemen `<canvas>` sementara dengan `pointer-events: none; position: fixed; inset: 0; z-index: 9999;`. Buat 25 partikel warna-warni pastel/brand (merah, emas, hijau, cyan), jalankan animasi fisika gravitasi selama 1.2 detik, lalu lepaskan elemen canvas dari DOM (`canvas.remove()`).

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelolosan**
  Jalankan: `npx tsx src/lib/__tests__/confetti.test.ts`
  Ekspektasi: Lulus.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/confetti.ts src/lib/__tests__/confetti.test.ts
  git commit -m "feat: create zero-dependency canvas micro-confetti utility"
  ```

---

### Task 5: Bottom Navigation Spring Physics & Haptic Integration

**Files:**
- Modify: `src/components/layout/BottomNav.tsx`
- Interfaces: Consumes `haptic.tap` from `src/lib/haptic.ts`.

- [ ] **Step 1: Pasang `haptic.tap()` pada klik navigasi tab**
  Buka `src/components/layout/BottomNav.tsx`. Pada handler klik link navigasi, panggil `haptic.tap()`.

- [ ] **Step 2: Tambahkan kelas spring transform pada ikon aktif**
  Gunakan `transition-transform duration-200 cubic-bezier(0.16, 1, 0.3, 1)` dan `active:scale-90`. Berikan efek kapsul aktif yang membal saat berpindah tab.

- [ ] **Step 3: Verifikasi tipe data & build**
  Jalankan: `npx tsc --noEmit`
  Ekspektasi: Berhasil tanpa error.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/layout/BottomNav.tsx
  git commit -m "feat: add tactile haptic tap and spring animations to bottom navigation"
  ```

---

### Task 6: Polish Kartu Finansial & Animasi Hitung Naik Saldo (Kas & Wallet)

**Files:**
- Modify: `src/components/kas/DigitalWalletCard.tsx`
- Modify: `src/components/kas/PublicCashLedger.tsx`
- Interfaces: Consumes `useCountUp` from `src/hooks/useCountUp.ts`.

- [ ] **Step 1: Integrasikan `useCountUp` di `DigitalWalletCard.tsx`**
  Ganti tampilan nominal saldo statis `formatRupiah(user.kasBalance)` dengan `formatRupiah(animatedBalance)` yang dihasilkan oleh `useCountUp(user.kasBalance, 600)`.
  Tambahkan utility `card-hover` pada kontainer kartu dan `touch-bounce` pada tombol aksi kartu.

- [ ] **Step 2: Integrasikan `useCountUp` di `PublicCashLedger.tsx`**
  Ganti nominal `totalBalance` dengan `useCountUp(totalBalance, 700)`.
  Tambahkan kelas `card-hover` pada kartu saldo kas utama dan kartu ringkasan pemasukan/pengeluaran.

- [ ] **Step 3: Verifikasi tipe data**
  Jalankan: `npx tsc --noEmit`
  Ekspektasi: Lolos.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/kas/DigitalWalletCard.tsx src/components/kas/PublicCashLedger.tsx
  git commit -m "feat: integrate smooth number count-up and tactile hover cards on treasury views"
  ```

---

### Task 7: Selebrasi Transaksi, Zero-State Delight, & Scanner QR Haptik

**Files:**
- Modify: `src/components/kas/InvoiceTrackerSection.tsx`
- Modify: `src/components/kas/InvoiceListCard.tsx`
- Modify: `src/components/presensi/AttendanceScannerModal.tsx`
- Interfaces: Consumes `triggerMicroConfetti` from `src/lib/confetti.ts` dan `haptic.success` from `src/lib/haptic.ts`.

- [ ] **Step 1: Integrasikan konfeti & haptik sukses di `InvoiceTrackerSection.tsx`**
  Pada fungsi `handleQuickSettle`, jika respons `res.success` bernilai `true`:
  - Panggil `triggerMicroConfetti()`
  - Panggil `haptic.success()`

- [ ] **Step 2: Perindah status bebas tunggakan di `InvoiceListCard.tsx`**
  Ketika `unpaidInvoices.length === 0`:
  Tambahkan efek pendaran lembut (*soft ambient glow*) dan badge perayaan "Semua Tagihan Lunas ✨" dengan efek sentuh membal `touch-bounce`.

- [ ] **Step 3: Tambahkan `haptic.success()` di `AttendanceScannerModal.tsx`**
  Pada callback saat verifikasi QR code berhasil (`onScanSuccess`), panggil `haptic.success()` untuk memberikan umpan balik fisik instan pada ponsel saat presensi sukses.

- [ ] **Step 4: Verifikasi tipe data**
  Jalankan: `npx tsc --noEmit`
  Ekspektasi: Lolos.

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/kas/InvoiceTrackerSection.tsx src/components/kas/InvoiceListCard.tsx src/components/presensi/AttendanceScannerModal.tsx
  git commit -m "feat: integrate micro-confetti celebrations and haptic success on attendance scan"
  ```

---

### Task 8: Verifikasi Menyeluruh & Uji Build Produksi

**Files:**
- Verify: Seluruh file yang dimodifikasi

- [ ] **Step 1: Jalankan typecheck penuh**
  Jalankan: `npx tsc --noEmit`
  Ekspektasi: Exit code 0.

- [ ] **Step 2: Jalankan build produksi Next.js**
  Jalankan: `npm run build`
  Ekspektasi: Kompilasi Turbopack Next.js 16 berhasil dengan kode keluar 0.

- [ ] **Step 3: Verifikasi status git**
  Jalankan: `git status`
  Ekspektasi: Bersih (*clean working tree*).
