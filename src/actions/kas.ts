"use server";

import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import {
  Role,
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
} from "@prisma/client";

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  description: string;
  incomeCategory?: IncomeCategory;
  expenseCategory?: ExpenseCategory;
  proofUrl?: string;
  date?: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Mencatat transaksi umum pemasukan atau pengeluaran baru
 * Hanya dapat diakses oleh: BENDAHARA, ADMIN, OPERATOR
 */
export async function createCashTransaction(
  input: CreateTransactionInput
): Promise<ActionResponse> {
  try {
    const user = await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    if (!input.amount || input.amount <= 0) {
      return {
        success: false,
        message: "Nominal transaksi harus lebih dari Rp 0.",
      };
    }

    if (!input.description || input.description.trim() === "") {
      return {
        success: false,
        message: "Deskripsi transaksi wajib diisi.",
      };
    }

    // Ambil tahun ajaran aktif saat ini
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

    const transaction = await prisma.transaction.create({
      data: {
        academicYearId: academicYear.id,
        type: input.type,
        amount: Math.round(input.amount),
        description: input.description.trim(),
        incomeCategory:
          input.type === TransactionType.INCOME ? input.incomeCategory : null,
        expenseCategory:
          input.type === TransactionType.EXPENSE ? input.expenseCategory : null,
        proofUrl: input.proofUrl?.trim() || null,
        date: input.date ? new Date(input.date) : new Date(),
        createdById: user.id,
      },
    });

    revalidatePath("/kas");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Transaksi ${
        input.type === TransactionType.INCOME ? "pemasukan" : "pengeluaran"
      } berhasil dicatat.`,
      data: transaction,
    };
  } catch (error) {
    console.error("[Kas Action] createCashTransaction error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mencatat transaksi kas.",
    };
  }
}

/**
 * Menandai status lunas atau membatalkan iuran anggota per periode.
 * Secara atomik membuat/menghapus catatan KasPayment DAN catatan Transaction Buku Kas Publik.
 */
export async function toggleDuesPayment(
  userId: string,
  kasPeriodId: string
): Promise<ActionResponse<{ isPaid: boolean }>> {
  try {
    const currentUser = await assertRole([
      Role.BENDAHARA,
      Role.ADMIN,
      Role.OPERATOR,
    ]);

    const [kasPeriod, targetMember] = await Promise.all([
      prisma.kasPeriod.findUnique({
        where: { id: kasPeriodId },
        include: { academicYear: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
      }),
    ]);

    if (!kasPeriod) {
      return {
        success: false,
        message: "Periode kas tidak ditemukan.",
      };
    }

    if (!targetMember) {
      return {
        success: false,
        message: "Data anggota tidak ditemukan.",
      };
    }

    const txDescription = `Iuran ${kasPeriod.name} - ${targetMember.name}`;

    // Cek apakah pembayaran sudah ada sebelumnya
    const existingPayment = await prisma.kasPayment.findUnique({
      where: {
        kasPeriodId_userId: {
          kasPeriodId,
          userId,
        },
      },
    });

    if (existingPayment) {
      // BATALKAN LUNAS: Hapus KasPayment dan Hapus Transaction kas rutin terkait secara atomik
      await prisma.$transaction(async (tx) => {
        await tx.kasPayment.delete({
          where: { id: existingPayment.id },
        });

        // Cari transaksi pemasukan kas rutin yang cocok dengan deskripsi
        const matchingTx = await tx.transaction.findFirst({
          where: {
            academicYearId: kasPeriod.academicYearId,
            type: TransactionType.INCOME,
            incomeCategory: IncomeCategory.KAS_RUTIN,
            description: txDescription,
          },
          orderBy: { createdAt: "desc" },
        });

        if (matchingTx) {
          await tx.transaction.delete({
            where: { id: matchingTx.id },
          });
        }
      });

      revalidatePath("/kas");
      revalidatePath("/dashboard");

      return {
        success: true,
        message: `Status iuran ${targetMember.name} (P${kasPeriod.periodNumber}) dibatalkan.`,
        data: { isPaid: false },
      };
    } else {
      // TANDAI LUNAS: Buat KasPayment dan Buat Transaction pemasukan secara atomik
      await prisma.$transaction(async (tx) => {
        await tx.kasPayment.create({
          data: {
            kasPeriodId,
            userId,
            amountPaid: kasPeriod.amount,
            recordedBy: currentUser.name || currentUser.email || "Bendahara",
            paidAt: new Date(),
          },
        });

        await tx.transaction.create({
          data: {
            academicYearId: kasPeriod.academicYearId,
            type: TransactionType.INCOME,
            incomeCategory: IncomeCategory.KAS_RUTIN,
            amount: kasPeriod.amount,
            description: txDescription,
            createdById: currentUser.id,
            date: new Date(),
          },
        });
      });

      revalidatePath("/kas");
      revalidatePath("/dashboard");

      return {
        success: true,
        message: `Pembayaran iuran ${targetMember.name} (P${kasPeriod.periodNumber}) berhasil dicatat.`,
        data: { isPaid: true },
      };
    }
  } catch (error) {
    console.error("[Kas Action] toggleDuesPayment error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status pembayaran iuran.",
    };
  }
}

/**
 * Mencatat pembayaran di muka (Advance Payment) untuk beberapa periode sekaligus.
 * Mengintegrasikan pembuatan KasPayment dan Transaction pemasukan untuk setiap periode.
 */
export async function recordAdvancePayment(
  userId: string,
  periodIds: string[]
): Promise<ActionResponse> {
  try {
    const currentUser = await assertRole([
      Role.BENDAHARA,
      Role.ADMIN,
      Role.OPERATOR,
    ]);

    if (!periodIds || periodIds.length === 0) {
      return {
        success: false,
        message: "Pilih minimal 1 periode kas.",
      };
    }

    const [targetMember, periods] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.kasPeriod.findMany({
        where: { id: { in: periodIds } },
        orderBy: { periodNumber: "asc" },
      }),
    ]);

    if (!targetMember) {
      return {
        success: false,
        message: "Anggota tidak ditemukan.",
      };
    }

    let recordedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const period of periods) {
        const existing = await tx.kasPayment.findUnique({
          where: {
            kasPeriodId_userId: {
              kasPeriodId: period.id,
              userId,
            },
          },
        });

        if (!existing) {
          const txDescription = `Iuran ${period.name} - ${targetMember.name}`;

          await tx.kasPayment.create({
            data: {
              kasPeriodId: period.id,
              userId,
              amountPaid: period.amount,
              recordedBy: currentUser.name || currentUser.email || "Bendahara",
              paidAt: new Date(),
            },
          });

          await tx.transaction.create({
            data: {
              academicYearId: period.academicYearId,
              type: TransactionType.INCOME,
              incomeCategory: IncomeCategory.KAS_RUTIN,
              amount: period.amount,
              description: txDescription,
              createdById: currentUser.id,
              date: new Date(),
            },
          });

          recordedCount++;
        }
      }
    });

    revalidatePath("/kas");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Setoran kas di muka (${recordedCount} periode) untuk ${targetMember.name} berhasil disimpan.`,
    };
  } catch (error) {
    console.error("[Kas Action] recordAdvancePayment error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mencatat pembayaran di muka.",
    };
  }
}
