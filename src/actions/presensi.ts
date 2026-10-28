"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated, assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Role, AttendanceStatus, TargetAudience } from "@prisma/client";
import { getAllowedTargetAudiences, isUserEligibleForAudience } from "@/utils/audience";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface MeetingSessionData {
  id: string;
  title: string;
  targetAudience: TargetAudience;
  qrToken?: string | null;
  qrPayload: string;
  qrExpiresAt?: Date | string | null;
  createdAt: Date | string;
}

/**
 * Mengambil payload QR Code untuk rapat tertentu (Hanya ADMIN dan OPERATOR).
 * Format QR standar: JSON string { type: "SABA_ATTENDANCE", meetingId: "..." }
 */
export async function getMeetingQrSession(
  meetingId: string
): Promise<ActionResponse<MeetingSessionData>> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        title: true,
        targetAudience: true,
        qrToken: true,
        qrExpiresAt: true,
        createdAt: true,
      },
    });

    if (!meeting) {
      return {
        success: false,
        message: "Sesi rapat tidak ditemukan.",
      };
    }

    const qrPayload = JSON.stringify({
      type: "SABA_ATTENDANCE",
      meetingId: meeting.id,
    });

    return {
      success: true,
      message: "Data QR rapat berhasil dimuat.",
      data: {
        id: meeting.id,
        title: meeting.title,
        targetAudience: meeting.targetAudience,
        qrPayload,
        qrToken: meeting.qrToken,
        qrExpiresAt: meeting.qrExpiresAt,
        createdAt: meeting.createdAt,
      },
    };
  } catch (error) {
    console.error("[Presensi Action] getMeetingQrSession error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal memuat QR sesi rapat.",
    };
  }
}

/**
 * Mengambil atau membuat sesi rapat baru khusus untuk ADMIN dan OPERATOR.
 * Menghasilkan token QR unik yang valid untuk presensi hari ini.
 */
export async function getActiveOrCreateMeetingSession(): Promise<
  ActionResponse<MeetingSessionData>
> {
  try {
    const user = await assertRole([Role.ADMIN, Role.OPERATOR]);

    // Cari sesi rapat aktif yang dibuat dalam 8 jam terakhir dengan token QR yang valid
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

    let activeMeeting = await prisma.meeting.findFirst({
      where: {
        createdAt: { gte: eightHoursAgo },
        qrToken: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        targetAudience: true,
        qrToken: true,
        qrExpiresAt: true,
        createdAt: true,
      },
    });

    if (!activeMeeting || !activeMeeting.qrToken) {
      // Ambil tahun ajaran aktif
      let academicYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true },
      });

      if (!academicYear) {
        academicYear = await prisma.academicYear.findFirst({
          orderBy: { createdAt: "desc" },
        });
      }

      if (!academicYear) {
        return {
          success: false,
          message: "Tahun ajaran aktif belum dikonfigurasi dalam sistem.",
        };
      }

      const generatedToken = `SE-MEET-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase()}`;

      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 jam

      const newMeeting = await prisma.meeting.create({
        data: {
          academicYearId: academicYear.id,
          title: "Rapat Pleno & Presensi Organisasi",
          targetAudience: TargetAudience.ALL,
          qrToken: generatedToken,
          qrExpiresAt: expiresAt,
          date: new Date(),
          createdById: user.id,
        },
        select: {
          id: true,
          title: true,
          targetAudience: true,
          qrToken: true,
          qrExpiresAt: true,
          createdAt: true,
        },
      });

      activeMeeting = newMeeting;
    }

    revalidatePath("/dashboard");
    revalidatePath("/acara");

    const qrPayload = JSON.stringify({
      type: "SABA_ATTENDANCE",
      meetingId: activeMeeting.id,
    });

    return {
      success: true,
      message: "Sesi rapat aktif berhasil dimuat.",
      data: {
        id: activeMeeting.id,
        title: activeMeeting.title,
        targetAudience: activeMeeting.targetAudience,
        qrPayload,
        qrToken: activeMeeting.qrToken,
        qrExpiresAt: activeMeeting.qrExpiresAt,
        createdAt: activeMeeting.createdAt,
      },
    };
  } catch (error) {
    console.error("[Presensi Action] getActiveOrCreateMeetingSession error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal membuat atau memuat sesi rapat.",
    };
  }
}

export interface AttendanceRecordResult {
  meetingId: string;
  meetingTitle: string;
  pointsAwarded: number;
  attendancePercentage: number;
}

/**
 * Mencatat presensi kehadiran rapat berdasarkan meetingId spesifik.
 * Memverifikasi validitas meeting, batasan privasi angkatan (TargetAudience),
 * dan menghitung persentase kehadiran user yang akurat.
 */
