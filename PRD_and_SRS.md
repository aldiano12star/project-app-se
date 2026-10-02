# PRD_and_SRS.md (Product Requirements & Software Requirements Specification)

## 1. Meta Information

- **Nama Produk:** Super App Organisasi Saba ExploIT
- **Dokumen Status:** Approved / Production Baseline[]
- **Product Manager / Owner:** Fauzan Arif Aldiano[]
- **Tim Teknis (Tech Lead):** Claude Code / Cursor Agentic Workflow[]
- **Target Rilis:** Q4 2026[]
- **Arsitektur Biaya:** Zero-Cost Architecture (100% Free-Tier Neon & Vercel)[]

---

## 2. Executive Summary

- **Visi Produk:** Menjadi pusat kendali digital mandiri biaya yang transparan, aman dari perundungan finansial, terstruktur dalam manajemen kepanitiaan, serta menjadi sarana transfer pengetahuan (_knowledge transfer_) antargenerasi di Saba ExploIT[].
- **Problem Statement:**
  1. **Privasi & Transparansi Kas:** Matriks pembayaran anggota tidak boleh dibuka ke publik untuk mencegah _social shaming_, namun transparansi total saldo kas organisasi dan perbandingan kepatuhan angkatan tetap wajib ditampilkan[].
  2. **Kecurangan Presensi:** Kode angka rentan dibagikan via grup chat saat rapat[]; presensi membutuhkan verifikasi fisik berbasis QR Code di layar proyektor[].
  3. **Persiapan Acara Terlambat:** Ketiadaan alur persiapan baku diselesaikan dengan kalender jalur visual bulanan dan injeksi otomatis SOP[].
  4. **Saluran Evaluasi Tidak Tepat Sasaran:** Kritik personal, masukan umum, dan laporan kendala teknis aplikasi sering tercampur aduk di grup WhatsApp[].
- **Target Audience & Roles:**
  - **Operator (System Developer):** Pengembang aplikasi dengan hak akses sistem penuh (_god-mode bypass_) untuk _debugging_, namun berstatus sosial setara anggota di antarmuka publik[].
  - **Admin (Ketua & BPH Inti):** Pemilik kendali organisasi, kurasi karya, dan penutupan tahun ajaran[].
  - **Bendahara (2 Orang: Bendahara Kelas 10 & Bendahara Kelas 11):** Pengelola tunggal mutasi keuangan dan verifikasi setoran kas di panel khusus[].
  - **Anggota Aktif (Kelas 10 & 11):** Kolaborator kepanitiaan, presensi QR, kas pribadi, galeri karya, dan aspirasi[].
  - **Demisioner (Kelas 12 ke Atas):** Akses baca-saja (_read-only_) untuk arsip dan pembinaan[].

---

## 3. Scope & Architecture Constraints

### 3.1. In-Scope

- Autentikasi Google OAuth dengan verifikasi _whitelist_ email[].
- Navigasi 5 Tab Bawah: Beranda, Acara, Showcase, Arsip & Belajar, dan Suara[].
- Beranda Terpadu: Presensi Scanner QR[], Status Kas Pribadi[], Transparansi Kas Umum[], 2 Kotak Kepatuhan Kas per-Gen (Kelas 10 vs 11), Agenda Terdekat[], dan Podium Top 3 (2-1-3)[].
- Panel Pembukuan Kas Terisolasi (`/kas/kelola`): Hanya untuk Bendahara, Admin, dan Operator dengan filter default per angkatan[].
- Kalender Acara Mengular (Gaya Duolingo per Bulan) & Workspace Acara Ad-Hoc dengan Injeksi SOP serta Notulensi Acara[].
- Showcase Karya (Filter 5 Divisi, atribusi multi-kontributor, tautan eksternal Drive/GitHub/Figma/YouTube)[].
- Pusat Arsip & Modul Belajar (Kurasi tautan Google Drive untuk modul divisi dan template surat)[].
- Kotak Suara 3 Saluran (Publik, Privat 1-on-1 Wajib Bernama, Lapor Operator) dan Polling Multi-Format[].

### 3.2. Out-of-Scope

- Modul peminjaman inventaris/alat[].
- Chat pesan instan real-time (tetap melalui WhatsApp)[].
- Penyimpanan media fisik di database internal (beban media fisik 0 Byte, dialihkan ke tautan eksternal)[].

---

## 4. User Roles & Access Rights (RBAC)

| Modul / Rute                  |    ANGGOTA    |   BENDAHARA   |       ADMIN       |      OPERATOR      |  DEMISIONER   |
| ----------------------------- | :-----------: | :-----------: | :---------------: | :----------------: | :-----------: |
| **Beranda & Kas Personal**    |    View[]     |    View[]     |      View[]       |       View[]       |  Read-Only[]  |
| **Panel Kas (`/kas/kelola`)** |  Terblokir[]  | CRUD Penuh[]  |   CRUD Penuh[]    |   Full Bypass[]    |  Terblokir[]  |
| **Workspace Acara & Tugas**   | Kolaborasi[]  | Kolaborasi[]  | Verifikasi Poin[] |   Full Bypass[]    |  Read-Only[]  |
| **Presensi QR & Notulensi**   | Scan & Baca[] | Scan & Baca[] |  Buka Sesi QR[]   |   Full Bypass[]    |  Read-Only[]  |
| **Showcase Karya**            |   Unggah[]    |   Unggah[]    |  Moderasi/Pin[]   |   Full Bypass[]    |  Read-Only[]  |
| **Kotak Suara (3 Saluran)**   | Kirim Pesan[] | Kirim Pesan[] |   Baca Publik[]   | Terima Tiket Dev[] | Baca Publik[] |
| **Tutup Buku Tahunan**        |  Terblokir[]  |  Terblokir[]  |    Eksekusi[]     |   Full Bypass[]    |  Terblokir[]  |

