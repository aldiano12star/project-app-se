# Sustainable Media Storage, Edit Karya, & Hall of Fame Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghadirkan penyimpanan media berkelanjutan (Cloudinary 25 GB + Google Drive Smart Converter), memperbaiki bug karya kosong di Rollover Wizard, menambahkan fitur Edit Karya di Eksplorasi, dan menyematkan foto kenangan bersama seluruh pengurus di Hall of Fame.

**Architecture:** Arsitektur menggunakan kompresi sisi klien (Canvas $\to$ WebP < 40KB) yang dikirim ke Route Handler `/api/upload` yang terhubung ke Cloudinary (dengan fallback aman base64 lokal jika kunci belum disetel), didukung konverter instan tautan Google Drive (`lh3.googleusercontent.com`). Kurasi Rollover disinkronkan ke tabel `ShowcaseProject`, server action `updateShowcaseProject` ditambahkan dengan proteksi RBAC dan aturan poin anti-farming, serta kolom `groupPhotoUrl` ditambahkan ke skema `HallOfFame` untuk ditampilkan secara sinematik di filmstrip.

**Tech Stack:** Next.js 16.3 (App Router, Turbopack), React 19, TypeScript 5, Prisma ORM, PostgreSQL (Neon), Cloudinary SDK (`cloudinary`), Tailwind CSS 4, Lucide React.

**Spec:** `docs/superpowers/specs/2026-11-07-sustainable-media-and-rollover-enhancements-design.md`

## Global Constraints

- PWA Mobile-First: Seluruh modal dan antarmuka input foto harus memiliki target sentuh minimal 44px dan responsif di layar ponsel.
- Anti-Crash Fallback: Jika `CLOUDINARY_URL` belum diisi di `.env`, sistem tetap berfungsi menggunakan WebP Base64 terkompresi tanpa error.
- Zero Database Bloat: Ukuran gambar yang masuk database maksimal 40 KB jika dalam mode fallback, atau berupa link teks URL jika melalui Cloudinary / Google Drive.
- Next.js Remote Patterns: `res.cloudinary.com` dan `lh3.googleusercontent.com` wajib diizinkan di `next.config.ts`.
- RBAC Security: Hanya pemilik karya, Admin, atau Operator yang berhak mengedit karya di `updateShowcaseProject`. Hanya Operator yang berhak mengubah foto pengurus di `updateHallOfFameGroupPhoto`.

## Review Focus

1. Upload berkas non-gambar atau ukuran melebihi batas $\to$ Kompresor klien menolak dengan pesan ramah, Route Handler menolak berkas non-image.
2. Link Google Drive dengan format beragam (`/file/d/ID/view`, `?id=ID`, shortlink) $\to$ `parseGoogleDriveUrl` berhasil mengekstrak ID berkas dan mengubahnya ke `https://lh3.googleusercontent.com/d/{ID}`.
3. Rollover dijalankan saat data `ShowcaseProject` memiliki `imageUrl` null $\to$ Ditangani dengan fallback string kosong atau placeholder tanpa crash saat snapshot Hall of Fame dibuat.
4. User non-pemilik mencoba mengedit karya orang lain $\to$ Server Action `updateShowcaseProject` menolak dengan pesan "Akses ditolak" (HTTP 403 / error response).
5. Operator menambahkan kontributor baru pada saat Edit Karya $\to$ Hanya kontributor baru yang mendapatkan reward +50 XP; kontributor lama tidak mendapatkan poin ganda.

---

### Task 1: Google Drive Parser, Client Image Compressor, & Next.js Image Config

**Files:**
- Create: `src/lib/drive-parser.ts`
- Create: `src/lib/image-compression.ts`
- Create: `tests/unit/drive-parser.test.ts`
- Modify: `next.config.ts:15-32`

**Interfaces:**
- Produces: `parseGoogleDriveUrl(inputUrl: string): string`
- Produces: `compressImageToWebP(file: File, options?: { maxWidth?: number; quality?: number }): Promise<Blob>`

