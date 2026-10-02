"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface ResetPointsResponse {
  success: boolean;
  message: string;
  count?: number;
}

/**
 * Server Action untuk mereset 'totalPoints' (dan 'monthlyPoints') semua pengguna menjadi 0.
 * Hanya dapat dieksekusi oleh ADMIN atau OPERATOR.
 */
export async function resetAllUsersPoints(): Promise<ResetPointsResponse> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    const result = await prisma.user.updateMany({
      data: {
        totalPoints: 0,
        monthlyPoints: 0,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");

    return {
      success: true,
      message: `Berhasil mereset totalPoints untuk ${result.count} pengguna.`,
      count: result.count,
    };
  } catch (error) {
    console.error("[Points Action] resetAllUsersPoints error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mereset totalPoints pengguna.",
    };
  }
}
