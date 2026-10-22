// Saba ExploIT - Vanilla Service Worker (PWA Caching & Push Notifications)
const CACHE_NAME = 'saba-exploit-v2';
const PRECACHE_URLS = ['/', '/offline.html'];

// 1. Event Install: Precache halaman utama & fallback offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 2. Event Activate: Bersihkan cache versi lama & klaim klien aktif
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Event Fetch: Strategi Network First dengan Cache Fallback & Halaman Offline
self.addEventListener('fetch', (event) => {
  // Hanya proses permintaan metode GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Lewatkan protokol selain http/https (misal chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // Lewatkan API dan rute otentikasi agar selalu real-time ke server
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika respon sukses, perbarui cache secara dinamis
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Coba ambil dari cache yang tersedia
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Jika request navigasi halaman HTML gagal, sajikan offline.html
        if (event.request.mode === 'navigate') {
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
        }

        return new Response('Koneksi tidak tersedia', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
        });
      })
  );
});

// 4. Listener untuk Notifikasi Push Web
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }

  const options = {
    body: data.body || 'Ada pembaruan penting di Saba ExploIT',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Saba ExploIT', options)
  );
});

// 5. Listener saat notifikasi diklik oleh pengguna
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          if (client.url === urlToOpen) {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
