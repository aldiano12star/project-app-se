"use client";

import React, { useState } from "react";
import {
  X,
  MessageSquarePlus,
  Sparkles,
  EyeOff,
  Tag,
  AlertCircle,
  Globe,
  Lock,
  Bug,
  Lightbulb,
  Megaphone,
  MessagesSquare,
} from "lucide-react";
import {
  submitAspiration,
  AspirationCategoryType,
  AspirationScopeType,
} from "@/actions/aspirasi";

interface CreateAspirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PUBLIC_CATEGORIES: { id: AspirationCategoryType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "IDE_KEGIATAN", label: "Ide Kegiatan & Workshop", icon: Lightbulb },
  { id: "SARAN_PENGURUS", label: "Saran untuk Pengurus", icon: Megaphone },
  { id: "DISKUSI_UMUM", label: "Diskusi Bebas & Umum", icon: MessagesSquare },
];

export function CreateAspirationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAspirationModalProps) {
  const [targetScope, setTargetScope] = useState<AspirationScopeType>("PUBLIC");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AspirationCategoryType>("IDE_KEGIATAN");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Judul aspirasi wajib diisi.");
      return;
    }

    if (!content.trim()) {
      setErrorMessage("Isi saran atau usulan tidak boleh kosong.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await submitAspiration({
        title: title.trim(),
        content: content.trim(),
        category: targetScope === "PRIVATE_ADMIN" ? "BUG_SISTEM" : category,
        targetScope,
        isAnonymous,
      });

      if (res.success) {
        setTitle("");
        setContent("");
        setIsAnonymous(false);
        setTargetScope("PUBLIC");
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat mengirim aspirasi.");
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
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquarePlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Tulis Suara &amp; Aspirasi</h2>
              <p className="text-[11px] text-ink-muted">Dapatkan +10 XP atas usulan Anda</p>
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

          {/* PEMILIH JALUR ASPIRASI: Publik vs Privat ke Admin */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Tujuan / Visibilitas Aspirasi
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-container-low border border-edge">
              <button
                type="button"
                onClick={() => setTargetScope("PUBLIC")}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetScope === "PUBLIC"
                    ? "bg-card text-ink shadow-xs border border-edge"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                <span>Publik Komunitas</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope("PRIVATE_ADMIN")}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  targetScope === "PRIVATE_ADMIN"
                    ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-200 dark:border-indigo-900"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Lock className="h-3.5 w-3.5 text-indigo-500" />
                <span>Privat ke Admin/Dev</span>
              </button>
            </div>
            <p className="text-[10px] text-ink-muted leading-relaxed pl-0.5">
              {targetScope === "PUBLIC"
                ? "Dapat dibaca dan didiskusikan oleh seluruh anggota organisasi."
                : "Hanya dapat dibaca oleh Anda dan Pengurus/Pengembang (untuk bug & kendala teknis)."}
            </p>
          </div>

          {/* KATEGORI DINAMIS */}
          {targetScope === "PRIVATE_ADMIN" ? (
            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Bug className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">
                  Kategori: Bug &amp; Kendala Sistem (Dev)
                </span>
                <span className="text-[10px] text-ink-muted block">
                  Laporan akan langsung diteruskan ke Pengembang Aplikasi.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Kategori Aspirasi Publik</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AspirationCategoryType)}
                className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {PUBLIC_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Judul Aspirasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Pokok Usulan / Judul <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                targetScope === "PRIVATE_ADMIN"
                  ? "Contoh: Tombol scan QR presensi error di Safari"
                  : "Contoh: Usulan Workshop React & Tailwind di Libur Semester"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Isi Usulan / Penjelasan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Penjelasan Rinci <span className="text-primary">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder={
                targetScope === "PRIVATE_ADMIN"
                  ? "Jelaskan kronologi kendala, halaman yang bermasalah, dan perangkat yang Anda gunakan..."
                  : "Ceritakan latar belakang usulan, manfaat bagi anggota, atau solusi konkret..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Toggle Kirim Sebagai Anonim */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/60 border border-edge cursor-pointer select-none">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="h-7 w-7 rounded-lg bg-surface border border-edge flex items-center justify-center shrink-0 text-ink-muted">
                <EyeOff className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink block">
                  Kirim Sebagai Anonim
                </span>
                <span className="text-[10px] text-ink-muted leading-tight block">
                  Nama Anda akan disamarkan menjadi &quot;Anonim (Anggota Saba)&quot;.
                </span>
              </div>
            </div>

            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary shrink-0"
            />
          </label>

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
              className="h-11 min-h-11 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isLoading ? "Mengirim..." : "Kirim Aspirasi (+10 XP)"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
