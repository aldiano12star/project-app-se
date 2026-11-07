# [SECURITY & UX] Phase 12: The Gateway (Auth Flow Revamp)

- **Tanggal**: 2026-11-07
- **Komponen / Fitur Terdampak**: `prisma/schema.prisma`, `src/auth.ts`, `src/actions/onboarding.ts`, `src/actions/profile.ts`, `src/components/onboarding/OnboardingForm.tsx`, `src/app/login/page.tsx`, `src/app/onboarding/page.tsx`, `src/app/register/page.tsx`, `src/components/pengaturan/AdminUserManagementSection.tsx`, `src/utils/phone.ts`
- **Tingkat Keparahan**: Tinggi (Integritas Otentikasi, Skema Database & Pengalaman Pengguna Baru)
- **Status**: SELESAI

---

### 1. Gejala & Deskripsi Masalah
1. **Flawed Onboarding Flow**: Alur onboarding sebelumnya meminta kata sandi baru padahal login menggunakan Google OAuth (Google SSO), di mana kata sandi tersebut tidak pernah digunakan untuk login.
2. **Keterbatasan Skema Role & Organisasi**: Field `mainDivision` dan asumsi `gen`/`divisi` bersifat kaku pada database, padahal aplikasi diperuntukkan juga bagi tamu, pihak luar, dan kolaborator lintas organisasi yang tidak memiliki status generasi siswa atau divisi internal.
3. **Ketiadaan Mitigasi Lupa Akses**: Halaman masuk (*Login Page*) tidak memiliki saluran komunikasi langsung ketika anggota/pengguna mengalami kendala autentikasi atau akses diblokir.

---

### 2. Solusi & Perubahan yang Diterapkan
1. **Pembaruan Skema Prisma Non-Destruktif (`prisma/schema.prisma`)**:
   - Mengubah `mainDivision Division` menjadi opsional `mainDivision Division?`.
   - Menambahkan kolom `asalTujuan String?` untuk menampung konteks pendaftaran tamu/anggota.
   - Sinkronisasi instan ke Neon PostgreSQL menggunakan `prisma db push` tanpa merusak data pengguna eksisting.
2. **Frictionless Google SSO & Penghapusan Password (`src/auth.ts`)**:
   - Akun baru yang masuk lewat Google OAuth otomatis dibuat dengan role `GUEST` dan `isProfileCompleted: false` tanpa mengisi data dummy divisi/kelas.
   - Menghapus kewajiban kata sandi dari alur Google SSO secara menyeluruh.
3. **Formulir Registrasi Universal (`OnboardingForm.tsx` & `src/actions/onboarding.ts`)**:
   - Memangkas formulir onboarding menjadi 2 input esensial:
     1. **Nomor WhatsApp (Wajib)**: Dinormalisasi menggunakan utilitas E.164 `src/utils/phone.ts` (mengonversi `08xx`, `+62xx`, strip/spasi menjadi standar `628xx`).
     2. **Asal / Tujuan (Opsional)**: Dilengkapi *suggestion chips* interaktif (*Calon Anggota*, *Tamu / Kolaborator*, dsb.).
4. **Bantuan Akses Login WhatsApp (`src/app/login/page.tsx`)**:
   - Menambahkan tombol ramah `"Butuh Bantuan Login? Hubungi Admin"` dengan integrasi `wa.me/${process.env.NEXT_PUBLIC_ADMIN_WA}` dan pesan *pre-filled*.
5. **Manajemen Akun Tamu untuk Operator/Admin (`AdminUserManagementSection.tsx` & `src/actions/profile.ts`)**:
   - Admin dan Operator dapat melihat kontak WhatsApp (dengan tautan klik-langsung) dan asal/tujuan dari user Guest.
   - Dilengkapi dialog *"Atur Divisi/Gen"* untuk menetapkan divisi dan generasi siswa secara fleksibel saat atau setelah akun disetujui.

---

### 3. Verifikasi
- `npx prisma db push`: Sinkronisasi database berhasil dalam 1.67 detik.
- Pengujian Unit Logika `normalizeWhatsAppNumber`: 6/6 skenario lulus 100%.
- `npm run build`: Kompilasi Turbopack Next.js 16.3.6 dan TypeScript type-check berhasil tuntas tanpa error.
