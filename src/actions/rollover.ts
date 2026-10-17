"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/rbac";
import { Role, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface RolloverInput {
  confirmationText: string;
  notes?: string;
}

export interface RolloverResponse {
  success: boolean;
  message: string;
}

export async function executeRollover(
  input: RolloverInput
): Promise<RolloverResponse> {
  try {
    const user = await assertAuthenticated();

    // a) Verifikasi hak akses: Hanya OPERATOR
    if (user.role !== Role.OPERATOR) {
      return {
        success: false,
        message: "Akses ditolak. Hanya Operator yang berhak melakukan tutup buku kepengurusan.",
      };
    }

    // b) Validasi teks konfirmasi
    if (!input.confirmationText || input.confirmationText.trim() !== "TUTUP BUKU PERIODE") {
      return {
        success: false,
        message: "Teks konfirmasi tidak valid. Harap ketik 'TUTUP BUKU PERIODE' dengan tepat.",
      };
    }

    // Ambil periode aktif saat ini
    const activePeriod = await prisma.organizationalPeriod.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const currentGenYear = activePeriod ? activePeriod.generationYear : 20;
    const nextGenYear = currentGenYear + 1;
    const periodNameStr = `Periode ${2025 + (currentGenYear - 20)}/${2026 + (currentGenYear - 20)} (Gen ${currentGenYear})`;

    // Hitung total saldo kas berjalan saat ini (Total Income - Total Expense)
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpense = expenseAgg._sum.amount || 0;
    const currentCashBalance = totalIncome - totalExpense;
    const startingBalanceForNew = activePeriod ? activePeriod.startingCashBalance : 0;
    const closingCashBalance = startingBalanceForNew + currentCashBalance;

    // Ambil Top 3 kontributor saat ini berdasarkan totalPoints
    const topUsers = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
      take: 3,
      select: {
        name: true,
        mainDivision: true,
        totalPoints: true,
        image: true,
      },
    });

    const rank1 = topUsers[0];
    const rank2 = topUsers[1];
    const rank3 = topUsers[2];

    // Hitung total meetings
    const totalMeetings = await prisma.meeting.count();

    // Eksekusi transaksi transaksional atomik via prisma.$transaction
    await prisma.$transaction(async (tx) => {
      // 1. Simpan Hall of Fame snapshot
      if (rank1) {
        await tx.seasonHallOfFame.create({
          data: {
            periodName: periodNameStr,
            generationYear: currentGenYear,
            rank1Name: rank1.name,
            rank1Division: rank1.mainDivision || "PROGRAMMING",
            rank1Points: rank1.totalPoints,
            rank1Avatar: rank1.image,
            rank2Name: rank2 ? rank2.name : "-",
            rank2Division: rank2 ? rank2.mainDivision : null,
            rank2Points: rank2 ? rank2.totalPoints : 0,
            rank2Avatar: rank2 ? rank2.image : null,
            rank3Name: rank3 ? rank3.name : "-",
            rank3Division: rank3 ? rank3.mainDivision : null,
            rank3Points: rank3 ? rank3.totalPoints : 0,
            rank3Avatar: rank3 ? rank3.image : null,
            totalMeetings,
            totalCashFlow: closingCashBalance,
          },
        });
      }

      // 2. Nonaktifkan periode lama
      if (activePeriod) {
        await tx.organizationalPeriod.update({
          where: { id: activePeriod.id },
          data: {
            isActive: false,
            endDate: new Date(),
            closingCashBalance,
            notes: input.notes || activePeriod.notes,
          },
        });
      }

      // 3. Buat OrganizationalPeriod baru
      const nextPeriodName = `Periode ${2026 + (nextGenYear - 21)}/${2027 + (nextGenYear - 21)} (Gen ${nextGenYear})`;
      await tx.organizationalPeriod.create({
        data: {
          name: nextPeriodName,
          generationYear: nextGenYear,
          isActive: true,
          startingCashBalance: closingCashBalance,
          closingCashBalance: 0,
          notes: "Periode kepengurusan baru setelah rollover.",
        },
      });

      // 4. Promosikan tingkatan kelas anggota aktif (X -> XI, XI -> XII, XII -> ALUMNI / DEMISIONER)
      const allActiveUsers = await tx.user.findMany({
        where: { status: "ACTIVE" },
      });

      for (const u of allActiveUsers) {
        let newClassGrade = u.classGrade;
        let newKelas = u.kelas;
        let newStatus = u.status;
        let newGen = u.gen;

        if (u.classGrade === "KELAS_10") {
          newClassGrade = "KELAS_11";
          newKelas = "XI";
          if (newGen) newGen = newGen - 1;
        } else if (u.classGrade === "KELAS_11") {
          newClassGrade = "KELAS_12";
          newKelas = "XII";
          if (newGen) newGen = newGen - 1;
        } else if (u.classGrade === "KELAS_12") {
          newClassGrade = "ALUMNI";
          newStatus = "DEMISIONER";
        }

        await tx.user.update({
          where: { id: u.id },
          data: {
            classGrade: newClassGrade,
            kelas: newKelas,
            status: newStatus,
            gen: newGen,
            totalPoints: 0, // Reset total points
            monthlyPoints: 0,
          },
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/kas");
    revalidatePath("/pengaturan");

    return {
      success: true,
      message: "Rollover kepengurusan tahunan berhasil dijalankan! Buku kas ditutup dan anggota berhasil dipromosikan.",
    };
  } catch (error) {
    console.error("[Rollover] executeRollover error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menjalankan rollover kepengurusan.",
    };
  }
}
