"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { recordAttendance } from "@/actions/presensi";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceScannerModal({
  isOpen,
  onClose,
}: AttendanceScannerModalProps) {
  useBodyScrollLock(isOpen);
  const [feedback, setFeedback] = useState<{
    text: string;
    meetingTitle?: string;
    type: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClaim = (scannedText: string) => {
    startTransition(async () => {
      let meetingId = scannedText.trim();

      // Ekstraksi Smart QR Attendance Payload
      try {
        const parsed = JSON.parse(scannedText);
        if (parsed && typeof parsed === "object" && parsed.meetingId) {
          meetingId = parsed.meetingId;
        }
      } catch {
        // Raw token / ID fallback
      }

      const res = await recordAttendance(meetingId);
      if (res.success) {
        setFeedback({
          text: `Berhasil mencatat kehadiran untuk rapat ${res.data?.meetingTitle || ""}`,
          meetingTitle: res.data?.meetingTitle,
          type: "success",
        });
      } else {
        setFeedback({
          text: res.message || "Gagal mencatat kehadiran rapat.",
          type: "error",
        });
      }
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setFeedback(null);
      return;
    }

    let scanner: Html5QrcodeScanner | null = null;

    const timer = setTimeout(() => {
      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader-container",
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          false
        );

        scanner.render(
          (decodedText) => {
            if (scanner) {
              scanner.clear().catch(() => {});
            }
            handleClaim(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Failed to initialize QR scanner:", err);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-none animate-in fade-in duration-150">
      <div className="card-solid relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-edge flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-surface border border-edge text-ink-muted hover:text-ink transition-colors cursor-pointer"
          aria-label="Tutup dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-1.5 pr-6 pl-6 pt-1">
          {/* Naked Icon: Zero decorative box wrappers */}
          <QrCode className="h-8 w-8 text-primary" />
          <h3 className="text-lg font-semibold text-ink mt-1">
            Pindai QR Presensi Rapat
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Arahkan kamera ke layar proyektor rapat untuk klaim kehadiran otomatis (+10 XP).
          </p>
        </div>

        {/* Area Scanner */}
        <div className="w-full flex flex-col items-center justify-center">
          {feedback ? (
            <div
              className={`flex flex-col items-center justify-center rounded-2xl p-6 text-center w-full border ${
                feedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-10 w-10 mb-2 text-red-600 dark:text-red-400" />
              )}
              <span className="text-sm font-semibold">{feedback.text}</span>
            </div>
          ) : isPending ? (
            <div className="flex h-52 w-full flex-col items-center justify-center rounded-2xl border border-edge bg-surface">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-ink-muted mt-2">
                Memverifikasi Presensi...
              </span>
            </div>
          ) : (
            <div className="w-full overflow-hidden rounded-2xl border border-edge bg-black">
              <div id="qr-reader-container" className="w-full min-h-[240px]" />
            </div>
          )}
        </div>

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
