"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated, assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Role, AttendanceStatus } from "@prisma/client";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface MeetingSessionData {
  id: string;
  title: string;
  qrToken: string;
  qrExpiresAt: Date | string | null;
  createdAt: Date | string;
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
          qrToken: generatedToken,
          qrExpiresAt: expiresAt,
          date: new Date(),
          createdById: user.id,
        },
        select: {
          id: true,
          title: true,
          qrToken: true,
          qrExpiresAt: true,
          createdAt: true,
        },
      });

      activeMeeting = newMeeting;
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Sesi rapat aktif berhasil dimuat.",
      data: {
        id: activeMeeting.id,
        title: activeMeeting.title,
        qrToken: activeMeeting.qrToken!,
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

/**
 * Mencatat presensi anggota ketika QR berhasil dipindai (+10 XP)
 */
export async function claimAttendance(
  qrToken: string
): Promise<ActionResponse<{ pointsAwarded: number }>> {
  try {
    const user = await assertAuthenticated();

    if (!qrToken || qrToken.trim() === "") {
      return {
        success: false,
        message: "Token QR tidak valid.",
      };
    }

    const meeting = await prisma.meeting.findFirst({
      where: { qrToken: qrToken.trim() },
    });

    if (!meeting) {
      return {
        success: false,
        message: "Sesi rapat tidak ditemukan atau QR tidak valid.",
      };
    }

    if (meeting.qrExpiresAt && new Date() > new Date(meeting.qrExpiresAt)) {
      return {
        success: false,
        message: "Sesi QR rapat telah kedaluwarsa.",
      };
    }

    // Cek apakah pengguna sudah pernah presensi di rapat ini
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
        message: "Anda sudah melakukan presensi pada sesi rapat ini.",
      };
    }

    // Catat kehadiran dan tambahkan +10 XP
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

    revalidatePath("/dashboard");
    revalidatePath("/acara");

    return {
      success: true,
      message: "Kehadiran terverifikasi! +10 XP telah ditambahkan ke akun Anda.",
      data: { pointsAwarded: 10 },
    };
  } catch (error) {
    console.error("[Presensi Action] claimAttendance error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mencatat presensi.",
    };
  }
}
