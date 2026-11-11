"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Sparkles,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { FeedbackType } from "@prisma/client";
import { submitFeedbackIssue } from "@/actions/aspirasi";
import { Modal } from "@/components/ui/Modal";

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: FeedbackType;
  lockType?: FeedbackType;
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
  lockType,
}: CreateFeedbackModalProps) {
  const activeType = lockType || defaultType;
  const [type, setType] = useState<FeedbackType>(activeType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(
    activeType === FeedbackType.PUBLIC_ISSUE
      ? PUBLIC_CATEGORY_OPTIONS[0]
      : PRIVATE_CATEGORY_OPTIONS[0]
  );
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sinkronkan state tipe dan kategori saat modal dibuka kembali
  useEffect(() => {
    if (isOpen) {
      const targetType = lockType || defaultType;
      setType(targetType);
      setCategory(
        targetType === FeedbackType.PUBLIC_ISSUE
          ? PUBLIC_CATEGORY_OPTIONS[0]
          : PRIVATE_CATEGORY_OPTIONS[0]
      );
      setErrorMessage(null);
    }
  }, [isOpen, lockType, defaultType]);

  const isPrivat = type === FeedbackType.PRIVATE_ASPIRATION;

  const handleSelectType = (selectedType: FeedbackType) => {
    if (lockType) return;
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
      setErrorMessage(
        isPrivat
          ? "Judul aspirasi privat wajib diisi."
          : "Judul laporan isu atau ide wajib diisi."
      );
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
        isAnonymous: true,
      });

      if (res.success) {
        setTitle("");
        setDescription("");
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat mengirimkan formulir.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="relative w-full rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Modal */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-edge ${
            isPrivat
              ? "bg-purple-950/20 dark:bg-purple-950/30"
              : "bg-surface-container-low/60"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isPrivat
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isPrivat ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                {isPrivat
                  ? "Tulis Aspirasi Rahasia (Operator)"
                  : "Laporkan Isu / Ide Fitur Baru"}
              </h2>
              <p className="text-[11px] text-ink-muted">
                {isPrivat
                  ? "Kerahasiaan terjamin, hanya dibaca langsung oleh Operator Organisasi"
                  : "Dapatkan +10 XP kontribusi aktif komunitas"}
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

          {/* Banner Saluran Terkunci (Jika lockType aktif) */}
          {lockType && isPrivat && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
              <span className="text-[11px] leading-tight">
                Saluran Privat Aktif: Pesan ini terenkripsi dan tidak dipublikasikan ke papan umum.
              </span>
            </div>
          )}

          {/* Pemilihan Tipe Laporan (Hanya Ditampilkan Jika TIDAK Terkunci) */}
          {!lockType && (
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
          )}

          {/* Kategori Laporan (Strictly Filtered) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Kategori <span className="text-primary">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              {(isPrivat ? PRIVATE_CATEGORY_OPTIONS : PUBLIC_CATEGORY_OPTIONS).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Judul Laporan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              {isPrivat ? "Pokok Aspirasi / Masukan" : "Judul Laporan / Ide Fitur"}{" "}
              <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                isPrivat
                  ? "Contoh: Evaluasi sistem pembagian tugas seksi acara kepanitiaan"
                  : "Contoh: Tombol scan presensi kamera kadang tidak merespon di iOS"
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
              placeholder={
                isPrivat
                  ? "Sampaikan masukan, kendala kerja kepengurusan, atau saran secara jujur & solutif..."
                  : "Ceritakan kendala sistem, langkah reproduksi, atau konsep fitur yang diharapkan..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-edge bg-card flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 min-h-11 px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`h-11 min-h-11 px-5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] ${
                isPrivat
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-primary hover:bg-primary-hover"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirimkan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isPrivat
                      ? "Kirim Aspirasi Privat (+10 XP)"
                      : "Kirim Laporan Isu (+10 XP)"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
