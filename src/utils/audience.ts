import { Role, TargetAudience } from "@prisma/client";

/**
 * Mendapatkan daftar TargetAudience yang berhak diakses/dilihat oleh user
 * berdasarkan Role dan ClassGrade akun mereka.
 *
 * Aturan Otorisasi Privasi:
 * - Role ADMIN & OPERATOR: Akses penuh (return null = tanpa filter).
 * - KELAS_10 (Gen 21): Berhak melihat ALL dan GEN_21.
 * - KELAS_11 (Gen 20): Berhak melihat ALL dan GEN_20.
 * - Sisanya (KELAS_12 / Tamu): Hanya berhak melihat ALL.
 */
export function getAllowedTargetAudiences(
  role?: Role | null,
  classGrade?: string | null
): TargetAudience[] | null {
  if (role === Role.ADMIN || role === Role.OPERATOR) {
    return null; // Tanpa pembatasan (akses tak terbatas)
  }

  if (classGrade === "KELAS_10") {
    return [TargetAudience.ALL, TargetAudience.GEN_21];
  }

  if (classGrade === "KELAS_11") {
    return [TargetAudience.ALL, TargetAudience.GEN_20];
  }

  return [TargetAudience.ALL];
}

/**
 * Memeriksa apakah user berhak mengakses rapat/acara dengan target audience tertentu.
 */
export function isUserEligibleForAudience(
  targetAudience: TargetAudience,
  role?: Role | null,
  classGrade?: string | null
): boolean {
  if (role === Role.ADMIN || role === Role.OPERATOR) {
    return true;
  }

  const allowed = getAllowedTargetAudiences(role, classGrade);
  return allowed ? allowed.includes(targetAudience) : true;
}

/**
 * Helper label teks untuk target audience
 */
export function getTargetAudienceBadge(targetAudience: TargetAudience): {
  label: string;
  badgeClass: string;
} {
  switch (targetAudience) {
    case TargetAudience.GEN_20:
      return {
        label: "Khusus Kelas 11 (Gen 20)",
        badgeClass:
          "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900",
      };
    case TargetAudience.GEN_21:
      return {
        label: "Khusus Kelas 10 (Gen 21)",
        badgeClass:
          "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900",
      };
    case TargetAudience.ALL:
    default:
      return {
        label: "Semua Angkatan",
        badgeClass:
          "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700",
      };
  }
}
