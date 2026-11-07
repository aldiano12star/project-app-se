"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { normalizeWhatsAppNumber } from "@/utils/phone";

export interface OnboardingInput {
  fullName: string;
  noWhatsapp: string;
  asalTujuan?: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
}

export async function saveOnboardingData(
  input: OnboardingInput
): Promise<OnboardingResponse> {
  try {
    const user = await assertAuthenticated();

    // 1. Validasi Nama Lengkap Resmi (Wajib)
    const fullName = input.fullName?.trim();
    if (!fullName || fullName.length < 3) {
      return {
        success: false,
        message: "Nama lengkap resmi wajib diisi minimal 3 karakter.",
      };
    }

    if (fullName.length > 70) {
      return {
        success: false,
        message: "Nama lengkap maksimal 70 karakter.",
      };
    }

    // 2. Validasi & Normalisasi Nomor WhatsApp (Wajib)
    const normalizedWa = normalizeWhatsAppNumber(input.noWhatsapp || "");
    if (!normalizedWa) {
      return {
        success: false,
        message:
          "Nomor WhatsApp tidak valid. Masukkan nomor aktif minimal 10 digit (contoh: 081234567890).",
      };
    }

    // 3. Asal / Tujuan (Opsional, dibatasi maks 100 karakter untuk kebersihan data)
    const asalTujuan = input.asalTujuan?.trim() || null;
    if (asalTujuan && asalTujuan.length > 100) {
      return {
        success: false,
        message: "Keterangan Asal / Tujuan maksimal 100 karakter.",
      };
    }

    // 4. Simpan data profil baru tanpa password & tanpa paksaan kelas/divisi
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: fullName,
        fullName,
        noWhatsapp: normalizedWa,
        asalTujuan,
        isProfileCompleted: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");
    revalidatePath("/onboarding");

    return {
      success: true,
      message: "Profil berhasil dilengkapi! Selamat datang di SE-Core.",
    };
  } catch (error) {
    console.error("[Onboarding] saveOnboardingData error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data onboarding.",
    };
  }
}
