# [PWA & NOTIF] Resolusi Konfigurasi VAPID Production & Aktivasi Web Push PWA

- **Tanggal**: 2026-11-06
- **Komponen / Fitur Terdampak**: Vercel Environment Variables, `src/app/api/web-push/route.ts`, `src/lib/pwa-utils.ts`, `src/lib/web-push.ts`, PWA Web Push Notification
- **Tingkat Keparahan**: Kritis (Fitur Notifikasi Terblokir di Production)
- **Status**: SELESAI (Terverifikasi di Production)

---

### 1. Gejala & Deskripsi Masalah
1. Saat pengguna membuka halaman pengaturan di domain produksi (`https://project-app-se.vercel.app/pengaturan`) dan menekan tombol **"Aktifkan Notifikasi di Perangkat Ini"**, antarmuka menampilkan pesan error:
   ```text
   Kunci VAPID belum dikonfigurasi di server.
   ```
2. Pengguna menduga pesan ini adalah error generik/placeholder sistem, namun sebenarnya merupakan validasi spesifik gerbang awal `subscribeToPush()` di `src/lib/pwa-utils.ts`.

---

### 2. Akar Masalah (Root Cause)
1. **Unsynchronized Environment Variables**: Kunci VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, dan `VAPID_SUBJECT`) sebelumnya baru terkonfigurasi di berkas `.env` lokal pengembang. Karena `.env*` masuk dalam `.gitignore`, variabel tersebut tidak pernah terunggah ke repository maupun dashboard Vercel.
2. **Empty VAPID Response on Production**:
   - Selama proses build di Vercel, compiler Next.js tidak menemukan `NEXT_PUBLIC_VAPID_PUBLIC_KEY` sehingga meng-inline nilai `undefined` ke bundel JavaScript client.
   - Mekanisme fallback `GET /api/web-push` yang dipanggil client mengembalikan JSON:
     ```json
     {"publicKey":"","configured":false}
     ```
   - Akibatnya, `vapidPublicKey` bernilai hampa/falsy, sehingga proses langsung dihentikan sebelum browser sempat meminta izin notifikasi atau mendaftarkan subscription ke Push Manager.

---

### 3. Solusi & Perbaikan yang Diterapkan
1. **Injeksi Variabel Lingkungan ke Vercel**:
   Menyuntikkan 3 variabel VAPID resmi ke proyek Vercel (`project-app-se`, Team: `team_sLyzo0YKEmb6kTO8bBWAPDme`) untuk target `Production` dan `Preview`:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: String kurva eliptik P-256 base64url (tipe: `plain`)
   - `VAPID_PRIVATE_KEY`: Secret key 32-byte untuk penandatanganan payload push server (tipe: `sensitive`)
   - `VAPID_SUBJECT`: `mailto:admin@sabaexploit.org` (tipe: `plain`)
2. **Redeploy Produksi**:
   Memicu pembangunan ulang (*redeploy*) pada commit terbaru (`7e3d814`) dengan ID deployment `dpl_Fn9NitwX27k3RMwpHwt9gqKjH15Z`.
3. **Aliasing Domain**:
   Memastikan domain utama `project-app-se.vercel.app` terarah secara penuh ke deployment baru yang telah meng-inline kunci VAPID.

---

### 4. Langkah Verifikasi
1. **Live HTTP Endpoint Verification**:
   ```bash
   curl -s https://project-app-se.vercel.app/api/web-push
   ```
   **Hasil**:
   ```json
   {"publicKey":"BObvqsTNmZh-W_23CVpvsYvp5sPbUGzix5Ek7Z3r3TtLvRwRxG5tUkSXGLhlKZ8GEkaLkrXGWClKoZ_qPvuMuZ0","configured":true}
   ```
2. **Status Layanan**:
   - Endpoint sekarang mengembalikan status `configured: true` dengan public key yang cocok dengan kurva P-256 uncompressed (65 byte).
   - Client PWA pada perangkat anggota kini dapat langsung melakukan handshake dengan Push Manager browser dan menyimpan token ke tabel `PushSubscription` di database Neon.
