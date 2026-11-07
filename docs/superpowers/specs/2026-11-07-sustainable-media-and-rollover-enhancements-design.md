# Arsitektur & Desain Berkelanjutan: Media Storage, Edit Karya, & Hall of Fame Enhancements

**Tanggal:** 7 November 2026  
**Status:** FINAL DRAFT (Terverifikasi oleh Builder Check & Siap Eksekusi)  
**Dokumen Penentu:** Single Source of Truth untuk implementasi keberlanjutan aplikasi Saba ExploIT antar-generasi.

---

## 1. Latar Belakang & Prinsip Keberlanjutan ("Turun-Temurun")

Aplikasi **Saba ExploIT Super App** dirancang untuk digunakan secara berkelanjutan lintas periode kepengurusan (turun-temurun). Agar sistem tidak rusak atau berhenti berfungsi ketika estafet kepengurusan berganti:

1. **Anti Single-Person Lock-in**: Sistem tidak boleh bergantung pada akun kartu kredit pribadi pengurus yang suatu saat akan lulus dari sekolah.
2. **Efisiensi Database Neon (Limit 0.5 GB)**: Database relasional PostgreSQL hanya menyimpan metadata teks dan file gambar yang sudah dikompresi ultra-ringan. 
3. **Dual-Channel Media Ingestion (Sangat Berkelanjutan)**:
   - **Saluran A (Google Drive Smart Converter - Nol Biaya & Awet Selamanya)**: Organisasi sekolah selalu memiliki Google Drive bersama (15 GB gratis). Pengguna cukup menempelkan link file gambar Google Drive (`drive.google.com/file/d/...`), sistem otomatis mengekstrak File ID dan mengubahnya menjadi link CDN Google langsung (`https://lh3.googleusercontent.com/d/...`) yang sudah terdaftar di `next.config.ts`.
   - **Saluran B (Upload dari Galeri/Penyimpanan Perangkat)**: Dilengkapi kompresor otomatis di sisi klien (Canvas $\to$ WebP kualitas 75%, lebar maks 1080px, ukuran file dipangkas hingga 95% menjadi rata-rata 30–45 KB). Dengan ukuran hanya 30 KB per foto, 100 karya hanya memakan 3–4 MB dari total kuota 500 MB Neon (kurang dari 1% setelah bertahun-tahun dipakai). Ini bekerja 100% di Vercel Serverless tanpa error read-only filesystem dan tanpa perlu kredensial storage berbayar.
4. **Resiliensi Rollover & Arsip Generasi Abadi**: Memperbaiki sinkronisasi data kurasi karya antara modul Eksplorasi dengan Rollover Wizard, menambahkan foto kenangan angkatan (*Generation Group Photo*), dan memberikan hak penyuntingan karya bagi penciptanya.

---

## 2. Penyelesaian Isu & Keputusan Arsitektural

### A. Masalah 1: Karya Kosong di Rollover Wizard
- **Penyebab:** Pada `src/actions/rollover.ts`, fungsi kurasi `getRolloverCuratedData()` dan transaksi `executeRolloverWithCuratedData()` memanggil model usang `prisma.showcase.findMany()`, padahal seluruh karya aktif yang dibuat pengguna di modul Eksplorasi (`src/actions/eksplorasi.ts`) tersimpan pada model `prisma.showcaseProject`.
- **Solusi:** Ganti pemanggilan ke `prisma.showcaseProject` dengan memetakan kolom:
  - `id` $\leftarrow$ `project.id`
  - `title` $\leftarrow$ `project.title`
  - `thumbnailUrl` $\leftarrow$ `project.imageUrl || ""`
  - `authorName` $\leftarrow$ `project.author.name`
  - `primaryDivision` $\leftarrow$ `project.category`
  - `externalUrl` $\leftarrow$ `project.demoUrl || project.githubUrl || ""`
- Urutkan kurasi otomatis berdasarkan `likesCount` tertinggi dan tanggal pembuatan terbaru.

### B. Masalah 2: Fitur Edit Karya (Showcase Project)
- **Kebutuhan:** Pengguna yang membuat karya (atau Pengurus berwenang: Admin/Operator) dapat memperbarui judul, deskripsi, tautan repositori GitHub, URL demo, kategori divisi, dan foto banner karya yang telah diunggah.
- **Solusi & Aturan Poin (XP):**
  - Server Action `updateShowcaseProject(id: string, input: UpdateShowcaseInput)` di `src/actions/eksplorasi.ts`.
  - Otorisasi RBAC: Hanya pemilik karya (`authorId === currentUser.id`) atau user dengan Role `ADMIN` / `OPERATOR` yang dapat menyunting.
  - **Aturan Poin Anti-Farming**: Edit data deskripsi/link tidak mengubah poin. Jika pengurus menambahkan kontributor baru yang belum pernah menerima XP untuk karya tersebut, barulah kontributor baru tersebut mendapatkan reward partisipasi +50 XP. Anggota tim yang dipertahankan tidak akan mendapatkan poin ganda.
  - UI modal `EditProjectModal` yang responsif, dipicu dari tombol "Edit" pada `ProjectCard` dan `ProjectDetailModal`.

