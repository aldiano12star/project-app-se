"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated, assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Role, AttendanceStatus, TargetAudience } from "@prisma/client";
import {
  getAllowedTargetAudiences,
  isUserEligibleForAudience,
  buildAudienceFilter,
} from "@/utils/audience";
import { isTodayLocal } from "@/utils/eventStatus";

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
      return {
        success: false,
        message: "Tidak ada sesi rapat aktif yang ditemukan. Buat jadwal rapat terlebih dahulu.",
      };
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
        targetUsers: {
          select: { id: true },
        },
      },
    });

    if (!meeting) {
      // Coba cari via qrToken jika cleanMeetingId merupakan format legacy token
      meeting = await prisma.meeting.findFirst({
        where: { qrToken: cleanMeetingId },
        include: {
          academicYear: true,
          targetUsers: {
            select: { id: true },
          },
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

    // Validasi Keamanan: Presensi QR hanya valid pada hari H rapat (perbandingan tanggal YYYY-MM-DD)
    if (!isTodayLocal(meeting.date)) {
      return {
        success: false,
        message: "Presensi gagal: QR hanya valid pada hari H rapat.",
      };
    }

    // Validasi Hak Akses Privasi Angkatan / Peserta Khusus (TargetAudience)
    const isEligible = isUserEligibleForAudience(
      meeting.targetAudience,
      user.role,
      user.classGrade,
      user.id,
      meeting.targetUsers
    );

    if (!isEligible) {
      return {
        success: false,
        message:
          "Akses Ditolak: Anda bukan peserta yang terdaftar untuk sesi rapat ini.",
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

    // Catat kehadiran dan tambahkan +10 XP ke poin bulanan dan total poin (Kecuali KOLABORATOR)
    const shouldAwardPoints = user.role !== Role.KOLABORATOR;

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

      if (shouldAwardPoints) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            monthlyPoints: { increment: 10 },
            totalPoints: { increment: 10 },
          },
        });
      }
    });

    // Hitung persentase kehadiran user yang akurat berdasarkan rapat yang berhak mereka ikuti (termasuk CUSTOM)
    const audienceFilter = buildAudienceFilter(user.role, user.classGrade, user.id);

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

/**
 * Mengubah status kehadiran anggota secara manual untuk suatu sesi rapat (Admin/Operator).
 * Mendukung status: HADIR, SAKIT, IZIN, ALPHA
 */
export async function updateAttendanceStatus(
  meetingId: string,
  userId: string,
  status: AttendanceStatus
): Promise<ActionResponse> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    if (!meetingId || !userId) {
      return {
        success: false,
        message: "ID rapat dan ID pengguna wajib disertakan.",
      };
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, title: true, eventId: true },
    });

    if (!meeting) {
      return {
        success: false,
        message: "Sesi rapat tidak ditemukan.",
      };
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        meetingId_userId: {
          meetingId,
          userId,
        },
      },
      create: {
        meetingId,
        userId,
        status,
        isManual: true,
        checkedAt: new Date(),
      },
      update: {
        status,
        isManual: true,
      },
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/rapat/${meetingId}`);
    if (meeting.eventId) {
      revalidatePath(`/acara/${meeting.eventId}`);
    }
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Status kehadiran berhasil diubah menjadi ${status}.`,
      data: attendance,
    };
  } catch (error) {
    console.error("[Presensi Action] updateAttendanceStatus error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal memperbarui status kehadiran.",
    };
  }
}

/**
 * Menutup sesi presensi dan secara massal menetapkan status ALPHA
 * kepada seluruh anggota sasaran yang belum melakukan presensi.
 */
export async function finalizeAttendance(
  meetingId: string
): Promise<ActionResponse<{ count: number }>> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    if (!meetingId) {
      return {
        success: false,
        message: "ID sesi rapat tidak valid.",
      };
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        targetUsers: { select: { id: true } },
        attendances: { select: { userId: true } },
      },
    });

    if (!meeting) {
      return {
        success: false,
        message: "Sesi rapat tidak ditemukan.",
      };
    }

    // Tentukan daftar seluruh anggota yang berhak hadir berdasarkan targetAudience
    let eligibleUserIds: string[] = [];

    if (meeting.targetAudience === TargetAudience.CUSTOM) {
      eligibleUserIds = meeting.targetUsers.map((u) => u.id);
    } else if (meeting.targetAudience === TargetAudience.GEN_20) {
      const users = await prisma.user.findMany({
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
        select: { id: true },
      });
      eligibleUserIds = users.map((u) => u.id);
    } else if (meeting.targetAudience === TargetAudience.GEN_21) {
      const users = await prisma.user.findMany({
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
        select: { id: true },
      });
      eligibleUserIds = users.map((u) => u.id);
    } else {
      // ALL: Seluruh anggota aktif selain GUEST dan KOLABORATOR
      const users = await prisma.user.findMany({
        where: {
          status: "ACTIVE",
          role: { notIn: [Role.GUEST, Role.KOLABORATOR] },
        },
        select: { id: true },
      });
      eligibleUserIds = users.map((u) => u.id);
    }

    // Identifikasi anggota yang belum memiliki catatan presensi
    const attendedSet = new Set(meeting.attendances.map((a) => a.userId));
    const missingUserIds = eligibleUserIds.filter((id) => !attendedSet.has(id));

    if (missingUserIds.length === 0) {
      return {
        success: true,
        message: "Semua peserta yang berhak telah memiliki catatan kehadiran.",
        data: { count: 0 },
      };
    }

    const now = new Date();
    await prisma.attendance.createMany({
      data: missingUserIds.map((uid) => ({
        meetingId: meeting.id,
        userId: uid,
        status: AttendanceStatus.ALPHA,
        isManual: true,
        checkedAt: now,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/acara");
    revalidatePath(`/acara/rapat/${meetingId}`);
    if (meeting.eventId) {
      revalidatePath(`/acara/${meeting.eventId}`);
    }
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Presensi ditutup. Sebanyak ${missingUserIds.length} anggota yang tidak hadir ditandai Alfa.`,
      data: { count: missingUserIds.length },
    };
  } catch (error) {
    console.error("[Presensi Action] finalizeAttendance error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menutup presensi rapat.",
    };
  }
}

