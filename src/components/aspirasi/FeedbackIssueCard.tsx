"use client";

import React, { useState, useTransition } from "react";
import {
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Lock,
  Edit3,
  Trash2,
  Loader2,
  Sparkles,
  Tag,
  Save,
  X,
} from "lucide-react";
import { FeedbackType, IssueStatus, Role } from "@prisma/client";
import {
  toggleUpvoteIssue,
  updateIssueStatusAndNotes,
  deleteFeedbackIssue,
} from "@/actions/aspirasi";

export interface FeedbackIssueData {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  status: IssueStatus;
  isAnonymous: boolean;
  category: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
    classGrade?: string | null;
  } | null;
  upvotesCount: number;
  hasUpvoted: boolean;
  operatorNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackIssueCardProps {
  issue: FeedbackIssueData;
  currentUserRole: Role;
  currentUserId: string;
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

function formatDateIndo(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function FeedbackIssueCard({
  issue,
  currentUserRole,
  currentUserId,
}: FeedbackIssueCardProps) {
  const [upvoted, setUpvoted] = useState(issue.hasUpvoted);
  const [upvotesCount, setUpvotesCount] = useState(issue.upvotesCount);
  const [isPendingUpvote, startUpvoteTransition] = useTransition();

  // Operator Action State
  const [isEditingOperator, setIsEditingOperator] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(issue.status);
  const [operatorNotes, setOperatorNotes] = useState(issue.operatorNotes || "");
  const [isSavingOperator, startOperatorTransition] = useTransition();
  const [operatorFeedback, setOperatorFeedback] = useState<string | null>(null);

  // Delete State
  const [isDeleting, startDeleteTransition] = useTransition();

  const isOperator =
    currentUserRole === Role.OPERATOR || currentUserRole === Role.ADMIN;
  const isAuthor = issue.userId === currentUserId;
  const isPublic = issue.type === FeedbackType.PUBLIC_ISSUE;

  const handleToggleUpvote = () => {
    // Optimistic UI update
    const nextUpvoted = !upvoted;
    setUpvoted(nextUpvoted);
    setUpvotesCount((prev) => (nextUpvoted ? prev + 1 : Math.max(0, prev - 1)));

    startUpvoteTransition(async () => {
      const res = await toggleUpvoteIssue(issue.id);
      if (res.success && res.data) {
        setUpvoted(res.data.upvoted);
        setUpvotesCount(res.data.count);
      } else {
        // Rollback on failure
        setUpvoted(issue.hasUpvoted);
        setUpvotesCount(issue.upvotesCount);
      }
    });
  };

  const handleSaveOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    setOperatorFeedback(null);

    startOperatorTransition(async () => {
      const res = await updateIssueStatusAndNotes({
        issueId: issue.id,
        status: selectedStatus,
        operatorNotes,
      });

      if (res.success) {
        setOperatorFeedback("Tanggapan & status berhasil diperbarui!");
        setTimeout(() => {
          setIsEditingOperator(false);
          setOperatorFeedback(null);
        }, 1500);
      } else {
        setOperatorFeedback(res.message);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan/aspirasi ini?")) {
      return;
    }

    startDeleteTransition(async () => {
      await deleteFeedbackIssue(issue.id);
    });
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Ditinjau</span>
          </span>
        );
      case IssueStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30">
            <Wrench className="w-3.5 h-3.5" />
            <span>Sedang Ditangani</span>
          </span>
        );
      case IssueStatus.RESOLVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Terselesaikan</span>
          </span>
        );
      case IssueStatus.CLOSED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            <Lock className="w-3.5 h-3.5" />
            <span>Ditutup</span>
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string | null) => {
    const cat = category || "Umum";
    if (cat.toLowerCase().includes("bug") || cat.toLowerCase().includes("kendala")) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
          🐞 {cat}
        </span>
      );
    }
    if (cat.toLowerCase().includes("fitur") || cat.toLowerCase().includes("usulan")) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900/60">
          💡 {cat}
        </span>
      );
    }
    if (cat.toLowerCase().includes("rahasia") || cat.toLowerCase().includes("privat")) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60">
          🔒 {cat}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-container text-ink-secondary border border-edge">
        💬 {cat}
      </span>
    );
  };

  return (
    <article className="card-solid bg-card border border-edge rounded-2xl p-5 shadow-xs space-y-4 transition-all">
      {/* Header Kartu: Kategori & Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {getCategoryBadge(issue.category)}
          {!isPublic && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40">
              Saluran Khusus Operator
            </span>
          )}
        </div>
        <div>{getStatusBadge(issue.status)}</div>
      </div>

      {/* Konten Utama Isu */}
      <div className="space-y-2">
        <h3 className="text-base font-bold text-ink leading-snug tracking-tight">
          {issue.title}
        </h3>
        <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed whitespace-pre-line">
          {issue.description}
        </p>
      </div>

      {/* Tanggapan Resmi Operator jika sudah ada */}
      {issue.operatorNotes && !isEditingOperator && (
        <div className="p-3.5 rounded-xl bg-surface-container-low border-l-4 border-primary space-y-1.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <ShieldCheck className="w-4 h-4" />
            <span>Respon Resmi Operator Saba ExploIT:</span>
          </div>
          <p className="text-xs text-ink leading-relaxed whitespace-pre-line pl-0.5">
            {issue.operatorNotes}
          </p>
        </div>
      )}

      {/* Form Operator Inline Editor */}
      {isEditingOperator && (
        <form
          onSubmit={handleSaveOperator}
          className="p-4 rounded-xl bg-surface-container-low border border-edge space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Panel Tanggapan &amp; Status Operator</span>
            </span>
            <button
              type="button"
              onClick={() => setIsEditingOperator(false)}
              className="text-ink-muted hover:text-ink cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {operatorFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              {operatorFeedback}
            </div>
          )}

          {/* Select Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink block">
              Status Penanganan Isu
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as IssueStatus)}
              className="w-full h-10 px-3 rounded-lg bg-card border border-edge text-ink text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value={IssueStatus.PENDING}>⏳ Ditinjau (Pending)</option>
              <option value={IssueStatus.IN_PROGRESS}>
                🔧 Sedang Ditangani (In Progress)
              </option>
              <option value={IssueStatus.RESOLVED}>
                ✅ Terselesaikan (Resolved)
              </option>
              <option value={IssueStatus.CLOSED}>🔒 Ditutup (Closed)</option>
            </select>
          </div>

          {/* Textarea Operator Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink block">
              Catatan / Balasan Resmi Operator
            </label>
            <textarea
              rows={3}
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="Tuliskan catatan perbaikan atau konfirmasi tindakan tim pengembang..."
              className="w-full p-3 rounded-lg bg-card border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Submit Operator Action */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingOperator(false)}
              className="px-3 py-1.5 rounded-lg border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingOperator}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingOperator ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Respon</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Footer: Pelapor, Tanggal & Tombol Aksi Upvote / Operator */}
      <div className="pt-3 border-t border-edge/60 flex flex-wrap items-center justify-between gap-3">
        {/* Info Pengirim */}
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <User className="w-3.5 h-3.5" />
          <span>
            {issue.isAnonymous
              ? "Anggota Saba ExploIT (Anonim)"
              : issue.user?.name || "Anggota Organisasi"}
          </span>
          {!issue.isAnonymous && issue.user?.classGrade && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container font-mono text-ink-secondary">
              {formatGrade(issue.user.classGrade)}
            </span>
          )}
          <span>•</span>
          <span>{formatDateIndo(issue.createdAt)}</span>
        </div>

        {/* Action Buttons: Upvote & Operator Tools */}
        <div className="flex items-center gap-2">
          {/* Tombol Upvote (Hanya untuk Papan Isu Publik) */}
          {isPublic && (
            <button
              type="button"
              onClick={handleToggleUpvote}
              disabled={isPendingUpvote}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] active:scale-95 shadow-xs ${
                upvoted
                  ? "bg-primary text-white border border-primary shadow-primary/20"
                  : "bg-surface-container-low hover:bg-surface-container text-ink border border-edge"
              }`}
              title={
                upvoted
                  ? "Klik untuk membatalkan upvote"
                  : "Saya juga mengalami kendala / mendukung usulan ini"
              }
            >
              <ThumbsUp
                className={`w-3.5 h-3.5 ${
                  upvoted ? "fill-white text-white" : "text-primary"
                }`}
              />
              <span>
                {upvoted
                  ? `Didukung (${upvotesCount})`
                  : `+1 Saya Mengalami Ini (${upvotesCount})`}
              </span>
            </button>
          )}

          {/* Tombol Kelola Operator */}
          {isOperator && !isEditingOperator && (
            <button
              type="button"
              onClick={() => setIsEditingOperator(true)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-container-low hover:bg-surface-container text-ink border border-edge transition-all cursor-pointer min-h-[40px]"
              title="Perbarui status atau isi catatan respon resmi"
            >
              <Edit3 className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Kelola Status</span>
            </button>
          )}

          {/* Tombol Hapus (Author atau Operator) */}
          {(isAuthor || isOperator) && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-low hover:bg-rose-500/10 text-ink-muted hover:text-rose-500 border border-edge transition-all cursor-pointer disabled:opacity-50 min-h-[36px]"
              title="Hapus laporan ini"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
