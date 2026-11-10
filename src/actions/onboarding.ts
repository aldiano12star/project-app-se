"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { normalizeWhatsAppNumber } from "@/utils/phone";
import { Division, Role } from "@prisma/client";
import { calculateGenFromGrade } from "@/lib/academic-year";

export const VALID_ROLE_INTENTS = [
  "Calon Anggota",
  "Tamu / Kolaborator",
  "Alumni",
  "Eksplorasi Proyek",
] as const;

export interface OnboardingInput {
  fullName: string;
  noWhatsapp: string;
  asalTujuan: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
}

export interface CompletePhase2MemberInput {
  division: Division;
  grade: "KELAS_10" | "KELAS_11" | "KELAS_12" | "10" | "11" | "12";
}

export interface CompletePhase2KolaboratorInput {
  instansi: string;
}

/**
 * Fase 1 Onboarding: Pasca-Google SSO login pertama kali.
 * Menyimpan data dasar tanpa friksi: Nama Lengkap Resmi, Nomor WhatsApp, dan Asal/Tujuan Intent.
 */
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

    // 3. Asal / Tujuan Kunjungan (Wajib Dipilih dari Dropdown)
    const asalTujuan = input.asalTujuan?.trim();
    if (!asalTujuan) {
      return {
        success: false,
        message: "Silakan pilih Asal / Tujuan Kunjungan Anda.",
      };
    }

    const isValidIntent = VALID_ROLE_INTENTS.includes(
      asalTujuan as (typeof VALID_ROLE_INTENTS)[number]
    );

    if (!isValidIntent) {
      return {
        success: false,
        message: "Opsi Asal / Tujuan Kunjungan yang dipilih tidak valid.",
      };
    }

    // 4. Simpan data profil Fase 1
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
      message: "Profil dasar berhasil dilengkapi! Selamat datang di SE-Core.",
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

/**
 * Fase 2 Onboarding: Khusus Akun Terverifikasi MEMBER atau ADMIN
 * Menghitung nomor Gen secara dinamis (Auto-Gen) berdasarkan tingkat Kelas dan tahun ajaran kalender saat ini.
 */
export async function completePhase2Profile(
  input: CompletePhase2MemberInput
): Promise<OnboardingResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return {
        success: false,
        message: "Pengguna tidak ditemukan dalam sistem.",
      };
    }

    if (
      dbUser.role !== Role.MEMBER &&
      dbUser.role !== Role.ADMIN &&
      dbUser.role !== Role.BENDAHARA &&
      dbUser.role !== Role.OPERATOR
    ) {
      return {
        success: false,
        message: "Formulir ini hanya diperuntukkan bagi Anggota atau Pengurus organisasi.",
      };
    }

    // 1. Validasi Divisi
    const validDivisions = Object.values(Division);
    if (!input.division || !validDivisions.includes(input.division)) {
      return {
        success: false,
        message: "Pilihan divisi tidak valid.",
      };
    }

    // 2. Kalkulasi Dinamis Nomor Angkatan (Auto-Gen Algorithm)
    const genResult = calculateGenFromGrade(input.grade);

    // 3. Simpan data divisi, kelas, dan angkatan ke database
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        mainDivision: input.division,
        divisi: String(input.division),
        classGrade: genResult.classGrade,
        kelas: genResult.kelasLabel,
        gen: genResult.gen,
        generationNumber: genResult.gen,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");

    return {
      success: true,
      message: `Profil divisi & angkatan berhasil dilengkapi! Anda dialokasikan ke Gen ${genResult.gen} (${genResult.academicYear}).`,
    };
  } catch (error) {
    console.error("[Onboarding] completePhase2Profile error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal melengkapi profil anggota.",
    };
  }
}

/**
 * Fase 2 Onboarding: Khusus Akun Terverifikasi KOLABORATOR
 * Menanyakan nama instansi/organisasi asal tanpa penetapan divisi maupun nomor angkatan (Gen).
 */
export async function completePhase2Kolaborator(
  input: CompletePhase2KolaboratorInput
): Promise<OnboardingResponse> {
  try {
    const sessionUser = await assertAuthenticated();

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return {
        success: false,
        message: "Pengguna tidak ditemukan dalam sistem.",
      };
    }

    if (dbUser.role !== Role.KOLABORATOR) {
      return {
        success: false,
        message: "Formulir ini khusus untuk akun dengan role Kolaborator.",
      };
    }

    const instansi = input.instansi?.trim();
    if (!instansi || instansi.length < 3) {
      return {
        success: false,
        message: "Nama instansi / organisasi wajib diisi minimal 3 karakter.",
      };
    }

    if (instansi.length > 100) {
      return {
        success: false,
        message: "Nama instansi / organisasi maksimal 100 karakter.",
      };
    }

    // Simpan instansi, pastikan divisi & gen tetap kosong untuk kolaborator
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        instansi,
        mainDivision: null,
        divisi: null,
        classGrade: null,
        kelas: null,
        gen: null,
        generationNumber: null,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");

    return {
      success: true,
      message: "Profil kolaborator berhasil disimpan!",
    };
  } catch (error) {
    console.error("[Onboarding] completePhase2Kolaborator error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data kolaborator.",
    };
  }
}
