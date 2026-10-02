"use client";

import React, { useState } from "react";
import { X, Plus, CheckSquare } from "lucide-react";
import { addEventTask } from "@/actions/acara";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: { id: string; name: string }[];
  defaultSectionId?: string;
  onSuccess?: () => void;
}

export function AddTaskModal({
  isOpen,
  onClose,
  sections,
  defaultSectionId,
  onSuccess,
}: AddTaskModalProps) {
  const [sectionId, setSectionId] = useState(
    defaultSectionId || sections[0]?.id || ""
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSOP, setIsSOP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetSection = sectionId || sections[0]?.id;
    if (!targetSection) {
      setErrorMessage("Pilih seksi kepanitiaan terlebih dahulu.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Judul tugas wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await addEventTask({
        sectionId: targetSection,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? dueDate : undefined,
        isSOP,
      });

      if (res.success) {
        setTitle("");
        setDescription("");
        setDueDate("");
        setIsSOP(false);
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menambahkan tugas.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Tambah Tugas Ad-Hoc</h2>
              <p className="text-[11px] text-ink-muted">Tugas baru untuk kepanitiaan</p>
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
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-primary font-medium">
              {errorMessage}
            </div>
          )}

          {/* Pilihan Seksi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Seksi Panitia <span className="text-primary">*</span>
            </label>
            <select
              value={sectionId || sections[0]?.id || ""}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Judul Tugas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Judul Tugas <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pengadaan kabel HDMI & audio splitter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Deskripsi / Catatan Tambahan
            </label>
            <textarea
              rows={2}
              placeholder="Rincian instruksi pengerjaan tugas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Batas Waktu / Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Tenggat Waktu (Opsional)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* SOP Checkbox */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low/60 border border-edge cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSOP}
              onChange={(e) => setIsSOP(e.target.checked)}
              className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <span className="text-xs text-ink font-medium">
              Tandai sebagai SOP Standar Organisasi
            </span>
          </label>

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
              <Plus className="h-4 w-4" />
              <span>{isLoading ? "Menambahkan..." : "Tambah Tugas"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
