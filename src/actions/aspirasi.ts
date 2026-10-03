"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated, assertRole, assertActiveMember } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface CreatePollInput {
  question: string;
  description?: string;
  options: string[];
  closesAt?: string;
}

export type AspirationCategoryType =
  | "IDE_KEGIATAN"
  | "SARAN_PENGURUS"
  | "DISKUSI_UMUM"
  | "BUG_SISTEM";

export type AspirationScopeType = "PUBLIC" | "PRIVATE_ADMIN";

export type AspirationStatusType = "OPEN" | "RESPONDED" | "RESOLVED";

export interface SubmitAspirationInput {
  title: string;
  content: string;
  category?: AspirationCategoryType;
  targetScope?: AspirationScopeType;
  isAnonymous?: boolean;
}

/**
 * Membuat Polling Baru
 * Wewenang: OPERATOR, ADMIN, BENDAHARA, MEMBER
 */
export async function createPoll(
  input: CreatePollInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await assertRole([
      Role.MEMBER,
      Role.BENDAHARA,
      Role.ADMIN,
      Role.OPERATOR,
    ]);

    if (!input.question || input.question.trim() === "") {
      return {
        success: false,
        message: "Pertanyaan polling wajib diisi.",
      };
    }

    const validOptions = input.options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (validOptions.length < 2) {
      return {
        success: false,
        message: "Polling wajib memiliki minimal 2 pilihan jawaban.",
      };
    }

    // Ambil tahun ajaran aktif jika ada
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });

    const closesAtDate = input.closesAt ? new Date(input.closesAt) : null;

    const newPoll = await prisma.poll.create({
      data: {
        academicYearId: activeAcademicYear?.id || null,
        question: input.question.trim(),
        description: input.description?.trim() || null,
        isActive: true,
        closesAt: closesAtDate,
        expiresAt: closesAtDate,
        createdById: user.id,
        options: {
          create: validOptions.map((optionText) => ({
            optionText,
          })),
        },
      },
    });

    revalidatePath("/aspirasi");
    revalidatePath("/suara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Polling organisasi berhasil dibuat.",
      data: { id: newPoll.id },
    };
  } catch (error) {
    console.error("Gagal membuat polling:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Memberikan suara pada polling (Vote) + 5 XP Reward
 * Wewenang: Anggota aktif
 */
export async function votePoll(
  pollId: string,
  optionId: string
): Promise<ActionResponse> {
  try {
    const user = await assertActiveMember();

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      return {
        success: false,
        message: "Polling tidak ditemukan.",
      };
    }

    if (!poll.isActive) {
      return {
        success: false,
        message: "Polling ini sudah ditutup dan tidak menerima suara lagi.",
      };
    }

    const expiryTime = poll.expiresAt || poll.closesAt;
    if (expiryTime && new Date() > new Date(expiryTime)) {
      return {
        success: false,
        message: "Batas waktu voting pada polling ini telah berakhir.",
      };
    }

    // Validasi opsi jawaban
    const optionExists = poll.options.some((opt) => opt.id === optionId);
    if (!optionExists) {
      return {
        success: false,
        message: "Pilihan jawaban tidak valid untuk polling ini.",
      };
    }

    // Validasi satu suara per user per poll
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        pollId,
        userId: user.id,
      },
    });

    if (existingVote) {
      return {
        success: false,
        message: "Anda sudah pernah memberikan suara pada polling ini.",
      };
    }

    // Catat vote
    await prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId: user.id,
      },
    });

    // Tambahkan reward +5 XP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        monthlyPoints: { increment: 5 },
        totalPoints: { increment: 5 },
      },
    });

    revalidatePath("/aspirasi");
    revalidatePath("/suara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Suara Anda berhasil tercatat! (+5 XP ditambahkan)",
    };
  } catch (error) {
    console.error("Gagal melakukan vote:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menutup polling aktif
 * Wewenang: Pembuat Polling (Author), OPERATOR, ADMIN
 */
export async function closePoll(pollId: string): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticated();
    if (user.role === Role.GUEST) {
      return {
        success: false,
        message: "Akun tamu tidak memiliki wewenang untuk menutup polling.",
      };
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return {
        success: false,
        message: "Polling tidak ditemukan.",
      };
    }

    const isAuthor = poll.createdById === user.id;
    const isPrivileged =
      user.role === Role.ADMIN || user.role === Role.OPERATOR;

    if (!isAuthor && !isPrivileged) {
      return {
        success: false,
        message:
          "Hanya pembuat polling atau pengurus (Admin/Operator) yang dapat menutup polling ini.",
      };
    }

    await prisma.poll.update({
      where: { id: pollId },
      data: { isActive: false },
    });

    revalidatePath("/aspirasi");
    revalidatePath("/suara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Polling berhasil ditutup.",
    };
  } catch (error) {
    console.error("Gagal menutup polling:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Mengirim aspirasi atau usulan baru (+10 XP)
 * Mendukung targetScope: PUBLIC (komunitas) atau PRIVATE_ADMIN (khusus admin/pengembang)
 * Wewenang: Anggota aktif
 */
export async function submitAspiration(
  input: SubmitAspirationInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await assertActiveMember();

    if (!input.title || input.title.trim() === "") {
      return {
        success: false,
        message: "Judul aspirasi wajib diisi.",
      };
    }

    if (!input.content || input.content.trim() === "") {
      return {
        success: false,
        message: "Isi saran atau usulan tidak boleh kosong.",
      };
    }

    const targetScope =
      input.targetScope === "PRIVATE_ADMIN" ? "PRIVATE_ADMIN" : "PUBLIC";

    // Jika privat ke admin, otomatis kategorikan sebagai BUG_SISTEM
    const category =
      targetScope === "PRIVATE_ADMIN"
        ? "BUG_SISTEM"
        : input.category || "DISKUSI_UMUM";

    const newAspiration = await prisma.aspiration.create({
      data: {
        title: input.title.trim(),
        content: input.content.trim(),
        category,
        targetScope,
        isAnonymous: Boolean(input.isAnonymous),
        status: "OPEN",
        senderId: user.id,
      },
    });

    // Tambahkan reward +10 XP atas kontribusi aspirasi
    await prisma.user.update({
      where: { id: user.id },
      data: {
        monthlyPoints: { increment: 10 },
        totalPoints: { increment: 10 },
      },
    });

    revalidatePath("/aspirasi");
    revalidatePath("/suara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message:
        targetScope === "PRIVATE_ADMIN"
          ? "Laporan kendala privat berhasil dikirim ke Pengurus/Pengembang! (+10 XP)"
          : "Ide & aspirasi publik berhasil dibagikan ke komunitas! (+10 XP)",
      data: { id: newAspiration.id },
    };
  } catch (error) {
    console.error("Gagal mengirim aspirasi:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Memberikan tanggapan resmi pengurus dan memperbarui status aspirasi
 * Wewenang:
 * - Aspirasi Publik: OPERATOR, ADMIN
 * - Aspirasi Privat (Kode Rahasia / Bug): KHUSUS OPERATOR
 */
export async function respondAspiration(
  aspirationId: string,
  adminReply: string,
  status?: AspirationStatusType
): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticated();

    const aspiration = await prisma.aspiration.findUnique({
      where: { id: aspirationId },
    });

    if (!aspiration) {
      return {
        success: false,
        message: "Aspirasi tidak ditemukan.",
      };
    }

    if (aspiration.targetScope === "PRIVATE_ADMIN") {
      if (user.role !== Role.OPERATOR) {
        return {
          success: false,
          message:
            "FORBIDDEN: Hanya Operator/Pengembang yang memiliki akses membaca dan merespon aspirasi berkategori privat.",
        };
      }
    } else {
      if (user.role !== Role.ADMIN && user.role !== Role.OPERATOR) {
        return {
          success: false,
          message: "FORBIDDEN: Hanya Admin atau Operator yang dapat menanggapi aspirasi.",
        };
      }
    }

    const finalStatus =
      status || (aspiration.targetScope === "PRIVATE_ADMIN" ? "RESOLVED" : "RESPONDED");

    await prisma.aspiration.update({
      where: { id: aspirationId },
      data: {
        adminReply: adminReply.trim() || null,
        status: finalStatus,
      },
    });

    revalidatePath("/aspirasi");
    revalidatePath("/suara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Tanggapan resmi berhasil disimpan.",
    };
  } catch (error) {
    console.error("Gagal menanggapi aspirasi:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menghapus Polling beserta opsi dan riwayat suara (Cascade Delete)
 * Wewenang: Pembuat Polling (Author), OPERATOR, ADMIN
 */
export async function deletePoll(pollId: string): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticated();
    if (user.role === Role.GUEST) {
      return {
        success: false,
        message: "Akun tamu tidak memiliki wewenang untuk menghapus polling.",
      };
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return {
        success: false,
        message: "Polling tidak ditemukan.",
      };
    }

    const isAuthor = poll.createdById === user.id;
    const isPrivileged =
      user.role === Role.ADMIN || user.role === Role.OPERATOR;

    if (!isAuthor && !isPrivileged) {
      return {
        success: false,
        message:
          "Hanya pembuat polling atau pengurus (Admin/Operator) yang dapat menghapus polling ini.",
      };
    }

    // Jalankan transaksi penghapusan kaskade eksplisit untuk keandalan maksimal
    await prisma.$transaction(async (tx) => {
      await tx.pollVote.deleteMany({
        where: { pollId },
      });
      await tx.pollOption.deleteMany({
        where: { pollId },
      });
      await tx.poll.delete({
        where: { id: pollId },
      });
    });

    revalidatePath("/aspirasi");
    revalidatePath("/suara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Polling dan seluruh riwayat suara berhasil dibersihkan.",
    };
  } catch (error) {
    console.error("Gagal menghapus polling:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menghapus Kotak Aspirasi
 * Wewenang:
 * - Aspirasi Publik: OPERATOR, ADMIN, atau Pemilik Aspirasi (Sender)
 * - Aspirasi Privat: KHUSUS OPERATOR atau Pemilik Aspirasi (Sender)
 */
export async function deleteAspiration(
  aspirationId: string
): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticated();

    const aspiration = await prisma.aspiration.findUnique({
      where: { id: aspirationId },
    });

    if (!aspiration) {
      return {
        success: false,
        message: "Aspirasi tidak ditemukan.",
      };
    }

    const isPrivate = aspiration.targetScope === "PRIVATE_ADMIN";
    const isPrivileged = isPrivate
      ? user.role === Role.OPERATOR
      : user.role === Role.ADMIN || user.role === Role.OPERATOR;
    const isOwner = aspiration.senderId === user.id;

    if (!isPrivileged && !isOwner) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk menghapus aspirasi ini.",
      };
    }

    await prisma.aspiration.delete({
      where: { id: aspirationId },
    });

    revalidatePath("/aspirasi");
    revalidatePath("/suara");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Aspirasi berhasil dihapus.",
    };
  } catch (error) {
    console.error("Gagal menghapus aspirasi:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

