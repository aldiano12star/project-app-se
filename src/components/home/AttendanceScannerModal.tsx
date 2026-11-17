"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SwitchCamera,
  CameraOff,
} from "lucide-react";
import { recordAttendance } from "@/actions/presensi";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { haptic } from "@/lib/haptic";

export interface AttendanceScannerModalProps {
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

  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [activeCamIndex, setActiveCamIndex] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  const handleClaim = (scannedText: string) => {
    // Segera hentikan pemindai setelah pembacaan berhasil agar tidak menembak kueri berulang
    if (scannerRef.current && scannerRef.current.isScanning) {
      isStoppingRef.current = true;
      scannerRef.current
        .stop()
        .catch(() => {})
        .finally(() => {
          isStoppingRef.current = false;
        });
    }

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
        haptic.success();
        setFeedback({
          text: `Presensi Berhasil! Terdaftar pada rapat "${res.data?.meetingTitle || ""}" (+10 XP)`,
          meetingTitle: res.data?.meetingTitle,
          type: "success",
        });
      } else {
        haptic.warning();
        setFeedback({
          text: res.message || "Gagal mencatat presensi rapat.",
          type: "error",
        });
      }
    });
  };

  // Inisialisasi daftar kamera dan mulai stream
  useEffect(() => {
    if (!isOpen) {
      setFeedback(null);
      setCameraError(null);
      setIsCameraReady(false);
      return;
    }

    let isMounted = true;
    const scannerId = "attendance-qr-reader";

    const initScanner = async () => {
      try {
        // Dapatkan daftar kamera fisik
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!devices || devices.length === 0) {
          setCameraError(
            "Tidak ada kamera yang terdeteksi pada perangkat ini."
          );
          return;
        }

        setCameras(devices);

        // Prioritaskan kamera belakang (environment)
        let initialIndex = devices.findIndex((d) =>
          /back|rear|environment|belakang/i.test(d.label)
        );
        if (initialIndex < 0) initialIndex = 0;
        setActiveCamIndex(initialIndex);

        // Buat instance Html5Qrcode baru
        const html5Qr = new Html5Qrcode(scannerId);
        scannerRef.current = html5Qr;

        const selectedCam = devices[initialIndex];
        await html5Qr.start(
          selectedCam ? selectedCam.id : { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleClaim(decodedText);
          },
          () => {
            // Frame scanning tanpa QR diabaikan
          }
        );

        if (isMounted) {
          setIsCameraReady(true);
        }
      } catch (err: unknown) {
        console.error("Gagal memulai kamera QR:", err);
        if (isMounted) {
          setCameraError(
            "Akses kamera ditolak atau tidak tersedia. Izinkan akses kamera pada browser kamu untuk memindai kode QR."
          );
        }
      }
    };

    // Delay kecil agar elemen DOM selesai di-render
    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning && !isStoppingRef.current) {
          scannerRef.current
            .stop()
            .then(() => {
              scannerRef.current?.clear();
            })
            .catch(() => {});
        } else {
          try {
            scannerRef.current.clear();
          } catch {
            // Ignore
          }
        }
      }
    };
  }, [isOpen]);

  // Fungsi alih kamera (Depan <-> Belakang)
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current || isStoppingRef.current) return;

    try {
      const nextIndex = (activeCamIndex + 1) % cameras.length;
      isStoppingRef.current = true;
      setIsCameraReady(false);

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      isStoppingRef.current = false;
      setActiveCamIndex(nextIndex);

      const nextCam = cameras[nextIndex];
      await scannerRef.current.start(
        nextCam.id,
        {
          fps: 15,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleClaim(decodedText);
        },
        () => {}
      );

      setIsCameraReady(true);
    } catch (err) {
      console.error("Gagal beralih kamera:", err);
      setCameraError("Gagal beralih kamera. Coba segarkan halaman.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card-solid relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-edge flex flex-col items-center gap-4 animate-in zoom-in-95 duration-150">
        {/* Tombol Tutup Tunggal (Sesuai Standar Modal.tsx) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container border border-edge text-ink-muted hover:text-ink transition-colors cursor-pointer"
          aria-label="Tutup pemindai"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Modal */}
        <div className="flex flex-col items-center text-center gap-1.5 px-6 pt-1">
          <QrCode className="h-8 w-8 text-primary" />
          <h3 className="text-lg font-bold text-ink mt-0.5 tracking-tight font-display">
            Pindai QR Presensi Rapat
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Arahkan kamera ke layar proyektor untuk presensi otomatis (+10 XP).
          </p>
        </div>

        {/* Viewfinder Modern & State Scanner */}
        <div className="w-full flex flex-col items-center justify-center">
          {feedback ? (
            <div
              className={`flex flex-col items-center justify-center rounded-3xl p-6 text-center w-full border ${
                feedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
              ) : (
                <AlertCircle className="h-12 w-12 mb-3 text-rose-600 dark:text-rose-400 stroke-[2.2]" />
              )}
              <span className="text-sm font-bold leading-snug">
                {feedback.text}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2 rounded-xl bg-surface border border-edge text-xs font-bold text-ink hover:bg-surface-container transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          ) : isPending ? (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl border border-edge bg-surface">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-ink-muted mt-2.5">
                Memverifikasi Kehadiran...
              </span>
            </div>
          ) : cameraError ? (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 p-6 text-center text-rose-700 dark:text-rose-300 space-y-2">
              <CameraOff className="h-10 w-10 text-rose-500 mb-1" />
              <span className="text-xs font-bold leading-relaxed">
                {cameraError}
              </span>
            </div>
          ) : (
            <div className="relative w-full aspect-square max-w-[270px] rounded-3xl overflow-hidden border-2 border-edge/80 bg-black shadow-2xl flex items-center justify-center mx-auto">
              {/* HTML5 QR Camera Element */}
              <div
                id="attendance-qr-reader"
                className="w-full h-full object-cover overflow-hidden"
              />

              {/* Sudut Bidik (Corner L-Brackets) */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-3 border-l-3 border-primary rounded-tl-lg pointer-events-none z-10" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-3 border-r-3 border-primary rounded-tr-lg pointer-events-none z-10" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-3 border-l-3 border-primary rounded-bl-lg pointer-events-none z-10" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-3 border-r-3 border-primary rounded-br-lg pointer-events-none z-10" />

              {/* Garis Laser Pemindai Animasi Halus (Bergerak Vertikal) */}
              <div className="absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#E11D2A] animate-qr-scan pointer-events-none z-10" />

              {/* Tombol Melayang Glass Pill Ganti Kamera (Hanya jika > 1 kamera) */}
              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                  title="Ganti Kamera"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  <span>Kamera {activeCamIndex + 1}</span>
                </button>
              )}

              {/* Status Loading Kamera */}
              {!isCameraReady && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2 z-15">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-medium text-slate-300">
                    Menghubungkan Kamera...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Indikator Status di Bawah Kamera */}
        {!feedback && !cameraError && (
          <p className="text-xs text-ink-muted text-center font-medium leading-normal">
            Arahkan kamera ke kode QR rapat di layar proyektor
          </p>
        )}
      </div>
    </div>
  );
}
