"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated, assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { NotifType, Role } from "@prisma/client";
import { sendNotificationToUser } from "@/lib/web-push";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Mengambil seluruh notifikasi personal milik user yang sedang aktif.
 * Mengutamakan notifikasi yang belum dibaca dan diurutkan dari yang paling baru.
 */
export async function getMyNotifications() {
  try {
    const user = await assertAuthenticated();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 50,
    });

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    console.error("[Notification] getMyNotifications error:", error);
    return {
      success: false,
      notifications: [],
    };
  }
}

/**
 * Menghitung jumlah notifikasi personal yang belum dibaca (isRead = false).
 * Ringan dan efisien untuk indikator badge merah di TopHeader.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const user = await assertAuthenticated();

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return count;
  } catch {
    return 0;
  }
}

/**
 * Menandai satu notifikasi personal sebagai sudah dibaca.
 */
export async function markNotificationAsRead(id: string): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticated();

    const notif = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!notif || notif.userId !== user.id) {
      return {
        success: false,
        message: "Notifikasi tidak ditemukan atau bukan milik Anda.",
      };
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath("/kotak-masuk");
    return {
      success: true,
      message: "Notifikasi ditandai telah dibaca.",
    };
  } catch (error) {
    console.error("[Notification] markNotificationAsRead error:", error);
    return {
      success: false,
      message: "Gagal memperbarui status notifikasi.",
    };
  }
}

/**
 * Menandai seluruh notifikasi personal pengguna sebagai telah dibaca.
 */
export async function markAllNotificationsAsRead(): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticated();

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath("/kotak-masuk");
    return {
      success: true,
      message: "Semua notifikasi berhasil ditandai telah dibaca.",
    };
  } catch (error) {
    console.error("[Notification] markAllNotificationsAsRead error:", error);
    return {
      success: false,
      message: "Gagal memperbarui notifikasi.",
    };
  }
}

/**
 * Menghapus permanen seluruh notifikasi personal pengguna yang telah dibaca (isRead = true).
 */
export async function deleteReadNotifications(): Promise<ActionResponse<{ deletedCount: number }>> {
  try {
    const user = await assertAuthenticated();

    const result = await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        isRead: true,
      },
    });

    revalidatePath("/kotak-masuk");
    return {
      success: true,
      message: `${result.count} notifikasi yang sudah dibaca berhasil dihapus.`,
      data: { deletedCount: result.count },
    };
  } catch (error) {
    console.error("[Notification] deleteReadNotifications error:", error);
    return {
      success: false,
      message: "Gagal menghapus notifikasi yang sudah dibaca.",
    };
  }
}

/**
 * Mengirim notifikasi personal ke pengguna tertentu.
 * Hanya dapat dipanggil oleh BENDAHARA, ADMIN, atau OPERATOR.
 */
export async function sendPersonalNotification({
  userId,
  title,
  message,
  type,
  actionUrl,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotifType;
  actionUrl?: string;
}): Promise<ActionResponse> {
  try {
    await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    if (!userId || !title || !message) {
      return {
        success: false,
        message: "Target penerima, judul, dan isi pesan wajib diisi.",
      };
    }

    await prisma.notification.create({
      data: {
        userId,
        title: title.trim(),
        message: message.trim(),
        type,
        actionUrl: actionUrl?.trim() || null,
      },
    });

    // Kirim Web Push Notification secara langsung ke perangkat anggota
    try {
      await sendNotificationToUser(userId, {
        title: title.trim(),
        body: message.trim(),
        url: actionUrl?.trim() || "/kotak-masuk",
        tag: `personal-${type.toLowerCase()}`,
      });
    } catch (pushErr) {
      console.error("[Notification] Gagal mengirim Web Push personal:", pushErr);
    }

    return {
      success: true,
      message: "Notifikasi berhasil dikirimkan.",
    };
  } catch (error) {
    console.error("[Notification] sendPersonalNotification error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengirim notifikasi.",
    };
  }
}