---

## 5. Functional Requirements & User Stories

### 5.1. Presensi Rapat Fisik Berbasis QR Code

- **User Story:** Sebagai pengurus, saya ingin presensi hanya bisa dilakukan oleh anggota yang hadir secara fisik di ruangan rapat[].
- **Kriteria Diterima:**
  1. Pengurus membuka rapat -> Sistem menampilkan QR Code dinamis di layar proyektor[].
  2. Anggota membuka widget Beranda -> Klik tombol `[ Pindai QR Rapat ]` -> Kamera web menyala dan membaca kode QR[].
  3. Presensi sukses memberikan +10 Poin dan mencatat kehadiran tanpa celah titip absen dari rumah[].
  4. Sekretaris tetap memiliki panel saklar manual (Hadir/Izin/Sakit/Alpa) untuk antisipasi gawai rusak[].

### 5.2. Keuangan, Privasi Kas & 2 Kotak Angkatan

- **User Story (Anggota):** Sebagai anggota biasa, saya ingin melihat kejelasan uang kas pribadi saya dan transparansi kas umum tanpa dipermalukan di depan orang lain[].
- **Kriteria Diterima:**
  1. Anggota HANYA bisa melihat status kas miliknya sendiri di Beranda (contoh: _Lunas s/d Periode 12_ atau _Nunggak Rp10.000_)[].
  2. Matriks daftar nama seluruh anggota DIHAPUS dari pandangan anggota biasa[].
  3. Di bawah total saldo organisasi, ditampilkan 2 Kotak Kepatuhan Kas:
     - Kotak Gen 20 (Kelas 11): Persentase pelunasan kas angkatan kelas 11.
     - Kotak Gen 21 (Kelas 10): Persentase pelunasan kas angkatan kelas 10.
- **User Story (Bendahara):** Sebagai bendahara, saya ingin mengelola kas seluruh anggota di panel khusus[].
- **Kriteria Diterima:**
  1. Bendahara mengakses `/kas/kelola` melalui kartu tombol aksi di Beranda[].
  2. Bendahara Kelas 10 secara default disajikan filter data siswa Kelas 10, dan Bendahara Kelas 11 disajikan data Kelas 11 (dapat diganti fleksibel).
  3. Fitur _Advance Payment_: Input setoran Rp50.000 otomatis melunasi 10 periode kas berurutan (@ Rp5.000)[].

### 5.3. Acara, Kalender Mengular & Notulensi

- **User Story:** Sebagai panitia, saya ingin melihat alur tanggal acara bulanan yang interaktif dan workspace kerja lengkap dengan notulensi acara[].
- **Kriteria Diterima:**
  1. Halaman `/events` menampilkan kalender jalur mengular vertikal per bulan (_Duolingo-style snaking pathway_)[].
  2. Mengetuk tanggal berikon bintang/acara langsung membuka Workspace Acara Ad-Hoc (`/events/[id]`)[].
  3. Workspace memuat tautan folder Google Drive utama, daftar seksi ad-hoc, daftar tugas terinjeksi SOP, dan lembar **Notulensi Acara** terintegrasi[].

### 5.4. Leaderboard Podium (2 - 1 - 3) & Gamifikasi

- **User Story:** Sebagai anggota aktif, saya ingin melihat apresiasi kontributor dalam bentuk podium yang memotivasi[].
- **Kriteria Diterima:**
  1. Beranda menampilkan podium sejajar 3 pilar: Peringkat 2 Perak di kiri (tinggi sedang), Peringkat 1 Emas di tengah (paling tinggi), Peringkat 3 Perunggu di kanan (paling rendah)[].
  2. Skor perolehan poin: Presensi QR (+10), Lunas Kas per siklus (+10), Tugas Selesai Terverifikasi (+15), Publikasi Karya (+20), Baca Notulensi (+5)[].
  3. **Dual-Layer Reset:** Papan podium Top 3 di-reset setiap awal bulan, sedangkan akumulasi `User.totalPoints` disimpan tahunan di profil akun[].

### 5.5. Kotak Suara 3 Saluran & Polling Multi-Format

- **User Story:** Sebagai anggota, saya ingin menyampaikan aspirasi ke saluran yang tepat dan mengikuti voting interaktif[].
- **Kriteria Diterima:**
  1. Formulir Suara terbagi menjadi 3 saluran:
     - _Saluran Publik:_ Evaluasi umum organisasi/acara (Opsi Anonim atau Bernama)[].
     - _Saluran Privat 1-on-1:_ Masukan personal antardua anggota (Wajib Bernama & Wajib Pilih Penerima)[].
     - _Saluran Tiket Operator:_ Laporan kendala sistem/bug dan usulan fitur langsung ke pengembang aplikasi[].
  2. Polling mendukung konfigurasi: Pilihan Tunggal (_Single Choice_) atau Banyak (_Multiple Choice_), serta status Pemilih Anonim atau Terbuka[].
  3. Diagram batang persentase hasil suara langsung tampil di bagian atas kartu setelah anggota memberikan suara[].

---
