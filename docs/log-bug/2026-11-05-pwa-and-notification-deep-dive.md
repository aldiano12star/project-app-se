# [PWA & NOTIF] Phase 10: Ultimate PWA Polish & Web Push Notification Deep-Dive

- **Tanggal**: 2026-11-05
- **Komponen / Fitur Terdampak**: `src/proxy.ts`, `src/app/api/web-push/route.ts`, `src/lib/pwa-utils.ts`, `src/lib/web-push.ts`, `src/actions/kas.ts`, `src/components/pengaturan/NotificationSettingsCard.tsx`, `src/components/kas/TreasurerPanel.tsx`, `src/components/layout/SplashScreen.tsx`, `public/manifest.json`, `src/app/manifest.ts`, `src/app/layout.tsx`, `public/sw.js`
- **Tingkat Keparahan**: Kritis (Fitur Inti PWA & Notifikasi)
- **Status**: SELESAI

---

### 1. Gejala & Deskripsi Masalah
1. **Layout Tombol Bendahara Tidak Presisi**: Tombol aksi finansial di `TreasurerPanel` sebelumnya tersusun dalam flex wrap yang tidak simetris dan pecah di tampilan mobile.
2. **Error Kunci VAPID di Client**: UI memunculkan error *"Kunci VAPID belum dikonfigurasi di server."* padahal variabel `.env` sudah terisi lengkap.
3. **Infinite Loading Aktivasi Notifikasi**: Tombol *"Aktifkan Notifikasi di Perangkat Ini"* sering macet pada status *"Menghubungkan ke Server Push..."* tanpa henti.
4. **Trigger Event Nyata Gagal**: Notifikasi uji manual berfungsi secara lokal di browser, namun aksi server nyata (seperti penerbitan tagihan serentak atau rapat) tidak pernah mengirimkan Web Push ke perangkat anggota karena tabel langganan kosong dan trigger belum terpasang di aksi kas.
5. **Transisi Splash Screen & Ikon**: PWA membutuhkan splash screen beranimasi halus saat aplikasi pertama kali dimuat di layar penuh serta standarisasi app icon.

---

### 2. Akar Masalah (Root Cause)
1. **Proxy Redirection Interception**: Di `src/proxy.ts`, rute API `/api/web-push` tidak terdaftar dalam whitelist halaman publik. Akibatnya, request `GET /api/web-push` dari client dialihkan (HTTP 307) ke `/login`, sehingga respons berupa HTML bukan JSON. `res.json()` memicu `SyntaxError`, fallback VAPID key gagal, dan client menampilkan pesan kunci belum dikonfigurasi.
2. **Promise Deadlock pada Service Worker**: Spesifikasi browser W3C untuk `navigator.serviceWorker.ready` mengembalikan Promise yang **tidak pernah me-reject**. Jika Service Worker tertunda atau belum aktif, pemanggilan `await navigator.serviceWorker.ready` menggantung selamanya (*infinite hang*).
3. **Missing Web Push Trigger di `createBulkBills`**: `src/actions/kas.ts` hanya menyimpan notifikasi database internal tanpa memanggil `broadcastNotification` dari `@/lib/web-push`.
4. **Ilusi Uji Lokal**: Tombol manual *"Uji Notifikasi"* memanggil API Notification lokal browser langsung, bukan Web Push berbasis server.

---

### 3. Solusi & Perbaikan
1. **`src/proxy.ts`**: Menambahkan `pathname.startsWith("/api/web-push")` ke dalam kondisi `isPublicPage` agar public key VAPID dapat diambil secara andal oleh client/worker.
2. **`src/app/api/web-push/route.ts`**: Menambahkan `export const dynamic = "force-dynamic"` serta fallback pembacaan environment variable `NEXT_PUBLIC_VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY`.
3. **`src/lib/pwa-utils.ts`**:
   - Mengimplementasikan helper `withTimeout` untuk membungkus `navigator.serviceWorker.ready` dengan batas waktu aman (8 detik).
   - Menambahkan mekanisme rotasi/pembaruan langganan push jika kunci VAPID berbeda dengan langganan lama.
4. **`src/components/pengaturan/NotificationSettingsCard.tsx`**: Menambahkan safety timeout pada `handleRequestPermission` untuk menjamin state loading selalu di-reset.
5. **`src/actions/kas.ts`**: Mengintegrasikan `broadcastNotification` pada `createBulkBills` dan `sendNotificationToUser` pada `recordDeposit`.
6. **`src/lib/web-push.ts`**: Membuat inisialisasi dinamis `ensureVapidConfiguration()` saat runtime.
7. **`src/components/kas/TreasurerPanel.tsx`**: Menata ulang layout tombol sesuai wireframe (baris atas grid 2-kolom equal width untuk "Catat Setoran" dan "Tarik Tagihan", baris bawah full-width untuk "Danus / Operasional").
8. **`src/components/layout/SplashScreen.tsx`**: Membuat komponen custom splash screen layar penuh dengan animasi ambient glow, logo scaling pulse, dan progress bar elegan (fade out 1.5 - 2 detik).
9. **`public/manifest.json` & `src/app/manifest.ts` & `src/app/layout.tsx`**: Menyelaraskan seluruh ikon PWA dan apple-touch-icon ke `/logo.png`.

---

### 4. Verifikasi
- `npx tsc --noEmit`: Berhasil tanpa error tipe data TypeScript.
- `npm run build`: Kompilasi Turbopack Next.js 16 berhasil dengan kode keluar 0 (`exit code 0`).
