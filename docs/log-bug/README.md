# 🐛 Log Bug & Investigasi Masalah

Folder ini digunakan untuk mencatat riwayat kutu (*bug*), investigasi akar masalah (*root cause*), dan resolusi teknis pada aplikasi Saba ExploIT.

---

## Format Catatan Bug Baru

Saat menemukan dan menyelesaikan bug, buat file baru dengan format tanggal dan nama ringkas: `docs/log-bug/YYYY-MM-DD-judul-bug.md` dengan struktur berikut:

```markdown
# [BUG] Judul Masalah Singkat

- **Tanggal**: YYYY-MM-DD
- **Komponen / Fitur Terdampak**: (misal: `src/components/kas/TreasurerPanel.tsx`)
- **Tingkat Keparahan**: Rendah / Sedang / Kritis
- **Status**: [SELESAI / DALAM PENYELIDIKAN]

### 1. Gejala & Deskripsi Masalah
Jelaskan apa yang terjadi, pesan error yang muncul, atau perilaku UI/backend yang aneh.

### 2. Akar Masalah (Root Cause)
Jelaskan mengapa masalah tersebut terjadi berdasarkan temuan kode.

### 3. Solusi & Perubahan Kode
Rincian perbaikan kode atau file yang diubah untuk mengatasi masalah.

### 4. Langkah Verifikasi
Bagaimana cara memastikan bug tersebut telah tuntas dan tidak menyebabkan regresi.
```
