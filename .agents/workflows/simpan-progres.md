# 💾 Workflow: Simpan Progres Sebelum Ganti Akun / Selesai Sesi

Gunakan alur kerja ini saat sesi mendekati batas kuota/token, sebelum berganti akun, atau saat mengakhiri sesi pengerjaan.

---

## 📋 Langkah-Langkah Wajib Bagi Agen:

### 1. Periksa Status Berkas & Perubahan Git
Jalankan perintah berikut untuk menginventarisasi seluruh pekerjaan yang telah dilakukan:
```bash
git status
git diff --stat
```
Pastikan kamu mengetahui persis berkas mana saja yang baru dibuat, dimodifikasi, atau dihapus.

### 2. Verifikasi Integritas Kode (Kompilasi & Test)
Pastikan kode yang ditinggalkan dalam kondisi stabil (tidak *broken*):
```bash
# 1. Pastikan TypeScript & Turbopack build lulus
npm run build

# 2. Jalankan unit test jika menyentuh logika krusial
npx tsx --test tests/unit/academic-year.test.ts tests/unit/drive-parser.test.ts
```
Jika ada error, perbaiki terlebih dahulu sebelum mencatat progres.

### 3. Perbarui `docs/HANDOFF.md`
Buka dan mutakhirkan file [docs/HANDOFF.md](file:///home/fauzan/Documents/PELAJARAN/Belajar Coding/se_app/docs/HANDOFF.md):
- **Status Fase Terkini**: Tandai sub-fase atau fitur yang baru saja tuntas (misal: "Fase 1: Tokens globals.css & splash screen tuntas").
- **Catatan Masalah / Bug Tertunda**: Catat jika ada kendala spesifik, bug layout, atau dependensi yang belum selesai diperbaiki.
- **Instruksi Tindakan Berikutnya**: Tuliskan secara eksplisit **1-3 langkah pertama** yang harus langsung dieksekusi oleh agen berikutnya.

### 4. Bersihkan File Sampah & Logging Sementara
Pastikan tidak meninggalkan file proses di latar belakang (*background tasks*), screenshot sementara di luar direktori, atau file log yang tidak perlu.

### 5. Laporkan ke Pengguna
Beri tahu pengguna bahwa progres telah tersimpan aman di `docs/HANDOFF.md` dan proyek siap dilanjutkan oleh akun/sesi berikutnya.
