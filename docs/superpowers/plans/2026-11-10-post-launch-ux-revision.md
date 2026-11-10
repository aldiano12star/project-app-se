# Rencana Implementasi: Post-Launch UX Revision & Dynamic Logic

> **Sub-Skill Terkait:** Menggunakan `superpowers:executing-plans` untuk mengeksekusi rencana tugas demi tugas secara metodis. Setiap langkah menggunakan format checkbox (`- [ ]`) untuk pelacakan progres.

**Tujuan:** Memperbaiki inkonsistensi warna tombol utama di mode gelap (dark mode pink issue), menyederhanakan onboarding Fase 1 (dropdown tujuan, penghapusan NISN), memperluas pengaturan profil (edit nama & WA), menambahkan kustomisasi foto profil/avatar preset, serta mengimplementasikan onboarding Fase 2 dengan kalkulasi dinamis nomor angkatan (Auto-Gen algorithm) dan hak akses peran.

**Arsitektur:** Menggunakan standar Tailwind CSS v4 CSS variables untuk token warna yang konsisten di light dan dark mode. Prisma Schema disesuaikan dengan menghapus field `nisn` dan menambahkan `instansi`. Alur onboarding dibagi menjadi Fase 1 (registrasi akun baru Google SSO) dan Fase 2 (kelengkapan profil pasca-approval peran oleh operator) dengan validasi Server Actions dan perhitungan tahun ajaran otomatis.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma ORM (Neon PostgreSQL), Tailwind CSS v4, Lucide React, WebP image compression + Cloudinary upload.

---

## 📋 Ringkasan File yang Dimodifikasi & Dibuat

### 1. Global CSS & Design System
- `src/app/globals.css`: Mengunci token warna `--saba-primary` dan `--saba-primary-hover` di class `.dark` agar tetap solid red (`#E11D2A` & `#BE123C`), identik dengan mode terang dan konsisten dengan tombol "Buat Agenda" (menghilangkan efek salmon/pink).
- `docs/ui-ux/aturan-desain.md`: Memperbarui dokumentasi warna Saba Red agar sinkron dengan aturan baru.

### 2. Database & Schema
- `prisma/schema.prisma`:
  - Menghapus field `nisn String? @unique` pada model `User`.
  - Menambahkan field `instansi String?` pada model `User` untuk keperluan profil KOLABORATOR.
- `prisma/seed.ts`: Menyesuaikan data seed agar tidak menggunakan kolom `nisn`.

### 3. Logika Helper & Algoritma
- `src/lib/academic-year.ts` (File Baru): Helper fungsi `calculateGenFromGrade(grade, date)` untuk menghitung nomor angkatan (Gen) secara dinamis berdasarkan tahun ajaran kalender Indonesia (Juli–Juni).
- `tests/unit/academic-year.test.ts` (File Baru): Unit test untuk membuktikan keakuratan algoritma Auto-Gen pada berbagai tahun ajaran dan tingkat kelas.

### 4. Server Actions
- `src/actions/onboarding.ts`:
  - Mengubah `asalTujuan` menjadi field wajib (`required`) dengan validasi opsi: Calon Anggota, Tamu / Kolaborator, Alumni, Eksplorasi Proyek.
  - Menambahkan server action `completePhase2Profile` untuk peran MEMBER/ADMIN (menyimpan divisi, kelas, dan kalkulasi gen otomatis).
  - Menambahkan server action `completePhase2Kolaborator` untuk peran KOLABORATOR (menyimpan nama instansi/organisasi).
- `src/actions/profile.ts`:
  - Memperbarui `updateProfileContact` untuk mengizinkan perubahan Nama Lengkap (`name` & `fullName`) serta nomor WhatsApp (`noWhatsapp`).
  - Menghapus referensi `nisn`.
  - Menambahkan server action `updateUserAvatar` untuk memperbarui `avatarUrl` (dan `image`).
- `src/actions/auth.ts`: Menghapus referensi field `nisn`.
- `src/actions/backup.ts`: Menghapus referensi field `nisn`.

### 5. Komponen UI & Halaman
- `src/components/onboarding/OnboardingForm.tsx`:
  - Mengganti pill buttons "Asal / Tujuan" menjadi `<select>` dropdown wajib dengan 4 opsi resmi.
  - Memastikan tidak ada kolom NISN maupun tautan sosial media.
- `src/components/pengaturan/SettingsSection.tsx`:
  - Menambahkan input Nama Lengkap yang dapat diedit pada form "Data Kontak & Tautan Portofolio".
  - Menghapus input NISN.
  - Memastikan field "Asal / Tujuan Kunjungan" tidak dapat diedit di form ini.
  - Menyesuaikan pembatasan akses tombol KTA Digital agar tidak muncul jika pengguna berstatus `KOLABORATOR` atau `GUEST`.
- `src/components/pengaturan/ProfileHeroCard.tsx`:
  - Menghapus referensi `nisn`.
  - Menyembunyikan tombol KTA Digital untuk peran `KOLABORATOR`.
  - Menambahkan trigger tombol edit avatar untuk membuka modal pemilihan avatar.