### C. Masalah 3: Komponen Media Picker Berkelanjutan (`ImagePickerField`)
- Komponen input gambar cerdas yang menyediakan tab:
  1. **Tab "Pilih dari Galeri/Perangkat"**: Memilih file foto langsung dari galeri HP atau folder laptop, menampilkan pratinjau, lalu mengompresnya di latar belakang dengan WebP Canvas (30–45 KB).
  2. **Tab "Google Drive / Link Gambar"**: Memungkinkan menempelkan tautan Google Drive atau web image, dengan konversi otomatis instan ke direct CDN `lh3.googleusercontent.com`.
- Dilengkapi tombol hapus/reset dan indikator status kompresi yang ramah pengguna.

### D. Masalah 4: Foto Kenangan Bersama Pengurus di Hall of Fame
- **Skema Database (`prisma/schema.prisma`)**:
  - Tambahkan kolom opsional `groupPhotoUrl String? @db.Text` pada model `HallOfFame`.
- **Sifat Pengisian**:
  - **Opsional pada saat Rollover**: Operator dapat menyertakan foto bersama saat seremoni tutup buku, atau melewatinya (*skip*) jika sesi foto resmi belum selesai.
  - **Dapat Disunting Pasca-Rollover**: Disediakan Server Action `updateHallOfFameGroupPhoto(id: string, photoUrl: string)` (khusus OPERATOR) sehingga foto pengurus angkatan lama selalu dapat dilengkapi atau diperbarui kapan saja di halaman `/hall-of-fame`.
- **Tampilan Sinematik (`FilmstripFrame.tsx`)**:
  - Foto bersama pengurus ditampilkan sebagai *Panoramic Hero Showcase* di bagian teratas frame angkatan, dilengkapi efek pencahayaan sinematik dan keterangan tahun kepengurusan.

---

## 3. Rencana Komponen & File yang Terlibat

1. `prisma/schema.prisma`:
   - Tambahkan `groupPhotoUrl String? @db.Text` ke `model HallOfFame`.
   - Jalankan `npm run db:push` dan `npx prisma generate`.
2. `src/lib/image-compression.ts`:
   - Fungsi kompresi gambar berbasis browser Canvas $\to$ WebP (dimensi maksimal 1280px, kualitas 0.75).
3. `src/lib/drive-parser.ts`:
   - Fungsi parser link Google Drive $\to$ `https://lh3.googleusercontent.com/d/<ID>`.
4. `src/components/ui/ImagePickerField.tsx`:
   - Komponen UI reusable untuk pemilihan foto dari perangkat & link Google Drive.
5. `src/actions/eksplorasi.ts`:
   - Tambahkan `updateShowcaseProject` dengan validasi otorisasi dan penyesuaian kontributor.
6. `src/components/eksplorasi/EditProjectModal.tsx`:
   - Form modal penyuntingan karya dengan integrasi `ImagePickerField`.
7. `src/components/eksplorasi/CreateProjectModal.tsx`:
   - Perbarui form penambahan karya menggunakan `ImagePickerField` menggantikan input teks biasa.
8. `src/components/eksplorasi/ProjectCard.tsx` & `ProjectDetailModal.tsx`:
   - Tambahkan tombol "Edit Karya" khusus untuk pemilik atau Admin/Operator.
9. `src/actions/rollover.ts`:
   - Perbaiki query kurasi karya dari `prisma.showcase` ke `prisma.showcaseProject`.
   - Tambahkan penanganan `groupPhotoUrl` pada `executeRolloverWithCuratedData`.
10. `src/actions/hallOfFame.ts`:
    - Tambahkan Server Action `updateHallOfFameGroupPhoto` untuk pembaruan foto pengurus pasca-rollover.
11. `src/components/pengaturan/RolloverWizardModal.tsx`:
    - Tambahkan input/upload foto bersama pengurus (opsional).
12. `src/components/hall-of-fame/FilmstripFrame.tsx`:
    - Render foto bersama pengurus di bagian atas frame dengan gaya sinematik dan tombol edit foto bagi Operator.
