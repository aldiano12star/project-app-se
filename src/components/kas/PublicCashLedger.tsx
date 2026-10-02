"use client";

import React, { useState } from "react";
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
} from "@prisma/client";

export interface TransactionItem {
  id: string;
  type: TransactionType;
  incomeCategory: IncomeCategory | null;
  expenseCategory: ExpenseCategory | null;
  amount: number;
  description: string;
  proofUrl: string | null;
  date: Date | string;
  createdBy: {
    name: string;
  };
}

interface PublicCashLedgerProps {
  transactions: TransactionItem[];
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
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">(
    "ALL"
  );

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "ALL") return true;
    return t.type === filterType;
  });

  const formatCategory = (
    type: TransactionType,
    incomeCat: IncomeCategory | null,
    expenseCat: ExpenseCategory | null
  ) => {
    if (type === TransactionType.INCOME && incomeCat) {
      return incomeCat.replace("_", " ");
    }
    if (type === TransactionType.EXPENSE && expenseCat) {
      return expenseCat.replace("_", " ");
    }
    return type === TransactionType.INCOME ? "Pemasukan" : "Pengeluaran";
  };

  return (
    <div className="card-solid p-4 sm:p-5 shadow-sm flex flex-col gap-3">
      {/* Header & Total Saldo */}
      <div className="flex items-center justify-between border-b border-edge pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/50 text-brand-primary border border-red-200 dark:border-red-900">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Buku Kas Publik Transparan
            </h3>
            <span className="text-[10px] text-ink-muted">
              Laporan keluar masuk dana organisasi
            </span>
          </div>
        </div>
      </div>

      {/* 3 Kotak Ringkasan Finansial */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-surface-container-low border border-edge p-2.5 flex flex-col">
          <span className="text-[10px] font-medium text-ink-muted">
            Saldo Kas
          </span>
          <span className="text-xs font-black text-ink mt-0.5 tabular-nums truncate">
            Rp {totalBalance.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="rounded-lg bg-surface-container-low border border-edge p-2.5 flex flex-col">
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Pemasukan
          </span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums truncate">
            +Rp {totalIncome.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="rounded-lg bg-surface-container-low border border-edge p-2.5 flex flex-col">
          <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
            Pengeluaran
          </span>
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums truncate">
            -Rp {totalExpense.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setFilterType("ALL")}
          className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            filterType === "ALL"
              ? "bg-ink text-surface"
              : "bg-surface-container-low text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          Semua ({transactions.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("INCOME")}
          className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            filterType === "INCOME"
              ? "bg-emerald-600 text-white"
              : "bg-surface-container-low text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          Pemasukan
        </button>
        <button
          type="button"
          onClick={() => setFilterType("EXPENSE")}
          className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            filterType === "EXPENSE"
              ? "bg-rose-600 text-white"
              : "bg-surface-container-low text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          Pengeluaran
        </button>
      </div>

      {/* Daftar Riwayat Transaksi */}
      <div className="space-y-2 pt-1">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-6 text-xs text-ink-muted border border-dashed border-edge rounded-lg">
            Belum ada catatan transaksi pada filter ini.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === TransactionType.INCOME;
            const dateStr = new Date(tx.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={tx.id}
                className="rounded-lg border border-edge bg-surface p-3 flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 mt-0.5 ${
                      isIncome
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
                        : "bg-rose-50 dark:bg-rose-950/50 text-rose-600"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate leading-tight">
                      {tx.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-ink-muted">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="inline-block rounded bg-surface-container-high px-1.5 py-0.2 text-[9px] font-semibold text-ink-secondary">
                        {formatCategory(
                          tx.type,
                          tx.incomeCategory,
                          tx.expenseCategory
                        )}
                      </span>
                      {tx.proofUrl && (
                        <a
                          href={tx.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Nota</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-extrabold flex-shrink-0 tabular-nums ${
                    isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isIncome ? "+" : "-"}Rp{" "}
                  {tx.amount.toLocaleString("id-ID")}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
