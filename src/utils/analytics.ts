import { prisma } from "@/lib/prisma";
import { Role, TargetAudience, AttendanceStatus } from "@prisma/client";
import { buildAudienceFilter } from "@/utils/audience";
import { unstable_cache } from "next/cache";

export interface IndividualAttendanceStats {
  attended: number;
  eligible: number;
  percentage: number;
}

export interface GlobalHealthStats {
  totalActual: number;
  totalExpected: number;
  globalPercentage: number;
}

/**
 * 1. Menghitung Statistik Presensi Individual Anggota
 * Formula: (Total Hadir / Total Rapat Berhak Hadir) * 100
 */
export async function getIndividualAttendanceStats(
  userId: string,
  classGrade?: string | null,
  role?: Role | null
): Promise<IndividualAttendanceStats> {
  try {
    const audienceFilter = buildAudienceFilter(role, classGrade, userId);

    const [eligible, attended] = await Promise.all([
      prisma.meeting.count({
        where: audienceFilter,
      }),
      prisma.attendance.count({
        where: {
          userId,
          status: AttendanceStatus.HADIR,
          meeting: audienceFilter,
        },
      }),
    ]);

    const percentage = eligible > 0 ? Math.round((attended / eligible) * 100) : 100;

    return {
      attended,
      eligible,
      percentage,
    };
  } catch (error) {
    console.error("[Analytics] getIndividualAttendanceStats error:", error);
    return {
      attended: 0,
      eligible: 0,
      percentage: 100,
    };
  }
}

/**
 * 2. Menghitung Metrik Kesehatan & Keaktifan Global Organisasi
 * Formula: (Sum of all Attendance HADIR / Sum of all Eligible Targets across all meetings) * 100
 * Di-cache selama 60 detik untuk mencegah re-agregasi database berulang di setiap navigasi dashboard.
 */
export const getGlobalOrganizationalHealth = unstable_cache(
  async (): Promise<GlobalHealthStats> => {
    try {
      // Ambil agregasi populasi anggota aktif per angkatan
      const [totalGen20, totalGen21, totalRegularMembers, meetings, actualHadirCount] =
        await Promise.all([
          prisma.user.count({
            where: {
              status: "ACTIVE",
              role: { not: Role.GUEST },
              OR: [
                { gen: 20 },
                { generationNumber: 20 },
                { classGrade: "KELAS_11" },
                { kelas: { contains: "11" } },
                { kelas: "XI" },
              ],
            },
          }),
          prisma.user.count({
            where: {
              status: "ACTIVE",
              role: { not: Role.GUEST },
              OR: [
                { gen: 21 },
                { generationNumber: 21 },
                { classGrade: "KELAS_10" },
                { kelas: { contains: "10" } },
                { kelas: "X" },
              ],
            },
          }),
          prisma.user.count({
            where: {
              status: "ACTIVE",
              role: { notIn: [Role.GUEST, Role.KOLABORATOR] },
            },
          }),
          prisma.meeting.findMany({
            select: {
              id: true,
              targetAudience: true,
              _count: {
                select: { targetUsers: true },
              },
            },
          }),
          prisma.attendance.count({
            where: {
              status: AttendanceStatus.HADIR,
            },
          }),
        ]);

      // Hitung total ekspektasi peserta dari seluruh pertemuan yang tercatat
      let totalExpected = 0;
      for (const m of meetings) {
        if (m.targetAudience === TargetAudience.CUSTOM) {
          totalExpected += m._count.targetUsers;
        } else if (m.targetAudience === TargetAudience.GEN_20) {
          totalExpected += totalGen20;
        } else if (m.targetAudience === TargetAudience.GEN_21) {
          totalExpected += totalGen21;
        } else {
          totalExpected += totalRegularMembers;
        }
      }

      const totalActual = actualHadirCount;
      const globalPercentage =
        totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 100;

      return {
        totalActual,
        totalExpected,
        globalPercentage,
      };
    } catch (error) {
      console.error("[Analytics] getGlobalOrganizationalHealth error:", error);
      return {
        totalActual: 0,
        totalExpected: 0,
        globalPercentage: 100,
      };
    }
  },
  ["global-health-stats"],
  { revalidate: 60, tags: ["analytics", "meetings", "attendance"] }
);

