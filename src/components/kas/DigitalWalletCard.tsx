"use client";

import React, { useState } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
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
  userName: string;
  userRole: string;
  classGrade: string | null;
  kasBalance: number;
  transactions: PersonalLedgerItem[];
}

export function DigitalWalletCard({
  userName,
  userRole,
  classGrade,
  kasBalance,
  transactions,
}: DigitalWalletCardProps) {
  const [showHistory, setShowHistory] = useState(true);

  const isDeficit = kasBalance < 0;
  const absBalance = Math.abs(kasBalance);
  const formattedBalance = `Rp ${absBalance.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-4">
      {/* ── 1. THE DIGITAL WALLET CARD (Apple Wallet Inspired) ────────── */}
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all p-6 sm:p-7 shadow-xs ${
          isDeficit
            ? "bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
            : "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
        }`}
      >
        {/* Subtle Background Glow Accent */}
        <div
          className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 ${
            isDeficit ? "bg-rose-500" : "bg-emerald-500"
          }`}
        />

        <div className="relative z-10 flex flex-col justify-between gap-6">
          {/* Top Row: Brand & Status Pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wallet
                className={`h-5 w-5 ${
                  isDeficit
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Dompet Kas Personal
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isDeficit
                  ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                  : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              }`}
            >
              {isDeficit ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Tunggakan Kas</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>Saldo Kas Aman</span>
                </>
              )}
            </span>
          </div>

          {/* Center: Large Balance Display */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-ink-muted">
              {isDeficit ? "Total Tunggakan Iuran" : "Saldo Mengendap / Aktif"}
            </p>
            <div className="flex items-baseline gap-2">
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  isDeficit
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {isDeficit ? `- ${formattedBalance}` : formattedBalance}
              </h2>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed pt-1">
              {isDeficit
                ? "Anda memiliki iuran kas yang belum disetor. Silakan lakukan pembayaran tunai ke Bendahara Organisasi."
                : kasBalance > 0
                ? "Saldo kas Anda positif. Pembayaran iuran berikutnya akan otomatis dipotong dari saldo ini."
                : "Tidak ada tunggakan kas saat ini. Buku pembukuan Anda rapi dan tertib."}
            </p>
          </div>

          {/* Bottom Row: Member Info Badge */}
          <div className="pt-2 border-t border-edge/60 flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">{userName}</span>
              {classGrade && (
                <span className="px-2 py-0.5 rounded-md bg-card border border-edge text-[11px] font-medium">
                  {classGrade}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-ink-muted">
              Role: <strong className="text-ink">{userRole}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. MUTASI SALDO PERSONAL (Personal Transaction Timeline) ── */}
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
              const isDeduction = tx.type === TransactionType.BILL_DEDUCTION;
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
    </div>
  );
}
