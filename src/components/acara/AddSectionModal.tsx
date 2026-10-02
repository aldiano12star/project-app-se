"use client";

import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { addEventSection } from "@/actions/acara";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSuccess?: () => void;
}

export function AddSectionModal({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}: AddSectionModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Nama seksi wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await addEventSection(eventId, name.trim());
      if (res.success) {
        setName("");
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menambahkan seksi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-card border border-edge shadow-xl overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FolderPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Tambah Seksi Panitia</h2>
              <p className="text-[11px] text-ink-muted">Divisi kerja kepanitiaan</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-primary font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Nama Seksi <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Seksi Keamanan & Korlap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 min-h-[44px] px-4 rounded-lg border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 min-h-[44px] px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FolderPlus className="h-4 w-4" />
              <span>{isLoading ? "Menyimpan..." : "Tambah Seksi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
