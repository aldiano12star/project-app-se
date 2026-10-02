# Actionable_Task_Breakdown.md (Step-by-Step AI Execution Prompts)

## Panduan Penggunaan untuk Pengembang & AI Agent

Gunakan daftar *prompt* atomik di bawah ini satu per satu pada Claude Code atau Cursor[]. Jangan melangkah ke prompt berikutnya sebelum prompt aktif tuntas dikompilasi tanpa galat[].

---

## Tahap 1: Inisialisasi Proyek, Basis Data Neon, & Konfigurasi Token

### Prompt 1.1: Setup Proyek Next.js & Dependensi Inti

```text
Role: Senior Next.js Architect
Tugas: Buat inisialisasi proyek Next.js 14+ (App Router) dengan TypeScript dan dependensi inti.

Instruksi:
1. Setup dependensi berikut:
   - Framework & Styling: next, react, react-dom, tailwindcss, postcss, autoprefixer
   - Database: @prisma/client, prisma, @neondatabase/serverless, @prisma/adapter-neon, ws, @types/ws
   - Icons & Helpers: lucide-react, clsx, tailwind-merge, zod, html5-qrcode
   - Authentication: next-auth@beta (Auth.js v5)
2. Konfigurasikan tsconfig.json dengan path alias "@/*" mengarah ke "./src/*".
3. Pastikan package.json memiliki script build, lint, dan dev yang valid.
```

### Prompt 1.2: Konfigurasi Tailwind Sesuai DESIGN.md

```text
Role: Frontend UI Engineer
Tugas: Konfigurasikan tailwind.config.ts dan src/app/globals.css sesuai aturan @DESIGN.md.

Instruksi:
1. Petakan token warna dari @DESIGN.md:
   - brand.primary: #E11D2A
   - neutral-dark.surface: #0B1120, card: #131C31, border: #23304B
   - neutral-light.surface: #F8FAFC, card: #FFFFFF, border: #E2E8F0
   - divisions: programming (#2563EB), design (#9333EA), photography (#D97706), cinematography (#E11D2A), technopreneurship (#059669)
2. Terapkan aturan low-spec: Nonaktifkan utility backdrop-blur dan shadow berlebih.
3. Tetapkan darkMode: 'class'.
```

### Prompt 1.3: Prisma Schema & Neon Connection Adapter

```text
Role: Database Engineer
Tugas: Setup skema Prisma dan koneksi client Neon Serverless.

Instruksi:
1. Buat file prisma/schema.prisma dan salin seluruh model relasional dari Bab 2 @Architecture_and_SDD.md.
2. Buat src/lib/db.ts menginisialisasi PrismaClient menggunakan Pool dan WebSocket adapter dari @neondatabase/serverless sesuai Bab 1 @TRD.md.
3. Buat script prisma/seed.ts:
   - 1 Akun OPERATOR default (whitelist).
   - 1 AcademicYear aktif ("2026/2027").
   - 5 SOPTemplate bawaan.
4. Jalankan `npx prisma generate`.
```

---

## Tahap 2: Autentikasi Google OAuth & RBAC Operator Bypass

### Prompt 2.1: Integrasi Auth.js v5 & Whitelist Verification

```text
Role: Security & Auth Engineer
Tugas: Implementasikan autentikasi Google OAuth dengan proteksi whitelist email.

Instruksi:
1. Buat src/lib/auth.ts menggunakan NextAuth v5 dengan Google Provider.
2. Terapkan callback signIn(): Validasi email pengguna terhadap database model User. Jika belum terdaftar, arahkan ke /unauthorized.
3. Terapkan callback jwt() dan session(): Sertakan properti id, role (termasuk OPERATOR), classGrade, mainDivision, dan status.
4. Buat handler di src/app/api/auth/[...nextauth]/route.ts.
```

### Prompt 2.2: Middleware & RBAC Helper dengan Operator Bypass

```text
Role: Backend Security Specialist
Tugas: Buat Edge Middleware dan helper proteksi Server Actions dengan bypass untuk Operator.

Instruksi:
1. Buat src/middleware.ts:
   - Lindungi rute /(dashboard)/* wajib memiliki sesi aktif.
   - Lindungi rute /kas/kelola hanya untuk role ADMIN, BENDAHARA, dan OPERATOR.
2. Buat src/lib/rbac.ts sesuai Bab 3 @Architecture_and_SDD.md:
   - assertAuthenticated()
   - assertRole(allowedRoles: Role[]): Tambahkan logika IF role === OPERATOR -> return user (Bypass).
   - assertActiveMember(): Tambahkan bypass untuk OPERATOR.
```

---

## Tahap 3: Shell Navigasi 5 Tab Bawah & Primitif UI Dasar

### Prompt 3.1: Primitif UI Reusable (Low-Spec Friendly)

