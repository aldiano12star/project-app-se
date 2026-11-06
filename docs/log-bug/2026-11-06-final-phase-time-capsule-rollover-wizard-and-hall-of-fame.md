# [FEATURE] Final Phase: The Time Capsule (Rollover Wizard & Cinematic Hall of Fame)

- **Tanggal**: 2026-11-06
- **Komponen / Fitur Terdampak**: `prisma/schema.prisma`, `src/actions/rollover.ts`, `src/actions/hallOfFame.ts`, `src/components/pengaturan/RolloverWizardModal.tsx`, `src/components/pengaturan/SettingsSection.tsx`, `src/components/hall-of-fame/FilmstripFrame.tsx`, `src/components/hall-of-fame/HallOfFameList.tsx`, `src/app/hall-of-fame/page.tsx`, `src/proxy.ts`, `src/components/layout/Sidebar.tsx`
- **Status**: SELESAI & TERVERIFIKASI

---

### 1. Deskripsi Fitur
Sebagai fitur mahkota (*crowning feature*) SE-Core App, sistem ini menghadirkan:
1. **End-of-Year Rollover Wizard (4 Langkah Kurasi)**:
   - Menggantikan tombol instan lama menjadi alur panduan kurasi akhir masa bakti kepengurusan.
   - **Langkah 1 (The Champions)**: Sistem mendeteksi otomatis Top 3 anggota dengan poin XP tertinggi dan menghitung total karya portofolio mereka.
   - **Langkah 2 (The Best Events)**: Administrator memilih tepat 3 Acara / Proker paling berkesan dari periode berjalan.
   - **Langkah 3 (The Masterpieces)**: Administrator memilih tepat 3 Karya / Showcase unggulan.
   - **Langkah 4 (Konfirmasi & Eksekusi)**: Layar ringkasan dengan teks konfirmasi keamanan `"TUTUP BUKU PERIODE"`.

2. **Aturan Preservasi & Promosi Ketat**:
   - **Promosi**: Kelas 10 $\to$ Kelas 11 (`XI`), Kelas 11 $\to$ Kelas 12 (`XII`), Kelas 12 $\to$ Alumni Demisioner.
   - **Preservasi Identitas & Finansial**: Nilai angkatan (`gen`) **tidak diubah/didekremen sama sekali**. Saldo dompet titipan kas pribadi (`kasBalance`) serta seluruh karya portofolio tidak dihapus.
   - **Reset**: Poin keaktifan (`totalPoints` dan `monthlyPoints`) di-reset ke 0 untuk membuka lembaran kompetisi baru yang adil bagi seluruh angkatan.
   - **Tutup Buku Kas**: Mengabadikan saldo penutupan periode lama dan membuka periode kepengurusan baru dengan saldo awal yang identik.

3. **Hall of Fame Sinematik (Pita Film / Filmstrip 35mm)**:
   - Rute publik mandiri di `/hall-of-fame`.
   - Tata letak menyerupai pita film dengan lubang perforasi filmstrip atas dan bawah.
   - Setiap *Frame* mewakili satu periode estafet kepengurusan (misal: "Kepengurusan 2025/2026 • Gen 20").
   - Menampilkan kartu Top 3 Champions dengan pendaran aksen Gold (Juara 1), Silver (Juara 2), dan Bronze (Juara 3), lengkap dengan efek melayang `hover:scale-105` dan statistik pudar masuk (*fade-in*).
   - Menampilkan 3 Acara Pilihan dan 3 Karya Unggulan beserta tautan eksternal ke Drive dan portofolio.
   - Dilengkapi *pagination / lazy-loading* terukur sehingga performa tetap instan dan ringan bahkan ketika ada puluhan generasi di masa depan.

---

### 2. Skema Basis Data (`HallOfFame`)
Dibuat sebagai model flat snapshot mandiri tanpa relasi cascade agar riwayat sejarah kebal terhadap modifikasi akun di masa depan:
- Snapshot Juara (Rank 1, 2, 3: nama, divisi, poin, avatar, total karya).
- Snapshot Acara (Event 1, 2, 3: judul, deskripsi, tanggal, link drive).
- Snapshot Karya (Work 1, 2, 3: judul, pembuat, divisi, url, thumbnail).
- Metrik umum: total rapat selesai dan saldo penutupan kas.

---

### 3. Verifikasi
- `npx prisma db push`: Berhasil menyinkronkan tabel `HallOfFame` ke database Neon.
- `npx tsc --noEmit`: 0 error TypeScript.
- Unit Test (`haptic`, `useCountUp`, `confetti`): Lulus 100%.
- `npm run build`: Kompilasi Turbopack Next.js 16 berhasil dengan exit code 0.
