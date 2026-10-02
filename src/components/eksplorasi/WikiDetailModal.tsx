"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  BookOpen,
  Clock,
  User,
  Edit,
  Share2,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import { Role } from "@prisma/client";
import { WikiArticleData } from "./WikiCard";
import { deleteWikiArticle } from "@/actions/eksplorasi";

interface WikiDetailModalProps {
  article: WikiArticleData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit?: (article: WikiArticleData) => void;
  currentUser?: {
    id: string;
    role: Role;
  };
}

export function WikiDetailModal({
  article,
  isOpen,
  onClose,
  onOpenEdit,
  currentUser,
}: WikiDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  if (!isOpen || !article) return null;

  const isAuthor = currentUser?.id === article.author.id;
  const isPrivileged =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.OPERATOR;
  const canDelete = isAuthor || isPrivileged;

  const formattedDate = new Date(article.updatedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await deleteWikiArticle(article.id);
      if (!res.success) {
        alert(res.message);
      } else {
        onClose();
      }
      setIsConfirmingDelete(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/60">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-ink truncate">
                {article.title}
              </h2>
              <p className="text-[11px] text-ink-muted">
                Perpustakaan Digital Saba ExploIT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted pb-3 border-b border-edge/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>{article.author.name}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </span>
            </div>

            <span className="flex items-center gap-1 font-mono">
              <Eye className="h-3.5 w-3.5" />
              <span>{article.viewCount} pembaca</span>
            </span>
          </div>

          {/* Main Markdown Text Readability */}
          <div className="text-xs text-ink leading-relaxed space-y-3 whitespace-pre-line bg-surface-container-low/40 p-4 rounded-xl border border-edge/60 font-sans">
            {article.content}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-edge bg-surface-container-low/40 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="h-10 px-3.5 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? "Disalin!" : "Bagikan"}</span>
            </button>

            {canDelete && (
              <>
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1 bg-black/80 p-1 rounded-xl border border-red-500/40">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span>Hapus!</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isDeleting}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] hover:text-white cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="h-10 px-3 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 text-red-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer min-h-[44px] transition-colors"
                    title="Hapus Panduan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(article);
                }}
                className="h-10 px-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-ink text-xs font-bold border border-edge transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Panduan</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[44px]"
            >
              Selesai Membaca
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
