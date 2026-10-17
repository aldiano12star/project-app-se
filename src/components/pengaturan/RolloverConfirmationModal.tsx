"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import {
  AlertTriangle,
  X,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  RefreshCcw,
  ChevronRight,
} from "lucide-react";
import { executeRollover } from "@/actions/rollover";

const CONFIRMATION_KEYWORD = "TUTUP BUKU PERIODE";

interface RolloverConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalPhase = "warning" | "confirm" | "success";

export function RolloverConfirmationModal({
  isOpen,
  onClose,
}: RolloverConfirmationModalProps) {
  const [phase, setPhase] = useState<ModalPhase>("warning");
  const [confirmText, setConfirmText] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state saat modal dibuka/ditutup
  useEffect(() => {
    if (isOpen) {
      setPhase("warning");
      setConfirmText("");
      setNotes("");
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Auto-focus input konfirmasi saat masuk phase "confirm"
  useEffect(() => {
    if (phase === "confirm" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  if (!isOpen) return null;

  const isKeywordValid = confirmText.trim() === CONFIRMATION_KEYWORD;

  const handleExecuteRollover = () => {
    if (!isKeywordValid) return;
    setErrorMsg(null);

    startTransition(async () => {
      const result = await executeRollover({
        confirmationText: confirmText.trim(),
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        setPhase("success");
      } else {
        setErrorMsg(result.message);
      }
    });
  };

  return (
    // Overlay backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== "success" && !isPending) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-card border border-edge rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Danger header stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-red-500 to-orange-500" />

        {/* Phase: WARNING - Penjelasan konsekuensi */}
        {phase === "warning" && (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <RefreshCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink">
                    Ganti Periode Kepengurusan
                  </h2>
                  <p className="text-[11px] text-ink-muted">Rollover Tahunan Organisasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-surface-container hover:text-ink transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning banner */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Aksi Permanen — Tidak Dapat Dibatalkan
                </span>
              </div>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                Fitur ini akan menjalankan proses tutup buku kepengurusan tahunan secara atomik. Berikut dampak yang akan terjadi secara bersamaan:
              </p>
            </div>

            {/* Daftar konsekuensi */}
            <ul className="space-y-2.5">
              {[
                {
                  icon: "🔴",
                  text: "Semua XP/poin anggota aktif direset ke 0",
                },
                {
                  icon: "📈",
                  text: "Kelas X → XI, XI → XII, XII → ALUMNI (Demisioner)",
                },
                {
                  icon: "📚",
                  text: "Buku kas periode ini dibekukan & Snapshot Hall of Fame disimpan",
                },
                {
                  icon: "🔄",
                  text: "Periode kepengurusan baru dibuat otomatis dengan saldo awal = sisa kas",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-ink-muted">
                  <span className="text-sm mt-0.5 shrink-0">{item.icon}</span>
                  <span className="leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA lanjut */}
            <button
              type="button"
              onClick={() => setPhase("confirm")}
              className="w-full min-h-11 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Saya Mengerti, Lanjutkan ke Konfirmasi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs text-ink-muted hover:text-ink transition-colors py-1 cursor-pointer"
            >
              Batal, Kembali ke Pengaturan
            </button>
          </div>
        )}

        {/* Phase: CONFIRM - Input teks validasi */}
        {phase === "confirm" && (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink">Konfirmasi Rollover</h2>
                  <p className="text-[11px] text-ink-muted">Ketik frasa untuk melanjutkan</p>
                </div>
              </div>
              {!isPending && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-surface-container hover:text-ink transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-danger text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Field: Catatan opsional */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-ink-muted block">
                Catatan Penutup Periode <span className="text-ink-subtle">(opsional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Periode 2025/2026 telah selesai dengan 12 rapat pleno dan 5 acara besar."
                disabled={isPending}
                rows={3}
                className="w-full px-3.5 py-3 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-50 font-mono"
              />
            </div>

            {/* Field: Teks konfirmasi wajib */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-ink block">
                Ketik frasa konfirmasi persis seperti ini:
              </label>
              <div className="px-3 py-2 rounded-lg bg-surface-container border border-edge font-mono text-xs text-amber-400 tracking-widest select-all">
                {CONFIRMATION_KEYWORD}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Ketik frasa di sini..."
                disabled={isPending}
                className={`w-full h-11 px-3.5 rounded-xl border text-ink text-xs focus:outline-none focus:ring-2 transition-all font-mono tracking-wide disabled:opacity-50 ${
                  confirmText.length > 0
                    ? isKeywordValid
                      ? "bg-success-subtle border-success/50 focus:ring-success/20"
                      : "bg-danger-subtle border-danger/40 focus:ring-danger/20"
                    : "bg-surface border-edge focus:ring-primary/20 focus:border-primary"
                }`}
              />
              {confirmText.length > 0 && !isKeywordValid && (
                <p className="text-[10px] text-danger/80">
                  Frasa tidak cocok. Periksa huruf kapital dan spasi.
                </p>
              )}
            </div>

            {/* Tombol aksi */}
            <button
              type="button"
              onClick={handleExecuteRollover}
              disabled={!isKeywordValid || isPending}
              className="w-full min-h-11 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Rollover Tahunan...</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4" />
                  <span>Eksekusi Rollover Kepengurusan</span>
                </>
              )}
            </button>

            {!isPending && (
              <button
                type="button"
                onClick={() => setPhase("warning")}
                className="w-full text-center text-xs text-ink-muted hover:text-ink transition-colors py-1 cursor-pointer"
              >
                ← Kembali ke Ringkasan Konsekuensi
              </button>
            )}
          </div>
        )}

        {/* Phase: SUCCESS */}
        {phase === "success" && (
          <div className="p-6 space-y-5 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-success-subtle border border-success/30 text-success flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink">Rollover Berhasil!</h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Pindah periode kepengurusan baru selesai. Semua data telah
                  diperbarui secara atomik.
                </p>
              </div>
            </div>

            <ul className="text-left space-y-2">
              {[
                "✅ Hall of Fame snapshot berhasil disimpan",
                "✅ Buku kas periode lama berhasil ditutup",
                "✅ Periode kepengurusan baru telah dibuat",
                "✅ Kelas anggota aktif berhasil dinaikkan",
                "✅ Semua poin anggota direset ke 0",
              ].map((item, i) => (
                <li key={i} className="text-[11px] text-ink-muted font-medium">
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                onClose();
                // Reload halaman agar data ter-refresh
                window.location.reload();
              }}
              className="w-full min-h-11 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai & Muat Ulang Halaman</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
