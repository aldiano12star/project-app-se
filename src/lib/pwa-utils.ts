/**
 * Helper untuk memberikan batas waktu (timeout) pada operasi asynchronous (Promise)
 * agar tidak menggantung tanpa batas waktu (misal: navigator.serviceWorker.ready).
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ]);
}

/**
 * Mengonversi VAPID public key string (Base64 URL-safe) menjadi Uint8Array
 * yang dibutuhkan oleh browser PushManager.subscribe().
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Memeriksa apakah browser saat ini mendukung Service Worker dan Push Manager.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Memeriksa apakah perangkat saat ini sudah memiliki langganan Web Push aktif.
 */
export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      4000,
      "Timeout memeriksa kesiapan Service Worker."
    );
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.warn("[PWA] getActivePushSubscription info:", error);
    return null;
  }
}

/**
 * Mendaftarkan perangkat ke Web Push Notification & menyimpannya ke database via API.
 */
export async function subscribeToPush(): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushSupported()) {
    return {
      success: false,
      error: "Browser ini tidak mendukung Notifikasi Web Push.",
    };
  }

  let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  // Fallback: Jika environment variable client belum ter-inline saat build/dev bundling
  if (!vapidPublicKey) {
    try {
      const res = await fetch("/api/web-push", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.publicKey) {
          vapidPublicKey = data.publicKey;
        }
      }
    } catch (fetchError) {
      console.warn(
        "[PWA] Gagal mengambil fallback public VAPID key dari server:",
        fetchError
      );
    }
  }

  if (!vapidPublicKey) {
    console.error(
      "[PWA] NEXT_PUBLIC_VAPID_PUBLIC_KEY belum dikonfigurasi di client (.env) maupun respons API /api/web-push."
    );
    return {
      success: false,
      error: "Kunci VAPID belum dikonfigurasi di server.",
    };
  }

  try {
    // 1. Minta izin notifikasi pengguna
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        error: "Izin notifikasi tidak diberikan oleh pengguna atau peramban.",
      };
    }

    // 2. Pastikan Service Worker terdaftar & aktif dengan batas waktu (safety timeout)
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (regErr) {
      console.warn("[PWA] Register worker info:", regErr);
    }

    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      8000,
      "Service Worker membutuhkan waktu terlalu lama untuk aktif. Silakan muat ulang halaman."
    );

    // 3. Berlangganan Push Manager dengan penanganan rotasi kunci VAPID
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    let subscription: PushSubscription | null = null;

    try {
      subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as unknown as BufferSource,
        });
      }
    } catch (subErr) {
      console.warn("[PWA] Mencoba registrasi ulang langganan push:", subErr);
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe().catch(() => {});
      }
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    if (!subscription) {
      throw new Error("Gagal memperoleh token langganan dari Push Manager peramban.");
    }

    // 4. Kirim token subscription ke server database Prisma
    const response = await fetch("/api/web-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Gagal menyimpan langganan notifikasi ke database."
      );
    }

    return { success: true, subscription };
  } catch (error: any) {
    console.error("[PWA] Gagal subscribeToPush:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan saat mengaktifkan notifikasi.",
    };
  }
}

/**
 * Membatalkan langganan Web Push & menghapus token dari database Prisma.
 */
export async function unsubscribeFromPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isPushSupported()) {
    return { success: true };
  }

  try {
    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      4000,
      "Timeout Service Worker."
    );
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // 1. Hapus endpoint dari database
      await fetch("/api/web-push", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      // 2. Unsubscribe dari push manager browser
      await subscription.unsubscribe();
    }

    return { success: true };
  } catch (error: any) {
    console.error("[PWA] Gagal unsubscribeFromPush:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan saat mematikan notifikasi.",
    };
  }
}
