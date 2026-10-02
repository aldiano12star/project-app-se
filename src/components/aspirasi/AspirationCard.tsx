"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  ShieldCheck,
  User,
  Quote,
  Lock,
  Lightbulb,
  Megaphone,
  MessagesSquare,
  Bug,
  Sparkles,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Role } from "@prisma/client";
import {
  respondAspiration,
  deleteAspiration,
  AspirationCategoryType,
  AspirationStatusType,
  AspirationScopeType,
} from "@/actions/aspirasi";

export interface AspirationCardData {
  id: string;
  title: string;
  content: string;
  category: AspirationCategoryType;
  status: AspirationStatusType;
  targetScope?: AspirationScopeType;
  adminReply?: string | null;
  isAnonymous: boolean;
  sender?: {
    id: string;
    name: string;
    classGrade?: string | null;
  } | null;
  createdAt: Date | string;
}

interface AspirationCardProps {
  aspiration: AspirationCardData;
  currentUserRole?: Role;
  currentUserId?: string;
}

const CATEGORY_META: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  IDE_KEGIATAN: {
    label: "Ide Kegiatan",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900/60",
    icon: Lightbulb,
  },
  SARAN_PENGURUS: {
    label: "Saran Pengurus",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900/60",
    icon: Megaphone,
  },
  DISKUSI_UMUM: {
    label: "Diskusi Bebas",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-900/60",
    icon: MessagesSquare,
  },
  BUG_SISTEM: {
    label: "Bug & Sistem (Dev)",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-900/60",
    icon: Bug,
  },
};

export function AspirationCard({
  aspiration,
  currentUserRole,
  currentUserId,
}: AspirationCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyInput, setReplyInput] = useState(aspiration.adminReply || "");
  const [replyStatus, setReplyStatus] = useState<AspirationStatusType>(
    aspiration.status === "RESOLVED" ? "RESOLVED" : "RESPONDED"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isOfficer =
    currentUserRole === Role.ADMIN || currentUserRole === Role.OPERATOR;

  const isOwner = Boolean(
    currentUserId && aspiration.sender && aspiration.sender.id === currentUserId
  );

  const canDelete = isOfficer || isOwner;

  const isPrivate = aspiration.targetScope === "PRIVATE_ADMIN";

  const categoryMeta =
    CATEGORY_META[aspiration.category] || CATEGORY_META.DISKUSI_UMUM;
  const CategoryIcon = categoryMeta.icon;

  const isResponded = Boolean(aspiration.adminReply) || aspiration.status === "RESPONDED" || aspiration.status === "RESOLVED";

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await respondAspiration(
        aspiration.id,
        replyInput.trim(),
        replyStatus
      );

      if (res.success) {
        setIsReplying(false);
      } else {
        setFeedback(res.message);
      }
    } catch {
      setFeedback("Gagal menyimpan tanggapan pengurus.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAspiration = async () => {
    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await deleteAspiration(aspiration.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
      } else {
        setFeedback(res.message);
      }
    } catch {
      setFeedback("Gagal menghapus aspirasi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(aspiration.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const authorName = aspiration.isAnonymous
    ? "🎭 Anonim (Anggota Saba)"
    : aspiration.sender?.name || "Anggota Organisasi";

  return (
    <div
      className={`card-solid bg-card p-4 sm:p-5 rounded-2xl border shadow-sm space-y-3.5 transition-all ${
        isPrivate
          ? "border-indigo-200 dark:border-indigo-900/80 bg-indigo-50/10 dark:bg-indigo-950/10"
          : "border-edge"
      }`}
    >
      {/* Header Kartu: Kategori & Tanggal (Tanpa Status Tiket Birokratis) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Badge Scope Privat jika ada */}
          {isPrivate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
              <Lock className="h-3 w-3" />
              <span>Privat Admin/Dev</span>
            </span>
          )}

          {/* Badge Kategori Usulan */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
          >
            <CategoryIcon className="h-3 w-3" />
            <span>{categoryMeta.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-ink-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formattedDate}</span>
          </span>

          {canDelete && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isLoading || isDeleting}
              title="Hapus Aspirasi"
              className="p-1 rounded-md text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Judul & Isi Aspirasi */}
      <div className="space-y-1.5">
        <h3 className="text-sm sm:text-base font-bold text-ink leading-snug">
          {aspiration.title}
        </h3>
        <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-line bg-surface-container-low/30 p-3 rounded-xl border border-edge/60">
          {aspiration.content}
        </p>
      </div>

      {/* Kotak Tanggapan Resmi Pengurus jika ada */}
      {aspiration.adminReply && (
        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-1.5">
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs">
            <Quote className="h-3.5 w-3.5" />
            <span>Tanggapan Resmi Pengurus:</span>
          </div>
          <p className="text-xs text-ink leading-relaxed whitespace-pre-line pl-5 italic">
            &quot;{aspiration.adminReply}&quot;
          </p>
        </div>
      )}

      {/* Form Tanggapan untuk Pengurus (Admin/Operator) */}
      {isOfficer && isReplying && (
        <form
          onSubmit={handleSendReply}
          className="p-3.5 rounded-xl bg-surface-container-low border border-edge space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Tulis Tanggapan Resmi Pengurus</span>
            </span>
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="text-[11px] font-semibold text-ink-muted hover:text-ink cursor-pointer"
            >
              Tutup
            </button>
          </div>

          {feedback && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-950/40 text-primary text-xs font-medium border border-red-200">
              {feedback}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-ink block">
              Isi Tanggapan:
            </label>
            <textarea
              rows={3}
              required
              placeholder="Tuliskan respon, solusi, atau penjelasan dari pengurus/developer..."
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {isPrivate ? (
              <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={replyStatus === "RESOLVED"}
                  onChange={(e) => setReplyStatus(e.target.checked ? "RESOLVED" : "RESPONDED")}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 rounded"
                />
                <span>Tandai Laporan Selesai Ditangani</span>
              </label>
            ) : <div />}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="h-8 px-3 rounded-lg border border-edge text-xs font-semibold text-ink-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="h-8 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? "Menyimpan..." : "Kirim Tanggapan"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Footer Kartu: Penulis & Kontrol Pengurus */}
      <div className="pt-2 flex items-center justify-between border-t border-edge text-[11px]">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className={aspiration.isAnonymous ? "italic text-ink-secondary" : "font-medium text-ink"}>
            {authorName}
          </span>
        </div>

        {isOfficer && !isReplying && (
          <button
            type="button"
            onClick={() => setIsReplying(true)}
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{aspiration.adminReply ? "Edit Tanggapan" : "Beri Tanggapan"}</span>
          </button>
        )}
      </div>

      {/* Modal Konfirmasi Hapus Aspirasi */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-edge shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/60 text-primary flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-ink">
                Hapus Aspirasi Ini?
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Apakah kamu yakin ingin menghapus usulan <span className="font-semibold text-ink">&quot;{aspiration.title}&quot;</span>? Aspirasi yang dihapus tidak dapat dipulihkan kembali.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="h-9 px-3.5 rounded-lg border border-edge text-xs font-semibold text-ink hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAspiration}
                disabled={isDeleting}
                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? "Menghapus..." : "Hapus Aspirasi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
