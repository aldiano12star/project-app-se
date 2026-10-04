"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { claimAttendance } from "@/actions/presensi";

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceScannerModal({
  isOpen,
  onClose,
}: AttendanceScannerModalProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClaim = (token: string) => {
    startTransition(async () => {
      const res = await claimAttendance(token);
      if (res.success) {
        setFeedback({ text: res.message, type: "success" });
      } else {
        setFeedback({ text: res.message, type: "error" });
      }
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setScanResult(null);
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
            setScanResult(decodedText);
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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-subtle text-primary border border-primary/20">
            <QrCode className="h-5 w-5" />
          </div>
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
                  ? "bg-success-subtle border-success/30 text-success"
                  : "bg-danger-subtle border-danger/30 text-danger"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-10 w-10 mb-2 text-success" />
              ) : (
                <AlertCircle className="h-10 w-10 mb-2 text-danger" />
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
