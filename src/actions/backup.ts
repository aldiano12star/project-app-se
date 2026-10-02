"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { Role } from "@prisma/client";

export interface BackupResponse {
  success: boolean;
  message: string;
  filename?: string;
  csvContent?: string;
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Kelas 10 (Gen 21)";
  if (grade === "KELAS_11") return "Kelas 11 (Gen 20)";
  if (grade === "KELAS_12") return "Kelas 12 (Gen 19)";
  return grade.replace("_", " ");
}

function escapeCSV(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Ekspor Data Anggota Organisasi ke CSV dengan UTF-8 BOM
 * Wewenang: ADMIN & OPERATOR
 */
export async function exportMembersCSV(): Promise<BackupResponse> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    const users = await prisma.user.findMany({
      orderBy: [{ classGrade: "desc" }, { name: "asc" }],
      select: {
        nisn: true,
        name: true,
        email: true,
        classGrade: true,
        mainDivision: true,
        role: true,
        status: true,
        totalPoints: true,
        noWhatsapp: true,
        createdAt: true,
      },
    });

    const headers = [
      "NISN",
      "Nama Lengkap",
      "Email",
      "Kelas / Angkatan",
      "Divisi Utama",
      "Role",
      "Status",
      "Total XP",
      "No WhatsApp",
      "Tanggal Bergabung",
    ];

    const rows = users.map((u) => [
      escapeCSV(u.nisn || "-"),
      escapeCSV(u.name),
      escapeCSV(u.email),
      escapeCSV(formatGrade(u.classGrade)),
      escapeCSV(u.mainDivision),
      escapeCSV(u.role),
      escapeCSV(u.status),
      escapeCSV(u.totalPoints),
      escapeCSV(u.noWhatsapp || "-"),
      escapeCSV(u.createdAt.toISOString().split("T")[0]),
    ]);

    const csvBody = [headers.map(escapeCSV).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    // Tambahkan UTF-8 BOM (﻿) untuk kompatibilitas sempurna Microsoft Excel
    const csvContent = "﻿" + csvBody;
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `SabaExploIT_Anggota_${dateStr}.csv`;

    return {
      success: true,
      message: `Berhasil mengekspor data ${users.length} anggota.`,
      filename,
      csvContent,
    };
  } catch (error) {
    console.error("[Backup Action] exportMembersCSV error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengekspor data anggota.",
    };
  }
}

/**
 * Ekspor Rekap Kehadiran Rapat & Kegiatan ke CSV dengan UTF-8 BOM
 * Wewenang: ADMIN & OPERATOR
 */
export async function exportAttendanceCSV(): Promise<BackupResponse> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    const attendances = await prisma.attendance.findMany({
      orderBy: { checkedAt: "desc" },
      include: {
        meeting: {
          select: {
            title: true,
            date: true,
          },
        },
        user: {
          select: {
            name: true,
            nisn: true,
            classGrade: true,
            mainDivision: true,
          },
        },
      },
    });

    const headers = [
      "Judul Rapat / Kegiatan",
      "Tanggal Acara",
      "Nama Anggota",
      "NISN",
      "Kelas / Angkatan",
      "Divisi",
      "Status Kehadiran",
      "Waktu Presensi",
      "Metode Presensi",
    ];

    const rows = attendances.map((a) => [
      escapeCSV(a.meeting.title),
      escapeCSV(new Date(a.meeting.date).toISOString().split("T")[0]),
      escapeCSV(a.user.name),
      escapeCSV(a.user.nisn || "-"),
      escapeCSV(formatGrade(a.user.classGrade)),
      escapeCSV(a.user.mainDivision),
      escapeCSV(a.status),
      escapeCSV(new Date(a.checkedAt).toLocaleString("id-ID")),
      escapeCSV(a.isManual ? "Manual Pengurus" : "Pindai QR"),
    ]);

    const csvBody = [headers.map(escapeCSV).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const csvContent = "﻿" + csvBody;
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `SabaExploIT_Kehadiran_${dateStr}.csv`;

    return {
      success: true,
      message: `Berhasil mengekspor ${attendances.length} catatan kehadiran rapat.`,
      filename,
      csvContent,
    };
  } catch (error) {
    console.error("[Backup Action] exportAttendanceCSV error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengekspor rekap kehadiran.",
    };
  }
}

/**
 * Ekspor Buku Kas Organisasi (Pemasukan & Pengeluaran) ke CSV dengan UTF-8 BOM
 * Wewenang: ADMIN & OPERATOR
 */
export async function exportKasCSV(): Promise<BackupResponse> {
  try {
    await assertRole([Role.ADMIN, Role.OPERATOR]);

    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    const headers = [
      "Tanggal Transaksi",
      "Jenis Mutasi",
      "Kategori",
      "Nominal (Rp)",
      "Deskripsi / Uraian",
      "Bukti / Link Nota",
      "Pencatat Transaksi",
    ];

    const rows = transactions.map((t) => [
      escapeCSV(new Date(t.date).toISOString().split("T")[0]),
      escapeCSV(t.type === "INCOME" ? "PEMASUKAN" : "PENGELUARAN"),
      escapeCSV(t.incomeCategory || t.expenseCategory || "-"),
      escapeCSV(t.amount),
      escapeCSV(t.description),
      escapeCSV(t.proofUrl || "-"),
      escapeCSV(t.createdBy.name),
    ]);

    const csvBody = [headers.map(escapeCSV).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const csvContent = "﻿" + csvBody;
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `SabaExploIT_BukuKas_${dateStr}.csv`;

    return {
      success: true,
      message: `Berhasil mengekspor ${transactions.length} mutasi buku kas.`,
      filename,
      csvContent,
    };
  } catch (error) {
    console.error("[Backup Action] exportKasCSV error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengekspor buku kas.",
    };
  }
}
