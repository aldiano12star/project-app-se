"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role, Division } from "@prisma/client";

export interface ProfileActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UpdateContactPayload {
  name?: string;
  noWhatsapp?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

export interface UpdatePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function sanitizeUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`);
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

/**
 * Memperbarui data profil kontak & media sosial (Nama, WhatsApp, Portofolio, GitHub, Instagram, LinkedIn).
 * Catatan: Asal / Tujuan Kunjungan (Intent) TIDAK DAPAT diubah melalui formulir ini.
 */
export async function updateProfileContact(
  payload: UpdateContactPayload
): Promise<ProfileActionResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    const updateData: Record<string, unknown> = {};

    // 1. Validasi & Update Nama Lengkap jika dikirimkan
    if (payload.name !== undefined) {
      const trimmedName = payload.name.trim();
      if (trimmedName.length < 3) {
        return {
          success: false,
          message: "Nama lengkap resmi wajib diisi minimal 3 karakter.",
        };
      }
      if (trimmedName.length > 70) {
        return {
          success: false,
          message: "Nama lengkap resmi maksimal 70 karakter.",
        };
      }
      updateData.name = trimmedName;
      updateData.fullName = trimmedName;
    }

    // 2. Data Kontak WhatsApp & Social Links
    if (payload.noWhatsapp !== undefined) {
      updateData.noWhatsapp = payload.noWhatsapp.trim() || null;
    }
    if (payload.portfolioUrl !== undefined) {
      updateData.portfolioUrl = sanitizeUrl(payload.portfolioUrl);
    }
    if (payload.githubUrl !== undefined) {
      updateData.githubUrl = sanitizeUrl(payload.githubUrl);
    }
    if (payload.instagramUrl !== undefined) {
      updateData.instagramUrl = sanitizeUrl(payload.instagramUrl);
    }
    if (payload.linkedinUrl !== undefined) {
      updateData.linkedinUrl = sanitizeUrl(payload.linkedinUrl);
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Data profil & tautan sosial berhasil diperbarui!",
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
 * Memperbarui Foto Profil atau Avatar Pengguna
 */
export async function updateUserAvatar(
  avatarUrl: string
): Promise<ProfileActionResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    const cleanUrl = avatarUrl?.trim();
    if (!cleanUrl) {
      return {
        success: false,
        message: "URL foto profil atau avatar tidak valid.",
      };
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        avatarUrl: cleanUrl,
        image: cleanUrl,
      },
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return {
      success: true,
      message: "Foto profil & avatar berhasil diperbarui!",
    };
  } catch (error) {
    console.error("[Profile Action] updateUserAvatar error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui avatar pengguna.",
    };
  }
}

/**
 * Menandai bahwa pengguna telah melihat Modal Sambutan Perdana (One-Time Welcome).
 */
export async function markWelcomeAsSeen(): Promise<ProfileActionResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        hasSeenWelcome: true,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Status sambutan berhasil disimpan.",
    };
  } catch (error) {
    console.error("[Profile Action] markWelcomeAsSeen error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status sambutan.",
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

export interface PromoteUserRolePayload {
  targetUserId: string;
  newRole: Role;
  mainDivision?: Division | null;
  classGrade?: string | null;
  kelas?: string | null;
  gen?: number | null;
}

/**
 * Mengubah role pengguna (Aktivasi GUEST -> MEMBER / BENDAHARA / ADMIN) serta alokasi Gen/Divisi.
 * Wewenang: OPERATOR, ADMIN
 */
export async function promoteUserRole(
  payload: PromoteUserRolePayload
): Promise<ProfileActionResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    if (
      sessionUser.role !== Role.ADMIN &&
      sessionUser.role !== Role.OPERATOR
    ) {
      return {
        success: false,
        message: "FORBIDDEN: Hanya Admin atau Operator yang dapat mengubah role akun.",
      };
    }

    // Role OPERATOR hanya bisa diberikan oleh sesama OPERATOR
    if (payload.newRole === Role.OPERATOR && sessionUser.role !== Role.OPERATOR) {
      return {
        success: false,
        message: "FORBIDDEN: Hanya Operator yang dapat mengangkat akun Operator baru.",
      };
    }

    const target = await prisma.user.findUnique({
      where: { id: payload.targetUserId },
      select: { id: true, name: true, role: true },
    });

    if (!target) {
      return {
        success: false,
        message: "Pengguna tidak ditemukan dalam sistem.",
      };
    }

    const updateData: Record<string, unknown> = {
      role: payload.newRole,
    };

    if (payload.mainDivision !== undefined) {
      updateData.mainDivision = payload.mainDivision;
      updateData.divisi = payload.mainDivision ? String(payload.mainDivision) : null;
    }

    if (payload.classGrade !== undefined) {
      updateData.classGrade = payload.classGrade;
    }
    if (payload.kelas !== undefined) {
      updateData.kelas = payload.kelas;
    }
    if (payload.gen !== undefined) {
      updateData.gen = payload.gen;
      updateData.generationNumber = payload.gen;
    }

    await prisma.user.update({
      where: { id: payload.targetUserId },
      data: updateData,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/kas");
    revalidatePath("/dashboard");
    revalidatePath("/acara");
    revalidatePath("/operator/manajemen-akun");

    return {
      success: true,
      message: `Berhasil mengubah role ${target.name} menjadi ${payload.newRole}.`,
    };
  } catch (error) {
    console.error("[Profile Action] promoteUserRole error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mengubah role pengguna.",
    };
  }
}

export interface ResetPasswordByOperatorPayload {
  targetUserId: string;
  customPassword?: string;
}

export interface ResetPasswordByOperatorResponse {
  success: boolean;
  message: string;
  temporaryPassword?: string;
  targetWhatsapp?: string | null;
  targetName?: string;
}

/**
 * Mekanisme Operator Password Override:
 * Memungkinkan Operator/Admin me-reset kata sandi pengguna tanpa email routing
 * (Mitigasi Lupa Kata Sandi via WhatsApp Handoff).
 */
export async function resetUserPasswordByOperator(
  payload: ResetPasswordByOperatorPayload
): Promise<ResetPasswordByOperatorResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    if (
      sessionUser.role !== Role.ADMIN &&
      sessionUser.role !== Role.OPERATOR
    ) {
      return {
        success: false,
        message: "FORBIDDEN: Hanya Admin atau Operator yang dapat me-reset kata sandi akun.",
      };
    }

    const target = await prisma.user.findUnique({
      where: { id: payload.targetUserId },
      select: { id: true, name: true, role: true, noWhatsapp: true },
    });

    if (!target) {
      return {
        success: false,
        message: "Pengguna tidak ditemukan dalam sistem.",
      };
    }

    // Hanya Operator yang dapat me-reset akun sesama Operator
    if (target.role === Role.OPERATOR && sessionUser.role !== Role.OPERATOR) {
      return {
        success: false,
        message: "FORBIDDEN: Hanya Operator yang dapat me-reset akun sesama Operator.",
      };
    }

    // Tentukan kata sandi sementara (kustom atau generate acak 8 karakter)
    const tempPassword =
      payload.customPassword?.trim() ||
      `Saba-${Math.random().toString(36).substring(2, 6).toUpperCase()}!`;

    if (tempPassword.length < 6) {
      return {
        success: false,
        message: "Kata sandi sementara minimal harus 6 karakter.",
      };
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id: target.id },
      data: {
        password: hashedPassword,
        mustChangePassword: true, // Wajibkan ganti sandi saat login berikutnya
      },
    });

    revalidatePath("/pengaturan");
    revalidatePath("/operator/manajemen-akun");

    return {
      success: true,
      message: `Kata sandi akun ${target.name} berhasil di-reset ke sandi sementara.`,
      temporaryPassword: tempPassword,
      targetWhatsapp: target.noWhatsapp,
      targetName: target.name,
    };
  } catch (error) {
    console.error("[Profile Action] resetUserPasswordByOperator error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal me-reset kata sandi pengguna.",
    };
  }
}

export const changePassword = updatePassword;
