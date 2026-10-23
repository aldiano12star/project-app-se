import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { Role, TransactionType, BillingType } from "@prisma/client";
import { PersonalDuesCard } from "@/components/kas/PersonalDuesCard";
import { CashComplianceCard } from "@/components/kas/CashComplianceCard";
import { PublicCashLedger } from "@/components/kas/PublicCashLedger";
import { TreasurerPanel } from "@/components/kas/TreasurerPanel";
import { Wallet, Lock } from "lucide-react";

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
    activeUrunanEvents,
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
        isProfileCompleted: true,
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
        generationNumber: true,
        gen: true,
        kelas: true,
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
    prisma.billingEvent.findMany({
      where: {
        type: BillingType.URUNAN,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        amount: true,
        dueDate: true,
        targetUsers: {
          select: { id: true },
        },
        payments: {
          select: {
            id: true,
            userId: true,
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

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  // Gatekeeper: Akun GUEST tidak dapat melihat data sensitif keuangan
  if (dbUser.role === Role.GUEST) {
    return (
      <AppShell user={dbUser}>
        <div className="flex flex-col gap-4">
          <section className="flex items-center justify-between pt-1">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Kas Organisasi
              </h1>
              <p className="text-xs text-ink-muted">
                Transparansi pembukuan, iuran rutin, &amp; kepatuhan anggota
              </p>
            </div>
            <Wallet className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          </section>

          <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
            <Lock className="h-8 w-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-ink">Akses Data Kas Terbatas</h3>
            <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
              Akun Anda saat ini berstatus <span className="font-semibold text-ink">Menunggu Verifikasi (GUEST)</span>. Informasi transparansi kas dan buku besar organisasi hanya dapat diakses oleh anggota resmi terverifikasi.
            </p>
          </div>
        </div>
      </AppShell>
    );
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

  // Helper pencocokan generasi / kelas yang tahan banting (berbasis gen, generationNumber, maupun classGrade)
  const isGen20Member = (m: {
    classGrade?: string | null;
    gen?: number | null;
    generationNumber?: number | null;
    kelas?: string | null;
  }) => {
    const g = m.gen ?? m.generationNumber;
    if (g === 20) return true;
    const cg = (m.classGrade || "").toUpperCase().trim();
    const k = (m.kelas || "").toUpperCase().trim();
    return (
      cg === "KELAS_11" ||
      cg === "XI" ||
      cg === "11" ||
      cg.includes("11") ||
      k === "XI" ||
      k === "11" ||
      k.includes("11")
    );
  };

  const isGen21Member = (m: {
    classGrade?: string | null;
    gen?: number | null;
    generationNumber?: number | null;
    kelas?: string | null;
  }) => {
    const g = m.gen ?? m.generationNumber;
    if (g === 21) return true;
    const cg = (m.classGrade || "").toUpperCase().trim();
    const k = (m.kelas || "").toUpperCase().trim();
    return (
      cg === "KELAS_10" ||
      cg === "X" ||
      cg === "10" ||
      cg.includes("10") ||
      k === "X" ||
      k === "10" ||
      k.includes("10")
    );
  };

  // Hitung kepatuhan kas riil Gen 20 (Kelas 11) dan Gen 21 (Kelas 10)
  const gen20Members = allMembers.filter(isGen20Member);
  const gen21Members = allMembers.filter(isGen21Member);

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
    generationNumber: m.generationNumber ?? null,
    gen: m.gen ?? null,
    kelas: m.kelas ?? null,
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
          <Wallet className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </section>

        {/* Grid Adaptif Layar Lebar: Status Kas Personal & Kepatuhan Kas Angkatan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
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
        </div>

        {/* 3. Panel Khusus Bendahara & Admin (Tampil Kondisional) */}
        {isTreasurer && (
          <TreasurerPanel
            currentUserRole={dbUser.role}
            allMembers={mappedTreasurerMembers}
            periods={kasPeriods}
            activeUrunanEvents={activeUrunanEvents}
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
