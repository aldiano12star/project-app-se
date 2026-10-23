# 📱 Standar Progressive Web App (PWA) Saba ExploIT

Dokumen ini mendokumentasikan implementasi arsitektur PWA, Service Worker, strategi *caching*, dan penanganan *offline mode* di aplikasi Saba ExploIT.

---

## 1. Arsitektur Service Worker (`public/sw.js`)

Aplikasi ini menggunakan **Vanilla Service Worker** murni tanpa library pihak ketiga (seperti `next-pwa` atau Workbox) guna meminimalkan ukuran bundle JavaScript, menjaga kontrol penuh siklus hidup, dan menghindari konflik dengan Next.js App Router (Turbopack).

### Siklus Hidup (*Lifecycle*):
1. **`install`**:
   - Membuka cache storage (misal: `saba-exploit-v2`).
   - Melakukan precache halaman penting: `['/', '/offline.html']`.
   - Mengaktifkan `self.skipWaiting()` agar worker baru langsung siap digunakan.
2. **`activate`**:
   - Memindai seluruh key cache di browser.
   - Menghapus otomatis cache versi lama yang tidak cocok dengan `CACHE_NAME` terbaru.
   - Menjalankan `self.clients.claim()` untuk mengontrol tab/klien yang sedang terbuka secara instan.
3. **`fetch`**:
   - Menggunakan strategi **Network-First** (prioritas jaringan utama).
   - Mengabaikan request selain metode `GET`.
   - Melewati rute dinamis `/api/*` agar transaksi data, presensi, dan otentikasi selalu *real-time* ke server.

---

## 2. Strategi Network-First & Halaman Fallback Offline

- **Alur Permintaan**:
  1. Browser mencoba melakukan `fetch(event.request)` ke server.
  2. Jika berhasil (status 200), salinan respons disimpan/diperbarui ke dalam cache (`cache.put`).
  3. Jika jaringan putus atau gagal (*catch*), Service Worker mencari respons di cache lokal (`caches.match`).
  4. Jika rute berupa navigasi halaman (`mode === 'navigate'`) dan tidak ada di cache, Service Worker mengembalikan halaman ramah offline:
     👉 **`/offline.html`** (`public/offline.html`).

---

## 3. Standar Ikon & Manifest Aplikasi

Seluruh aset PWA disimpan terpusat di folder `public/icons/`:
- `public/icons/icon-192.png` (Resolusi standar Android home screen)
- `public/icons/icon-512.png` (Resolusi splash screen & store preview)
- `public/icons/maskable-icon-512.png` (Adaptive icon dengan safe zone melingkar/persegi)
- `public/icons/apple-touch-icon.png` (Khusus perangkat iOS Safari)

### Konfigurasi Web App Manifest (`src/app/manifest.ts`):
- `display: 'standalone'` (Memberikan pengalaman aplikasi native layar penuh tanpa address bar browser).
- `start_url: '/dashboard'`
- `theme_color: '#0B0F19'` / `background_color: '#0B0F19'`
- `scope: '/'`

---

## 4. Registrasi & Interaktivitas UI

- **Registrasi Otomatis**:
  - Ditangani oleh komponen `src/components/pwa/ServiceWorkerRegister.tsx` yang dipasang di `src/app/layout.tsx`.
  - Mendaftarkan `/sw.js` setelah halaman selesai dimuat (`window.addEventListener('load')`).
- **Prompt Instalasi Kustom**:
  - Ditangani oleh `src/components/pwa/InstallPWAPrompt.tsx`.
  - Menangkap event `beforeinstallprompt` untuk menampilkan banner ajakan pasang aplikasi yang elegan bagi pengguna mobile.
