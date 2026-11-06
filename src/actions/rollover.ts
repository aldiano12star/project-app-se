"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated } from "@/lib/rbac";
import { Role, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface CuratedChampion {
  id: string;
  name: string;
  email: string;
  mainDivision: string | null;
  totalPoints: number;
  image: string | null;
  workCount: number;
}

export interface CuratedEvent {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  description: string | null;
  driveUrl: string | null;
}

export interface CuratedWork {
  id: string;
  title: string;
  thumbnailUrl: string;
  externalUrl: string;
  primaryDivision: string;
  authorName: string;
}

export interface RolloverWizardData {
  periodName: string;
  generationYear: number;
  totalMeetings: number;
  totalIncome: number;
  totalExpense: number;
  currentCashBalance: number;
  closingCashBalance: number;
  topMembers: CuratedChampion[];
  allEvents: CuratedEvent[];
  allWorks: CuratedWork[];
}

export interface RolloverWizardInput {
  confirmationText: string;
  selectedEventIds: string[];
  selectedWorkIds: string[];
  notes?: string;
}

export interface RolloverResponse {
  success: boolean;
  message: string;
}

/**
 * Mengambil data kurasi otomatis untuk End-of-Year Rollover Wizard (Operator Only).
 */
export async function getRolloverCuratedData(): Promise<{
  success: boolean;
  data?: RolloverWizardData;
  message?: string;
}> {
  try {
    const user = await assertAuthenticated();
    if (user.role !== Role.OPERATOR) {
      return {
        success: false,
        message: "Akses ditolak. Hanya Operator yang dapat mengakses data persiapan rollover.",
      };
    }

    const activePeriod = await prisma.organizationalPeriod.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const currentGenYear = activePeriod ? activePeriod.generationYear : 20;
    const periodNameStr = `Kepengurusan ${2025 + (currentGenYear - 20)}/${2026 + (currentGenYear - 20)} (Gen ${currentGenYear})`;

    // Agregasi kas
    const [incomeAgg, expenseAgg, totalMeetings, topUsers, allEvents, allShowcases] =
      await Promise.all([
        prisma.ledgerTransaction.aggregate({
          where: { type: TransactionType.INCOME },
          _sum: { amount: true },
        }),
        prisma.ledgerTransaction.aggregate({
          where: { type: TransactionType.EXPENSE },
          _sum: { amount: true },
        }),
        prisma.meeting.count(),
        prisma.user.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
          take: 3,
          select: {
            id: true,
            name: true,
            email: true,
            mainDivision: true,
            totalPoints: true,
            image: true,
            showcaseContributions: {
              select: { id: true },
            },
          },
        }),
        prisma.event.findMany({
          orderBy: { startDate: "desc" },
          take: 30,
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            description: true,
            driveUrl: true,
          },
        }),
        prisma.showcase.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            externalUrl: true,
            primaryDivision: true,
            createdBy: {
              select: { name: true },
            },
          },
        }),
      ]);

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpense = expenseAgg._sum.amount || 0;
    const currentCashBalance = totalIncome - totalExpense;
    const startingBalanceForNew = activePeriod ? activePeriod.startingCashBalance : 0;
    const closingCashBalance = startingBalanceForNew + currentCashBalance;

    const topMembers: CuratedChampion[] = topUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      mainDivision: u.mainDivision,
      totalPoints: u.totalPoints,
      image: u.image,
      workCount: u.showcaseContributions.length,
    }));

    const formattedEvents: CuratedEvent[] = allEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      driveUrl: e.driveUrl,
    }));

    const formattedWorks: CuratedWork[] = allShowcases.map((w) => ({
      id: w.id,
      title: w.title,
      thumbnailUrl: w.thumbnailUrl,
      externalUrl: w.externalUrl,
      primaryDivision: w.primaryDivision,
      authorName: w.createdBy.name,
    }));

    return {
      success: true,
      data: {
        periodName: periodNameStr,
        generationYear: currentGenYear,
        totalMeetings,
        totalIncome,
        totalExpense,
        currentCashBalance,
        closingCashBalance,
        topMembers,
        allEvents: formattedEvents,
        allWorks: formattedWorks,
      },
    };
  } catch (error) {
    console.error("[Rollover] getRolloverCuratedData error:", error);
    return {
      success: false,
      message: "Gagal mengambil data persiapan rollover kepengurusan.",
    };
  }
}

