# [UX POLISH] Phase 11: Data Clutter Reduction & Dashboard Priority

- **Tanggal**: 2026-11-06
- **Komponen / Fitur Terdampak**: `src/app/kas/page.tsx`, `src/components/kas/DigitalWalletCard.tsx`, `src/components/kas/InvoiceTrackerSection.tsx`, `src/app/dashboard/page.tsx`
- **Tingkat Keparahan**: Sedang (Penyempurnaan Ergonomi & Kejelasan Informasi)
- **Status**: SELESAI

---

### 1. Gejala & Deskripsi Masalah
1. **Penumpukan Riwayat Mutasi**: Komponen "Riwayat Mutasi Saldo Kas" me-render seluruh transaksi tanpa batas, membuat halaman kas memanjang tanpa kendali.
2. **Penumpukan Tagihan Selesai (Treasurer Clutter)**: Agenda penagihan massal yang sudah 100% lunas bertumpuk di layar Bendahara, mengaburkan fokus dari tagihan yang masih menunggak.
3. **Prioritas Acara di Beranda**: Widget "Agenda Acara Terdekat" sebelumnya didominasi oleh Proker multi-hari jangka panjang dan tautannya mengarah ke workspace internal `/acara/[id]`, padahal anggota memerlukan pengingat rapat atau acara singkat mendesak.

---

### 2. Solusi & Perubahan yang Diterapkan
1. **Pembatasan Mutasi Kas Personal (`DigitalWalletCard.tsx` & `src/app/kas/page.tsx`)**:
   - Membatasi query dan render riwayat mutasi kas hanya pada 5 transaksi terbaru (*hard slice* 5 item) untuk menjaga tinggi kartu tetap terprediksi tanpa scrollbar.
2. **Penyembunyian Cerdas Tagihan Lunas (`InvoiceTrackerSection.tsx`)**:
   - Mempartisi agenda tagihan menjadi `activeGroups` (tunggakan aktif) dan `completedGroups` (100% lunas).
   - Tagihan yang sudah 100% tuntas disembunyikan di balik akordeon *"Tampilkan Tagihan Selesai (N Agenda Lunas)"* sehingga perhatian Bendahara terpusat pada penagihan aktif.
   - Menampilkan kartu selebrasi bersih ketika seluruh tagihan aktif telah tuntas 100%.
3. **Prioritas Urgent-First pada Dashboard (`src/app/dashboard/page.tsx`)**:
   - Memperbarui query dashboard untuk mengambil sesi rapat (`Meeting`) dan kegiatan satu hari (*single-day* `Event`).
   - Menyusun prioritas teratas untuk agenda singkat yang paling dekat waktunya (hari ini / besok), dan baru mengisi dengan proker multi-hari jika slot kurang dari 3.
   - Memperbarui seluruh tautan item widget agar langsung menuju ke halaman utama `/acara`.

---

### 3. Verifikasi
- `npx tsc --noEmit`: Bebas error tipe data.
- Unit Test (`haptic`, `useCountUp`, `confetti`): Lulus 100%.
- `npm run build`: Kompilasi Turbopack Next.js 16 berhasil dengan kode keluar 0 (*exit code 0*).
