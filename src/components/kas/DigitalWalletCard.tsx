"use client";

import React, { useState } from "react";
import {
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { TransactionType, TransactionCategory } from "@prisma/client";
import { useCountUp } from "@/hooks/useCountUp";
import { haptic } from "@/lib/haptic";

export interface PersonalLedgerItem {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: Date | string;
}

export interface DigitalWalletCardProps {
  userName?: string;
  userRole?: string;
  classGrade?: string | null;
  kasBalance?: number;
  orgBalance?: number;
  totalIncome?: number;
  totalExpense?: number;
  isKolaborator?: boolean;
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export function DigitalWalletCard({
  userName = "Anggota",
  classGrade,
  kasBalance = 0,
  orgBalance = 0,
  totalIncome = 0,
  totalExpense = 0,
  isKolaborator = false,
}: DigitalWalletCardProps) {
  const [activeCard, setActiveCard] = useState<"ORG" | "PERSONAL">(
    isKolaborator ? "PERSONAL" : "ORG"
  );

  const animatedOrgBalance = useCountUp(orgBalance, 600);
  const animatedPersonalBalance = useCountUp(kasBalance, 600);

  const isPositive = kasBalance > 0;
  const isZero = kasBalance === 0;
  const gradeLabel = formatGrade(classGrade);

  return (
    <div className="space-y-3">
      {/* Apple-Style Segmented Card Switcher */}
      {!isKolaborator && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border hairline-border">
            <button
              type="button"
              onClick={() => {
                haptic.tap();
                setActiveCard("ORG");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCard === "ORG"
                  ? "bg-card text-ink shadow-xs border hairline-border"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Kas Organisasi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.tap();
                setActiveCard("PERSONAL");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCard === "PERSONAL"
                  ? "bg-card text-ink shadow-xs border hairline-border"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Dompet Saya</span>
            </button>
          </div>

          <span className="text-xs text-ink-muted hidden sm:inline-block">
            {activeCard === "ORG" ? "Buku Kas Publik" : "Saldo Anggota"}
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* APPLE WALLET INTERACTIVE CARD STACK                       */}
      {/* ========================================================= */}
      <div className="relative">
        {activeCard === "ORG" && !isKolaborator ? (
          /* CARD A: KAS UTAMA ORGANISASI (ADAPTIVE LIGHT / ELEVATED DARK APPLE CARD) */
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-linear-to-br from-amber-50/90 via-white to-amber-100/40 dark:from-[#23242B] dark:via-[#1E1F25] dark:to-[#191A20] text-zinc-900 dark:text-white border border-black/10 dark:border-white/15 shadow-md dark:shadow-xl space-y-6 transition-all duration-300">
            {/* Ambient Metallic Glow & Specular Sheen */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Row: Brand & Badge */}
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Kas Treasury SE-Core
                </span>
                <span className="text-base font-semibold text-zinc-900 dark:text-neutral-100 font-display">
                  Kas Utama Saba ExploIT
                </span>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-white/10 text-amber-900 dark:text-neutral-300 border border-amber-500/20 dark:border-white/15 text-xs font-medium">
                Organisasi
              </span>
            </div>

            {/* Middle: Giant Tabular Balance */}
            <div className="space-y-1 relative z-10">
              <span className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-neutral-400 leading-relaxed">
                Total Saldo Kas Tersedia
              </span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold tabular-nums text-zinc-950 dark:text-white tracking-tight">
                Rp {animatedOrgBalance.toLocaleString("id-ID")}
              </div>
            </div>

            {/* Bottom Row: Pemasukan & Pengeluaran Bento Strip + Cardholder */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-black/10 dark:border-white/10 relative z-10">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center gap-2">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-xs text-zinc-500 dark:text-neutral-400 block font-normal">Masuk</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +Rp {totalIncome.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center gap-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <span className="text-xs text-zinc-500 dark:text-neutral-400 block font-normal">Keluar</span>
                    <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      -Rp {totalExpense.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-zinc-500 dark:text-neutral-400 block font-normal">
                  Pemegang Buku Kas
                </span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-neutral-200 tracking-tight font-display">
                  Bendahara Umum Saba ExploIT
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* CARD B: DOMPET PERSONAL ANGGOTA (ADAPTIVE LIGHT / EMERALD APPLE CARD) */
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-linear-to-br from-emerald-50/90 via-white to-teal-50/50 dark:from-emerald-950/80 dark:via-teal-950/70 dark:to-[#171E1C] text-zinc-900 dark:text-white border border-black/10 dark:border-emerald-500/30 shadow-md dark:shadow-xl space-y-6 transition-all duration-300">
            {/* Ambient Emerald Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Row: Brand & Badge */}
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Dompet Anggota SE-Core
                </span>
                <span className="text-base font-semibold text-zinc-900 dark:text-neutral-100 font-display">
                  Dompet Kas Anggota
                </span>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-white/10 text-emerald-800 dark:text-neutral-300 border border-emerald-500/20 dark:border-white/15 text-xs font-medium">
                Personal
              </span>
            </div>

            {/* Middle: Giant Tabular Balance */}
            <div className="space-y-1 relative z-10">
              <span className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-neutral-400 leading-relaxed">
                Saldo Dompet Personal Saya
              </span>
              <div
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tabular-nums tracking-tight ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isZero
                    ? "text-zinc-950 dark:text-white"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {animatedPersonalBalance < 0 ? "- " : ""}Rp{" "}
                {Math.abs(animatedPersonalBalance).toLocaleString("id-ID")}
              </div>
            </div>

            {/* Bottom Row: Status Pill & Cardholder */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-black/10 dark:border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${
                    isPositive
                      ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40"
                      : isZero
                      ? "bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-neutral-300 border-black/10 dark:border-white/20"
                      : "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/40"
                  }`}
                >
                  {isPositive
                    ? "✓ Saldo Tersedia"
                    : isZero
                    ? "Saldo Nol"
                    : "Defisit Tagihan"}
                </span>
                <span className="text-xs text-zinc-500 dark:text-neutral-400 hidden sm:inline-block">
                  {isPositive ? "Dapat memotong tagihan otomatis" : "Hubungi Bendahara"}
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-zinc-500 dark:text-neutral-400 block font-normal">
                  Nama Anggota
                </span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-neutral-200 tracking-tight font-display">
                  {userName}{gradeLabel ? ` • ${gradeLabel}` : ""}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MutationHistoryProps {
  transactions: PersonalLedgerItem[];
}

export function MutationHistory({ transactions = [] }: MutationHistoryProps) {
  const displayedTransactions = transactions.slice(0, 5);

  return (
    <div className="specular-card bg-card p-5 sm:p-6 rounded-2xl border border-edge/80 dark:border-white/10 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-surface-container flex items-center justify-center border hairline-border">
            <History className="h-4 w-4 text-ink-muted" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink font-display">
              Riwayat Mutasi Saldo Kas
            </h3>
            <p className="text-xs text-ink-muted">
              5 transaksi terakhir tercatat pada akun ini
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-ink-muted bg-surface-container-low px-2.5 py-1 rounded-full border hairline-border">
          {displayedTransactions.length} Transaksi
        </span>
      </div>

      {displayedTransactions.length === 0 ? (
        <div className="py-8 text-center space-y-2 bg-surface-container-low/40 dark:bg-white/5 rounded-xl border hairline-border">
          <Info className="h-6 w-6 text-ink-muted mx-auto" />
          <p className="text-xs text-ink-muted font-body">
            Belum ada riwayat mutasi kas personal tercatat untuk akun kamu.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-edge/60 dark:divide-white/10">
          {displayedTransactions.map((tx) => {
            const isIncome = tx.type === TransactionType.INCOME;
            const dateStr = new Date(tx.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-3 first:pt-1 last:pb-0 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate group-hover:text-primary transition-colors">
                      {tx.description}
                    </p>
                    <p className="text-xs sm:text-sm text-ink-muted flex items-center gap-1.5 mt-0.5">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="font-semibold text-ink-secondary">
                        {tx.category.replace(/_/g, " ")}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm sm:text-base font-extrabold tabular-nums ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"} Rp{" "}
                    {tx.amount.toLocaleString("id-ID")}
                  </span>
                  <span className="block text-xs text-ink-muted mt-0.5">
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
