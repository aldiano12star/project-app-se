import React from "react";
import {
  CheckCircle2,
  CalendarCheck,
  AlertTriangle,
  Sparkles,
  Trophy,
} from "lucide-react";

export interface AttendanceSummaryData {
  attendedCount: number;
  totalMeetings: number;
  attendanceRate: number; // 0 - 100
  isCompliant: boolean; // >= 75%
}

interface PersonalSummarySectionProps {
  attendanceSummary: AttendanceSummaryData;
  totalPoints?: number;
  monthlyPoints?: number;
  userRank?: number;
}

export function PersonalSummarySection({
  attendanceSummary,
  totalPoints,
  monthlyPoints,
  userRank,
}: PersonalSummarySectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted font-mono">
          Rekapitulasi Mandiri (Privat)
        </h3>
        <span className="text-xs text-ink-muted flex items-center gap-1 font-mono">
          🔒 Hanya Terlihat Olehmu
        </span>
      </div>

      {/* KARTU POIN KONTRIBUSI & PERINGKAT */}
      {typeof totalPoints === "number" && (
        <div className="specular-card bg-card border border-edge/80 dark:border-white/10 p-5 sm:p-6 rounded-2xl flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/25">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-ink-muted font-display">
                  Poin Kontribusi
                </span>
              </div>

              {userRank !== undefined && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-mono">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  <span>Peringkat #{userRank}</span>
                </span>
              )}
            </div>

            <div className="pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-ink font-mono-num font-mono">
                  {totalPoints.toLocaleString("id-ID")}
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                  XP
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-1 leading-relaxed">
                +{monthlyPoints ?? 0} XP diperoleh pada periode bulan ini
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REKAPITULASI PRESENSI SAYA */}
      <div className="card-solid p-6 rounded-2xl bg-card border border-edge shadow-xs flex flex-col gap-4">
        <div className="flex flex-col items-start gap-2.5">
          {/* Baris Teratas: Badge Status */}
          {attendanceSummary.isCompliant ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Aktif &amp; Memenuhi Syarat</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 font-semibold px-2.5 py-1 rounded-full text-xs dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60 whitespace-nowrap shrink-0">
              <AlertTriangle className="w-4 h-4" />
              <span>Perlu Ditingkatkan</span>
            </span>
          )}

          {/* Baris Bawah: Icon + Judul & Deskripsi Membentang Penuh */}
          <div className="flex items-center gap-3 w-full">
            <div className="rounded-xl flex items-center justify-center shrink-0 border border-amber-200 p-2.5 shadow-xs bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="w-full text-base font-semibold text-ink leading-snug uppercase tracking-wider">
                Rekapitulasi Presensi Saya
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Kehadiran rapat pleno &amp; kegiatan resmi organisasi
              </p>
            </div>
          </div>
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
                  ? "bg-linear-to-r from-emerald-500 to-teal-400"
                  : "bg-linear-to-r from-amber-500 to-rose-500"
              }`}
              style={{ width: `${Math.min(attendanceSummary.attendanceRate, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
            <span>Standar Keaktifan Minimum: 75%</span>
            <span className="font-normal text-ink-secondary">
              {attendanceSummary.isCompliant
                ? "Status kuorum terpenuhi untuk kepanitiaan."
                : "Tingkatkan kehadiran pada sesi rapat berikutnya."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
