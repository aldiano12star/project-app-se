"use client";

import React from "react";
import { Invoice, InvoiceStatus, InvoiceType } from "@prisma/client";
import {
  Receipt,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

interface InvoiceListCardProps {
  invoices: Invoice[];
  userKasBalance?: number;
}

export function InvoiceListCard({
  invoices,
  userKasBalance = 0,
}: InvoiceListCardProps) {
  const unpaidInvoices = invoices.filter((i) => i.status === InvoiceStatus.UNPAID);
  const paidInvoices = invoices.filter((i) => i.status === InvoiceStatus.PAID);

  const totalUnpaidAmount = unpaidInvoices.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header Tagihan & Total Tunggakan */}
      <div className="card-solid p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="h-5 w-5 text-primary stroke-2" />
            <div>
              <h2 className="text-sm font-bold text-ink">
                Tagihan Saya (Invoices)
              </h2>
              <p className="text-xs text-ink-muted">
                Rincian iuran kas rutin &amp; urunan kegiatan
              </p>
            </div>
          </div>

          {unpaidInvoices.length > 0 ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
              {unpaidInvoices.length} Belum Lunas
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Semua Lunas</span>
            </span>
          )}
        </div>

        {/* Ringkasan Tunggakan & Teks Motivasi Dinamis */}
        {unpaidInvoices.length > 0 ? (
          <div className="p-4 rounded-2xl bg-surface-container-low border border-edge space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-ink-muted">
                Total Tagihan Tertunda
              </span>
              <p className="text-base font-extrabold text-ink tabular-nums">
                Rp {totalUnpaidAmount.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-edge/60 text-xs">
              <span className="text-ink-muted">Saldo Dompet Saya:</span>
              <span className="font-bold text-ink tabular-nums">
                Rp {userKasBalance.toLocaleString("id-ID")}
              </span>
            </div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 pt-0.5">
              Mohon segera temui Bendahara untuk konfirmasi pelunasan tagihan aktif Anda.
            </p>
          </div>
        ) : (
          <div className="card-hover p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                Semua Tagihan Lunas ✨
              </span>
              <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 leading-relaxed mt-0.5">
                Hebat! Tidak ada tagihan tertunda. Pertahankan dedikasimu untuk organisasi!
              </p>
            </div>
          </div>
        )}

        {/* List Tagihan Belum Lunas */}
        <div className="space-y-3">
          {unpaidInvoices.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink-muted flex flex-col items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-emerald-500 stroke-[1.5]" />
              <p>Hebat! Tidak ada tagihan yang tertunda saat ini.</p>
            </div>
          ) : (
            unpaidInvoices.map((inv) => {
              const isDuePassed = inv.dueDate && new Date(inv.dueDate) < new Date();

              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl border border-edge bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-edge/80 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-ink">
                        {inv.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          inv.type === InvoiceType.KAS
                            ? "bg-sky-500/10 text-sky-500 border-sky-500/20"
                            : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                        }`}
                      >
                        {inv.type === InvoiceType.KAS ? "Kas Rutin" : "Urunan"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span className="font-semibold text-ink tabular-nums">
                        Rp {inv.amount.toLocaleString("id-ID")}
                      </span>
                      {inv.dueDate && (
                        <span
                          className={`flex items-center gap-1 text-[11px] ${
                            isDuePassed ? "text-rose-500 font-semibold" : ""
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>
                            Jatuh tempo:{" "}
                            {new Date(inv.dueDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl self-start sm:self-center">
                    Belum Lunas
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Riwayat Tagihan Lunas (Collapsible or Clean List) */}
        {paidInvoices.length > 0 && (
          <div className="pt-3 border-t border-edge/60 space-y-2">
            <span className="text-xs font-semibold text-ink-muted block">
              Riwayat Tagihan Lunas ({paidInvoices.length})
            </span>
            <div className="space-y-2">
              {paidInvoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl bg-surface-container-low/50 border border-edge/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-ink font-medium">{inv.title}</span>
                  </div>
                  <span className="text-ink-muted tabular-nums font-medium">
                    Rp {inv.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
