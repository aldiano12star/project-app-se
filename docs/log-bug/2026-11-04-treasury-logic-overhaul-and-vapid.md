# [BUG] Overhaul Logika Akuntansi Kas (Eliminasi Double Entry) & Client VAPID Key Debugging

- **Tanggal**: 2026-11-04
- **Komponen / Fitur Terdampak**: `src/actions/invoice.ts`, `src/components/kas/InvoiceListCard.tsx`, `src/components/kas/InvoiceTrackerSection.tsx`, `src/components/kas/DigitalWalletCard.tsx`, `src/components/kas/PublicCashLedger.tsx`, `src/app/kas/page.tsx`, `src/lib/pwa-utils.ts`, `src/app/api/web-push/route.ts`
- **Tingkat Keparahan**: Kritis
- **Status**: SELESAI

### 1. Gejala & Deskripsi Masalah
1. **Ghost Money / Double Entry**: Ketika anggota melunasi tagihan menggunakan saldo dompetnya (`kasBalance`), aksi server sebelumnya menyuntikkan nominal tersebut kembali sebagai transaksi `INCOME` ke dalam `LedgerTransaction` (Buku Kas Publik), sehingga kas organisasi seolah-olah mendapat uang baru berlipat ganda.
2. **Insufficient Balance Settle**: Anggota dan bendahara dapat menekan tombol "Lunaskan" meskipun saldo dompet anggota kurang dari nominal tagihan, yang menyebabkan sistem memalsukan setoran tunai darurat secara otomatis.
3. **Ergonomi UI Kas**: Panel "Aksi Finansial Bendahara" terkubur di bagian paling bawah halaman, menyulitkan bendahara saat mencatat setoran kilat. Daftar buku kas publik juga merender daftar transaksi panjang yang membebani tampilan.
4. **VAPID Key Undefined Client-side**: Pada browser pengguna tertentu, `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY` tidak ter-inline dengan baik oleh compiler atau cache bundling, memunculkan alert "Kunci VAPID belum dikonfigurasi di server".

### 2. Akar Masalah (Root Cause)
1. Pada `quickSettleInvoice` di `src/actions/invoice.ts`, terdapat blok kode yang menghitung `missingAmount` dan secara otomatis membuat `tx.ledgerTransaction.create({ type: TransactionType.INCOME, category: TransactionCategory.SETORAN_MEMBER, amount: missingAmount })`. Ini menyebabkan uang fiktif dicatat ke kas fisik.
2. Pada `payInvoiceWithWallet` & `quickSettleInvoice`, validasi saldo tidak mengunci eksekusi secara absolut, dan tombol "Lunaskan" di UI tidak memperhitungkan saldo vs nominal tagihan dengan status disabled yang jelas.
3. Di `src/lib/pwa-utils.ts`, akses env variable hanya mengandalkan inlining statis tanpa mekanisme fetch fallback ke endpoint runtime server.

### 3. Solusi & Perubahan Kode
1. **`src/actions/invoice.ts`**:
   - Membersihkan `quickSettleInvoice` dari pembuatan entri `INCOME` otomatis. Pelunasan tagihan kini murni mutasi internal (`BILL_DEDUCTION` + pemotongan `kasBalance` atomik).
   - Menambahkan pengamanan saldo ketat: jika saldo anggota kurang dari nominal tagihan, transaksi dibatalkan dengan pesan informatif agar bendahara mencatat uang riil terlebih dahulu via "Catat Setoran".
   - Membuka akses `payInvoiceWithWallet` bagi pemilik tagihan untuk pelunasan mandiri via saldo dompet.
2. **`src/components/kas/InvoiceListCard.tsx`**:
   - Menambahkan tombol "Lunaskan" mandiri jika `userKasBalance >= inv.amount`.
   - Mengubah menjadi tombol nonaktif bertuliskan "Saldo Kurang" jika saldo tidak mencukupi.
3. **`src/components/kas/InvoiceTrackerSection.tsx`**:
   - Pada baris anggota, jika saldo kurang dari nominal tagihan, tombol "Lunaskan" diubah menjadi status disabled bertuliskan "Saldo Kurang".
4. **`src/components/kas/DigitalWalletCard.tsx`**:
   - Mengubah label "Saldo Titipan Kas" menjadi "Dompet Saya".
5. **`src/app/kas/page.tsx`**:
   - Memindahkan `TreasurerPanel` ke bagian paling atas halaman kas (tepat di bawah header seksi kas).
6. **`src/components/kas/PublicCashLedger.tsx`**:
   - Membatasi transaksi awal yang dirender sebanyak maksimal 15 item dengan kontainer `max-h-[400px] overflow-y-auto`.
7. **`src/app/api/web-push/route.ts` & `src/lib/pwa-utils.ts`**:
   - Menyediakan handler `GET /api/web-push` untuk mengirimkan public VAPID key.
   - Menambahkan fallback fetch dinamis di `subscribeToPush()` jika env client kosong saat hydration.

### 4. Langkah Verifikasi
- Menjalankan `npx tsc --noEmit` dan `npm run build`: Berhasil tanpa error tipe data maupun regresi bundler.
- Memastikan aliran data pelunasan kas hanya mencatat transaksi berkategori `BILL_DEDUCTION`, sehingga uang riil di `PublicLedger` tetap akurat dan terhindar dari inflasi saldo fiktif.