- `src/components/pengaturan/KTADigitalModal.tsx`:
  - Menghapus badge/tampilan NISN.
  - Membatasi akses agar tidak merender KTA untuk pengguna `KOLABORATOR` atau `GUEST`.
- `src/components/pengaturan/AvatarSelectorModal.tsx` (File Baru):
  - Memungkinkan unggah foto profil kustom melalui `ImagePickerField` (WebP + Cloudinary).
  - Menyediakan grid 4–6 template avatar default (ilustrasi modern).
  - Menyimpan avatar terpilih via `updateUserAvatar`.
- `src/components/pengaturan/AdminUserManagementSection.tsx`:
  - Menyediakan tombol aksi cepat persetujuan role generik (`Setujui Member`, `Setujui Kolaborator`).
- `src/components/onboarding/CompleteProfileModal.tsx` (File Baru):
  - Modal onboarding Fase 2 yang memblokir layar jika akun telah di-approve tetapi belum melengkapi profil spesifik:
    - Jika MEMBER/ADMIN: Meminta pilihan Divisi dan Kelas (10, 11, 12). Menampilkan preview otomatis nomor Gen hasil kalkulasi.
    - Jika KOLABORATOR: Meminta input nama "Asal Organisasi / Instansi".
- `src/app/dashboard/page.tsx`:
  - Memasang `CompleteProfileModal` untuk memicu Fase 2 saat login jika profil spesifik peran belum lengkap.
- `src/app/pengaturan/page.tsx`:
  - Menghapus pembacaan `nisn`.
  - Mengirimkan data `instansi` ke tampilan.

---

## 🧮 Penjelasan Logika Algoritma Auto-Gen

Tahun ajaran sekolah di Indonesia berjalan dari **1 Juli tahun $Y$ hingga 30 Juni tahun $Y+1$**.
Berdasarkan konteks acuan:
> Pada Tahun Ajaran **2026/2027**:
> - Kelas 10 = Gen 21
> - Kelas 11 = Gen 20
> - Kelas 12 = Gen 19

### Rumus Matematis:
1. **Tahun Mulai Ajaran ($A$):**
   - Jika bulan saat ini $\ge 7$ (Juli–Desember), maka $A = \text{Tahun Sekarang}$.
   - Jika bulan saat ini $< 7$ (Januari–Juni), maka $A = \text{Tahun Sekarang} - 1$.
   *(Contoh: November 2026 $\rightarrow A = 2026$. Februari 2027 $\rightarrow A = 2026$. Juli 2027 $\rightarrow A = 2027$).*

2. **Pergeseran Tahun Acuan ($\Delta A$):**
   - Basis acuan: Tahun ajaran 2026/2027 ($A_{\text{base}} = 2026$), di mana Kelas 10 adalah Gen 21.
   - $\Delta A = A - 2026$.

3. **Kalkulasi Nomor Gen:**
   - Kelas 10: $\text{Gen} = 21 + \Delta A$
   - Kelas 11: $\text{Gen} = 20 + \Delta A = (21 - 1) + \Delta A$
   - Kelas 12: $\text{Gen} = 19 + \Delta A = (21 - 2) + \Delta A$

Rumus umum:
$$\text{Gen} = 21 - (\text{Kelas} - 10) + (A - 2026)$$

*Validasi:*
- Pada TA 2026/2027 ($A = 2026$):
  - Kelas 10: $21 - 0 + 0 = 21$ ✅
  - Kelas 11: $21 - 1 + 0 = 20$ ✅
  - Kelas 12: $21 - 2 + 0 = 19$ ✅
- Pada TA 2027/2028 ($A = 2027, \Delta A = +1$):
  - Kelas 10: $21 - 0 + 1 = 22$ ✅ (Siswa baru angkatan 22 masuk)
  - Kelas 11: $21 - 1 + 1 = 21$ ✅ (Siswa angkatan 21 naik ke kelas 11)
  - Kelas 12: $21 - 2 + 1 = 20$ ✅ (Siswa angkatan 20 naik ke kelas 12)

---

## 📋 Daftar Rencana Eksekusi Bertahap

### Task 1: Standarisasi Warna Tombol Utama (Perbaikan Pink di Dark Mode)
- [ ] Ubah `--saba-primary` dan `--saba-primary-hover` pada `.dark` di `src/app/globals.css` menjadi solid red (`#E11D2A` dan `#BE123C`).
- [ ] Sesuaikan dokumentasi di `docs/ui-ux/aturan-desain.md`.
- [ ] Verifikasi visual tombol utama agar tidak ada class `dark:bg-pink-*`.

