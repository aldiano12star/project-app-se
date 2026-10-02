"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  Check,
  Crown,
  CheckCheck,
} from "lucide-react";
import { Role } from "@prisma/client";
import { votePoll, closePoll } from "@/actions/aspirasi";

export interface PollOptionData {
  id: string;
  optionText: string;
  votesCount: number;
  percentage: number;
}

export interface PollCardData {
  id: string;
  question: string;
  description?: string | null;
  isActive: boolean;
  closesAt?: Date | string | null;
  createdAt: Date | string;
  options: PollOptionData[];
  totalVotes: number;
  userVotedOptionId?: string | null;
}

interface PollCardProps {
  poll: PollCardData;
  currentUserRole?: Role;
}

export function PollCard({ poll, currentUserRole }: PollCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    poll.userVotedOptionId || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isOfficer =
    currentUserRole === Role.ADMIN || currentUserRole === Role.OPERATOR;

  const hasVoted = Boolean(poll.userVotedOptionId);
  const isExpired = poll.closesAt ? new Date() > new Date(poll.closesAt) : false;
  const isClosed = !poll.isActive || isExpired;
  const showResults = hasVoted || isClosed;

  // Hitung suara terbanyak untuk menandai pemenang di polling yang telah ditutup
  const maxVotes = Math.max(0, ...poll.options.map((o) => o.votesCount));

  const handleVote = async () => {
    if (!selectedOptionId) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await votePoll(poll.id, selectedOptionId);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kesalahan saat memberikan suara.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePoll = async () => {
    if (!confirm("Apakah Anda yakin ingin menutup polling ini?")) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await closePoll(poll.id);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Gagal menutup polling.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formattedClosesAt = poll.closesAt
    ? new Date(poll.closesAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl transition-all space-y-4 ${
        !isClosed
          ? "card-solid bg-card border border-edge shadow-sm hover:border-primary/40"
          : "bg-surface-container-low/40 border border-edge/60 shadow-none opacity-90"
      }`}
    >
      {/* Header Polling: Badge Status Kontras & Tindakan Pengurus */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {!isClosed ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 dark:bg-red-950/60 text-primary border border-red-200 dark:border-red-900/60">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>Berlangsung</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                  <Sparkles className="h-3 w-3" />
                  <span>+5 XP</span>
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-ink-muted border border-edge">
                <Lock className="h-3 w-3" />
                <span>Polling Ditutup</span>
              </span>
            )}

            {formattedClosesAt && (
              <span className="text-[11px] text-ink-muted flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Batas: {formattedClosesAt}</span>
              </span>
            )}
          </div>

          <h3
            className={`text-sm sm:text-base font-bold leading-snug ${
              !isClosed ? "text-ink" : "text-ink/80"
            }`}
          >
            {poll.question}
          </h3>
        </div>

        {/* Tombol Tutup Poll Khusus Pengurus jika masih aktif */}
        {isOfficer && !isClosed && (
          <button
            type="button"
            onClick={handleClosePoll}
            disabled={isLoading}
            className="text-[11px] font-semibold text-ink-muted hover:text-primary transition-colors cursor-pointer shrink-0 border border-edge px-2.5 py-1 rounded-lg hover:bg-surface-container-low"
          >
            Tutup Poll
          </button>
        )}
      </div>

      {/* Deskripsi Tambahan jika ada */}
      {poll.description && (
        <p className="text-xs text-ink-secondary leading-relaxed bg-surface-container-low/40 p-2.5 rounded-xl border border-edge/60">
          {poll.description}
        </p>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-primary"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline ml-2 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Daftar Opsi Jawaban (Mode Rekapitulasi vs Mode Pilihan Voting) */}
      <div className="space-y-2.5 pt-0.5">
        {poll.options.map((option) => {
          const isUserChoice = poll.userVotedOptionId === option.id;
          const isSelected = selectedOptionId === option.id;
          const isWinner = isClosed && maxVotes > 0 && option.votesCount === maxVotes;

          if (showResults) {
            // Tampilan Rekapitulasi Hasil Polling (Progress Bar Persentase)
            return (
              <div
                key={option.id}
                className={`p-3 rounded-xl border relative overflow-hidden transition-all ${
                  isWinner
                    ? "border-amber-400/80 dark:border-amber-600 bg-amber-50/20 dark:bg-amber-950/20 ring-1 ring-amber-400/40"
                    : isUserChoice
                    ? "border-primary/60 bg-red-50/30 dark:bg-red-950/20"
                    : "border-edge bg-surface"
                }`}
              >
                {/* Background Progress Fill */}
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${
                    isWinner
                      ? "bg-amber-400/15 dark:bg-amber-500/20"
                      : isUserChoice
                      ? "bg-primary/15 dark:bg-primary/25"
                      : "bg-surface-container"
                  }`}
                  style={{ width: `${option.percentage}%` }}
                />

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isWinner && (
                      <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs" title="Suara Terbanyak">
                        <Crown className="h-3 w-3" />
                      </span>
                    )}

                    {isUserChoice && !isWinner && (
                      <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs" title="Pilihan Anda">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}

                    <span
                      className={`text-xs truncate ${
                        isWinner
                          ? "text-amber-800 dark:text-amber-300 font-extrabold"
                          : isUserChoice
                          ? "text-primary font-bold"
                          : "text-ink font-medium"
                      }`}
                    >
                      {option.optionText}
                    </span>

                    {isWinner && (
                      <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 shrink-0">
                        Pemenang
                      </span>
                    )}

                    {isUserChoice && (
                      <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary-subtle shrink-0">
                        Pilihanmu
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <span className="text-[11px] text-ink-muted">
                      {option.votesCount} suara
                    </span>
                    <span
                      className={`text-xs font-extrabold ${
                        isWinner
                          ? "text-amber-700 dark:text-amber-400"
                          : isUserChoice
                          ? "text-primary"
                          : "text-ink"
                      }`}
                    >
                      {option.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Tampilan Pilihan Voting untuk Polling Aktif (Radio Button Interaktif)
          return (
            <label
              key={option.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer min-h-[48px] transition-all ${
                isSelected
                  ? "border-primary bg-primary-subtle/30 dark:bg-red-950/30 ring-2 ring-primary/20 shadow-xs"
                  : "border-edge bg-surface hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="radio"
                  name={`poll-${poll.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSelectedOptionId(option.id)}
                  className="h-4 w-4 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-xs font-semibold text-ink truncate">
                  {option.optionText}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between border-t border-edge text-[11px] text-ink-muted">
        <span className="flex items-center gap-1 font-medium">
          <Users className="h-3.5 w-3.5" />
          <span>Total {poll.totalVotes} Suara Masuk</span>
        </span>

        {!showResults && (
          <button
            type="button"
            disabled={!selectedOptionId || isLoading}
            onClick={handleVote}
            className="h-10 min-h-10 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isLoading ? "Mengirim..." : "Kirim Suara (+5 XP)"}</span>
          </button>
        )}

        {showResults && hasVoted && !isClosed && (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Suara Anda Tercatat</span>
          </span>
        )}

        {isClosed && (
          <span className="text-[11px] font-semibold text-ink-muted">
            Hasil Akhir Pemungutan Suara
          </span>
        )}
      </div>
    </div>
  );
}