```text
Role: Frontend Component Engineer
Tugas: Buat komponen UI dasar di src/components/ui/ sesuai aturan @DESIGN.md.

Instruksi:
1. Buat komponen:
   - Button.tsx: h-11 (min 44px) touch target, varian primary Merah Saba (#E11D2A), outline, destructive.
   - Card.tsx: Kontainer flat 1px solid border tanpa blur.
   - Badge.tsx: Minimalist pill badge untuk semantic dan 5 divisi.
   - Modal.tsx: Dialog bersih dengan overlay hitam solid transparan bg-black/60 (tanpa backdrop-blur).
   - Input.tsx: Field form teks dengan border 1px tegas.
```

### Prompt 3.2: Layout Shell Navigasi 5 Tab

```text
Role: Frontend UI Engineer
Tugas: Buat shell navigasi 5 tab bawah di src/components/navigation/ dan layout induk.

Instruksi:
1. Buat MobileBottomNav.tsx (fixed bottom, 5 tab: Beranda, Acara, Showcase, Arsip, Suara).
2. Buat DesktopSidebar.tsx untuk resolusi >= 768px.
3. Buat TopHeader.tsx dengan avatar profil, sapaan, dan toggle tema (Light/Dark).
4. Susun src/app/(dashboard)/layout.tsx menggabungkan komponen-komponen ini.
```

---

## Tahap 4: Tab 1 (Beranda): Presensi QR, Kas Pribadi, 2 Kotak Gen, & Podium

### Prompt 4.1: Server Actions Presensi QR & Podium

```text
Role: Fullstack Engineer
Tugas: Buat Server Actions presensi QR dan kalkulasi leaderboard di src/actions/attendance.actions.ts dan admin.actions.ts.

Instruksi:
1. generateMeetingQR(): Menghasilkan token QR acak dan waktu kedaluwarsa 15 menit.
2. claimQRAttendance(): Memvalidasi token QR kamera, mencatat Attendance, dan memberi reward +10 poin bulanan & tahunan.
3. Kueri Top 3 podium bulanan (User dengan monthlyPoints tertinggi) diurutkan untuk susunan 2 - 1 - 3.
```

### Prompt 4.2: Tampilan Beranda Konsolidasi

```text
Role: Senior Frontend Developer
Tugas: Bangun halaman Beranda di src/app/(dashboard)/page.tsx sesuai @UI_UX_Flow.md.

Instruksi:
1. Widget Presensi QR: Banner pemicu scanner kamera modal (menggunakan html5-qrcode).
2. Role Action Card: Tombol Merah Saba ke /kas/kelola (khusus Bendahara/Admin/Operator).
3. Widget Kas Pribadi & Transparansi:
   - Status iuran diri sendiri (Lunas/Nunggak).
   - Total Saldo Kas Organisasi & donut chart alokasi pengeluaran.
   - 2 Kotak Kepatuhan Angkatan (Grid 2 kolom: Kepatuhan Kelas 10 vs Kelas 11).
4. Agenda Acara Terdekat (D-Minus Countdown).
5. Podium Top 3 (2 - 1 - 3 Layout): Pilar Perak (kiri), Pilar Emas (tengah lebih tinggi), Pilar Perunggu (kanan lebih rendah) sesuai @DESIGN.md.
```

---

## Tahap 5: Panel Khusus Pembukuan Kas (`/kas/kelola`)

### Prompt 5.1: Server Actions Mutasi Kas & Advance Payment

```text
Role: Backend Engineer
Tugas: Buat Server Actions modul kas di src/actions/kas.actions.ts.

Instruksi:
1. createKasPeriod(): Membuka periode dua mingguan baru.
2. recordKasPayment(): Menerima total nominal, mengalokasikan Math.floor(nominal / 5000) periode kas berurutan dalam prisma.$transaction, dan memberi reward poin.
3. createTransaction(): Mencatat pemasukan/pengeluaran dengan validasi URL bukti Google Drive.
4. Batasi akses fungsi ini hanya untuk BENDAHARA, ADMIN, dan OPERATOR.
```

### Prompt 5.2: Antarmuka Panel Kelola Kas Terisolasi

```text
Role: Frontend Engineer
Tugas: Bangun halaman panel pembukuan di src/app/(dashboard)/kas/kelola/page.tsx.

Instruksi:
1. Filter otomatis per angkatan:
   - Bendahara Kelas 10 default melihat siswa Kelas 10.
   - Bendahara Kelas 11 default melihat siswa Kelas 11.
   - Sediakan tombol switch untuk mengganti filter kelas secara manual.
2. Matriks kas anggota lengkap (Grid tabel badge Lunas/Nunggak per 2 minggu).
3. Modal Catat Pembayaran Kas (Advance Payment) dan Modal Input Pengeluaran Nota Drive.
```

---

## Tahap 6: Tab 2 (Acara): Kalender Mengular & Workspace Ad-Hoc

### Prompt 6.1: Server Actions Event, Task SOP, & Notulensi Acara

```text
Role: Backend Engineer
Tugas: Buat Server Actions acara di src/actions/event.actions.ts.

Instruksi:
1. createEvent(): Membuat acara baru dan otomatis menginjeksi task dari SOPTemplate ke seksi default "Kesekretariatan & Logistik".
2. createEventSection() & createEventTask(): Pengelolaan seksi dan tugas kepanitiaan ad-hoc.
3. verifyTaskCompletion(): Verifikasi penyelesaian tugas oleh Ketua/Operator untuk klaim +15 poin anti-farming.
4. saveEventNotulensi(): Menyimpan dokumentasi notulensi rapat teknis khusus acara terkait.
```

