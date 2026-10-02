import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { Role, ClassGrade, TransactionType } from "@prisma/client";
import { PersonalDuesCard } from "@/components/kas/PersonalDuesCard";
import { CashComplianceCard } from "@/components/kas/CashComplianceCard";
import { PublicCashLedger } from "@/components/kas/PublicCashLedger";
import { TreasurerPanel } from "@/components/kas/TreasurerPanel";
import { Wallet } from "lucide-react";

export default async function KasPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ambil seluruh data esensial untuk halaman Kas secara paralel
  const [
    dbUser,
    kasPeriods,
    userPayments,
    transactions,
    incomeAggregate,
    expenseAggregate,
    allMembers,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        classGrade: true,
        mainDivision: true,
        status: true,
        monthlyPoints: true,
        totalPoints: true,
      },
    }),
    prisma.kasPeriod.findMany({
      orderBy: { periodNumber: "asc" },
      select: {
        id: true,
        periodNumber: true,
        name: true,
        startDate: true,
        endDate: true,
        amount: true,
      },
    }),
    prisma.kasPayment.findMany({
      where: { userId: session.user.id },
      select: {
        kasPeriodId: true,
        amountPaid: true,
        paidAt: true,
      },
    }),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 40,
      select: {
        id: true,
        type: true,
        incomeCategory: true,
        expenseCategory: true,
        amount: true,
        description: true,
        proofUrl: true,
        date: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.transaction.aggregate({
      where: { type: TransactionType.INCOME },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ classGrade: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        classGrade: true,
        mainDivision: true,
        kasPayments: {
          select: {
            kasPeriodId: true,
            amountPaid: true,
            paidAt: true,
          },
        },
      },
    }),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  const isTreasurer =
    dbUser.role === Role.ADMIN ||
    dbUser.role === Role.BENDAHARA ||
    dbUser.role === Role.OPERATOR;

  // Hitung total finansial riil dari database aggregation
  const totalIncome = incomeAggregate._sum.amount || 0;
  const totalExpense = expenseAggregate._sum.amount || 0;
  const totalBalance = Math.max(0, totalIncome - totalExpense);

  // Status periode untuk user aktif
  const userPaidPeriodIds = new Set(userPayments.map((p) => p.kasPeriodId));
  const personalPeriods = kasPeriods.map((p) => ({
    ...p,
    isPaid: userPaidPeriodIds.has(p.id),
  }));

  // Periode aktif (periode dengan nomor urut tertinggi atau yang sedang berjalan)
  const activePeriod = kasPeriods[kasPeriods.length - 1] || null;

  // Hitung kepatuhan kas riil Gen 20 (Kelas 11) dan Gen 21 (Kelas 10)
  const gen20Members = allMembers.filter(
    (m) => m.classGrade === ClassGrade.KELAS_11
  );
  const gen21Members = allMembers.filter(
    (m) => m.classGrade === ClassGrade.KELAS_10
  );

  const gen20PaidCount = gen20Members.filter((m) =>
    activePeriod
      ? m.kasPayments.some((p) => p.kasPeriodId === activePeriod.id)
      : m.kasPayments.length > 0
  ).length;

  const gen21PaidCount = gen21Members.filter((m) =>
    activePeriod
      ? m.kasPayments.some((p) => p.kasPeriodId === activePeriod.id)
      : m.kasPayments.length > 0
  ).length;

  const gen20Total = gen20Members.length;
  const gen21Total = gen21Members.length;

  const gen20Percentage =
    gen20Total > 0 ? Math.round((gen20PaidCount / gen20Total) * 100) : 0;
  const gen21Percentage =
    gen21Total > 0 ? Math.round((gen21PaidCount / gen21Total) * 100) : 0;

  const gen20Collected = gen20Members.reduce(
    (sum, m) =>
      sum + m.kasPayments.reduce((pSum, p) => pSum + p.amountPaid, 0),
    0
  );

  const gen21Collected = gen21Members.reduce(
    (sum, m) =>
      sum + m.kasPayments.reduce((pSum, p) => pSum + p.amountPaid, 0),
    0
  );

  // Format anggota untuk TreasurerPanel
  const mappedTreasurerMembers = allMembers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    image: m.image,
    role: m.role,
    classGrade: m.classGrade,
    mainDivision: m.mainDivision,
    payments: m.kasPayments,
  }));

  return (
    <AppShell user={dbUser}>
      <div className="flex flex-col gap-4">
        {/* Header Seksi Kas */}
        <section className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Kas Organisasi
            </h1>
            <p className="text-xs text-ink-muted">
              Transparansi pembukuan, iuran rutin, & kepatuhan anggota
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
        </section>

        {/* 1. Status Kas Personal Pengguna */}
        <PersonalDuesCard
          userName={dbUser.name}
          periods={personalPeriods}
        />

        {/* 2. Kepatuhan Kas Angkatan (Gen 20 & Gen 21) */}
        <CashComplianceCard
          gen20={{
            name: "Gen 20 (Kelas 11)",
            grade: "Kelas 11",
            totalMembers: gen20Total,
            paidMembers: gen20PaidCount,
            collectedAmount: gen20Collected,
            percentage: gen20Percentage,
          }}
          gen21={{
            name: "Gen 21 (Kelas 10)",
            grade: "Kelas 10",
            totalMembers: gen21Total,
            paidMembers: gen21PaidCount,
            collectedAmount: gen21Collected,
            percentage: gen21Percentage,
          }}
        />

        {/* 3. Panel Khusus Bendahara & Admin (Tampil Kondisional) */}
        {isTreasurer && (
          <TreasurerPanel
            currentUserRole={dbUser.role}
            allMembers={mappedTreasurerMembers}
            periods={kasPeriods}
          />
        )}

        {/* 4. Buku Kas Publik Transparan */}
        <PublicCashLedger
          transactions={transactions}
          totalBalance={totalBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
        />
      </div>
    </AppShell>
  );
}
