# UI_UX_Flow.md (User Interface & User Experience Design Guideline)

## 1. 5-Tab Mobile Navigation Hierarchy

Navigasi bilah bawah (_fixed bottom_, tinggi 56px, latar solid tanpa blur) terdiri dari 5 tab:[

1. **Beranda (`/`):** Dashboard personal, presensi QR, kas pribadi, 2 kotak angkatan, agenda, dan podium top 3[.
2. **Acara (`/events`):** Kalender mengular bulanan & workspace ad-hoc[.
3. **Showcase (`/showcase`):** Galeri portofolio karya 5 divisi[.
4. **Arsip & Belajar (`/arsip`):** Modul divisi, template proposal/surat, dan aset brand[.
5. **Suara (`/suara`):** Kotak evaluasi 3 saluran dan polling interaktif[.

---

## 2. Screen Breakdown & Flow Details

### 2.1. Tab 1: Beranda (`/`)

- **Header:** Logo Saba ExploIT, avatar profil, sapaan ramah, dan lencana kelas/peran (untuk Operator ditampilkan: `Kelas 11 • System Operator`)[.
- **Widget Presensi Cepat QR (Jika ada rapat aktif):**
  Banner biru/merah dengan tombol `[ Pindai QR Rapat`[. Mengetuk tombol membuka modal kamera ringan (`html5-qrcode`) untuk memindai QR proyektor secara instan[.
- **Kartu Aksi Khusus Bendahara & Operator:**
  Hanya muncul jika `role === BENDAHARA || ADMIN || OPERATOR`[. Kartu solid Merah Saba: `[ Buka Panel Pembukuan Kas (/kas/kelola)`[.
- **Widget Kas Pribadi & Transparansi Saldo (Semua Anggota):**[
  - Baris Atas: Status kas diri sendiri (`Lunas s/d Periode 12` atau `Nunggak Rp10.000`)[.
  - Baris Tengah: Total Saldo Kas Organisasi (teks besar tebal) + Donut chart alokasi pengeluaran[.
  - **2 Kotak Kepatuhan Angkatan (Grid 2 Kolom):**
    - Kotak Kiri: Gen 20 (Kelas 11) -> Persentase kepatuhan kas kelas 11.
    - Kotak Kanan: Gen 21 (Kelas 10) -> Persentase kepatuhan kas kelas 10.
- **Agenda Acara Terdekat:** Kartu horizontal hitung mundur hari (_D-3 Seminar Robotika_)[.
- **Podium Apresiasi Kontributor (2 - 1 - 3 Layout):**[
  - Pilar Kiri (Perak): Peringkat 2, tinggi `h-36`, badge perak 🥈[.
  - Pilar Tengah (Emas): Peringkat 1, tinggi `h-44`, warna Merah Saba aksen emas 🥇, avatar lebih besar[.
  - Pilar Kanan (Perunggu): Peringkat 3, tinggi `h-28`, badge perunggu 🥉[.
  - Label: _"Di-reset setiap awal bulan"_[.
- **Banner Notulensi Belum Dibaca:** Otomatis muncul jika anggota izin/alpa pada rapat pleno terakhir[.

---

### 2.2. Halaman Khusus: Panel Pembukuan Kas (`/kas/kelola`)

- **Akses Terbatas:** Hanya peran `BENDAHARA`, `ADMIN`, dan `OPERATOR`[.
- **Filter Default Angkatan:**
  - Bendahara Kelas 10 membuka halaman -> Otomatis terfilter siswa **Kelas 10**.
  - Bendahara Kelas 11 membuka halaman -> Otomatis terfilter siswa **Kelas 11**.
  - Disediakan tombol toggle untuk melihat kelas lain atau semua anggota[.
- **Matriks Kas:** Grid tabel status Lunas (Hijau) / Nunggak (Merah) per 2 minggu[.
- **Modal Catat Pembayaran (Advance Payment):** Input nominal setoran (Rp50.000 otomatis melunasi 10 periode)[.
- **Modal Pengeluaran:** Input nominal, kategori pengeluaran, dan URL Google Drive bukti nota[.

---

### 2.3. Tab 2: Acara (`/events` & `/events/[id`)

- **Halaman Induk (`/events`):**
  - **Kalender Jalur Mengular (Gaya Duolingo):** Jalur tanggal vertikal berliku per bulan[.
  - Titik tanggal biasa berwarna abu-abu netral[.
  - Titik tanggal yang memiliki kegiatan membesar dengan warna Merah Saba dan ikon bintang/kalender[.
  - Selector bulan di atas: `[ <  November 2026 [ >`.
- **Workspace Acara Ad-Hoc (`/events/[id`):**[
  - Tombol Google Drive utama acara (Hijau-Kuning)[.
  - Accordion Seksi Ad-Hoc (Kesekretariatan, Acara, Humas, Konsumsi)[.
  - Task checklist dengan label ungu "SOP Otomatis" dan tombol verifikasi poin emas bagi ketua acara[.
  - **Tab Terintegrasi: Notulensi Acara:** Catatan rapat koordinasi/gladi bersih khusus acara ini[.

---

### 2.4. Tab 3: Showcase Karya (`/showcase`)

- Filter 5 Divisi Utama (_Programming, Design, Photography, Cinematography, Technopreneurship_)[.
- Kartu Karya Feed 1 Kolom (Thumbnail 16:9, lencana divisi, atribusi kontributor, tombol eksternal GitHub/Figma/Drive/YouTube)[.
- Tombol `+ Pamerkan Karya` untuk mengajukan proyek baru[.

---

### 2.5. Tab 4: Arsip & Belajar (`/arsip`)

- Katalog Modul Pembelajaran per divisi yang mengarah ke tautan Google Drive resmi[.
- Repositori Template Dokumen (Proposal kegiatan, surat izin resmi sarpras/sekolah)[.
- Pusat Aset Brand Saba ExploIT (Logo vektor SVG, color palette, panduan visual)[.

---

### 2.6. Tab 5: Suara & Komunitas (`/suara`)

- **Kotak Suara (Segmented 3 Tab):**
  1. _Evaluasi Umum (Publik):_ Masukan acara/organisasi, opsi anonim/bernama, feed publik terbuka[.
  2. _Evaluasi Personal (Privat 1-on-1):_ Masukan antardua anggota, wajib bernama (tidak boleh anonim), hanya dibaca pengirim dan penerima[.
  3. _Lapor ke Operator:_ Tiket pengembang untuk pelaporan bug sistem dan usulan fitur baru langsung ke Operator[.
- **Polling Multi-Format:**
  - Diagram batang persentase langsung muncul di bagian atas setelah memilih[.
  - Mendukung pilihan tunggal (_radio_) atau banyak (_checkbox_), serta pemilih transparan/anonim[.

---
