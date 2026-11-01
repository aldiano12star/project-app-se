import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { Role, TransactionType } from "@prisma/client";
import { DigitalWalletCard } from "@/components/kas/DigitalWalletCard";
import { PublicCashLedger } from "@/components/kas/PublicCashLedger";
import { TreasurerPanel } from "@/components/kas/TreasurerPanel";
import { calculateRealMoney } from "@/actions/kas";
import { Wallet, Lock } from "lucide-react";

export default async function KasPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ambil seluruh data esensial untuk halaman Kas modern secara paralel
  const [dbUser, personalTransactions, globalTransactions, allMembers, realMoney] =
    await Promise.all([
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
          kasBalance: true,
          isProfileCompleted: true,
        },
      }),
      prisma.ledgerTransaction.findMany({
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
        take: 30,
        select: {
          id: true,
          type: true,
          category: true,
          amount: true,
          description: true,
          date: true,
        },
      }),
      prisma.ledgerTransaction.findMany({
        where: {
          type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
        },
        orderBy: { date: "desc" },
        take: 40,
        select: {
          id: true,
          type: true,
          category: true,
          amount: true,
          description: true,
          date: true,
          user: {
            select: {
              id: true,
              name: true,
              classGrade: true,
            },
          },
        },
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
          kasBalance: true,
        },
      }),
      calculateRealMoney(),
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
                Transparansi pembukuan, dompet personal, &amp; buku besar kas
              </p>
            </div>
            <Wallet className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          </section>

          <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
            <Lock className="h-8 w-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-ink">Akses Data Kas Terbatas</h3>
            <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
              Akun Anda saat ini berstatus{" "}
              <span className="font-semibold text-ink">
                Menunggu Verifikasi (GUEST)
              </span>
              . Informasi dompet kas dan buku besar organisasi hanya dapat diakses oleh anggota resmi terverifikasi.
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

  return (
    <AppShell user={dbUser}>
      <div className="flex flex-col gap-5">
        {/* Header Seksi Kas */}
        <section className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Kas &amp; Dompet Digital
            </h1>
            <p className="text-xs text-ink-muted">
              Sistem buku kas transparan, mutasi saldo, &amp; manajemen tagihan organisasi
            </p>
          </div>
          <Wallet className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </section>

        {/* ── 1. DIGITAL WALLET CARD (Member Personal View) ─────────────── */}
        <DigitalWalletCard
          userName={dbUser.name}
          userRole={dbUser.role}
          classGrade={dbUser.classGrade}
          kasBalance={dbUser.kasBalance}
          transactions={personalTransactions}
        />

        {/* ── 2. TREASURER CONTROL MATRIX (Tampil Khusus Pengurus) ──────── */}
        {isTreasurer && (
          <TreasurerPanel
            currentUserRole={dbUser.role}
            allMembers={allMembers}
            realBalance={realMoney.realBalance}
            totalIncome={realMoney.totalIncome}
            totalExpense={realMoney.totalExpense}
          />
        )}

        {/* ── 3. BUKU KAS PUBLIK TERPADU (Global Cash Ledger) ──────────── */}
        <PublicCashLedger
          transactions={globalTransactions}
          totalBalance={realMoney.realBalance}
          totalIncome={realMoney.totalIncome}
          totalExpense={realMoney.totalExpense}
        />
      </div>
    </AppShell>
  );
}
