import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { AppShell } from "@/components/layout/AppShell";
import { Role, TransactionType, TransactionCategory } from "@prisma/client";
import { DigitalWalletCard } from "@/components/kas/DigitalWalletCard";
import { InvoiceListCard } from "@/components/kas/InvoiceListCard";
import { PublicCashLedger } from "@/components/kas/PublicCashLedger";
import { TreasurerPanel } from "@/components/kas/TreasurerPanel";
import { GuestLockedView } from "@/components/ui/GuestLockedView";
import { calculateRealMoney } from "@/actions/kas";
import { Wallet, Users } from "lucide-react";

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

  // 2. Ambil data transaksi personal, invoices, & buku kas
  const [personalTransactions, globalTransactions, allMembers, realMoney, userInvoices, allInvoices] =
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
      !isKolaborator
        ? prisma.ledgerTransaction.findMany({
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

  return (
    <AppShell user={dbUser}>
      <div className="flex flex-col gap-5">
        {/* Header Seksi Kas */}
        <section className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              {isKolaborator ? "Urunan & Dompet Kegiatan" : "Kas & Dompet Digital"}
            </h1>
            <p className="text-xs text-ink-muted">
              {isKolaborator
                ? "Manajemen kontribusi dana & urunan kepanitiaan bersama"
                : "Sistem buku kas transparan, mutasi saldo, & manajemen tagihan organisasi"}
            </p>
          </div>
          <Wallet className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </section>

        {/* ── 1. INVOICE LIST CARD (Tagihan Kas & Urunan Personal) ──────── */}
        <InvoiceListCard
          invoices={userInvoices}
          userKasBalance={dbUser.kasBalance}
        />

        {/* ── 2. RIWAYAT MUTASI KAS PERSONAL (Transaction Timeline) ─────── */}
        <DigitalWalletCard
          userName={dbUser.name}
          userRole={dbUser.role}
          classGrade={dbUser.classGrade}
          kasBalance={dbUser.kasBalance}
          transactions={personalTransactions}
        />

        {/* ── 3. KOLABORATOR INFORMATIVE NOTICE ─────────────────────────── */}
        {isKolaborator && (
          <div className="card-solid bg-card p-5 sm:p-6 rounded-2xl border border-edge text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-ink font-bold text-xs sm:text-sm">
              <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Status Akun: Kolaborator Kepanitiaan Eksternal</span>
            </div>
            <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
              Anda terdaftar sebagai mitra kepanitiaan gabungan. Akun Anda tidak dibebani iuran kas rutin mingguan/bulanan organisasi. Riwayat mutasi di atas hanya menampilkan tagihan insidental (Urunan proker) dan setoran dana khusus untuk kegiatan yang Anda ikuti.
            </p>
          </div>
        )}

        {/* ── 3. TREASURER CONTROL MATRIX (Tampil Khusus Pengurus) ──────── */}
        {isTreasurer && (
          <TreasurerPanel
            currentUserRole={dbUser.role}
            allMembers={allMembers}
            invoices={allInvoices}
            realBalance={realMoney.realBalance}
            totalIncome={realMoney.totalIncome}
            totalExpense={realMoney.totalExpense}
          />
        )}

        {/* ── 4. BUKU KAS PUBLIK TERPADU (Hanya untuk Anggota Internal) ── */}
        {!isKolaborator && (
          <PublicCashLedger
            transactions={globalTransactions}
            totalBalance={realMoney.realBalance}
            totalIncome={realMoney.totalIncome}
            totalExpense={realMoney.totalExpense}
          />
        )}
      </div>
    </AppShell>
  );
}
