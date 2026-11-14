"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { Wallet, CreditCard, Receipt, FileText, SlidersHorizontal, Users } from "lucide-react";
import { haptic } from "@/lib/haptic";
import { DigitalWalletCard, MutationHistory } from "./DigitalWalletCard";
import { InvoiceListCard } from "./InvoiceListCard";
import { PublicCashLedger } from "./PublicCashLedger";
import { TreasurerPanel } from "./TreasurerPanel";
import { InvoiceTrackerSection } from "./InvoiceTrackerSection";

interface KasClientViewProps {
  dbUser: {
    id: string;
    name: string;
    role: Role;
    classGrade?: string | null;
    kasBalance: number;
  };
  realMoney: {
    realBalance: number;
    totalIncome: number;
    totalExpense: number;
  };
  isKolaborator: boolean;
  isTreasurer: boolean;
  userInvoices: any[];
  personalTransactions: any[];
  globalTransactions: any[];
  allMembers: any[];
  allInvoices: any[];
}

export function KasClientView({
  dbUser,
  realMoney,
  isKolaborator,
  isTreasurer,
  userInvoices,
  personalTransactions,
  globalTransactions,
  allMembers,
  allInvoices,
}: KasClientViewProps) {
  const [activeTab, setActiveTab] = useState<"PERSONAL" | "PUBLIC" | "TREASURER">("PERSONAL");

  const unpaidInvoicesCount = userInvoices.filter((inv) => inv.status !== "PAID").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── EDITORIAL HEADER ── */}
      <section className="flex items-center justify-between pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
              {isKolaborator ? "Urunan & Dompet Kegiatan" : "Kas & Dompet Digital"}
            </h1>
            {unpaidInvoicesCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/25 text-[11px] font-bold font-mono">
                {unpaidInvoicesCount} Tagihan Aktif
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            {isKolaborator
              ? "Manajemen kontribusi dana & urunan kepanitiaan bersama"
              : "Sistem buku kas transparan, mutasi saldo, & pembukuan organisasi."}
          </p>
        </div>

        <div className="h-10 w-10 rounded-2xl bg-surface-container flex items-center justify-center text-ink-muted shrink-0 border hairline-border">
          <Wallet className="h-5 w-5" />
        </div>
      </section>

      {/* ── 1. DIGITAL WALLET CARD (Apple Wallet Stack) ── */}
      <DigitalWalletCard
        userName={dbUser.name}
        userRole={dbUser.role}
        classGrade={dbUser.classGrade}
        kasBalance={dbUser.kasBalance}
        orgBalance={realMoney.realBalance}
        totalIncome={realMoney.totalIncome}
        totalExpense={realMoney.totalExpense}
        isKolaborator={isKolaborator}
      />

      {/* ── 2. GLASS SEGMENTED ACTIVITY DOCK (Revolut / Apple Wallet Style) ── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-container/60 border hairline-border overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            setActiveTab("PERSONAL");
          }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "PERSONAL"
              ? "bg-card text-ink shadow-xs border hairline-border font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Dompet Personal</span>
        </button>

        {!isKolaborator && (
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab("PUBLIC");
            }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "PUBLIC"
                ? "bg-card text-ink shadow-xs border hairline-border font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Buku Kas LPJ</span>
          </button>
        )}

        {isTreasurer && (
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab("TREASURER");
            }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "TREASURER"
                ? "bg-card text-amber-500 shadow-xs border hairline-border font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Panel Kelola Kas</span>
          </button>
        )}
      </div>

      {/* ── 3. TAB 1: DOMPET PERSONAL (Tagihan & Riwayat Mutasi) ── */}
      {activeTab === "PERSONAL" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <InvoiceListCard
            invoices={userInvoices}
            userKasBalance={dbUser.kasBalance}
          />

          <MutationHistory transactions={personalTransactions} />

          {isKolaborator && (
            <div className="card-solid bg-card p-5 sm:p-6 rounded-2xl border hairline-border text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-ink font-bold text-xs sm:text-sm">
                <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Status: Kolaborator Kepanitiaan Eksternal</span>
              </div>
              <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                Kamu terdaftar sebagai mitra kepanitiaan gabungan tanpa beban kas rutin mingguan/bulanan. Riwayat di atas hanya menampilkan tagihan insidental kegiatan yang kamu ikuti.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── 4. TAB 2: BUKU KAS PUBLIK (Transparansi LPJ Riil) ── */}
      {activeTab === "PUBLIC" && !isKolaborator && (
        <div className="animate-in fade-in duration-200">
          <PublicCashLedger
            transactions={globalTransactions}
            totalBalance={realMoney.realBalance}
            totalIncome={realMoney.totalIncome}
            totalExpense={realMoney.totalExpense}
          />
        </div>
      )}

      {/* ── 5. TAB 3: AUDIT & KELOLA KAS (Khusus Pengurus & Bendahara) ── */}
      {activeTab === "TREASURER" && isTreasurer && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <TreasurerPanel
            currentUserRole={dbUser.role}
            allMembers={allMembers}
            invoices={allInvoices}
            realBalance={realMoney.realBalance}
            totalIncome={realMoney.totalIncome}
            totalExpense={realMoney.totalExpense}
          />

          <InvoiceTrackerSection invoices={allInvoices} />
        </div>
      )}
    </div>
  );
}
