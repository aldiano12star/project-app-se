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
    <section className="space-y-1.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 px-1 font-mono">
        🛡️ Panel Darurat &amp; Cadangan Data Admin
      </h3>

      <div className="bg-card border border-edge rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-500 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink leading-tight">
              Pencadangan Data Organisasi (.CSV)
            </h4>
            <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
              Unduh salinan data fisik berkala untuk arsip LPJ kesiswaan atau antisipasi pemulihan sistem. Format CSV menggunakan UTF-8 BOM agar rapi di Microsoft Excel.
            </p>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
              feedback.type === "success"
                ? "bg-success-subtle border-success/30 text-success"
                : "bg-danger-subtle border-danger/30 text-danger"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* 3 Download Action Buttons */}
        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {/* Button 1: Rekap Anggota */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleDownload("members", exportMembersCSV)}
            className="w-full min-h-[44px] p-3 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-[0.99] border border-edge flex items-center justify-between text-left transition-all cursor-pointer disabled:opacity-50 group"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors block truncate">
                  1. Unduh Rekap Data Anggota (.CSV)
                </span>
                <span className="text-[10px] text-ink-muted">
                  NISN, Nama, Divisi, Angkatan, Role, No WA, Total XP
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-edge text-ink text-xs font-semibold shrink-0 group-hover:border-primary/50">
              {downloadingType === "members" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Download className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="hidden sm:inline">Export</span>
            </div>
          </button>

          {/* Button 2: Rekap Kehadiran Rapat */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleDownload("attendance", exportAttendanceCSV)}
            className="w-full min-h-[44px] p-3 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-[0.99] border border-edge flex items-center justify-between text-left transition-all cursor-pointer disabled:opacity-50 group"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors block truncate">
                  2. Unduh Arsip Kehadiran Rapat (.CSV)
                </span>
                <span className="text-[10px] text-ink-muted">
                  Judul Rapat, Tanggal, Anggota, NISN, Status Presensi
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-edge text-ink text-xs font-semibold shrink-0 group-hover:border-primary/50">
              {downloadingType === "attendance" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Download className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="hidden sm:inline">Export</span>
            </div>
          </button>

          {/* Button 3: Buku Besar Kas */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleDownload("kas", exportKasCSV)}
            className="w-full min-h-[44px] p-3 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-[0.99] border border-edge flex items-center justify-between text-left transition-all cursor-pointer disabled:opacity-50 group"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors block truncate">
                  3. Unduh Buku Besar Kas (.CSV)
                </span>
                <span className="text-[10px] text-ink-muted">
                  Tanggal, Jenis Mutasi, Kategori, Nominal, Uraian
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-edge text-ink text-xs font-semibold shrink-0 group-hover:border-primary/50">
              {downloadingType === "kas" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Download className="w-3.5 h-3.5 text-primary" />
              )}
              <span className="hidden sm:inline">Export</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
