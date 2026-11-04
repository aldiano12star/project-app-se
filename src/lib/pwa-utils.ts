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
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("[PWA] Gagal memeriksa push subscription:", error);
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
    return { success: false, error: "Browser tidak mendukung Notifikasi Web Push." };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.error("[PWA] NEXT_PUBLIC_VAPID_PUBLIC_KEY belum dikonfigurasi.");
    return { success: false, error: "Kunci VAPID belum dikonfigurasi di server." };
  }

  try {
    // 1. Minta izin notifikasi pengguna
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Izin notifikasi tidak diberikan oleh pengguna." };
    }

    // 2. Pastikan Service Worker terdaftar & aktif
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.ready;
    } catch {
      registration = await navigator.serviceWorker.register("/sw.js");
    }

    // 3. Berlangganan Push Manager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    // 4. Kirim subscription ke server database Prisma
    const response = await fetch("/api/web-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal menyimpan langganan notifikasi ke database.");
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
export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: true };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
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