- [ ] **Step 1: Write the failing test for Google Drive Parser**

```typescript
// tests/unit/drive-parser.test.ts
import { parseGoogleDriveUrl } from "../../src/lib/drive-parser";

function runTest() {
  const sample1 = "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i/view?usp=sharing";
  const result1 = parseGoogleDriveUrl(sample1);
  if (result1 !== "https://lh3.googleusercontent.com/d/1a2b3c4d5e6f7g8h9i") {
    throw new Error(`Test 1 Failed: Expected direct URL, got ${result1}`);
  }

  const sample2 = "https://drive.google.com/open?id=XYZ987654321";
  const result2 = parseGoogleDriveUrl(sample2);
  if (result2 !== "https://lh3.googleusercontent.com/d/XYZ987654321") {
    throw new Error(`Test 2 Failed: Expected direct URL, got ${result2}`);
  }

  const normalUrl = "https://images.unsplash.com/photo-12345";
  if (parseGoogleDriveUrl(normalUrl) !== normalUrl) {
    throw new Error("Test 3 Failed: Normal URL should remain unchanged");
  }

  console.log("✅ drive-parser tests passed!");
}

runTest();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/unit/drive-parser.test.ts`
Expected: FAIL with "Cannot find module .../drive-parser"

- [ ] **Step 3: Implement `drive-parser.ts`, `image-compression.ts`, and update `next.config.ts`**

Implementasikan parser regex untuk mendeteksi ID berkas Google Drive dan menghasilkan URL CDN `https://lh3.googleusercontent.com/d/${id}`. Buat fungsi kompresi canvas HTML5 ke WebP dengan resolusi maksimal 1080px dan kualitas 0.75. Tambahkan `res.cloudinary.com` ke `images.remotePatterns` pada `next.config.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/unit/drive-parser.test.ts`
Expected: PASS with "✅ drive-parser tests passed!"

- [ ] **Step 5: Commit**

```bash
git add src/lib/drive-parser.ts src/lib/image-compression.ts next.config.ts tests/unit/drive-parser.test.ts
git commit -m "feat(media): add Google Drive parser, client-side WebP compressor, and Cloudinary image domains"
```

---

### Task 2: Server Route Handler `/api/upload` with Cloudinary & Graceful Fallback

**Files:**
- Create: `src/app/api/upload/route.ts`
- Create: `tests/integration/upload-route.test.ts`
- Modify: `package.json` (add `cloudinary`)

**Interfaces:**
- Consumes: `process.env.CLOUDINARY_URL`
- Produces: HTTP POST `/api/upload` returning `{ success: boolean, url?: string, message?: string }`

- [ ] **Step 1: Install `cloudinary` and `@types/node` if needed**

Run: `npm install cloudinary`

- [ ] **Step 2: Write test for upload endpoint logic**

Buat berkas uji `tests/integration/upload-route.test.ts` untuk menguji pembentukan nama berkas unik, penolakan MIME-type non-gambar, dan pengembalian fallback Base64 jika `CLOUDINARY_URL` tidak tersedia.

- [ ] **Step 3: Implement `/api/upload/route.ts`**

