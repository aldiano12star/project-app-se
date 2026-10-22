"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role, Division, MemberStatus } from "@prisma/client";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  nisn?: string;
  kelas?: "X" | "XI" | "XII";
  divisi?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Server Action: Mendaftarkan akun anggota baru dengan kata sandi terenkripsi bcrypt.
 */
export async function registerUser(
  input: RegisterInput
): Promise<RegisterResponse> {
  try {
    const name = input.name?.trim();
    if (!name || name.length < 3) {
      return {
        success: false,
        message: "Nama lengkap wajib diisi minimal 3 karakter.",
      };
    }

    const email = input.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return {
        success: false,
        message: "Format alamat email tidak valid.",
      };
    }

    // Validasi Kata Sandi Server-Side
    if (!input.password || input.password.length < 8) {
      return {
        success: false,
        message: "Kata sandi wajib diisi minimal 8 karakter.",
      };
    }

    if (input.password !== input.confirmPassword) {
      return {
        success: false,
        message: "Konfirmasi kata sandi tidak cocok dengan kata sandi.",
      };
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Alamat email ini sudah terdaftar dalam sistem.",
      };
    }

    // Cek NISN jika diisi
    if (input.nisn?.trim()) {
      const existingNisn = await prisma.user.findUnique({
        where: { nisn: input.nisn.trim() },
      });
      if (existingNisn) {
        return {
          success: false,
          message: "NISN ini sudah terdaftar oleh pengguna lain.",
        };
      }
    }

    // Enkripsi (hash) kata sandi pengguna dengan salt 10 rounds sebelum disimpan ke database
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Hitung Generasi dan ClassGrade
    let gen = 21;
    let classGrade = "KELAS_10";
    if (input.kelas === "XI") {
      gen = 20;
      classGrade = "KELAS_11";
    } else if (input.kelas === "XII") {
      gen = 19;
      classGrade = "KELAS_12";
    }

    // Mapping divisi
    let mainDivision: Division = Division.PROGRAMMING;
    if (input.divisi === "Technopreneurship") mainDivision = Division.TECHNOPRENEURSHIP;
    else if (input.divisi === "Desain") mainDivision = Division.DESIGN;
    else if (input.divisi === "Fotografi") mainDivision = Division.PHOTOGRAPHY;
    else if (input.divisi === "Cinematografi") mainDivision = Division.CINEMATOGRAPHY;

    // Buat record user baru
    const newUser = await prisma.user.create({
      data: {
        name,
        fullName: name,
        email,
        password: hashedPassword,
        // Karena pengguna membuat kata sandinya sendiri sejak awal, mustChangePassword disetel ke false
        mustChangePassword: false,
        nisn: input.nisn?.trim() || null,
        kelas: input.kelas || "X",
        gen,
        classGrade,
        mainDivision,
        divisi: input.divisi || "Programming",
        role: Role.GUEST,
        status: MemberStatus.ACTIVE,
        isProfileCompleted: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");

    return {
      success: true,
      message: "Pendaftaran akun berhasil! Silakan masuk ke aplikasi.",
      userId: newUser.id,
    };
  } catch (error) {
    console.error("[Auth] registerUser error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan saat mendaftar.",
    };
  }
}
