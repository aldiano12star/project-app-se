# Arsitektur & Desain Berkelanjutan: Media Storage (Cloudinary 25 GB), Edit Karya, & Hall of Fame Enhancements

**Tanggal:** 7 November 2026  
**Status:** REVISED & APPROVED (Cloudinary 25 GB + Google Drive Smart Converter + Fallback Lokal)  
**Dokumen Penentu:** Single Source of Truth untuk implementasi keberlanjutan aplikasi Saba ExploIT antar-generasi.

---

## 1. Latar Belakang & Prinsip Keberlanjutan ("Turun-Temurun")

Aplikasi **Saba ExploIT Super App** dirancang untuk digunakan secara berkelanjutan lintas periode kepengurusan (turun-temurun) dan saat ini dideploy aktif di **Vercel Serverless**.

### Prinsip Utama:

1. **Cloud Media Storage Raksasa & Gratis (Cloudinary 25 GB)**:
   - Berbeda dari Vercel Blob yang hanya memberikan 250 MB gratis, **Cloudinary menyediakan kuota gratis hingga 25 GB / bulan**.
   - Ini mampu menampung puluhan ribu foto dokumentasi dan karya siswa selama bertahun-tahun tanpa mengeluarkan biaya sepeser pun.
   - Unggahan dilakukan secara aman melalui Server Route Handler (`/api/upload`) dengan paket `cloudinary`.
   - Domain `res.cloudinary.com` ditambahkan ke `images.remotePatterns` di `next.config.ts`.
2. **Resiliensi Tanpa Hambatan (Smart Fallback)**:
   - Jika kredensial `CLOUDINARY_URL` belum diisi di berkas `.env` lokal, sistem otomatis menggunakan *fallback* Base64 WebP terkompresi (< 35 KB) sehingga pengujian fitur lokal tidak akan pernah macet atau crash.
3. **Saluran Google Drive Smart Converter (Nol Biaya Cadangan)**:
   - Konverter instan tautan berbagi Google Drive (`drive.google.com/file/d/...`) menjadi tautan gambar langsung via Google CDN (`lh3.googleusercontent.com/d/...`).
4. **Efisiensi Klien (Canvas WebP Compression)**:
   - Semua foto yang dipilih dari galeri HP/laptop otomatis dikompresi di browser (dimensi 1080px, kualitas 0.75, format WebP) sebelum dikirim ke server. Ini membuat waktu unggah sangat cepat (hanya beberapa milidetik) bahkan pada jaringan seluler sekolah yang lambat.
5. **Resiliensi Rollover & Arsip Generasi Abadi**:
   - Memperbaiki sinkronisasi data kurasi karya antara modul Eksplorasi (`ShowcaseProject`) dengan Rollover Wizard.
   - Menambahkan foto kenangan angkatan (*Generation Group Photo*) di Hall of Fame.
   - Memberikan hak penyuntingan karya bagi penciptanya dan pengurus.

---

## 2. Rincian Teknis Implementasi

### A. Masalah 1: Karya Kosong di Rollover Wizard

- **Penyebab:** Pada `src/actions/rollover.ts`, fungsi kurasi `getRolloverCuratedData()` dan transaksi `executeRolloverWithCuratedData()` memanggil model usang `prisma.showcase.findMany()`, padahal seluruh karya aktif yang dibuat pengguna di modul Eksplorasi (`src/actions/eksplorasi.ts`) tersimpan pada model `prisma.showcaseProject`.
- **Solusi:** Ganti pemanggilan ke `prisma.showcaseProject` dengan memetakan:
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

### C. Masalah 3: Arsitektur Media Storage (Cloudinary + Google Drive + Kompresi Klien)

- **Instalasi:** `cloudinary` (SDK resmi Node.js)
- **Konfigurasi `next.config.ts`**: Menambahkan domain `res.cloudinary.com` ke daftar `images.remotePatterns`.
- **Route Handler `/api/upload/route.ts`**:
  - Menerima `POST` dengan `FormData` (file gambar terkompresi).
  - Validasi otentikasi sesi (hanya anggota terdaftar yang dapat mengunggah).
  - Jika `process.env.CLOUDINARY_URL` tersedia: Unggah buffer gambar ke Cloudinary folder `se_app/uploads` dan kembalikan URL HTTPS publik (`secure_url`).
  - Jika `CLOUDINARY_URL` belum tersedia: Kembalikan Data URL WebP terkompresi (< 35 KB) sebagai *graceful fallback*.
- **Komponen UI `ImagePickerField`**:
  - Tab 1: "Pilih dari Galeri/Perangkat" dengan kompresi otomatis Canvas $\to$ WebP (lebar maks 1080px, kualitas 0.75) dan upload ke `/api/upload`.
  - Tab 2: "Tautan Google Drive / Web" dengan parser otomatis ID Google Drive ke CDN `lh3.googleusercontent.com`.
  - Pratinjau langsung 16:9, indikator proses unggah, dan tombol hapus/reset.

### D. Masalah 4: Foto Kenangan Bersama Pengurus di Hall of Fame

- **Skema Database (`prisma/schema.prisma`)**:
  - Tambahkan kolom opsional `groupPhotoUrl String? @db.Text` pada model `HallOfFame`.
- **Sifat Pengisian**:
  - **Opsional pada saat Rollover**: Operator dapat menyertakan foto bersama saat seremoni tutup buku, atau melewatinya (*skip*) jika sesi foto resmi belum selesai.
  - **Dapat Disunting Pasca-Rollover**: Disediakan Server Action `updateHallOfFameGroupPhoto(id: string, photoUrl: string)` (khusus OPERATOR) sehingga foto pengurus angkatan lama selalu dapat dilengkapi atau diperbarui kapan saja di halaman `/hall-of-fame`.
- **Tampilan Sinematik (`FilmstripFrame.tsx`)**:
  - Foto bersama pengurus ditampilkan sebagai *Panoramic Hero Showcase* di bagian teratas frame angkatan, dilengkapi efek pencahayaan sinematik dan keterangan tahun kepengurusan.

---

## 3. Instruksi Setup Cloudinary untuk Pengurus / Developer

Cukup ikuti langkah singkat ini untuk mengaktifkan Cloudinary 25 GB gratis:

1. Daftar akun gratis di [cloudinary.com](https://cloudinary.com).
2. Di halaman Dashboard (Programmable Media), salin nilai **API Environment variable**:
   Format: `CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>`
3. Tempelkan baris tersebut ke:
   - File `.env` lokal untuk pengembangan di komputer.
   - Dashboard Vercel (Project Settings $\to$ Environment Variables) untuk lingkungan live produksi.