### Task 2: Pembersihan Field NISN dari Skema Database & Kode
- [ ] Hapus field `nisn` dari `prisma/schema.prisma` dan tambahkan field `instansi String?`.
- [ ] Sesuaikan `prisma/seed.ts` agar tidak memasukkan nilai `nisn`.
- [ ] Jalankan `prisma generate` dan `prisma db push`.
- [ ] Hapus penggunaan `nisn` di:
  - `src/actions/auth.ts`
  - `src/actions/profile.ts`
  - `src/actions/backup.ts`
  - `src/app/pengaturan/page.tsx`
  - `src/components/pengaturan/SettingsSection.tsx`
  - `src/components/pengaturan/ProfileHeroCard.tsx`
  - `src/components/pengaturan/KTADigitalModal.tsx`
  - `src/components/auth/RegisterForm.tsx`
- [ ] Jalankan `rtk proxy npx tsc --noEmit` untuk memastikan tidak ada sisa error kompilasi.

### Task 3: Onboarding Fase 1 yang Ringkas (Streamlined Post-Google SSO)
- [ ] Perbarui `src/components/onboarding/OnboardingForm.tsx`:
  - Ubah input "Asal / Tujuan Kunjungan" dari chip button menjadi `<select>` dropdown wajib dengan 4 opsi:
    1. Calon Anggota
    2. Tamu / Kolaborator
    3. Alumni
    4. Eksplorasi Proyek
  - Validasi tombol submit memerlukan Nama, Nomor WhatsApp, dan Asal/Tujuan terpilih.
  - Pastikan tidak ada input NISN maupun social links.
- [ ] Perbarui `src/actions/onboarding.ts`:
  - Tambahkan validasi ketat bahwa `asalTujuan` wajib diisi dan merupakan salah satu dari 4 pilihan yang sah.

### Task 4: Pembaruan Pengaturan Profil ("Data Kontak & Tautan Portofolio")
- [ ] Modifikasi `src/actions/profile.ts`:
  - Izinkan `updateProfileContact` menerima `fullName` / `name` dan memperbarui `name` serta `fullName` di DB.
  - Pertahankan nomor WhatsApp dan tautan portofolio/sosial (GitHub, Instagram, LinkedIn, Portfolio).
  - Pastikan `asalTujuan` (Intent) tidak dapat diubah dari form ini.
- [ ] Modifikasi `src/components/pengaturan/SettingsSection.tsx`:
  - Tambahkan input teks "Nama Lengkap" di paling atas form Kontak.
  - Pastikan input WhatsApp dan media sosial tetap ada, sedangkan input NISN telah dihapus.

### Task 5: Fitur Foto Profil Lanjutan & Template Avatar
- [ ] Buat koleksi template avatar SVG/URL di `public/avatars/` atau daftar konstanta template yang menarik dan andal.
- [ ] Buat Server Action `updateUserAvatar({ avatarUrl: string })` di `src/actions/profile.ts` yang memperbarui `avatarUrl` dan `image` di DB pengguna.
- [ ] Buat komponen `AvatarSelectorModal.tsx` yang menyediakan:
  - Tab 1: Unggah Foto Pribadi menggunakan `ImagePickerField` (WebP + Cloudinary).
  - Tab 2: Pilih dari 6 Template Avatar Bawaan.
  - Preview visual lingkaran avatar.
- [ ] Hubungkan modal ini ke tombol edit avatar di `ProfileHeroCard.tsx` dan `SettingsSection.tsx`.

### Task 6: Algoritma Auto-Gen & Onboarding Fase 2
- [ ] Buat helper `src/lib/academic-year.ts` dengan fungsi `calculateGenFromGrade`.
- [ ] Buat unit test `tests/unit/academic-year.test.ts` dan jalankan dengan `rtk proxy npx tsx` untuk memvalidasi kasus uji (Kelas 10, 11, 12 di berbagai tahun ajaran).
- [ ] Buat Server Action `completePhase2Profile` (MEMBER/ADMIN) dan `completePhase2Kolaborator` (KOLABORATOR) di `src/actions/onboarding.ts`.
- [ ] Buat komponen `CompleteProfileModal.tsx`:
  - Jika MEMBER/ADMIN dan belum ada divisi/kelas: render form Divisi + Kelas (10, 11, 12). Tampilkan kalkulasi nomor Gen otomatis.
  - Jika KOLABORATOR dan belum ada data instansi: render form "Asal Organisasi / Instansi".
- [ ] Pasang `CompleteProfileModal` di `src/app/dashboard/page.tsx`.
- [ ] Pastikan hak akses KTA Digital diblokir/disembunyikan untuk peran `KOLABORATOR` di `ProfileHeroCard.tsx`, `SettingsSection.tsx`, dan `KTADigitalModal.tsx`.
- [ ] Sesuaikan `AdminUserManagementSection.tsx` agar operator dapat menyetujui peran generik (MEMBER, KOLABORATOR) tanpa mewajibkan input manual Gen/Divisi di panel admin.

### Task 7: Verifikasi Menyeluruh & Testing
- [ ] Jalankan unit test `tests/unit/academic-year.test.ts`.
- [ ] Jalankan typecheck `rtk proxy npx tsc --noEmit`.
- [ ] Verifikasi alur transisi dan pastikan tidak ada regresi UI/UX.
