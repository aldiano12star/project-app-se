"use client";

import { useState } from "react";
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Layers,
} from "lucide-react";
import { TransactionType, TransactionCategory } from "@prisma/client";
import { useCountUp } from "@/hooks/useCountUp";
import { haptic } from "@/lib/haptic";

export interface PublicLedgerItem {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: Date | string;
  user?: {
    id: string;
    name: string;
    classGrade?: string | null;
  } | null;
}

interface PublicCashLedgerProps {
  transactions: PublicLedgerItem[];
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export function PublicCashLedger({
  transactions,
  totalBalance,
  totalIncome,
  totalExpense,
}: PublicCashLedgerProps) {
  const animatedBalance = useCountUp(totalBalance, 700);
  const animatedIncome = useCountUp(totalIncome, 700);
  const animatedExpense = useCountUp(totalExpense, 700);

  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">(
    "ALL"
  );

  // Filter hanya transaksi uang riil (INCOME & EXPENSE) untuk buku kas publik
  const realTransactions = transactions.filter(
    (t) =>
      t.type === TransactionType.INCOME || t.type === TransactionType.EXPENSE
  );

  const filteredTransactions = realTransactions.filter((t) => {
    if (filterType === "ALL") return true;
    return t.type === filterType;
  });

  // Batasi daftar awal maksimal 15 item agar tidak membebani DOM halaman
  const displayedTransactions = filteredTransactions.slice(0, 15);

  return (
    <div className="card-solid bg-card p-5 sm:p-6 rounded-2xl border border-edge space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-edge/60 pb-4">
        <div className="flex items-center gap-2.5">
          <Receipt className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-ink">
              Buku Kas Publik Terpadu
            </h3>
            <p className="text-[11px] text-ink-muted">
              Transparansi aliran dana kas riil organisasi Saba ExploIT
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-edge/70 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setFilterType("ALL");
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all touch-bounce cursor-pointer ${
              filterType === "ALL"
                ? "bg-card text-ink shadow-xs border border-edge"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Semua ({realTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setFilterType("INCOME");
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all touch-bounce cursor-pointer ${
              filterType === "INCOME"
                ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs border border-edge"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setFilterType("EXPENSE");
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all touch-bounce cursor-pointer ${
              filterType === "EXPENSE"
                ? "bg-card text-rose-600 dark:text-rose-400 shadow-xs border border-edge"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* Ringkasan Finansial Singkat (Full-Width Saldo + 2-Column Pemasukan/Pengeluaran) */}
      <div className="space-y-3">
        <div className="card-hover p-4 rounded-xl bg-surface-container-low/70 border hairline-border space-y-1">
          <span className="text-[11px] text-ink-muted block font-medium">
            Saldo Kas Riil Tersedia
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-ink font-mono-num font-mono">
            Rp {animatedBalance.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="card-hover p-3.5 rounded-xl bg-surface-container-low/70 border hairline-border space-y-1">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-medium">
              Total Dana Masuk
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono-num font-mono">
              + Rp {animatedIncome.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="card-hover p-3.5 rounded-xl bg-surface-container-low/70 border hairline-border space-y-1">
            <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-medium">
              Total Pengeluaran
            </span>
            <span className="text-sm sm:text-base font-extrabold text-rose-700 dark:text-rose-400 font-mono-num font-mono">
              - Rp {animatedExpense.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Daftar Transaksi (Maksimal 400px dengan Scroll Internal) */}
      {displayedTransactions.length === 0 ? (
        <div className="py-10 text-center space-y-2 bg-surface-container-low rounded-xl border border-edge/60">
          <Layers className="h-6 w-6 text-slate-400 mx-auto" />
          <p className="text-xs text-ink-muted">
            Tidak ada transaksi kas pada filter ini.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-edge/70 max-h-[400px] overflow-y-auto pr-2">
          {displayedTransactions.map((t) => {
            const isIncome = t.type === TransactionType.INCOME;
            const dateStr = new Date(t.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={t.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 sm:mt-0 ${
                      isIncome
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink line-clamp-1">
                      {t.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted mt-0.5">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container text-ink-secondary font-medium">
                        {t.category.replace(/_/g, " ")}
                      </span>
                      {t.user && (
                        <>
                          <span>•</span>
                          <span className="text-ink">
                            Anggota: {t.user.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 pl-12 sm:pl-0">
                  <span
                    className={`text-xs font-bold ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"} Rp {t.amount.toLocaleString("id-ID")}
                  </span>
                  <span className="block text-[10px] text-ink-muted mt-0.5">
                    {isIncome ? "Kas Masuk" : "Kas Keluar"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
