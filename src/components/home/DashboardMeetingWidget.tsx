"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { QrCode, CalendarCheck2, CheckCircle2, Radio } from "lucide-react";
import { Role } from "@prisma/client";

const AttendanceScannerModal = dynamic(
  () => import("./AttendanceScannerModal").then((mod) => mod.AttendanceScannerModal),
  { ssr: false }
);

interface DashboardMeetingWidgetProps {
  userRole: Role;
  hasAttendedToday?: boolean;
}

export function DashboardMeetingWidget({
  userRole,
  hasAttendedToday = false,
}: DashboardMeetingWidgetProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <>
      <div className="specular-card bg-card border border-edge/80 dark:border-white/10 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden group">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <CalendarCheck2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted font-display">
                Presensi Rapat
              </span>
            </div>

            {hasAttendedToday ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-mono">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Hadir</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 font-mono">
                <Radio className="h-3 w-3 text-cyan-500 animate-pulse" />
                <span>Sesi Siap</span>
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-ink tracking-tight font-display">
            {hasAttendedToday ? "Presensi Hari Ini Tercatat" : "Pindai Presensi Mandiri"}
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
            {hasAttendedToday
              ? "Kehadiranmu pada sesi rapat hari ini telah berhasil tervalidasi ke dalam sistem."
              : "Arahkan kamera ke QR Code di layar proyektor untuk mencatat kehadiran & klaim +10 XP."}
          </p>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-1">
          {userRole === Role.GUEST ? (
            <div className="w-full py-2.5 px-3 rounded-xl bg-surface-container-low text-center text-xs text-ink-muted border hairline-border">
              🔒 Menunggu verifikasi role akun
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full h-11 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all text-white text-xs font-bold tracking-tight rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>{hasAttendedToday ? "Pindai Sesi Lain (+10 XP)" : "Pindai QR Rapat (+10 XP)"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Dialog Scanner Kamera Anggota */}
      <AttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </>
  );
}
