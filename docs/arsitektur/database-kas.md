# 💰 Arsitektur Database Sistem Kas Dinamis

Dokumen ini mendokumentasikan model data, alur bisnis, dan aturan pengelolaan sistem keuangan serta tagihan kas dinamis pada aplikasi Saba ExploIT.

---

## 1. Konsep Utama & Relasi Prisma

Sistem kas modern menggunakan pendekatan berbasis *Event-Driven Billing* yang dipisahkan menjadi dua model utama dalam `prisma/schema.prisma`:

1. **`BillingEvent`** (Induk Tagihan / Acara Kas):
   - Merepresentasikan jenis pungutan dana dengan target tertentu.
   - Kolom kunci:
     - `title`: Nama agenda (misal: *"Kas Rutin Bulan Oktober"* atau *"Urunan Jaket Angkatan"*).
     - `type`: Enum `BillingType` (`KAS_RUTIN` atau `URUNAN`).
     - `amount`: Nominal tagihan per anggota (Rp).
     - `dueDate`: Batas waktu penyetoran dana.
     - `isActive`: Status apakah tagihan masih aktif atau sudah ditutup.
     - `targetUsers`: Relasi many-to-many `User[]` (`@relation("BillingTargets")`).
     - `academicYearId`: Mengikat tagihan ke periode tahun ajaran aktif.

2. **`BillingPayment`** (Catatan Pembayaran Anggota):
   - Mencatat transaksi riil pelunasan dari masing-masing anggota.
   - Kolom kunci:
     - `billingEventId`: Rujukan ke event tagihan.
     - `userId`: Anggota yang membayar.
     - `amountPaid`: Nominal yang dibayarkan.
     - `paidAt`: Timestamp waktu pembayaran disetujui.
     - `recordedBy`: ID user petugas bendahara/operator yang memvalidasi dana.
     - `proofUrl`: Bukti transfer/struk (opsional).
   - Memiliki batasan unik: `@@unique([billingEventId, userId])` sehingga satu anggota hanya memiliki satu status penyelesaian per event tagihan.

---

## 2. Klasifikasi Tipe Tagihan (`BillingType`)

### A. `KAS_RUTIN` (Global / Anggota Aktif)
- **Cakupan**: Otomatis dibebankan ke **seluruh anggota aktif** organisasi tanpa perlu mendaftarkan target satu per satu.
- **Tujuan**: Iuran wajib berkala (bulanan/mingguan) untuk operasional kas umum.
- **Logika Penagihan**: Di UI maupun server action, jika `type === 'KAS_RUTIN'`, daftar tagihan dihasilkan dengan memeriksa seluruh user aktif yang belum memiliki `BillingPayment` terkait.

### B. `URUNAN` (Insidental / Segmented)
- **Cakupan**: Hanya dibebankan ke **anggota tertentu yang dipilih** via multi-select selector (`targetUsers`).
- **Tujuan**: Pengadaan proyek divisi khusus, biaya partisipasi lomba tertentu, konsumsi rapat panitia proker, atau jaket angkatan.
- **Logika Penagihan**: Hanya user yang terdaftar dalam relasi `targetUsers` yang akan melihat tagihan ini di dashboard pribadi mereka.

---

## 3. Integrasi ke Buku Kas Publik (`CashTransaction`)

Selain penagihan personal via `BillingEvent` & `BillingPayment`, pemasukan yang terkumpul atau pengeluaran operasional dicatat ke dalam buku kas umum (`CashTransaction`):
- Pemasukan kas ditandai dengan tipe `INCOME`.
- Pengeluaran operasional ditandai dengan tipe `EXPENSE` disertai lampiran nota/kuitansi (`receiptUrl`).
- Saldo kas dihitung secara agregat (`SUM(INCOME) - SUM(EXPENSE)`) untuk transparansi publik pada rute `/kas`.
