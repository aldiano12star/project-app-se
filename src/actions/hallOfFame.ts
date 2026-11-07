"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getHallOfFameEntries(page: number = 1, pageSize: number = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const [entries, totalCount] = await Promise.all([
      prisma.hallOfFame.findMany({
        orderBy: [{ generationYear: "desc" }, { archivedAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.hallOfFame.count(),
    ]);

    return {
      success: true,
      entries,
      totalCount,
      hasMore: skip + entries.length < totalCount,
    };
  } catch (error) {
    console.error("[HallOfFame] getHallOfFameEntries error:", error);
    return {
      success: false,
      entries: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}

/**
 * Memperbarui Foto Kenangan Bersama Seluruh Pengurus di Hall of Fame
 * Wewenang: Khusus OPERATOR
 */
export async function updateHallOfFameGroupPhoto(
  hallOfFameId: string,
  groupPhotoUrl: string
) {
  try {
    await assertRole([Role.OPERATOR]);

    if (!hallOfFameId) {
      return {
        success: false,
        message: "ID Hall of Fame tidak valid.",
      };
    }

    const updated = await prisma.hallOfFame.update({
      where: { id: hallOfFameId },
      data: {
        groupPhotoUrl: groupPhotoUrl.trim() || null,
      },
    });

    revalidatePath("/hall-of-fame");

    return {
      success: true,
      message: "Foto kenangan bersama seluruh pengurus berhasil diperbarui!",
      data: updated,
    };
  } catch (error: any) {
    console.error("[HallOfFame] updateHallOfFameGroupPhoto error:", error);
    return {
      success: false,
      message:
        error.message || "Gagal memperbarui foto kenangan bersama pengurus.",
    };
  }
}
