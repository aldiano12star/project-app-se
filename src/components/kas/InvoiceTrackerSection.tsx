"use client";

import React, { useState, useTransition } from "react";
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Loader2,
  Filter,
  Users,
} from "lucide-react";
import { InvoiceStatus, InvoiceType, Role, Division } from "@prisma/client";
import { quickSettleInvoice } from "@/actions/invoice";

export interface TrackerInvoiceUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  classGrade: string | null;
  generationNumber?: number | null;
  gen?: number | null;
  kelas?: string | null;
  mainDivision: Division;
  kasBalance: number;
}

export interface TrackerInvoiceItem {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: InvoiceType;
  status: InvoiceStatus;
  dueDate?: Date | string | null;
  createdAt: Date | string;
  user: TrackerInvoiceUser;
}

interface InvoiceTrackerSectionProps {
  invoices: TrackerInvoiceItem[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function InvoiceTrackerSection({
  invoices,
  onSuccess,
  onError,
}: InvoiceTrackerSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [settlingInvoiceId, setSettlingInvoiceId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [statusFilters, setStatusFilters] = useState<Record<string, "ALL" | "UNPAID" | "PAID">>({});

  // Group invoices by title + type
  const groupedInvoices = React.useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        title: string;
        type: InvoiceType;
        amount: number;
        createdAt: Date;
        dueDate?: Date | null;
        items: TrackerInvoiceItem[];
      }
    >();

    invoices.forEach((inv) => {
      const key = `${inv.title}__${inv.type}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: inv.title,
          type: inv.type,
          amount: inv.amount,
          createdAt: new Date(inv.createdAt),
          dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
          items: [],
        });
      }
      map.get(key)!.items.push(inv);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [invoices]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleQuickSettle = (invoiceId: string) => {
    setSettlingInvoiceId(invoiceId);
    startTransition(async () => {
      try {
        const res = await quickSettleInvoice(invoiceId);
        if (res.success) {
          onSuccess?.(res.message);
        } else {
          onError?.(res.message);
        }
      } catch {
        onError?.("Gagal melakukan pelunasan tagihan.");
      } finally {
        setSettlingInvoiceId(null);
      }
    });
  };

  const formatGradeGen = (u: TrackerInvoiceUser) => {
    if (u.role === Role.KOLABORATOR || (u.role as string) === "KOLABORATOR") {
      return "Kolaborator";
    }
    const genVal =
      u.gen ??
      u.generationNumber ??
      (u.classGrade === "KELAS_10"
        ? 21
        : u.classGrade === "KELAS_11"
        ? 20
        : u.classGrade === "KELAS_12"
        ? 19
        : null);

    if (genVal) return `Gen ${genVal}`;
    return "-";
  };

  if (groupedInvoices.length === 0) {
    return (
      <div className="card-solid bg-card p-6 rounded-2xl border border-edge text-center space-y-2">
        <Receipt className="h-8 w-8 text-slate-400 mx-auto stroke-[1.5]" />
        <h4 className="text-sm font-bold text-ink">Belum Ada Tagihan Kas Aktif</h4>
        <p className="text-xs text-ink-muted max-w-sm mx-auto">
          Terbitkan tagihan kas rutin atau urunan melalui tombol &ldquo;Tarik Tagihan Serentak&rdquo; di atas untuk mulai memantau pembayaran anggota.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-ink">
            Pantau Tagihan &amp; Invoice Massal
          </h3>
          <p className="text-xs text-ink-muted">
            Tracking pelunasan kas per agenda, monitoring kekurangan, &amp; pelunasan kilat.
          </p>
        </div>
        <span className="text-xs font-semibold text-ink-muted bg-surface-container-low px-2.5 py-1 rounded-full border border-edge">
          {groupedInvoices.length} Agenda Penagihan
        </span>
      </div>

      <div className="space-y-3">
        {groupedInvoices.map((group) => {
          const isExpanded = expandedGroups[group.key] ?? false;
          const query = searchQueries[group.key] || "";
          const filter = statusFilters[group.key] || "ALL";

          const totalTarget = group.items.length;
          const paidCount = group.items.filter((i) => i.status === InvoiceStatus.PAID).length;
          const unpaidCount = totalTarget - paidCount;
          const percent = totalTarget > 0 ? Math.round((paidCount / totalTarget) * 100) : 0;
          const totalTargetAmount = group.amount * totalTarget;
          const collectedAmount = group.amount * paidCount;

          // Filter items inside table
          const filteredItems = group.items.filter((item) => {
            if (filter === "PAID" && item.status !== InvoiceStatus.PAID) return false;
            if (filter === "UNPAID" && item.status !== InvoiceStatus.UNPAID) return false;
            if (!query.trim()) return true;

            const q = query.toLowerCase();
            return (
              item.user.name.toLowerCase().includes(q) ||
              (item.user.classGrade || "").toLowerCase().includes(q) ||
              item.user.mainDivision.toLowerCase().includes(q)
            );
          });

          return (
            <div
              key={group.key}
              className="card-solid bg-card rounded-2xl border border-edge shadow-xs overflow-hidden transition-all"
            >
              {/* Group Accordion Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleGroup(group.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleGroup(group.key);
                  }
                }}
                className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors cursor-pointer select-none"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-ink truncate">
                      {group.title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        group.type === InvoiceType.KAS
                          ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                          : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                      }`}
                    >
                      {group.type === InvoiceType.KAS ? "Kas Rutin" : "Urunan"}
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      • Rp {group.amount.toLocaleString("id-ID")} / org
                    </span>
                  </div>

                  {/* Progress Bar & Subtitle */}
                  <div className="flex items-center gap-3 max-w-md pt-0.5">
                    <div className="flex-1 h-2 bg-surface-container-low rounded-full overflow-hidden border border-edge/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent === 100
                            ? "bg-emerald-600 dark:bg-emerald-400"
                            : "bg-primary"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-ink tabular-nums shrink-0">
                      {paidCount}/{totalTarget} ({percent}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-ink-muted">
                    Terkumpul:{" "}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Rp {collectedAmount.toLocaleString("id-ID")}
                    </span>{" "}
                    dari total Rp {totalTargetAmount.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {unpaidCount === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Lunas Semua
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {unpaidCount} Belum Bayar
                    </span>
                  )}
                  <div className="p-1 rounded-lg text-ink-muted hover:text-ink">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expansion Table Content */}
              {isExpanded && (
                <div className="border-t border-edge p-4 sm:p-5 space-y-4 bg-surface-container-low/20 animate-in fade-in duration-200">
                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative">
                      <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Saring nama, kelas, divisi..."
                        value={query}
                        onChange={(e) =>
                          setSearchQueries((prev) => ({
                            ...prev,
                            [group.key]: e.target.value,
                          }))
                        }
                        className="h-9 min-h-9 pl-9 pr-3 text-xs bg-card rounded-xl border border-edge text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-1 focus:ring-primary w-full sm:w-56"
                      />
                    </div>

                    <div className="flex items-center bg-card p-1 rounded-xl border border-edge text-xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() =>
                          setStatusFilters((prev) => ({
                            ...prev,
                            [group.key]: "ALL",
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          filter === "ALL"
                            ? "bg-surface-container-low text-ink shadow-xs border border-edge"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        Semua ({group.items.length})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStatusFilters((prev) => ({
                            ...prev,
                            [group.key]: "UNPAID",
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          filter === "UNPAID"
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs border border-rose-200 dark:border-rose-900"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        Belum Lunas ({unpaidCount})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStatusFilters((prev) => ({
                            ...prev,
                            [group.key]: "PAID",
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                          filter === "PAID"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-200 dark:border-emerald-900"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        Lunas ({paidCount})
                      </button>
                    </div>
                  </div>

                  {/* Targeted Members Table */}
                  <div className="overflow-x-auto rounded-xl border border-edge/80 bg-card">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low border-b border-edge text-ink-muted font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-2.5">Nama Anggota</th>
                          <th className="px-4 py-2.5">Kelas / Divisi</th>
                          <th className="px-4 py-2.5 text-center">Status</th>
                          <th className="px-4 py-2.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge/60">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-ink-muted">
                              Tidak ada anggota yang cocok dengan filter ini.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((item) => {
                            const isPaid = item.status === InvoiceStatus.PAID;
                            const isProcessing = settlingInvoiceId === item.id;
                            const userBal = item.user.kasBalance;

                            // Status calculation:
                            // 1. Lunas
                            // 2. Kurang Rp X (jika user punya saldo tapi kurang dari nominal tagihan)
                            // 3. Saldo Cukup (jika user punya saldo >= nominal tagihan tapi belum dipotong)
                            // 4. Belum Bayar (jika user tidak punya saldo / 0 / negatif)
                            let statusBadge: React.ReactNode;
                            if (isPaid) {
                              statusBadge = (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                  <Check className="h-3 w-3" />
                                  Lunas
                                </span>
                              );
                            } else if (userBal <= 0) {
                              statusBadge = (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                  <AlertCircle className="h-3 w-3" />
                                  Belum Bayar
                                </span>
                              );
                            } else if (userBal < item.amount) {
                              const missing = item.amount - userBal;
                              statusBadge = (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                  <Clock className="h-3 w-3" />
                                  Kurang Rp {missing.toLocaleString("id-ID")}
                                </span>
                              );
                            } else {
                              statusBadge = (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900">
                                  <Wallet className="h-3 w-3" />
                                  Saldo Cukup
                                </span>
                              );
                            }

                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-surface-container-low/40 transition-colors"
                              >
                                <td className="px-4 py-2.5 font-semibold text-ink">
                                  {item.user.name}
                                </td>
                                <td className="px-4 py-2.5 text-ink-muted">
                                  {formatGradeGen(item.user)} • {item.user.mainDivision}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {statusBadge}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {isPaid ? (
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Selesai
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isProcessing || isPending}
                                      onClick={() => handleQuickSettle(item.id)}
                                      className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                      title={`Lunaskan tagihan ${item.user.name}`}
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
                                      )}
                                      <span>Lunaskan</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