### Prompt 6.2: Tampilan Kalender Mengular & Workspace

```text
Role: Frontend Engineer
Tugas: Bangun halaman acara di src/app/(dashboard)/events/.

Instruksi:
1. Halaman /events/page.tsx:
   - Kalender Jalur Mengular Bulanan (Duolingo-style snaking pathway) sesuai @DESIGN.md.
   - Selector bulan di atas ([ < ] Bulan Tahun [ > ]).
   - Mengetuk tanggal berikon acara langsung mengarahkan ke /events/[eventId].
2. Halaman /events/[eventId]/page.tsx:
   - Header: Tombol Google Drive utama acara.
   - Accordion Seksi Ad-Hoc & Task Board (dengan lencana SOP otomatis).
   - Tab Terpadu: Notulensi Acara.
```

---

## Tahap 7: Tab 3 (Showcase Portofolio Organisasi)

### Prompt 7.1: Server Actions Showcase & Atribusi Multi-Kontributor

```text
Role: Backend Engineer
Tugas: Buat Server Actions galeri karya di src/actions/showcase.actions.ts.

Instruksi:
1. publishShowcase(): Menerima judul, deskripsi, divisi utama, externalUrl (GitHub/Figma/YouTube/Drive), thumbnailUrl, dan daftar contributorUserIds.
2. Validasi tautan eksternal menggunakan regex dari @TRD.md.
3. Simpan data karya dan relasi kontributor, beri reward +20 poin untuk pembuat karya.
```

### Prompt 7.2: Grid Showcase & Filter 5 Divisi

```text
Role: Frontend Engineer
Tugas: Bangun halaman showcase di src/app/(dashboard)/showcase/page.tsx.

Instruksi:
1. Bilah filter 5 divisi utama (Programming, Design, Photography, Cinematography, Technopreneurship).
2. Feed kartu karya responsif: Thumbnail 16:9 (lazy loading), tag warna divisi, nama kontributor, dan tombol buka tautan eksternal.
3. Modal form + Pamerkan Karya Baru.
```

---

## Tahap 8: Tab 4 (Arsip & Belajar)

### Prompt 8.1: Repositori Modul Divisi & Template

```text
Role: Frontend Developer
Tugas: Bangun halaman pusat arsip dan modul belajar di src/app/(dashboard)/arsip/page.tsx.

Instruksi:
1. Tampilkan 3 kategori kartu repositori Google Drive:
   - Modul Pembelajaran Divisi (Programming, Design, Fotografi, Videografi).
   - Template Dokumen Resmi (Format Proposal, Surat Izin Sekolah/Sarpras, LPJ).
   - Aset Brand Saba ExploIT (Logo SVG/PNG, Font, Color Palette).
2. Sekali klik langsung membuka tautan folder Google Drive resmi terkait.
```

---

## 9. Tab 5 (Suara): Kotak Suara 3 Saluran & Polling Multi-Format

### Prompt 9.1: Server Actions Suara & Polling

```text
Role: Backend Engineer
Tugas: Buat Server Actions di src/actions/aspiration.actions.ts.

Instruksi:
1. submitAspiration():
   - PUBLIC: Opsi anonim/bernama, receiverId null.
   - PRIVATE_MEMBER: Wajib bernama (isAnonymous = false) dan wajib menyertakan receiverId.
   - OPERATOR_SUPPORT: Ditujukan langsung ke Operator (tiket bug/usulan fitur).
2. votePoll(): Mendukung single-choice dan multiple-choice sesuai konfigurasi allowMultipleVotes pada model Poll.
```

### Prompt 9.2: Tampilan Kotak Suara & Polling

```text
Role: Frontend Engineer
Tugas: Bangun halaman suara di src/app/(dashboard)/suara/page.tsx.

Instruksi:
1. Kotak Suara 3 Tab: Formulir dinamis untuk Evaluasi Publik, Evaluasi Personal 1-on-1, dan Lapor ke Operator.
2. Widget Polling Interaktif: Menampilkan diagram batang persentase suara langsung di bagian atas kartu setelah anggota memilih.
```

---

## Tahap 10: Audit Sistem & Verifikasi Produksi

### Prompt 10.1: Pemeriksaan Low-Spec & Build Test

```text
Role: QA & Performance Engineer
Tugas: Lakukan audit menyeluruh terhadap kode aplikasi sebelum rilis ke Vercel.

Instruksi:
1. Periksa codebase: Pastikan TIDAK ADA utilitas backdrop-blur atau box-shadow berat.
2. Pastikan tombol memiliki touch target minimal 44px (h-11).
3. Jalankan `npm run lint` dan `npx tsc --noEmit`. Pastikan zero error.
4. Jalankan `npm run build` dan periksa bahwa initial bundle size rute Beranda berada di bawah 160 KB sesuai @TRD.md.
```

---
