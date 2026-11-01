"use server";

import { prisma } from "@/lib/prisma";
import { assertRole, assertAuthenticated } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Role, TransactionType, TransactionCategory } from "@prisma/client";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface RealMoneySummary {
  totalIncome: number;
  totalExpense: number;
  realBalance: number;
}

/**
 * Menghitung Total Uang Kas Riil Organisasi.
 * Total Uang Riil = (Sum of all INCOME amounts) - (Sum of all EXPENSE amounts).
 * Catatan Fintech: BILL_DEDUCTION hanya memotong saldo virtual anggota dan TIDAK mempengaruhi uang riil fisik!
 */
export async function calculateRealMoney(): Promise<RealMoneySummary> {
  try {
    const [incomeAggregate, expenseAggregate] = await Promise.all([
      prisma.ledgerTransaction.aggregate({
        where: { type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.ledgerTransaction.aggregate({
        where: { type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAggregate._sum.amount || 0;
    const totalExpense = expenseAggregate._sum.amount || 0;
    const realBalance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      realBalance,
    };
  } catch (error) {
    console.error("[Kas Action] calculateRealMoney error:", error);
    return {
      totalIncome: 0,
      totalExpense: 0,
      realBalance: 0,
    };
  }
}

/**
 * 1. RECORD DEPOSIT (Setoran Uang Riil Anggota)
 * - Mencatat uang riil masuk (INCOME, SETORAN_MEMBER).
 * - Menambah kasBalance anggota secara atomik (increment: amount).
 * Hanya dapat diakses oleh: BENDAHARA, ADMIN, OPERATOR
 */
export async function recordDeposit(
  userId: string,
  amount: number,
  description: string
): Promise<ActionResponse> {
  try {
    const officer = await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    if (!userId || userId.trim() === "") {
      return {
        success: false,
        message: "Target anggota wajib dipilih.",
      };
    }

    const cleanAmount = Math.round(Number(amount));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return {
        success: false,
        message: "Nominal setoran kas harus berupa angka positif lebih dari Rp 0.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, kasBalance: true },
    });

    if (!targetUser) {
      return {
        success: false,
        message: "Data anggota tidak ditemukan dalam sistem.",
      };
    }

    const cleanDescription =
      description && description.trim() !== ""
        ? description.trim()
        : `Setoran kas dari ${targetUser.name}`;

    // Ambil tahun ajaran aktif jika ada
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    });

    // Eksekusi ACID Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Catat transaksi di Ledger
      const ledgerEntry = await tx.ledgerTransaction.create({
        data: {
          academicYearId: currentAcademicYear?.id || null,
          type: TransactionType.INCOME,
          category: TransactionCategory.SETORAN_MEMBER,
          amount: cleanAmount,
          description: cleanDescription,
          userId: targetUser.id,
          createdById: officer.id,
          date: new Date(),
        },
      });

      // 2. Tambahkan saldo dompet anggota (advance payment / cicilan lunas)
      const updatedUser = await tx.user.update({
        where: { id: targetUser.id },
        data: {
          kasBalance: { increment: cleanAmount },
        },
        select: { id: true, name: true, kasBalance: true },
      });

      return { ledgerEntry, updatedUser };
    });

    revalidatePath("/kas");
    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");

    return {
      success: true,
      message: `Berhasil mencatat setoran Rp ${cleanAmount.toLocaleString("id-ID")} untuk ${targetUser.name}. Saldo terbaru: Rp ${result.updatedUser.kasBalance.toLocaleString("id-ID")}`,
      data: result,
    };
  } catch (error) {
    console.error("[Kas Action] recordDeposit error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal memproses setoran kas anggota.",
    };
  }
}

/**
 * 2. CREATE BULK BILLS (Penarikan Tagihan Serentak / Pemotongan Saldo)
 * - Membuat transaksi pemotongan saldo virtual (BILL_DEDUCTION) untuk setiap anggota terpilih.
 * - Mengurangi kasBalance anggota secara atomik (decrement: amount).
 * Hanya dapat diakses oleh: BENDAHARA, ADMIN, OPERATOR
 */
export async function createBulkBills(
  userIds: string[],
  amount: number,
  description: string,
  category: "TAGIHAN_RUTIN" | "TAGIHAN_INSIDENTAL" = "TAGIHAN_RUTIN"
): Promise<ActionResponse> {
  try {
    const officer = await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    if (!userIds || userIds.length === 0) {
      return {
        success: false,
        message: "Pilih minimal 1 anggota untuk dikenakan tagihan kas.",
      };
    }

    const cleanAmount = Math.round(Number(amount));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return {
        success: false,
        message: "Nominal tagihan harus berupa angka positif lebih dari Rp 0.",
      };
    }

    if (!description || description.trim() === "") {
      return {
        success: false,
        message: "Keterangan/judul tagihan kas wajib diisi.",
      };
    }

    const cleanDescription = description.trim();
    const targetCategory =
      category === "TAGIHAN_INSIDENTAL"
        ? TransactionCategory.TAGIHAN_INSIDENTAL
        : TransactionCategory.TAGIHAN_RUTIN;

    // Ambil tahun ajaran aktif jika ada
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    });

    const now = new Date();

    // Eksekusi ACID Transaction
    const affectedCount = await prisma.$transaction(async (tx) => {
      // 1. Buat LedgerTransaction untuk setiap user
      await tx.ledgerTransaction.createMany({
        data: userIds.map((uid) => ({
          academicYearId: currentAcademicYear?.id || null,
          type: TransactionType.BILL_DEDUCTION,
          category: targetCategory,
          amount: cleanAmount,
          description: cleanDescription,
          userId: uid,
          createdById: officer.id,
          date: now,
        })),
      });

      // 2. Potong saldo kasBalance masing-masing user
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          kasBalance: { decrement: cleanAmount },
        },
      });

      return userIds.length;
    });

    revalidatePath("/kas");
    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");

    return {
      success: true,
      message: `Berhasil menerbitkan tagihan "${cleanDescription}" sebesar Rp ${cleanAmount.toLocaleString("id-ID")} kepada ${affectedCount} anggota.`,
      data: { count: affectedCount },
    };
  } catch (error) {
    console.error("[Kas Action] createBulkBills error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menerbitkan tagihan serentak.",
    };
  }
}

