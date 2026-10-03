"use client";

import React from "react";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export interface AttendanceSummaryData {
  attendedCount: number;
  totalMeetings: number;
  attendanceRate: number; // 0 - 100
  isCompliant: boolean; // >= 75%
}

export interface KasSummaryData {
  isPaid: boolean;
  totalArrears: number; // in Rupiah
  unpaidPeriodNames: string[];
  paidPeriodCount: number;
  totalPeriodCount: number;
}

interface PersonalSummarySectionProps {
  kasSummary: KasSummaryData;
  attendanceSummary: AttendanceSummaryData;
}

export function PersonalSummarySection({
  kasSummary,
  attendanceSummary,
}: PersonalSummarySectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Rekapitulasi Mandiri (Privat)
        </h3>
        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
          🔒 Hanya Terlihat Oleh Anda
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* ========================================================= */}
        {/* KARTU 1: STATUS KAS SAYA                                  */}
        {/* ========================================================= */}
        <div className="card-solid p-6 rounded-2xl bg-card border border-edge shadow-xs flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  kasSummary.isPaid
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
              >
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink uppercase tracking-wider">
                  Status Iuran Kas Saya
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kepatuhan iuran kas rutin periode aktif
                </p>
              </div>
            </div>

            {kasSummary.isPaid ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Kas Lunas</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold border border-amber-300 dark:border-amber-500/30 shrink-0">
                <AlertCircle className="w-4 h-4" />
                <span>Tunggakan Rp {kasSummary.totalArrears.toLocaleString("id-ID")}</span>
              </span>
            )}
          </div>

          {/* Rincian Keterangan Kas */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-edge/60 text-sm">
            {kasSummary.isPaid ? (
              <div className="space-y-1">
                <p className="text-ink font-semibold flex items-center gap-1.5 text-sm">
                  <span>✅ Seluruh iuran kas tercatat lunas.</span>
                </p>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Terima kasih sudah tertib kas organisasi! Pembukuan Anda bersih ({kasSummary.paidPeriodCount}/{kasSummary.totalPeriodCount} periode terbayar).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Perlu Diselesaikan</span>
                  </span>
                  <span className="font-mono font-bold text-ink text-sm">
                    Rp {kasSummary.totalArrears.toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Terdapat {kasSummary.unpaidPeriodNames.length} periode belum disetor:{" "}
                  <strong className="text-ink">{kasSummary.unpaidPeriodNames.join(", ")}</strong>. Silakan melakukan pembayaran tunai ke Bendahara Organisasi.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* KARTU 2: REKAPITULASI PRESENSI SAYA                       */}
        {/* ========================================================= */}
        <div className="card-solid p-6 rounded-2xl bg-card border border-edge shadow-xs flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  attendanceSummary.isCompliant
                    ? "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                }`}
              >
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink uppercase tracking-wider">
                  Rekapitulasi Presensi Saya
                </h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Kehadiran rapat pleno &amp; kegiatan resmi
                </p>
              </div>
            </div>

            {attendanceSummary.isCompliant ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Aktif &amp; Memenuhi Syarat</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold border border-amber-300 dark:border-amber-500/30 shrink-0">
                <AlertTriangle className="w-4 h-4" />
                <span>Perlu Ditingkatkan</span>
              </span>
            )}
          </div>

          {/* Progress Bar & Indikator Angka */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-edge/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                Persentase Kehadiran:
              </span>
              <span className="font-mono font-bold text-ink text-sm">
                {attendanceSummary.attendanceRate}%{" "}
                <span className="text-xs font-normal text-ink-muted">
                  ({attendanceSummary.attendedCount}/{attendanceSummary.totalMeetings} Pertemuan Hadir)
                </span>
              </span>
            </div>

            <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-edge/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  attendanceSummary.isCompliant
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-amber-500 to-rose-500"
                }`}
                style={{ width: `${Math.min(attendanceSummary.attendanceRate, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
              <span>Standar Keaktifan Minimum: 75%</span>
              <span className="font-normal text-slate-300">
                {attendanceSummary.isCompliant
                  ? "Status kuorum terpenuhi untuk kepanitiaan."
                  : "Tingkatkan kehadiran pada sesi rapat berikutnya."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
