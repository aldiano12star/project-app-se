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
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono">
          Rekapitulasi Mandiri (Privat)
        </h3>
        <span className="text-[10px] text-ink-muted flex items-center gap-1 font-mono">
          🔒 Hanya Terlihat Oleh Anda
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* ========================================================= */}
        {/* KARTU 1: STATUS KAS SAYA                                  */}
        {/* ========================================================= */}
        <div className="card-solid p-4 rounded-2xl bg-card border border-edge shadow-xs flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  kasSummary.isPaid
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Status Iuran Kas Saya
                </h4>
                <p className="text-[11px] text-ink-muted">
                  Kepatuhan iuran kas rutin periode aktif
                </p>
              </div>
            </div>

            {kasSummary.isPaid ? (
              <span className="inline-flex items-center gap-1 bg-success-subtle text-success px-2.5 py-1 rounded-full text-[11px] font-bold border border-success/30 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kas Bulan Ini Lunas</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-500/30 shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ada Tunggakan Rp {kasSummary.totalArrears.toLocaleString("id-ID")}</span>
              </span>
            )}
          </div>

          {/* Rincian Keterangan Kas */}
          <div className="bg-surface-container-low rounded-xl p-3 border border-edge/60 text-xs">
            {kasSummary.isPaid ? (
              <div className="space-y-1">
                <p className="text-ink font-semibold flex items-center gap-1.5 text-xs">
                  <span>✅ Seluruh iuran kas tercatat lunas.</span>
                </p>
                <p className="text-[11px] text-ink-secondary">
                  Terima kasih sudah tertib kas organisasi! Pembukuan Anda bersih ({kasSummary.paidPeriodCount}/{kasSummary.totalPeriodCount} periode terbayar).
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Perlu Diselesaikan</span>
                  </span>
                  <span className="font-mono font-bold text-ink text-xs">
                    Rp {kasSummary.totalArrears.toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-[11px] text-ink-secondary leading-relaxed">
                  Terdapat {kasSummary.unpaidPeriodNames.length} periode belum disetor:{" "}
                  <strong>{kasSummary.unpaidPeriodNames.join(", ")}</strong>. Silakan melakukan pembayaran tunai ke Bendahara Organisasi.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* KARTU 2: REKAPITULASI PRESENSI SAYA                       */}
        {/* ========================================================= */}
        <div className="card-solid p-4 rounded-2xl bg-card border border-edge shadow-xs flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  attendanceSummary.isCompliant
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Rekapitulasi Presensi Saya
                </h4>
                <p className="text-[11px] text-ink-muted">
                  Kehadiran rapat pleno &amp; kegiatan resmi
                </p>
              </div>
            </div>

            {attendanceSummary.isCompliant ? (
              <span className="inline-flex items-center gap-1 bg-success-subtle text-success px-2.5 py-1 rounded-full text-[11px] font-bold border border-success/30 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aktif &amp; Memenuhi Syarat</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Perlu Ditingkatkan</span>
              </span>
            )}
          </div>

          {/* Progress Bar & Indikator Angka */}
          <div className="bg-surface-container-low rounded-xl p-3 border border-edge/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                Persentase Kehadiran:
              </span>
              <span className="font-mono font-bold text-ink text-sm">
                {attendanceSummary.attendanceRate}%{" "}
                <span className="text-[11px] font-normal text-ink-muted">
                  ({attendanceSummary.attendedCount}/{attendanceSummary.totalMeetings} Pertemuan Hadir)
                </span>
              </span>
            </div>

            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-edge/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  attendanceSummary.isCompliant
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-amber-500 to-red-500"
                }`}
                style={{ width: `${Math.min(attendanceSummary.attendanceRate, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-ink-muted pt-0.5">
              <span>Standar Keaktifan Minimum: 75%</span>
              <span className="font-medium text-ink-secondary">
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
