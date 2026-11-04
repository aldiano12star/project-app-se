import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@sabaexploit.org";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn(
    "[WebPush] VAPID keys belum terkonfigurasi secara lengkap di environment variable."
  );
}

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

/**
 * Mengirim Web Push Notification ke seluruh perangkat aktif milik satu pengguna spesifik.
 * Secara otomatis membersihkan subscription yang sudah kedaluwarsa (HTTP 404/410 Gone).
 */
export async function sendNotificationToUser(
  userId: string,
  payload: WebPushPayload
): Promise<{ successCount: number; failureCount: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[WebPush] Pengiriman dibatalkan: VAPID keys belum diatur.");
    return { successCount: 0, failureCount: 0 };
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      tag: payload.tag || "general",
    });

    let successCount = 0;
    let failureCount = 0;

    const expiredSubscriptionIds: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushConfig, payloadString);
          successCount++;
        } catch (error: any) {
          failureCount++;
          // Kode 404 / 410 menandakan token subscription sudah tidak valid / di-revoke oleh browser
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            expiredSubscriptionIds.push(sub.id);
          } else {
            console.error(`[WebPush] Gagal mengirim push ke subscription ${sub.id}:`, error);
          }
        }
      })
    );

    // Pembersihan otomatis token yang kedaluwarsa
    if (expiredSubscriptionIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expiredSubscriptionIds } },
      });
      console.log(
        `[WebPush] Berhasil membersihkan ${expiredSubscriptionIds.length} subscription kedaluwarsa.`
      );
    }

    return { successCount, failureCount };
  } catch (error) {
    console.error("[WebPush] sendNotificationToUser error:", error);
    return { successCount: 0, failureCount: 0 };
  }
}

/**
 * Mengirim Web Push Notification ke banyak pengguna (Broadcast atau Target Tertentu).
 * Cocok untuk pengumuman Rapat Pleno, Acara Besar, atau Tagihan Kas Masal.
 */
export async function broadcastNotification(
  payload: WebPushPayload,
  targetUserIds?: string[]
): Promise<{ successCount: number; failureCount: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[WebPush] Broadcast dibatalkan: VAPID keys belum diatur.");
    return { successCount: 0, failureCount: 0 };
  }

  try {
    const whereClause = targetUserIds && targetUserIds.length > 0
      ? { userId: { in: targetUserIds } }
      : {};

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
    });

    if (subscriptions.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      tag: payload.tag || "broadcast",
    });

    let successCount = 0;
    let failureCount = 0;
    const expiredSubscriptionIds: string[] = [];

    // Kirim secara paralel dalam batch untuk stabilitas serverless & memory
    const BATCH_SIZE = 25;
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (sub) => {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          try {
            await webpush.sendNotification(pushConfig, payloadString);
            successCount++;
          } catch (error: any) {
            failureCount++;
            if (error?.statusCode === 404 || error?.statusCode === 410) {
              expiredSubscriptionIds.push(sub.id);
            } else {
              console.error(`[WebPush] Gagal push broadcast ke ${sub.id}:`, error);
            }
          }
        })
      );
    }

    if (expiredSubscriptionIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expiredSubscriptionIds } },
      });
      console.log(
        `[WebPush] Membersihkan ${expiredSubscriptionIds.length} token push usang pasca broadcast.`
      );
    }

    return { successCount, failureCount };
  } catch (error) {
    console.error("[WebPush] broadcastNotification error:", error);
    return { successCount: 0, failureCount: 0 };
  }
}
