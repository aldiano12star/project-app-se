"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Sparkles,
  Globe,
  Lock,
  Bug,
  Lightbulb,
  ShieldCheck,
  EyeOff,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { FeedbackType } from "@prisma/client";
import { submitFeedbackIssue } from "@/actions/aspirasi";

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: FeedbackType;
}

const PUBLIC_CATEGORY_OPTIONS = [
  "Bug & Kendala Aplikasi",
  "Usulan Fitur Baru",
  "Kritik & Masukan Acara",
  "Lainnya",
];

const PRIVATE_CATEGORY_OPTIONS = [
  "Evaluasi Internal Pengurus",
  "Aspirasi & Saran Organisasi",
  "Laporan Khusus & Rahasia",
  "Lainnya",
];

export function CreateFeedbackModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = FeedbackType.PUBLIC_ISSUE,
}: CreateFeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>(defaultType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(
    defaultType === FeedbackType.PUBLIC_ISSUE
      ? PUBLIC_CATEGORY_OPTIONS[0]
      : PRIVATE_CATEGORY_OPTIONS[0]
  );
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectType = (selectedType: FeedbackType) => {
    setType(selectedType);
    setCategory(
      selectedType === FeedbackType.PUBLIC_ISSUE
        ? PUBLIC_CATEGORY_OPTIONS[0]
        : PRIVATE_CATEGORY_OPTIONS[0]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Judul laporan atau aspirasi wajib diisi.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Deskripsi lengkap tidak boleh kosong.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await submitFeedbackIssue({
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        isAnonymous,
      });

      if (res.success) {
        setTitle("");
        setDescription("");
        setIsAnonymous(false);
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat mengirimkan laporan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                {type === FeedbackType.PUBLIC_ISSUE
                  ? "Laporkan Isu / Ide Fitur Baru"
                  : "Tulis Aspirasi Rahasia (Operator)"}
              </h2>
              <p className="text-[11px] text-ink-muted">
                Dapatkan +10 XP kontribusi aktif komunitas
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pemilihan Tipe Laporan (Public vs Private) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Pilih Saluran Laporan <span className="text-primary">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Opsi 1: Isu Sistem Publik */}
              <button
                type="button"
                onClick={() => handleSelectType(FeedbackType.PUBLIC_ISSUE)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  type === FeedbackType.PUBLIC_ISSUE
                    ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500/50 shadow-xs ring-1 ring-sky-500/30"
                    : "bg-surface-container-low border-edge hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe
                    className={`w-4 h-4 ${
                      type === FeedbackType.PUBLIC_ISSUE
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-ink-muted"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      type === FeedbackType.PUBLIC_ISSUE
                        ? "text-sky-700 dark:text-sky-300"
                        : "text-ink"
                    }`}
                  >
                    Isu / Ide Publik
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-tight">
                  Tampil di Papan Isu terbuka &amp; dapat di-upvote anggota.
                </p>
              </button>

              {/* Opsi 2: Aspirasi Rahasia Operator */}
              <button
                type="button"
                onClick={() => handleSelectType(FeedbackType.PRIVATE_ASPIRATION)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  type === FeedbackType.PRIVATE_ASPIRATION
                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500/50 shadow-xs ring-1 ring-purple-500/30"
                    : "bg-surface-container-low border-edge hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock
                    className={`w-4 h-4 ${
                      type === FeedbackType.PRIVATE_ASPIRATION
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-ink-muted"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      type === FeedbackType.PRIVATE_ASPIRATION
                        ? "text-purple-700 dark:text-purple-300"
                        : "text-ink"
                    }`}
                  >
                    Aspirasi Privat
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-tight">
                  Kerahasiaan terjamin, hanya dibaca langsung oleh Operator.
                </p>
              </button>
            </div>
          </div>

          {/* Kategori Laporan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Kategori <span className="text-primary">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              {(type === FeedbackType.PUBLIC_ISSUE
                ? PUBLIC_CATEGORY_OPTIONS
                : PRIVATE_CATEGORY_OPTIONS
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Judul Laporan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Judul Laporan / Aspirasi <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                type === FeedbackType.PUBLIC_ISSUE
                  ? "Contoh: Tombol scan presensi kamera kadang tidak merespon di iOS"
                  : "Contoh: Evaluasi sistem pembagian tugas seksi acara perlombaan"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Deskripsi Lengkap */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Deskripsi &amp; Rincian Lengkap <span className="text-primary">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Ceritakan kendala, kronologi, atau usulan solusi konstruktif yang Anda harapkan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Checkbox Pengirim Anonim */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-edge cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <EyeOff className="w-3.5 h-3.5 text-primary" />
                <span>Kirim sebagai Anonim</span>
              </div>
              <p className="text-ink-muted text-[11px] mt-0.5 leading-relaxed">
                Nama dan kelas Anda akan disamarkan menjadi &apos;Anggota Saba ExploIT&apos;
                pada tampilan daftar laporan.
              </p>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-edge bg-card flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 min-h-[44px] px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 min-h-[44px] px-5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirimkan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Kirim Laporan (+10 XP)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