/**
 * Menjalankan End-of-Year Rollover dengan data kurasi pilihan (Top 3 Members, Top 3 Events, Top 3 Works).
 */
export async function executeRolloverWithCuratedData(
  input: RolloverWizardInput
): Promise<RolloverResponse> {
  try {
    const user = await assertAuthenticated();

    // Verifikasi hak akses: Hanya OPERATOR
    if (user.role !== Role.OPERATOR) {
      return {
        success: false,
        message: "Akses ditolak. Hanya Operator yang berhak melakukan tutup buku kepengurusan.",
      };
    }

    // Validasi teks konfirmasi
    if (!input.confirmationText || input.confirmationText.trim() !== "TUTUP BUKU PERIODE") {
      return {
        success: false,
        message: "Teks konfirmasi tidak valid. Harap ketik 'TUTUP BUKU PERIODE' dengan tepat.",
      };
    }

    if (!input.selectedEventIds || input.selectedEventIds.length !== 3) {
      return {
        success: false,
        message: "Anda wajib memilih tepat 3 Acara / Proker Terbaik periode ini.",
      };
    }

    if (!input.selectedWorkIds || input.selectedWorkIds.length !== 3) {
      return {
        success: false,
        message: "Anda wajib memilih tepat 3 Karya / Showcase Terbaik periode ini.",
      };
    }

    // Ambil data aktif saat ini
    const activePeriod = await prisma.organizationalPeriod.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const currentGenYear = activePeriod ? activePeriod.generationYear : 20;
    const nextGenYear = currentGenYear + 1;
    const periodNameStr = `Kepengurusan ${2025 + (currentGenYear - 20)}/${2026 + (currentGenYear - 20)} (Gen ${currentGenYear})`;

    // Agregasi kas
    const [incomeAgg, expenseAgg, totalMeetings, topUsers, selectedEvents, selectedWorks] =
      await Promise.all([
        prisma.ledgerTransaction.aggregate({
          where: { type: TransactionType.INCOME },
          _sum: { amount: true },
        }),
        prisma.ledgerTransaction.aggregate({
          where: { type: TransactionType.EXPENSE },
          _sum: { amount: true },
        }),
        prisma.meeting.count(),
        prisma.user.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
          take: 3,
          select: {
            id: true,
            name: true,
            mainDivision: true,
            totalPoints: true,
            image: true,
            showcaseContributions: { select: { id: true } },
          },
        }),
        prisma.event.findMany({
          where: { id: { in: input.selectedEventIds } },
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            description: true,
            driveUrl: true,
          },
        }),
        prisma.showcase.findMany({
          where: { id: { in: input.selectedWorkIds } },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            externalUrl: true,
            primaryDivision: true,
            createdBy: { select: { name: true } },
          },
        }),
      ]);

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpense = expenseAgg._sum.amount || 0;
    const currentCashBalance = totalIncome - totalExpense;
    const startingBalanceForNew = activePeriod ? activePeriod.startingCashBalance : 0;
    const closingCashBalance = startingBalanceForNew + currentCashBalance;

    const rank1 = topUsers[0];
    const rank2 = topUsers[1];
    const rank3 = topUsers[2];

    const ev1 = selectedEvents[0];
    const ev2 = selectedEvents[1];
    const ev3 = selectedEvents[2];

    const wk1 = selectedWorks[0];
    const wk2 = selectedWorks[1];
    const wk3 = selectedWorks[2];

    // Eksekusi transaksi atomik
    await prisma.$transaction(async (tx) => {
      // 1. Simpan Snapshot Abadi ke tabel HallOfFame
      await tx.hallOfFame.create({
        data: {
          periodName: periodNameStr,
          generationYear: currentGenYear,
          totalMeetings,
          totalCashFlow: currentCashBalance,
          closingCashBalance,

          // Champions
          rank1Name: rank1?.name || "Anggota Berprestasi 1",
          rank1Division: rank1?.mainDivision || "PROGRAMMING",
          rank1Points: rank1?.totalPoints || 0,
          rank1Avatar: rank1?.image || null,
          rank1WorkCount: rank1?.showcaseContributions.length || 0,

          rank2Name: rank2?.name || "Anggota Berprestasi 2",
          rank2Division: rank2?.mainDivision || null,
          rank2Points: rank2?.totalPoints || 0,
          rank2Avatar: rank2?.image || null,
          rank2WorkCount: rank2?.showcaseContributions.length || 0,

          rank3Name: rank3?.name || "Anggota Berprestasi 3",
          rank3Division: rank3?.mainDivision || null,
          rank3Points: rank3?.totalPoints || 0,
          rank3Avatar: rank3?.image || null,
          rank3WorkCount: rank3?.showcaseContributions.length || 0,

          // Events
          event1Title: ev1?.title || null,
          event1Description: ev1?.description || null,
          event1Date: ev1 ? new Date(ev1.startDate).toLocaleDateString("id-ID") : null,
          event1DriveUrl: ev1?.driveUrl || null,

          event2Title: ev2?.title || null,
          event2Description: ev2?.description || null,
          event2Date: ev2 ? new Date(ev2.startDate).toLocaleDateString("id-ID") : null,
          event2DriveUrl: ev2?.driveUrl || null,

          event3Title: ev3?.title || null,
          event3Description: ev3?.description || null,
          event3Date: ev3 ? new Date(ev3.startDate).toLocaleDateString("id-ID") : null,
          event3DriveUrl: ev3?.driveUrl || null,

          // Works
          work1Title: wk1?.title || null,
          work1Author: wk1?.createdBy.name || null,
          work1Division: wk1?.primaryDivision || null,
          work1Url: wk1?.externalUrl || null,
          work1Thumbnail: wk1?.thumbnailUrl || null,

          work2Title: wk2?.title || null,
          work2Author: wk2?.createdBy.name || null,
          work2Division: wk2?.primaryDivision || null,
          work2Url: wk2?.externalUrl || null,
          work2Thumbnail: wk2?.thumbnailUrl || null,

          work3Title: wk3?.title || null,
          work3Author: wk3?.createdBy.name || null,
          work3Division: wk3?.primaryDivision || null,
          work3Url: wk3?.externalUrl || null,
          work3Thumbnail: wk3?.thumbnailUrl || null,

          eventsJson: JSON.stringify(selectedEvents),
          worksJson: JSON.stringify(selectedWorks),
        },
      });

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
      const nextPeriodName = `Kepengurusan ${2026 + (nextGenYear - 21)}/${2027 + (nextGenYear - 21)} (Gen ${nextGenYear})`;
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

      // 4. Promosikan tingkatan kelas anggota aktif
      // ATURAN KETAT:
      // - Kelas 10 -> Kelas 11
      // - Kelas 11 -> Kelas 12
      // - Kelas 12 -> ALUMNI / DEMISIONER
      // - Identitas Angkatan (gen) DILARANG DIUBAH!
      // - Saldo Kas Pribadi (kasBalance) DILARANG DIHAPUS!
      // - Seluruh totalPoints di-reset menjadi 0.
      const allActiveUsers = await tx.user.findMany({
        where: { status: "ACTIVE" },
      });

      for (const u of allActiveUsers) {
        let newClassGrade = u.classGrade;
        let newKelas = u.kelas;
        let newStatus = u.status;

        if (u.classGrade === "KELAS_10") {
          newClassGrade = "KELAS_11";
          newKelas = "XI";
        } else if (u.classGrade === "KELAS_11") {
          newClassGrade = "KELAS_12";
          newKelas = "XII";
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
            // gen tetap tidak diubah sama sekali (identitas angkatan abadi)
            totalPoints: 0,
            monthlyPoints: 0,
          },
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/kas");
    revalidatePath("/pengaturan");
    revalidatePath("/hall-of-fame");

    return {
      success: true,
      message:
        "Rollover kepengurusan tahunan berhasil dijalankan! Hall of Fame telah diabadikan, buku kas ditutup, dan anggota berhasil dipromosikan.",
    };
  } catch (error) {
    console.error("[Rollover] executeRolloverWithCuratedData error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menjalankan rollover kepengurusan dengan data kurasi.",
    };
  }
}

/**
 * Backward compatibility fallback.
 */
export async function executeRollover(input: {
  confirmationText: string;
  notes?: string;
}): Promise<RolloverResponse> {
  const curated = await getRolloverCuratedData();
  const eventIds = curated.data?.allEvents.slice(0, 3).map((e) => e.id) || [];
  const workIds = curated.data?.allWorks.slice(0, 3).map((w) => w.id) || [];

  return executeRolloverWithCuratedData({
    confirmationText: input.confirmationText,
    notes: input.notes,
    selectedEventIds: eventIds,
    selectedWorkIds: workIds,
  });
}
