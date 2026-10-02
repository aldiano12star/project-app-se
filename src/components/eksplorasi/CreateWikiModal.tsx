"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Sparkles,
  Tag,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import {
  submitWikiArticle,
  SubmitWikiInput,
  WikiCategory,
} from "@/actions/eksplorasi";
import { WikiArticleData } from "./WikiCard";

interface CreateWikiModalProps {
  isOpen: boolean;
  onClose: () => void;
  editArticle?: WikiArticleData | null;
  onSuccess?: () => void;
}

export function CreateWikiModal({
  isOpen,
  onClose,
  editArticle,
  onSuccess,
}: CreateWikiModalProps) {
  const [formData, setFormData] = useState<SubmitWikiInput>({
    title: "",
    category: "PANDUAN_TEKNIS",
    content: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editArticle) {
      setFormData({
        id: editArticle.id,
        title: editArticle.title,
        category: (editArticle.category === "SOP_LAB"
          ? "PANDUAN_TEKNIS"
          : editArticle.category === "TUTORIAL"
          ? "MODUL_PELATIHAN"
          : editArticle.category === "LPJ_SURAT"
          ? "SURAT_LPJ"
          : editArticle.category === "TIPS_LOMBA"
          ? "INFO_LOMBA"
          : editArticle.category) as WikiCategory,
        content: editArticle.content,
      });
    } else {
      setFormData({
        title: "",
        category: "PANDUAN_TEKNIS",
        content: "",
      });
    }
  }, [editArticle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setErrorMessage("Judul panduan wajib diisi minimal 3 karakter.");
      return;
    }

    if (!formData.content.trim() || formData.content.trim().length < 5) {
      setErrorMessage("Isi panduan tidak boleh kosong (minimal 5 karakter).");
      return;
    }

    setIsLoading(true);

    try {
      const res = await submitWikiArticle({
        id: formData.id,
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
      });

      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menyimpan artikel panduan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                {formData.id ? "Edit Panduan Perpustakaan" : "Tulis Panduan Baru"}
              </h2>
              <p className="text-[11px] text-ink-muted">
                Mendapat +15 XP setelah panduan berhasil dipublikasikan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Judul Artikel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Judul Panduan / Dokumen <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Format Proposal Pengajuan Dana Kegiatan Lomba"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-11 min-h-[44px] px-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Kategori Wiki (4 Kategori Baru Bebas Istilah SOP) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-emerald-500" />
              <span>Kategori Perpustakaan Digital <span className="text-primary">*</span></span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as WikiCategory })
              }
              className="w-full h-11 min-h-[44px] px-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-medium"
            >
              <option value="SURAT_LPJ">📄 1. Format Surat &amp; LPJ</option>
              <option value="INFO_LOMBA">🏆 2. Tips &amp; Info Lomba</option>
              <option value="MODUL_PELATIHAN">📚 3. Modul &amp; Materi Pelatihan</option>
              <option value="PANDUAN_TEKNIS">🛠️ 4. Panduan Teknis &amp; Alat</option>
            </select>
          </div>

          {/* Isi Konten Panduan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-ink-muted" />
              <span>Konten Panduan (Format Teks / Link Google Drive) <span className="text-primary">*</span></span>
            </label>
            <textarea
              rows={8}
              required
              placeholder="Tuliskan materi, instruksi langkah kerja, atau tautan Google Drive dokumen secara terstruktur..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none leading-relaxed font-sans"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
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
              className="h-11 min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Simpan Panduan (+15 XP)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
