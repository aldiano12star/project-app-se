"use client";

import React, { useState } from "react";
import { QrCode, Sparkles, Eye } from "lucide-react";
import { Role } from "@prisma/client";
import { MeetingQrModal } from "./MeetingQrModal";
import { AttendanceScannerModal } from "./AttendanceScannerModal";

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
      <section className="card-solid bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 p-4 sm:p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden">
        {/* Header Widget */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <h2 className="text-sm font-bold text-ink">
              Presensi Sesi Rapat Aktif
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 bg-primary-subtle text-primary px-2 py-0.5 rounded-full text-[10px] font-semibold border border-primary/20">
            <Sparkles className="h-3 w-3" />
            Sesi Terbuka
          </span>
        </div>

        <p className="text-xs text-ink-secondary">
          Pindai QR Code di layar proyektor ruang rapat untuk mencatat kehadiran otomatis dan mengklaim poin presensi.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-1">
          {userRole === Role.GUEST ? (
            <div className="w-full p-3 rounded-xl bg-surface-container-low border border-edge text-center text-xs text-ink-muted">
              🔒 <span className="font-semibold text-ink">Fitur Presensi Terkunci</span> — Menunggu aktivasi role akun oleh pengurus.
            </div>
          ) : (
            <>
              {/* Tombol Utama Scan QR Mandiri (Semua Anggota Terverifikasi) */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full flex-1 h-11 min-h-[44px] bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>Pindai QR Rapat (+10 XP)</span>
              </button>

              {/* Tombol Khusus Pengurus: Tampilkan QR Sesi */}
              {canShowQr && (
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="w-full sm:w-auto h-11 min-h-[44px] px-4 bg-surface-container-low hover:bg-surface-container border border-edge text-ink text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Tampilkan QR Code untuk dipindai anggota"
                >
                  <Eye className="h-4 w-4 text-primary" />
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
