import { Role, TargetAudience } from "@prisma/client";

/**
 * Mendapatkan daftar TargetAudience yang berhak diakses/dilihat oleh user
 * berdasarkan Role dan ClassGrade akun mereka.
 *
 * Aturan Otorisasi Privasi:
 * - Role ADMIN & OPERATOR: Akses penuh (return null = tanpa filter).
 * - Role KOLABORATOR: Dilarang melihat agenda umum internal (return [] = hanya CUSTOM via invite).
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

  // Kolaborator eksternal tidak memiliki hak akses ke acara umum internal organisasi
  if (role === Role.KOLABORATOR) {
    return [];
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
 * Membangun klausa filter where Prisma untuk Event atau Meeting
 * yang mendukung ALL, GEN_20, GEN_21, dan CUSTOM (Many-to-Many targetUsers).
 */
export function buildAudienceFilter(
  role?: Role | null,
  classGrade?: string | null,
  userId?: string | null
): Record<string, unknown> {
  if (role === Role.ADMIN || role === Role.OPERATOR) {
    return {}; // Tanpa batasan kueri untuk pengurus
  }

  // Khusus Kolaborator: HANYA agenda bertarget CUSTOM yang secara eksplisit mengundang user ini
  if (role === Role.KOLABORATOR) {
    if (!userId) {
      return { id: "UNAUTHORIZED_NO_ACCESS" };
    }
    return {
      targetAudience: TargetAudience.CUSTOM,
      targetUsers: { some: { id: userId } },
    };
  }

  const allowed = getAllowedTargetAudiences(role, classGrade);
  const conditions: Record<string, unknown>[] = [];

  if (allowed && allowed.length > 0) {
    conditions.push({ targetAudience: { in: allowed } });
  }

  if (userId) {
    conditions.push({
      targetAudience: TargetAudience.CUSTOM,
      targetUsers: { some: { id: userId } },
    });
  }

  return conditions.length > 0 ? { OR: conditions } : {};
}

/**
 * Memeriksa apakah user berhak mengakses rapat/acara dengan target audience tertentu.
 */
export function isUserEligibleForAudience(
  targetAudience: TargetAudience,
  role?: Role | null,
  classGrade?: string | null,
  userId?: string | null,
  targetUsers?: { id: string }[] | null
): boolean {
  if (role === Role.ADMIN || role === Role.OPERATOR) {
    return true;
  }

  // Khusus Kolaborator: Hanya sah jika targetAudience adalah CUSTOM dan userId terdaftar di targetUsers
  if (role === Role.KOLABORATOR) {
    if (targetAudience !== TargetAudience.CUSTOM || !userId || !targetUsers) {
      return false;
    }
    return targetUsers.some((u) => u.id === userId);
  }

  if (targetAudience === TargetAudience.CUSTOM) {
    if (!userId || !targetUsers) return false;
    return targetUsers.some((u) => u.id === userId);
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
    case TargetAudience.CUSTOM:
      return {
        label: "Peserta Khusus",
        badgeClass:
          "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900",
      };
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