Menerima `formData.get("file")`. Validasi otentikasi sesi via NextAuth (`auth()`). Jika kredensial `CLOUDINARY_URL` ada, lakukan upload stream ke Cloudinary folder `se_app/uploads`. Jika tidak ada, ubah buffer ke Data URL WebP berukuran kecil sebagai fallback aman.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/integration/upload-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app/api/upload/route.ts tests/integration/upload-route.test.ts
git commit -m "feat(api): create upload route handler with Cloudinary integration and safe WebP fallback"
```

---

### Task 3: Reusable `ImagePickerField` UI Component

**Files:**
- Create: `src/components/ui/ImagePickerField.tsx`

**Interfaces:**
- Consumes: `compressImageToWebP` from `@/lib/image-compression`, `parseGoogleDriveUrl` from `@/lib/drive-parser`
- Produces: `<ImagePickerField value={string} onChange={(url: string) => void} label={string} aspectRatio="video" | "banner" />`

- [ ] **Step 1: Implement `ImagePickerField.tsx` component**

Komponen memiliki 2 tab:
- Tab 1: "Unggah dari Perangkat" $\to$ File input (hanya accept="image/*"), drag-and-drop, indikator kompresi & uploading, pratinjau gambar 16:9.
- Tab 2: "Tautan Google Drive / Web" $\to$ Input teks dengan tombol tempel dan konversi otomatis via `parseGoogleDriveUrl`.
- Tombol hapus/ganti gambar jika sudah ada nilai `value`.

- [ ] **Step 2: Verify component builds cleanly**

Run: `npx tsc --noEmit`
Expected: PASS without type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ImagePickerField.tsx
git commit -m "feat(ui): create reusable ImagePickerField with mobile file picker and Google Drive converter"
```

---

### Task 4: Fix Rollover Works Query Mismatch & Add Generation Group Photo Schema

**Files:**
- Modify: `prisma/schema.prisma:555-585`
- Modify: `src/actions/rollover.ts:87-175,255-385`
- Test: `tests/integration/rollover-query.test.ts`

**Interfaces:**
- Consumes: `prisma.showcaseProject`
- Produces: `getRolloverCuratedData()` returning curated works from `ShowcaseProject`
- Produces: `executeRolloverWithCuratedData` with `groupPhotoUrl` stored into `HallOfFame`

- [ ] **Step 1: Write test to verify Rollover queries `showcaseProject` and supports `groupPhotoUrl`**

```typescript
// tests/integration/rollover-query.test.ts
import { getRolloverCuratedData } from "../../src/actions/rollover";

// Verifikasi struktur kurasi mengambil dari showcaseProject
console.log("Verifying rollover data structure...");
```

- [ ] **Step 2: Update `prisma/schema.prisma` and push to database**

Tambahkan `groupPhotoUrl String? @db.Text` pada `model HallOfFame`.
Run: `npm run db:push && npx prisma generate`

- [ ] **Step 3: Modify `src/actions/rollover.ts`**

Ganti `prisma.showcase.findMany()` dengan `prisma.showcaseProject.findMany({ include: { author: true } })`.
Petakan `thumbnailUrl` ke `project.imageUrl`, `authorName` ke `project.author.name`, `primaryDivision` ke `project.category`.
Tambahkan field `groupPhotoUrl?: string` pada `RolloverWizardInput` dan simpan ke `tx.hallOfFame.create()`.

- [ ] **Step 4: Run integration test**

Run: `npx tsx tests/integration/rollover-query.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/actions/rollover.ts tests/integration/rollover-query.test.ts
git commit -m "fix(rollover): sync curated works with ShowcaseProject and add groupPhotoUrl to HallOfFame"
```

---

### Task 5: Showcase Project Edit Server Action (`updateShowcaseProject`) & Modals

**Files:**
- Modify: `src/actions/eksplorasi.ts`
- Create: `src/components/eksplorasi/EditProjectModal.tsx`
- Modify: `src/components/eksplorasi/CreateProjectModal.tsx`
- Modify: `src/components/eksplorasi/ProjectCard.tsx`
- Modify: `src/components/eksplorasi/ProjectDetailModal.tsx`

**Interfaces:**
- Produces: `updateShowcaseProject(id: string, input: UpdateShowcaseInput): Promise<ActionResult>`
- Produces: `<EditProjectModal isOpen={boolean} project={ProjectCardData} onClose={fn} onSuccess={fn} />`

- [ ] **Step 1: Implement `updateShowcaseProject` Server Action**

