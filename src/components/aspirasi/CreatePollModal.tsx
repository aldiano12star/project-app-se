"use client";

import React, { useState } from "react";
import {
  X,
  Vote,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { createPoll } from "@/actions/aspirasi";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePollModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [closesAt, setClosesAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!question.trim()) {
      setErrorMessage("Pertanyaan polling wajib diisi.");
      return;
    }

    const filledOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (filledOptions.length < 2) {
      setErrorMessage("Wajib mengisi minimal 2 pilihan jawaban.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await createPoll({
        question: question.trim(),
        description: description.trim() || undefined,
        options: filledOptions,
        closesAt: closesAt || undefined,
      });

      if (res.success) {
        setQuestion("");
        setDescription("");
        setOptions(["", ""]);
        setClosesAt("");
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat membuat polling.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Vote className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Buat Polling Organisasi</h2>
              <p className="text-[11px] text-ink-muted">Suara &amp; Musyawarah Anggota</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-primary font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pertanyaan Polling */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Pertanyaan Polling <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Topik apa yang ingin dibahas pada Workshop berikutnya?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Keterangan Tambahan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Keterangan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan konteks atau tujuan diadakannya pemungutan suara ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Opsi Pilihan Jawaban */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink block">
                Pilihan Opsi Jawaban <span className="text-primary">*</span>
              </label>
              <span className="text-[11px] text-ink-muted">
                {options.length}/6 Opsi
              </span>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Pilihan ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="h-10 w-10 flex items-center justify-center rounded-lg text-ink-muted hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Hapus opsi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full h-9 mt-1 border border-dashed border-edge hover:border-emerald-500 text-xs font-semibold text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Opsi Pilihan</span>
              </button>
            )}
          </div>

          {/* Batas Waktu Ditutup */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>Batas Waktu Polling (Opsional)</span>
            </label>
            <input
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 min-h-11 px-4 rounded-lg border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 min-h-11 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isLoading ? "Menyimpan..." : "Buat Polling"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
