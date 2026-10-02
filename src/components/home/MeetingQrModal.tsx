"use client";

import React, { useState, useEffect, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Loader2, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { getActiveOrCreateMeetingSession, MeetingSessionData } from "@/actions/presensi";

interface MeetingQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSession?: MeetingSessionData | null;
}

export function MeetingQrModal({
  isOpen,
  onClose,
  initialSession,
}: MeetingQrModalProps) {
  const [sessionData, setSessionData] = useState<MeetingSessionData | null>(
    initialSession || null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchSession = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await getActiveOrCreateMeetingSession();
      if (res.success && res.data) {
        setSessionData(res.data);
      } else {
        setErrorMsg(res.message || "Gagal memuat sesi rapat.");
      }
    });
  };

  useEffect(() => {
    if (isOpen && !sessionData) {
      fetchSession();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-none">
      <div className="card-solid relative w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl border border-edge flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-muted hover:text-ink transition-colors"
          aria-label="Tutup dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Modal */}
        <div className="flex flex-col items-center text-center gap-1 pr-6 pl-6 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-[11px] font-bold text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Sesi Rapat Pleno Aktif
          </span>
          <h3 className="text-base font-bold text-ink mt-1">
            {sessionData?.title || "Presensi Rapat Organisasi"}
          </h3>
          <p className="text-xs text-ink-muted">
            Tunjukkan kode QR ini kepada seluruh anggota rapat untuk memindai presensi (+10 XP).
          </p>
        </div>

        {/* Kontainer Gambar QR Code */}
        <div className="flex flex-col items-center justify-center w-full py-2">
          {isPending ? (
            <div className="flex h-56 w-56 flex-col items-center justify-center rounded-xl border border-edge bg-surface">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-ink-muted mt-2">
                Menyiapkan Kode QR...
              </span>
            </div>
          ) : errorMsg ? (
            <div className="flex h-56 w-56 flex-col items-center justify-center rounded-xl border border-danger/30 bg-danger-subtle p-4 text-center">
              <AlertCircle className="h-8 w-8 text-danger" />
              <p className="text-xs font-bold text-danger mt-2">{errorMsg}</p>
              <button
                type="button"
                onClick={fetchSession}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-danger underline hover:opacity-80"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Coba Lagi
              </button>
            </div>
          ) : sessionData?.qrToken ? (
            <div className="rounded-xl border border-edge bg-white p-4 shadow-sm flex flex-col items-center">
              <QRCodeSVG
                value={sessionData.qrToken}
                size={200}
                level="H"
                includeMargin={true}
                className="h-auto w-full max-w-[200px]"
              />
              <span className="text-[10px] font-semibold text-slate-500 mt-2 tracking-wide uppercase">
                Pindai melalui Super App Saba ExploIT
              </span>
            </div>
          ) : (
            <div className="flex h-56 w-56 flex-col items-center justify-center rounded-xl border border-edge bg-surface">
              <QrCode className="h-10 w-10 text-ink-muted opacity-40" />
              <button
                type="button"
                onClick={fetchSession}
                className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                Buat Sesi QR
              </button>
            </div>
          )}
        </div>

        {/* Footer Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-surface-container-low border border-edge text-xs font-bold text-ink hover:bg-surface-container transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
