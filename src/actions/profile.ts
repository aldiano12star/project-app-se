"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export interface ProfileActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UpdateContactPayload {
  noWhatsapp?: string;
  portfolioUrl?: string;
  nisn?: string;
}

export interface UpdatePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * Memperbarui data kontak (WhatsApp, Portofolio URL, NISN) milik pengguna aktif.
 */
export async function updateProfileContact(
  payload: UpdateContactPayload
): Promise<ProfileActionResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    const noWhatsapp = payload.noWhatsapp?.trim() || null;
    const portfolioUrl = payload.portfolioUrl?.trim() || null;
    const nisn = payload.nisn?.trim() || null;

    // Validasi URL sederhana jika diisi
    if (portfolioUrl) {
      try {
        new URL(portfolioUrl);
      } catch {
        return {
          success: false,
          message: "Format URL portofolio tidak valid. Sertakan https:// atau http://.",
        };
      }
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        noWhatsapp,
        portfolioUrl,
        nisn,
      },
    });

    revalidatePath("/pengaturan");

    return {
      success: true,
      message: "Data kontak & portofolio berhasil diperbarui!",
    };
  } catch (error) {
    console.error("[Profile Action] updateProfileContact error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui data kontak.",
    };
  }
}

/**
 * Mengubah atau mengatur kata sandi pengguna dengan enkripsi bcrypt.
 */
export async function updatePassword(
  payload: UpdatePasswordPayload
): Promise<ProfileActionResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    const currentPassword = payload.currentPassword || "";
    const newPassword = payload.newPassword || "";
    const confirmPassword = payload.confirmPassword || "";

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        message: "Kata sandi baru minimal harus terdiri dari 6 karakter.",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: "Konfirmasi kata sandi baru tidak cocok.",
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, password: true },
    });

    if (!dbUser) {
      return {
        success: false,
        message: "Pengguna tidak ditemukan dalam sistem.",
      };
    }

    // Jika pengguna sudah memiliki kata sandi sebelumnya, wajib verifikasi kata sandi lama
    if (dbUser.password) {
      if (!currentPassword) {
        return {
          success: false,
          message: "Masukkan kata sandi lama Anda untuk verifikasi.",
        };
      }

      const isCurrentValid = await bcrypt.compare(
        currentPassword,
        dbUser.password
      );

      if (!isCurrentValid) {
        return {
          success: false,
          message: "Kata sandi lama yang Anda masukkan salah.",
        };
      }
    }

    // Hash kata sandi baru dengan salt 10 rounds
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Kata sandi akun Anda berhasil diperbarui secara aman!",
    };
  } catch (error) {
    console.error("[Profile Action] updatePassword error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui kata sandi.",
    };
  }
}

export const changePassword = updatePassword;
