"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/rbac";
import { ClassGrade, Division } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface OnboardingInput {
  fullName: string;
  kelas: "X" | "XI" | "XII";
  divisi: string;
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

    const fullName = input.fullName?.trim();
    if (!fullName || fullName.length < 3) {
      return {
        success: false,
        message: "Nama lengkap wajib diisi minimal 3 karakter.",
      };
    }

    if (!input.kelas || !["X", "XI", "XII"].includes(input.kelas)) {
      return {
        success: false,
        message: "Pilihan kelas tidak valid.",
      };
    }

    if (!input.divisi || input.divisi.trim() === "") {
      return {
        success: false,
        message: "Pilihan divisi wajib dipilih.",
      };
    }

    // Hitung Generasi dan ClassGrade otomatis
    let gen = 21;
    let classGrade: ClassGrade = ClassGrade.KELAS_10;

    if (input.kelas === "X") {
      gen = 21;
      classGrade = ClassGrade.KELAS_10;
    } else if (input.kelas === "XI") {
      gen = 20;
      classGrade = ClassGrade.KELAS_11;
    } else if (input.kelas === "XII") {
      gen = 19;
      classGrade = ClassGrade.KELAS_12;
    }

    // Mapping 5 divisi resmi ke Enum Division
    let mainDivision: Division = Division.PROGRAMMING;
    let normalizedDivisi = "Programming";

    switch (input.divisi) {
      case "Programming":
        mainDivision = Division.PROGRAMMING;
        normalizedDivisi = "Programming";
        break;
      case "Technopreneurship":
        mainDivision = Division.TECHNOPRENEURSHIP;
        normalizedDivisi = "Technopreneurship";
        break;
      case "Desain":
        mainDivision = Division.DESIGN;
        normalizedDivisi = "Desain";
        break;
      case "Fotografi":
        mainDivision = Division.PHOTOGRAPHY;
        normalizedDivisi = "Fotografi";
        break;
      case "Cinematografi":
        mainDivision = Division.CINEMATOGRAPHY;
        normalizedDivisi = "Cinematografi";
        break;
      default:
        mainDivision = Division.PROGRAMMING;
        normalizedDivisi = "Programming";
        break;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: fullName,
        fullName,
        kelas: input.kelas,
        gen,
        divisi: normalizedDivisi,
        classGrade,
        mainDivision,
        isProfileCompleted: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");
    revalidatePath("/onboarding");

    return {
      success: true,
      message: "Data profil berhasil disimpan! Selamat datang di Saba ExploIT.",
    };
  } catch (error) {
    console.error("[Onboarding] saveOnboardingData error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menyimpan data onboarding.",
    };
  }
}
