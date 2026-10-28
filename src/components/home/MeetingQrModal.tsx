"use client";

import React, { useState, useEffect, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import {
  getMeetingQrSession,
  getActiveOrCreateMeetingSession,
  MeetingSessionData,
} from "@/actions/presensi";
import { getTargetAudienceBadge } from "@/utils/audience";
import { TargetAudience } from "@prisma/client";

interface MeetingQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId?: string;
  initialSession?: MeetingSessionData | null;
}

export function MeetingQrModal({
  isOpen,
  onClose,
  meetingId,
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
      const res = meetingId
        ? await getMeetingQrSession(meetingId)
        : await getActiveOrCreateMeetingSession();

      if (res.success && res.data) {
        setSessionData(res.data);
      } else {
        setErrorMsg(res.message || "Gagal memuat sesi rapat.");
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchSession();
    } else {
      setSessionData(null);
      setErrorMsg(null);
    }
  }, [isOpen, meetingId]);

  if (!isOpen) return null;

  const audienceBadge = sessionData?.targetAudience
    ? getTargetAudienceBadge(sessionData.targetAudience)
    : null;

  const qrValue =
    sessionData?.qrPayload ||
    (sessionData?.id
      ? JSON.stringify({ type: "SABA_ATTENDANCE", meetingId: sessionData.id })
      : "");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-none animate-in fade-in duration-150">
      <div className="card-solid relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-edge flex flex-col items-center gap-4">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-surface border border-edge text-ink-muted hover:text-ink transition-colors cursor-pointer"
          aria-label="Tutup dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Modal */}
        <div className="flex flex-col items-center text-center gap-1.5 pr-6 pl-6 pt-1">
          {/* Naked Icon */}
          <QrCode className="h-8 w-8 text-primary" />
          <h3 className="text-lg font-semibold text-ink mt-1">
            {sessionData?.title || "Presensi Rapat Organisasi"}
          </h3>

          {audienceBadge && sessionData?.targetAudience !== TargetAudience.ALL && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${audienceBadge.badgeClass}`}
            >
              {audienceBadge.label}
            </span>
          )}

          <p className="text-xs text-ink-muted leading-relaxed">
            Tunjukkan kode QR ini kepada seluruh anggota rapat untuk memindai presensi (+10 XP).
          </p>
        </div>

        {/* Kontainer Gambar QR Code */}
        <div className="flex flex-col items-center justify-center w-full py-2">
          {isPending ? (
            <div className="flex h-56 w-56 flex-col items-center justify-center rounded-2xl border border-edge bg-surface">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-ink-muted mt-2">
                Menyiapkan Kode QR...
              </span>
            </div>
          ) : errorMsg ? (
            <div className="flex h-56 w-56 flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-2">{errorMsg}</p>
              <button
                type="button"
                onClick={fetchSession}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 underline hover:opacity-80 cursor-pointer min-h-[36px]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Coba Lagi
              </button>
            </div>
          ) : qrValue ? (
            <div className="rounded-2xl border border-edge bg-white p-4 shadow-md flex flex-col items-center">
              <QRCodeSVG
                value={qrValue}
                size={200}
                level="H"
                includeMargin={true}
                className="h-auto w-full max-w-[200px]"
              />
              <span className="text-[10px] font-mono font-bold text-slate-700 mt-2 tracking-wide uppercase">
                Pindai melalui App Saba ExploIT
              </span>
            </div>
          ) : (
            <div className="flex h-56 w-56 flex-col items-center justify-center rounded-2xl border border-edge bg-surface">
              <QrCode className="h-10 w-10 text-ink-muted" />
              <button
                type="button"
                onClick={fetchSession}
                className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors cursor-pointer min-h-[40px]"
              >
                Muat Sesi QR
              </button>
            </div>
          )}
        </div>

        {/* Footer Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 min-h-[44px] w-full items-center justify-center rounded-xl bg-surface border border-edge text-xs font-semibold text-ink hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
