# [VISUAL & UX] Phase 13: First Impression & Visual Polish

- **Tanggal**: 2026-11-07
- **Komponen / Fitur Terdampak**: `prisma/schema.prisma`, `src/auth.ts`, `src/actions/profile.ts`, `src/components/home/WelcomeOnboardingModal.tsx`, `src/components/ui/HumanizedEmptyState.tsx`, `src/components/ui/SocialIcons.tsx`, `src/components/pengaturan/ProfileHeroCard.tsx`, `src/components/pengaturan/SettingsSection.tsx`, `src/components/kas/InvoiceListCard.tsx`, `src/app/dashboard/page.tsx`, `src/components/eksplorasi/ShowcaseTab.tsx`
- **Tingkat Keparahan**: Sedang (Penyempurnaan Estetika Visual, Branding, Empty State & Hype Onboarding)
- **Status**: SELESAI

---

### 1. Gejala & Deskripsi Kebutuhan
1. **Generic Empty States (Zero-Data UI)**: Tampilan kondisi kosong (*empty state*) pada modul Kas, Dashboard Agenda, dan Showcase sebelumnya terasa kaku, dingin, dan seperti sistem yang rusak (*"Data tidak ditemukan"*).
2. **Keterbatasan Personalisasi Sosial**: Pengguna tidak memiliki opsi mencantumkan tautan media sosial profesional dan karya mereka (GitHub, Instagram, LinkedIn).
3. **Ketiadaan Momen Penyambutan Perdana**: Pengguna baru yang baru saja menyelesaikan onboarding langsung dihadapkan pada antarmuka dashboard tanpa sambutan hangat (*the hype moment*) yang menjelaskan ekosistem digital SE-Core.

---

### 2. Solusi & Perubahan yang Diterapkan
1. **Pembaruan Skema Prisma (`prisma/schema.prisma`)**:
   - Menambahkan field baru pada `model User`:
     - `avatarUrl String?` (Penyelarasan eksplisit URL avatar)
     - `githubUrl String?` (Tautan profil GitHub)
     - `instagramUrl String?` (Tautan profil Instagram)
     - `linkedinUrl String?` (Tautan profil LinkedIn)
     - `hasSeenWelcome Boolean @default(false)` (Pelacak modal sambutan perdana berbasis database)
   - Sinkronisasi non-destruktif sukses via `prisma db push`.
2. **Sinkronisasi Avatar Google SSO (`src/auth.ts`)**:
   - Google OAuth secara otomatis menyimpan foto profil Google ke kolom `image` dan `avatarUrl` saat sign-in dan sinkronisasi berkala.
3. **Komponen Reusable Empty State (`HumanizedEmptyState.tsx`)**:
   - Dibuat dengan aksen visual halus (`text-ink-muted/30`, ambient soft circle, dan layout terpusat yang ramah).
   - **Kas Module (Invoices)**: *"Yeay! Belum ada tagihan aktif. Dompetmu aman! 🎉"* dilengkapi ikon koin/dompet tersenyum ceria.
   - **Dashboard (Agenda)**: *"Tidak ada agenda terdekat. Waktunya fokus berkarya atau bersantai!"* dilengkapi ikon secangkir kopi santai.
   - **Showcase (Karya)**: *"Belum ada mahakarya di sini. Jadilah yang pertama mengukir sejarah!"* dilengkapi ikon roket/kanvas dan tombol aksi submit karya.
4. **Tautan Sosial di Pengaturan & Kartu Profil (`ProfileHeroCard.tsx`, `SettingsSection.tsx`, `SocialIcons.tsx`)**:
   - Dibuat komponen ikon SVG murni independen (`GithubIcon`, `InstagramIcon`, `LinkedinIcon`).
   - Formulir pengaturan kontak diperkaya dengan input validasi URL untuk GitHub, Instagram, dan LinkedIn.
   - Kartu profil utama (`ProfileHeroCard`) menampilkan deretan lencana sosial interaktif yang dapat diklik langsung.
5. **One-Time Welcome Onboarding Modal (`WelcomeOnboardingModal.tsx` & `src/actions/profile.ts`)**:
   - Modal sambutan imersif dengan lambang squircle SE-Core berpendar cahaya halus (*ambient radial glow*).
   - Menampilkan salam personal, 3 pilar nilai ekosistem (Eksplorasi, XP & Podium, Transparansi Kas).
   - Tombol *"Mulai Penjelajahan"* menyulut letupan partikel mikro-konfeti (`triggerMicroConfetti()`) dan umpan balik haptik (`haptic.success()`), serta memperbarui flag `hasSeenWelcome: true` di database sehingga tidak akan pernah muncul kembali.

---

### 3. Verifikasi
- `npx prisma db push`: Sinkronisasi skema database Neon PostgreSQL sukses 100%.
- `npm run build`: Kompilasi Turbopack Next.js 16.3.6 dan TypeScript type-check tuntas bebas error (0 error).
