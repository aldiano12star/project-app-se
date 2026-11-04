"use client";

import React, { useState, useTransition } from "react";
import { Invoice, InvoiceStatus, InvoiceType } from "@prisma/client";
import {
  Receipt,
  CheckCircle2,
  Clock,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  X,
  Wallet,
} from "lucide-react";
import { payInvoiceWithWallet } from "@/actions/invoice";

interface InvoiceListCardProps {
  invoices: Invoice[];
  userKasBalance?: number;
}

export function InvoiceListCard({
  invoices,
  userKasBalance = 0,
}: InvoiceListCardProps) {
  const [isPending, startTransition] = useTransition();
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const unpaidInvoices = invoices.filter((i) => i.status === InvoiceStatus.UNPAID);
  const paidInvoices = invoices.filter((i) => i.status === InvoiceStatus.PAID);

  const totalUnpaidAmount = unpaidInvoices.reduce((acc, curr) => acc + curr.amount, 0);

  const handlePay = (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await payInvoiceWithWallet(invoiceId);
        if (res.success) {
          setFeedback({ type: "success", message: res.message });
        } else {
          setFeedback({ type: "error", message: res.message });
        }
      } catch {
        setFeedback({
          type: "error",
          message: "Terjadi kesalahan saat memproses pembayaran tagihan.",
        });
      } finally {
        setPayingInvoiceId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* ── FEEDBACK NOTIFICATION ────────────────────────────────────────── */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
              Gunakan saldo dompet Anda untuk melunasi tagihan secara mandiri, atau temui Bendahara untuk setoran tunai.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Hebat! Tidak ada tagihan tertunda. Pertahankan dedikasimu untuk organisasi!
            </p>
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
              const hasEnoughBalance = userKasBalance >= inv.amount;
              const isProcessing = payingInvoiceId === inv.id;

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

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {hasEnoughBalance ? (
                      <button
                        type="button"
                        disabled={isProcessing || isPending}
                        onClick={() => handlePay(inv.id)}
                        className="h-8 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        title="Lunaskan tagihan ini menggunakan saldo dompet Anda"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Lunaskan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="h-8 px-3 rounded-xl bg-surface-container-low text-ink-muted border border-edge opacity-60 cursor-not-allowed text-xs font-semibold inline-flex items-center gap-1"
                        title={`Saldo dompet Anda (Rp ${userKasBalance.toLocaleString("id-ID")}) kurang untuk melunasi tagihan ini`}
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        <span>Saldo Kurang</span>
                      </button>
                    )}
                  </div>
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
