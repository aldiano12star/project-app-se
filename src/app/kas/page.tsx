import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { AppShell } from "@/components/layout/AppShell";
import { Role, TransactionType, TransactionCategory } from "@prisma/client";
import { KasClientView } from "@/components/kas/KasClientView";
import { GuestLockedView } from "@/components/ui/GuestLockedView";
import { calculateRealMoney } from "@/actions/kas";
import { Wallet } from "lucide-react";

export default async function KasPage() {
  const current = await getCurrentDbUser();

  if (!current?.session?.user?.id || !current.dbUser) {
    redirect("/login");
  }

  const { session, dbUser } = current;

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

          <GuestLockedView
            title="Akses Data Kas Terbatas"
            description="Informasi dompet kas, riwayat pembayaran iuran, dan buku besar organisasi hanya dapat diakses oleh anggota resmi terverifikasi."
          />
        </div>
      </AppShell>
    );
  }

  const isKolaborator = dbUser.role === Role.KOLABORATOR;
  const isTreasurer =
    dbUser.role === Role.ADMIN ||
    dbUser.role === Role.BENDAHARA ||
    dbUser.role === Role.OPERATOR;

  // 1. Ambil periode kepengurusan aktif untuk isolasi buku kas pasca-rollover
  const activePeriod = await prisma.organizationalPeriod.findFirst({
    where: { isActive: true },
  });
  const periodFilter = activePeriod ? { date: { gte: activePeriod.startDate } } : {};

  // 2. Ambil data transaksi personal, invoices, & buku kas periode aktif
  const [personalTransactions, rawGlobalTransactions, allMembers, realMoney, userInvoices, allInvoices] =
    await Promise.all([
      prisma.ledgerTransaction.findMany({
        where: {
          userId: session.user.id,
          ...(isKolaborator
            ? {
                category: {
                  in: [
                    TransactionCategory.TAGIHAN_INSIDENTAL,
                    TransactionCategory.SETORAN_MEMBER,
                  ],
                },
              }
            : {}),
        },
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          category: true,
          amount: true,
          description: true,
          date: true,
        },
      }),
      !isKolaborator
        ? prisma.ledgerTransaction.findMany({
            where: {
              type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
              ...periodFilter,
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
          })
        : Promise.resolve([]),
      isTreasurer
        ? prisma.user.findMany({
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
          })
        : Promise.resolve([]),
      !isKolaborator ? calculateRealMoney() : Promise.resolve({ totalIncome: 0, totalExpense: 0, realBalance: 0 }),
      prisma.invoice.findMany({
        where: { userId: session.user.id },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      }),
      isTreasurer
        ? prisma.invoice.findMany({
            orderBy: [{ createdAt: "desc" }],
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  classGrade: true,
                  generationNumber: true,
                  gen: true,
                  kelas: true,
                  mainDivision: true,
                  kasBalance: true,
                },
              },
            },
            take: 300,
          })
        : Promise.resolve([]),
    ]);

  // Gabungkan entri saldo awal sisa periode sebelumnya sebagai 1 mutasi pembuka tunggal
  const legacyStartingEntry =
    activePeriod && activePeriod.startingCashBalance > 0
      ? [
          {
            id: `legacy-rollover-${activePeriod.id}`,
            type: TransactionType.INCOME,
            category: TransactionCategory.DANUS_SUKARELA,
            amount: activePeriod.startingCashBalance,
            description: "Dana Kas Sisa Periode Sebelumnya",
            date: activePeriod.startDate,
            user: null,
          },
        ]
      : [];

  const globalTransactions = [...rawGlobalTransactions, ...legacyStartingEntry];

  return (
    <AppShell user={dbUser}>
      <KasClientView
        dbUser={{
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
          classGrade: dbUser.classGrade,
          kasBalance: dbUser.kasBalance,
        }}
        realMoney={realMoney}
        isKolaborator={isKolaborator}
        isTreasurer={isTreasurer}
        userInvoices={userInvoices}
        personalTransactions={personalTransactions}
        globalTransactions={globalTransactions}
        allMembers={allMembers}
        allInvoices={allInvoices}
      />
    </AppShell>
  );
}
