"use client";

import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Info,
} from "lucide-react";
import { TransactionType, TransactionCategory } from "@prisma/client";

export interface PersonalLedgerItem {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: Date | string;
}

interface DigitalWalletCardProps {
  userName?: string;
  userRole?: string;
  classGrade?: string | null;
  kasBalance?: number;
  transactions: PersonalLedgerItem[];
}

export function DigitalWalletCard({
  transactions,
}: DigitalWalletCardProps) {
  return (
    <div className="card-solid bg-card p-5 sm:p-6 rounded-2xl border border-edge space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-bold text-ink">
            Riwayat Mutasi Saldo Kas
          </h3>
        </div>
        <span className="text-xs text-ink-muted">
          {transactions.length} Transaksi Terakhir
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center space-y-2 bg-surface-container-low rounded-xl border border-edge/60">
          <Info className="h-6 w-6 text-slate-400 mx-auto" />
          <p className="text-xs text-ink-muted">
            Belum ada riwayat mutasi kas personal tercatat untuk akun Anda.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-edge/70">
          {transactions.map((tx) => {
            const isIncome = tx.type === TransactionType.INCOME;
            const dateStr = new Date(tx.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
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
                    <p className="text-xs font-semibold text-ink truncate">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-ink-muted flex items-center gap-2 mt-0.5">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="font-medium text-ink-secondary">
                        {tx.category.replace(/_/g, " ")}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"} Rp{" "}
                    {tx.amount.toLocaleString("id-ID")}
                  </span>
                  <span className="block text-[10px] text-ink-muted mt-0.5">
                    {isIncome ? "Setoran Masuk" : "Potongan Tagihan"}
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
