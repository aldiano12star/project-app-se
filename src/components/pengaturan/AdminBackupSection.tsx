"use client";

import React, { useState, useTransition } from "react";
import {
  Download,
  FileSpreadsheet,
  Users,
  CalendarCheck,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  exportMembersCSV,
  exportAttendanceCSV,
  exportKasCSV,
  BackupResponse,
} from "@/actions/backup";

interface AdminBackupSectionProps {
  currentUserRole?: string;
}

export function AdminBackupSection({ currentUserRole }: AdminBackupSectionProps) {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "OPERATOR";

  if (!isAdmin) return null;

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownload = (
    type: "members" | "attendance" | "kas",
    exportFn: () => Promise<BackupResponse>
  ) => {
    setDownloadingType(type);
    setFeedback(null);

    startTransition(async () => {
      const res = await exportFn();
      if (res.success && res.csvContent && res.filename) {
        triggerDownload(res.csvContent, res.filename);
        setFeedback({ text: res.message, type: "success" });
      } else {
        setFeedback({
          text: res.message || "Gagal mengunduh cadangan data.",
          type: "error",
        });
      }
      setDownloadingType(null);
    });
  };

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1 font-mono">
        Panel Darurat &amp; Cadangan Data Admin
      </h3>

      <div className="apple-card p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-6 h-6 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-ink leading-tight font-display">
              Pencadangan Data Organisasi (.CSV)
            </h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Unduh salinan data fisik berkala untuk arsip LPJ kesiswaan atau antisipasi pemulihan sistem. Format CSV menggunakan UTF-8 BOM agar rapi di Microsoft Excel.
            </p>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* 3 Download Action Cards (Bersih, Multi-baris tanpa Truncation, Touch Target >= 44px) */}
        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {/* Item 1: Rekap Anggota */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low/70 hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-surface-container-low">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hairline-border flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-xs font-bold text-ink">
                    Rekapitulasi Data Anggota
                  </h5>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-surface hairline-border text-ink-muted uppercase">
                    .CSV
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Daftar nama, divisi, angkatan, peran, kontak WhatsApp, dan akumulasi poin XP anggota aktif.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDownload("members", exportMembersCSV)}
              className="tactile-btn h-11 min-h-[44px] px-4 rounded-xl bg-surface hairline-border hover:bg-surface-container text-ink text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto w-full sm:w-auto"
            >
              {downloadingType === "members" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-ink-muted" />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>

          {/* Item 2: Rekap Kehadiran Rapat */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low/70 hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-surface-container-low">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hairline-border flex items-center justify-center shrink-0 mt-0.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-xs font-bold text-ink">
                    Arsip Kehadiran Rapat &amp; Pleno
                  </h5>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-surface hairline-border text-ink-muted uppercase">
                    .CSV
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Log lengkap riwayat presensi rapat per sesi, verifikasi QR kehadiran, dan keterlibatan anggota.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDownload("attendance", exportAttendanceCSV)}
              className="tactile-btn h-11 min-h-[44px] px-4 rounded-xl bg-surface hairline-border hover:bg-surface-container text-ink text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto w-full sm:w-auto"
            >
              {downloadingType === "attendance" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-ink-muted" />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>

          {/* Item 3: Buku Besar Kas */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low/70 hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-surface-container-low">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hairline-border flex items-center justify-center shrink-0 mt-0.5">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-xs font-bold text-ink">
                    Buku Besar Kas Organisasi
                  </h5>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-surface hairline-border text-ink-muted uppercase">
                    .CSV
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Catatan transaksi kas masuk &amp; keluar, status pelunasan iuran berkala, dan saldo mutasi riil.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDownload("kas", exportKasCSV)}
              className="tactile-btn h-11 min-h-[44px] px-4 rounded-xl bg-surface hairline-border hover:bg-surface-container text-ink text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto w-full sm:w-auto"
            >
              {downloadingType === "kas" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-ink-muted" />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