/**
 * 3. RECORD GLOBAL FINANCE (Pemasukan Danus / Pengeluaran Operasional Organisasi)
 * - Tipe INCOME: Dana Usaha (DANUS_SUKARELA) -> Menambah uang riil, tidak memotong/menambah saldo personal.
 * - Tipe EXPENSE: Operasional Kegiatan (OPERASIONAL_ACARA) -> Mengurangi uang riil.
 * Hanya dapat diakses oleh: BENDAHARA, ADMIN, OPERATOR
 */
export async function recordGlobalFinance(
  type: "INCOME" | "EXPENSE",
  category: TransactionCategory,
  amount: number,
  description: string
): Promise<ActionResponse> {
  try {
    const officer = await assertRole([Role.BENDAHARA, Role.ADMIN, Role.OPERATOR]);

    const cleanAmount = Math.round(Number(amount));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return {
        success: false,
        message: "Nominal transaksi harus lebih dari Rp 0.",
      };
    }

    if (!description || description.trim() === "") {
      return {
        success: false,
        message: "Uraian / deskripsi transaksi wajib diisi.",
      };
    }

    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    });

    const targetType =
      type === "EXPENSE" ? TransactionType.EXPENSE : TransactionType.INCOME;

    const ledgerEntry = await prisma.ledgerTransaction.create({
      data: {
        academicYearId: currentAcademicYear?.id || null,
        type: targetType,
        category,
        amount: cleanAmount,
        description: description.trim(),
        userId: null, // Global organisasi (bukan milik satu orang)
        createdById: officer.id,
        date: new Date(),
      },
    });

    revalidatePath("/kas");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Berhasil mencatat transaksi ${
        targetType === TransactionType.INCOME ? "pemasukan bebas" : "pengeluaran operasional"
      } sebesar Rp ${cleanAmount.toLocaleString("id-ID")}.`,
      data: ledgerEntry,
    };
  } catch (error) {
    console.error("[Kas Action] recordGlobalFinance error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mencatat transaksi finansial global.",
    };
  }
}

/**
 * 4. GET USER LEDGER TRANSACTIONS (Riwayat Mutasi Saldo Personal)
 */
export async function getUserLedgerTransactions(userId: string) {
  try {
    const user = await assertAuthenticated();
    // Anggota hanya bisa melihat riwayatnya sendiri, kecuali officer
    const isOfficer =
      user.role === Role.ADMIN ||
      user.role === Role.OPERATOR ||
      user.role === Role.BENDAHARA;

    const targetId = isOfficer ? userId : user.id;

    return await prisma.ledgerTransaction.findMany({
      where: { userId: targetId },
      orderBy: { date: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("[Kas Action] getUserLedgerTransactions error:", error);
    return [];
  }
}

/**
 * 5. GET GLOBAL LEDGER (Buku Kas Terpadu Publik Organisasi)
 */
export async function getGlobalLedger(limit: number = 50) {
  try {
    return await prisma.ledgerTransaction.findMany({
      orderBy: { date: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, classGrade: true },
        },
      },
    });
  } catch (error) {
    console.error("[Kas Action] getGlobalLedger error:", error);
    return [];
  }
}
