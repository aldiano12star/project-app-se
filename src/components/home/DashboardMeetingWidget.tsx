"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { QrCode, CalendarDays } from "lucide-react";
import { Role } from "@prisma/client";

const AttendanceScannerModal = dynamic(
  () => import("./AttendanceScannerModal").then((mod) => mod.AttendanceScannerModal),
  { ssr: false }
);

interface DashboardMeetingWidgetProps {
  userRole: Role;
}

export function DashboardMeetingWidget({
  userRole,
}: DashboardMeetingWidgetProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <>
      <section className="specular-card bg-card border border-edge/80 dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col gap-4 relative overflow-hidden rounded-2xl">
        {/* Header Widget */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 dark:text-slate-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink tracking-tight font-display">
                Presensi Sesi Rapat Aktif
              </h2>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Pindai QR Code di layar proyektor ruang rapat untuk mencatat kehadiran otomatis dan mengklaim poin presensi.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
          {userRole === Role.GUEST ? (
            <div className="w-full p-4 rounded-xl bg-surface-container-low/60 dark:bg-white/5 border border-edge/80 dark:border-white/10 text-center text-xs sm:text-sm text-ink-muted">
              🔒 <span className="font-semibold text-ink">Fitur Presensi Terkunci</span> — Menunggu aktivasi role akun oleh pengurus.
            </div>
          ) : (
            /* Tombol Utama Scan QR Mandiri (Semua Anggota Terverifikasi) */
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full flex-1 h-12 min-h-12 bg-primary hover:bg-primary-hover active:scale-95 transition-all duration-150 ease-out text-white text-xs sm:text-sm font-bold tracking-tight rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,42,0.25)] cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Pindai QR Rapat (+10 XP)</span>
            </button>
          )}
        </div>
      </section>

      {/* Modal Dialog Scanner Kamera Anggota */}
      <AttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </>
  );
}