export async function recordAttendance(
  meetingId: string
): Promise<ActionResponse<AttendanceRecordResult>> {
  try {
    const user = await assertAuthenticated();

    if (!meetingId || meetingId.trim() === "") {
      return {
        success: false,
        message: "ID rapat presensi tidak valid.",
      };
    }

    const cleanMeetingId = meetingId.trim();

    // Cari data meeting berdasarkan ID (atau token QR fallback jika ada legacy token)
    let meeting = await prisma.meeting.findUnique({
      where: { id: cleanMeetingId },
      include: {
        academicYear: true,
      },
    });

    if (!meeting) {
      // Coba cari via qrToken jika cleanMeetingId merupakan format legacy token
      meeting = await prisma.meeting.findFirst({
        where: { qrToken: cleanMeetingId },
        include: {
          academicYear: true,
        },
      });
    }

    if (!meeting) {
      return {
        success: false,
        message: "Sesi rapat tidak ditemukan atau QR presensi tidak valid.",
      };
    }

    // Validasi masa berlaku jika ada batasan waktu
    if (meeting.qrExpiresAt && new Date() > new Date(meeting.qrExpiresAt)) {
      return {
        success: false,
        message: "Sesi QR rapat telah kedaluwarsa.",
      };
    }

    // Validasi Hak Akses Privasi Angkatan (TargetAudience)
    const isEligible = isUserEligibleForAudience(
      meeting.targetAudience,
      user.role,
      user.classGrade
    );

    if (!isEligible) {
      const targetLabel =
        meeting.targetAudience === TargetAudience.GEN_20
          ? "Kelas 11 (Gen 20)"
          : meeting.targetAudience === TargetAudience.GEN_21
          ? "Kelas 10 (Gen 21)"
          : "Angkatan Khusus";

      return {
        success: false,
        message: `Rapat ini khusus untuk ${targetLabel}. Akun Anda tidak termasuk dalam sasaran rapat ini.`,
      };
    }

    // Cek apakah user sudah pernah mencatat presensi di rapat ini
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        meetingId_userId: {
          meetingId: meeting.id,
          userId: user.id,
        },
      },
    });

    if (existingAttendance) {
      return {
        success: false,
        message: `Anda sudah pernah mencatat presensi untuk rapat "${meeting.title}".`,
      };
    }

    // Catat kehadiran dan tambahkan +10 XP ke poin bulanan dan total poin
    await prisma.$transaction(async (tx) => {
      await tx.attendance.create({
        data: {
          meetingId: meeting.id,
          userId: user.id,
          status: AttendanceStatus.HADIR,
          checkedAt: new Date(),
          isManual: false,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          monthlyPoints: { increment: 10 },
          totalPoints: { increment: 10 },
        },
      });
    });

    // Hitung persentase kehadiran user yang akurat berdasarkan rapat yang berhak mereka ikuti
    const allowedAudiences = getAllowedTargetAudiences(user.role, user.classGrade);
    const audienceFilter = allowedAudiences !== null
      ? { targetAudience: { in: allowedAudiences } }
      : {};

    const [totalEligibleMeetings, userAttendedCount] = await Promise.all([
      prisma.meeting.count({
        where: {
          ...(meeting.academicYearId ? { academicYearId: meeting.academicYearId } : {}),
          ...audienceFilter,
        },
      }),
      prisma.attendance.count({
        where: {
          userId: user.id,
          status: AttendanceStatus.HADIR,
          meeting: {
            ...(meeting.academicYearId ? { academicYearId: meeting.academicYearId } : {}),
            ...audienceFilter,
          },
        },
      }),
    ]);

    const attendancePercentage =
      totalEligibleMeetings > 0
        ? Math.round((userAttendedCount / totalEligibleMeetings) * 100)
        : 100;

    revalidatePath("/dashboard");
    revalidatePath("/acara");
    if (meeting.eventId) {
      revalidatePath(`/acara/${meeting.eventId}`);
    }

    return {
      success: true,
      message: `Berhasil mencatat kehadiran untuk rapat ${meeting.title}`,
      data: {
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        pointsAwarded: 10,
        attendancePercentage,
      },
    };
  } catch (error) {
    console.error("[Presensi Action] recordAttendance error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mencatat kehadiran.",
    };
  }
}

/**
 * Mencatat presensi anggota ketika QR dipindai.
 * Mendukung pembacaan payload JSON { type: "SABA_ATTENDANCE", meetingId: "..." }
 * maupun token QR legacy.
 */
export async function claimAttendance(
  scannedPayload: string
): Promise<ActionResponse<AttendanceRecordResult>> {
  try {
    if (!scannedPayload || scannedPayload.trim() === "") {
      return {
        success: false,
        message: "Data pemindaian QR tidak boleh kosong.",
      };
    }

    let meetingId = scannedPayload.trim();

    // Coba parsing jika QR berupa JSON payload
    try {
      const parsed = JSON.parse(scannedPayload);
      if (parsed && typeof parsed === "object" && parsed.meetingId) {
        meetingId = parsed.meetingId;
      }
    } catch {
      // Bukan JSON, gunakan string langsung sebagai ID atau token
    }

    return await recordAttendance(meetingId);
  } catch (error) {
    console.error("[Presensi Action] claimAttendance error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memproses presensi rapat.",
    };
  }
}

