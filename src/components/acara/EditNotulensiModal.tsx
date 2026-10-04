"use client";

import React, { useState, useTransition, useEffect } from "react";
import { X, FileText, Save, Loader2, AlertCircle, Edit3 } from "lucide-react";
import { updateNotulensi } from "@/actions/acara";

interface EditNotulensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  meetingId?: string;
  initialNotes?: string | null;
  eventTitle: string;
  onSuccess?: (newNotes: string) => void;
}

export function EditNotulensiModal({
  isOpen,
  onClose,
  eventId,
  meetingId,
  initialNotes = "",
  eventTitle,
  onSuccess,
}: EditNotulensiModalProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes || "");
      setErrorMessage(null);
    }
  }, [isOpen, initialNotes]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await updateNotulensi(eventId, notes, meetingId);
      if (res.success) {
        onSuccess?.(notes.trim());
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Tulis / Edit Notulensi</h2>
              <p className="text-[11px] text-ink-muted truncate max-w-[220px] sm:max-w-xs">
                {eventTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 flex flex-col">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="text-xs font-bold text-ink flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Isi Catatan &amp; Hasil Kesepakatan Rapat:</span>
            </label>
            <textarea
              rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan poin-poin penting pembahasan, keputusan rapat, pembagian tanggung jawab, atau tindak lanjut berikutnya..."
              className="w-full flex-1 p-3.5 rounded-xl bg-surface border border-edge text-ink text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y min-h-[160px]"
            />
            <p className="text-[11px] text-ink-muted">
              Kosongkan jika belum ada notulensi resmi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-edge flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-11 min-h-[44px] px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-11 min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Notulensi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