Validasi otentikasi. Pastikan hanya pemilik karya (`authorId === user.id`) atau `Role.ADMIN` / `Role.OPERATOR` yang dapat menyunting.
Lakukan update `title`, `description`, `category`, `demoUrl`, `githubUrl`, `imageUrl`.
Hitung selisih kontributor (`newContributorIds` yang belum ada sebelumnya): Berikan reward +50 XP hanya untuk kontributor baru.
Perbarui relasi `contributors: { set: newContributorIds.map(id => ({ id })) }`.
Panggil `revalidatePath("/eksplorasi")`.

- [ ] **Step 2: Create `EditProjectModal.tsx` with `ImagePickerField`**

Form modal lengkap dengan data awal proyek, selector kategori, input demo/github, pemilihan kontributor, dan `ImagePickerField` untuk banner proyek.

- [ ] **Step 3: Update `CreateProjectModal.tsx` to use `ImagePickerField`**

Ganti input teks URL gambar biasa di modal pembuatan proyek dengan komponen `ImagePickerField`.

- [ ] **Step 4: Add Edit Action in `ProjectCard.tsx` and `ProjectDetailModal.tsx`**

Tampilkan tombol pensil "Edit Karya" jika `currentUser.id === project.author.id` atau `currentUser.role === Role.ADMIN || currentUser.role === Role.OPERATOR`.

- [ ] **Step 5: Verify build & TypeScript integrity**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/actions/eksplorasi.ts src/components/eksplorasi/EditProjectModal.tsx src/components/eksplorasi/CreateProjectModal.tsx src/components/eksplorasi/ProjectCard.tsx src/components/eksplorasi/ProjectDetailModal.tsx
git commit -m "feat(eksplorasi): add updateShowcaseProject action, EditProjectModal, and integrated ImagePickerField"
```

---

### Task 6: Hall of Fame Group Photo Display & Post-Rollover Update Server Action

**Files:**
- Modify: `src/actions/hallOfFame.ts`
- Modify: `src/components/pengaturan/RolloverWizardModal.tsx`
- Modify: `src/components/hall-of-fame/FilmstripFrame.tsx`

**Interfaces:**
- Produces: `updateHallOfFameGroupPhoto(hallOfFameId: string, groupPhotoUrl: string): Promise<ActionResult>`

- [ ] **Step 1: Implement `updateHallOfFameGroupPhoto` Server Action**

Hanya user dengan `Role.OPERATOR` yang dapat mengeksekusi. Memperbarui `groupPhotoUrl` pada rekor `HallOfFame` tertentu dan memanggil `revalidatePath("/hall-of-fame")`.

- [ ] **Step 2: Update `RolloverWizardModal.tsx`**

Tambahkan input/upload foto bersama pengurus menggunakan `ImagePickerField` pada langkah kurasi atau sebelum konfirmasi akhir. Input ini opsional (dapat dilewati jika belum ada foto).

- [ ] **Step 3: Update `FilmstripFrame.tsx`**

Tampilkan foto bersama pengurus sebagai *Panoramic Hero Showcase* di bagian teratas frame generasi dengan rasio lebar, border aksen emas/sinematik, dan tombol ganti foto bagi OPERATOR.

- [ ] **Step 4: Verify type safety**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/actions/hallOfFame.ts src/components/pengaturan/RolloverWizardModal.tsx src/components/hall-of-fame/FilmstripFrame.tsx
git commit -m "feat(hall-of-fame): render cinematic generation group photo and add post-rollover photo updater"
```

---

### Task 7: Full System Build & End-to-End Verification

**Files:**
- All modified files

- [ ] **Step 1: Run Prisma Generate & Next.js Production Build**

Run: `npm run build`
Expected: Build berhasil 100% tanpa error TypeScript atau lint.

- [ ] **Step 2: Final Verification Commit**

```bash
git status
git commit -m "chore(release): complete sustainable media storage, edit karya, and hall of fame upgrades"
```
