"use client";

import React, { useState, useEffect, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Loader2, RefreshCw, AlertCircle, Calendar, Sparkles } from "lucide-react";
import {
  getMeetingQrSession,
  getActiveOrCreateMeetingSession,
  MeetingSessionData,
} from "@/actions/presensi";
import { getTargetAudienceBadge } from "@/utils/audience";
import { TargetAudience } from "@prisma/client";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

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
  useBodyScrollLock(isOpen);
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

  const dateFormatted = sessionData?.createdAt
    ? new Date(sessionData.createdAt).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      {/* Luma Ticket Pass Container */}
      <div className="ticket-notch glass-surface-subtle hairline-border relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl transition-all duration-200 flex flex-col">
        {/* Tombol Tutup Header */}
        <button
          type="button"
          onClick={onClose}
          className="tactile-btn absolute top-3.5 right-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low/80 hairline-border text-ink-muted hover:text-ink transition-colors cursor-pointer"
          aria-label="Tutup dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── TOP TICKET STUB: Header & Detail Acara ── */}
        <div className="relative p-6 pb-5 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary hairline-border mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tiket Presensi Acara</span>
          </div>

          <h3 className="font-display text-xl font-bold text-ink leading-snug line-clamp-2 px-4">
            {sessionData?.title || "Presensi Rapat Organisasi"}
          </h3>

          {/* Badges & Meta Info */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {audienceBadge && sessionData?.targetAudience !== TargetAudience.ALL && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${audienceBadge.badgeClass}`}
              >
                {audienceBadge.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono-num">
              +10 XP Kehadiran
            </span>
          </div>

          {dateFormatted && (
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-ink-muted mt-2 font-mono-num">
              <Calendar className="h-3.5 w-3.5" />
              <span>{dateFormatted}</span>
            </div>
          )}
        </div>

        {/* ── PERFORATED TEAR-OFF LINE DENGAN NOTCHES ── */}
        <div className="relative flex items-center justify-center w-full my-0 select-none">
          {/* Notch Kiri */}
          <div className="absolute -left-3 h-6 w-6 rounded-full bg-black/80 hairline-border" />
          {/* Garis Sobekan Putus-putus */}
          <div className="w-full mx-3 border-t-2 border-dashed hairline-border opacity-70" />
          {/* Notch Kanan */}
          <div className="absolute -right-3 h-6 w-6 rounded-full bg-black/80 hairline-border" />
        </div>

        {/* ── BOTTOM TICKET STUB: QR Code Display ── */}
        <div className="p-6 pt-5 flex flex-col items-center text-center">
          {isPending ? (
            <div className="flex h-52 w-52 flex-col items-center justify-center rounded-2xl hairline-border bg-surface-container-low/60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-ink-muted mt-2">
                Menyiapkan Kode QR...
              </span>
            </div>
          ) : errorMsg ? (
            <div className="flex h-52 w-52 flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-2">{errorMsg}</p>
              <button
                type="button"
                onClick={fetchSession}
                className="tactile-btn mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 underline hover:opacity-80 cursor-pointer min-h-[36px]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Coba Lagi
              </button>
            </div>
          ) : qrValue ? (
            <div className="flex flex-col items-center">
              {/* Bingkai Putih Tajam untuk Kontras Scanner Kamera */}
              <div className="rounded-2xl bg-white p-3.5 shadow-md border border-black/5 flex flex-col items-center">
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  level="H"
                  includeMargin={false}
                  className="h-auto w-full max-w-[180px]"
                />
              </div>
              <p className="text-xs sm:text-sm font-medium text-ink-muted mt-3">
                Arahkan pemindai aplikasi Saba ke QR ini
              </p>
            </div>
          ) : (
            <div className="flex h-52 w-52 flex-col items-center justify-center rounded-2xl hairline-border bg-surface-container-low/60">
              <QrCode className="h-10 w-10 text-ink-muted" />
              <button
                type="button"
                onClick={fetchSession}
                className="tactile-btn mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors cursor-pointer min-h-[40px]"
              >
                Muat Sesi QR
              </button>
            </div>
          )}

          {/* Tombol Tutup Selesai */}
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn mt-5 flex h-11 min-h-[44px] w-full items-center justify-center rounded-xl bg-surface hairline-border text-sm font-bold text-ink hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
