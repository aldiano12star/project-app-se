"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { QrCode, Sparkles, Eye, CalendarDays } from "lucide-react";
import { Role } from "@prisma/client";

const MeetingQrModal = dynamic(
  () => import("./MeetingQrModal").then((mod) => mod.MeetingQrModal),
  { ssr: false }
);

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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const canShowQr =
    userRole === Role.ADMIN ||
    userRole === Role.OPERATOR;

  return (
    <>
      <section className="card-solid bg-card border-edge p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        {/* Header Widget */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-slate-500 dark:text-slate-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-ink">
                Presensi Sesi Rapat Aktif
              </h2>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Sesi Terbuka
          </span>
        </div>

        <p className="text-sm text-ink-secondary leading-relaxed">
          Pindai QR Code di layar proyektor ruang rapat untuk mencatat kehadiran otomatis dan mengklaim poin presensi.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
          {userRole === Role.GUEST ? (
            <div className="w-full p-4 rounded-xl bg-surface-container-low border border-edge text-center text-sm text-ink-muted">
              🔒 <span className="font-semibold text-ink">Fitur Presensi Terkunci</span> — Menunggu aktivasi role akun oleh pengurus.
            </div>
          ) : (
            <>
              {/* Tombol Utama Scan QR Mandiri (Semua Anggota Terverifikasi) */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full flex-1 h-12 min-h-12 bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>Pindai QR Rapat (+10 XP)</span>
              </button>

              {/* Tombol Khusus Pengurus: Tampilkan QR Sesi */}
              {canShowQr && (
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="w-full sm:w-auto h-12 min-h-12 px-5 bg-surface-container-low hover:bg-surface-container border border-edge text-ink text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Tampilkan QR Code untuk dipindai anggota"
                >
                  <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>Tampilkan QR Sesi</span>
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* Modal Dialog QR Code Pengurus */}
      <MeetingQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Modal Dialog Scanner Kamera Anggota */}
      <AttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </>
  );
}
