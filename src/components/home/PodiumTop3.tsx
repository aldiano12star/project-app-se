import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Trophy, Zap, ChevronRight } from "lucide-react";
import { Division, Role } from "@prisma/client";

export interface ContributorItem {
  id: string;
  name: string;
  image?: string | null;
  role?: Role;
  classGrade?: string | null;
  mainDivision?: Division | null;
  totalPoints: number;
  monthlyPoints?: number;
}

interface PodiumTop3Props {
  contributors: ContributorItem[];
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export function PodiumTop3({ contributors }: PodiumTop3Props) {
  const rank1 = contributors[0] || null;
  const rank2 = contributors[1] || null;
  const rank3 = contributors[2] || null;

  const getDivisionBadgeColor = (division?: Division | null) => {
    switch (division) {
      case Division.PROGRAMMING:
        return "text-sky-600 dark:text-sky-400";
      case Division.TECHNOPRENEURSHIP:
        return "text-amber-600 dark:text-amber-400";
      case Division.DESIGN:
        return "text-purple-600 dark:text-purple-400";
      case Division.PHOTOGRAPHY:
        return "text-emerald-600 dark:text-emerald-400";
      case Division.CINEMATOGRAPHY:
        return "text-rose-600 dark:text-rose-400";
      default:
        return "text-ink-muted";
    }
  };

  const getDivisionLabel = (division?: Division | null) => {
    switch (division) {
      case Division.PROGRAMMING:
        return "Programming";
      case Division.TECHNOPRENEURSHIP:
        return "Technopreneurship";
      case Division.DESIGN:
        return "Desain";
      case Division.PHOTOGRAPHY:
        return "Fotografi";
      case Division.CINEMATOGRAPHY:
        return "Cinematografi";
      default:
        return division || "Anggota";
    }
  };

  const renderAvatar = (
    user: ContributorItem | null,
    ringColor: string,
    badgeText: string,
    isFirst: boolean = false
  ) => {
    const sizeClasses = isFirst ? "h-16 w-16" : "h-12 w-12";

    if (!user) {
      return (
        <div className="relative mb-3 flex flex-col items-center">
          {isFirst && (
            <span className="text-2xl -mb-1 animate-bounce duration-1000">👑</span>
          )}
          <div
            className={`flex ${sizeClasses} items-center justify-center rounded-full border border-edge bg-surface text-xs font-semibold text-ink-muted shadow-md ring-2 ${ringColor}`}
          >
            -
          </div>
          <span className="absolute -bottom-1.5 -right-1 text-xs px-2 py-0.5 rounded-full bg-card border border-edge font-bold text-ink shadow-sm font-mono">
            {badgeText}
          </span>
        </div>
      );
    }

    const initials =
      user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "SE";

    return (
      <div className="relative mb-3 flex flex-col items-center">
        {isFirst && (
          <span className="text-2xl -mb-1 animate-bounce duration-1000">👑</span>
        )}
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "Foto profil kontributor"}
            width={isFirst ? 64 : 48}
            height={isFirst ? 64 : 48}
            referrerPolicy="no-referrer"
            className={`${sizeClasses} rounded-full object-cover ring-2 ${ringColor} shadow-lg`}
          />
        ) : (
          <div
            className={`flex ${sizeClasses} items-center justify-center rounded-full border border-edge bg-surface text-sm font-bold text-ink ring-2 ${ringColor} shadow-lg`}
          >
            {initials}
          </div>
        )}
        <span className="absolute -bottom-1.5 -right-1 text-xs px-2 py-0.5 rounded-full bg-card border border-edge font-bold text-ink shadow-sm font-mono">
          {badgeText}
        </span>
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-3">
      {/* Header Seksi */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2 font-display uppercase tracking-widest">
            <span>Podium Apresiasi Kontributor</span>
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Panggung apresiasi kontribusi aktif, presensi &amp; karya teratas
          </p>
        </div>
        <div className="flex flex-row items-center gap-1.5 whitespace-nowrap text-xs font-bold font-mono tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25">
          <Trophy className="h-4 w-4" />
          <span>Top 3</span>
        </div>
      </div>

      {/* Kartu Utama Podium Panggung Turnamen */}
      <div className="specular-card relative overflow-hidden p-6 flex flex-col bg-card text-ink border border-edge/80 dark:border-white/10 rounded-2xl shadow-xs">
        {/* Ambient Glow Emas di belakang Juara 1 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Banner Motivasi Kontribusi Komunitas */}
        <div className="mb-6 p-4 rounded-xl bg-surface-container-low/60 dark:bg-white/5 border border-edge/80 dark:border-white/10 text-sm flex items-start gap-3 relative z-10">
          <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 space-y-1">
            <span className="font-bold block text-ink text-sm">
              Kontribusi &amp; Keaktifan Komunitas
            </span>
            <p className="text-xs text-ink-muted font-normal leading-relaxed">
              Tingkatkan XP kontribusi melalui presensi rapat, kepanitiaan kegiatan, dan submit karya inovasi.
            </p>
          </div>
        </div>

        {/* 3 Pilar Fisik Podium Berjejang (Juara 2 - Juara 1 - Juara 3) */}
        <div className="flex items-end justify-center gap-3 sm:gap-4 pt-4 pb-2 relative z-10">
          {/* Juara 2 (Perak/Silver - Kiri) */}
          <div className="w-[30%] max-w-[110px] flex flex-col items-center">
            {renderAvatar(rank2, "ring-slate-400 ring-offset-2 ring-offset-card", "🥈")}
            <span className="text-xs sm:text-sm font-extrabold text-ink truncate text-center w-full block">
              {rank2 ? rank2.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-xs font-semibold truncate max-w-full mt-0.5 ${getDivisionBadgeColor(
                rank2?.mainDivision
              )}`}
            >
              {getDivisionLabel(rank2?.mainDivision)}
            </span>

            {/* Pilar Perak Berjejang */}
            <div className="w-full h-32 sm:h-36 bg-surface-container-low/50 dark:bg-white/5 border hairline-border rounded-t-xl mt-3 flex flex-col items-center justify-center p-3 shadow-xs">
              <span className="text-xl font-extrabold text-ink font-display">2</span>
              <div className="flex items-center gap-1.5 mt-1.5 bg-slate-500/10 dark:bg-slate-400/10 px-2 py-0.5 rounded-full border border-slate-400/25">
                <Zap className="h-3 w-3 text-slate-500 dark:text-slate-400 fill-slate-500 dark:fill-slate-400 shrink-0" />
                <span className="text-xs font-extrabold text-ink font-mono-num">
                  {rank2 ? rank2.totalPoints : 0}
                </span>
                <span className="text-[10px] font-bold text-ink-muted">XP</span>
              </div>
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mt-1.5 font-mono">
                JUARA 2
              </span>
            </div>
          </div>

          {/* Juara 1 (Emas/Gold - Tengah: Pilar Tertinggi & Paling Dominan) */}
          <div className="w-[38%] max-w-[140px] flex flex-col items-center">
            {renderAvatar(
              rank1,
              "ring-amber-500 ring-offset-2 ring-offset-card shadow-amber-500/30 shadow-lg",
              "🥇",
              true
            )}
            <span className="text-sm sm:text-base font-extrabold text-amber-700 dark:text-amber-400 truncate text-center w-full block">
              {rank1 ? rank1.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-xs font-semibold truncate max-w-full mt-0.5 ${getDivisionBadgeColor(
                rank1?.mainDivision
              )}`}
            >
              {getDivisionLabel(rank1?.mainDivision)}
            </span>

            {/* Pilar Emas Tertinggi */}
            <div className="w-full h-44 sm:h-48 bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-500/80 dark:border-amber-500/60 rounded-t-xl mt-3 flex flex-col items-center justify-center p-3 shadow-[0_0_24px_rgba(245,158,11,0.15)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-display">1</span>
              <div className="flex items-center gap-1.5 mt-1.5 bg-amber-500/15 dark:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
                <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400 shrink-0" />
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 font-mono-num">
                  {rank1 ? rank1.totalPoints : 0}
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">XP</span>
              </div>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-1.5 font-mono">
                JUARA 1
              </span>
            </div>
          </div>

          {/* Juara 3 (Perunggu/Bronze - Kanan) */}
          <div className="w-[30%] max-w-[110px] flex flex-col items-center">
            {renderAvatar(
              rank3,
              "ring-amber-700 ring-offset-2 ring-offset-card",
              "🥉"
            )}
            <span className="text-xs sm:text-sm font-extrabold text-ink truncate text-center w-full block">
              {rank3 ? rank3.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-xs font-semibold truncate max-w-full mt-0.5 ${getDivisionBadgeColor(
                rank3?.mainDivision
              )}`}
            >
              {getDivisionLabel(rank3?.mainDivision)}
            </span>

            {/* Pilar Perunggu Berjejang */}
            <div className="w-full h-28 sm:h-32 bg-surface-container-low/50 dark:bg-white/5 border hairline-border rounded-t-xl mt-3 flex flex-col items-center justify-center p-3 shadow-xs">
              <span className="text-xl font-extrabold text-ink font-display">3</span>
              <div className="flex items-center gap-1.5 mt-1.5 bg-amber-700/10 dark:bg-amber-600/10 px-2 py-0.5 rounded-full border border-amber-700/25">
                <Zap className="h-3 w-3 text-amber-700 dark:text-amber-500 fill-amber-700 dark:fill-amber-500 shrink-0" />
                <span className="text-xs font-extrabold text-ink font-mono-num">
                  {rank3 ? rank3.totalPoints : 0}
                </span>
                <span className="text-[10px] font-bold text-ink-muted">XP</span>
              </div>
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mt-1.5 font-mono">
                JUARA 3
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info Transparan & Akses Ergonomis Hall of Fame */}
        <div className="pt-4 border-t hairline-border mt-4 flex items-center justify-between text-xs text-ink-muted relative z-10">
          <span className="font-medium">Klasemen Akumulasi XP</span>
          <Link
            href="/hall-of-fame"
            className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-semibold tactile-btn py-1 px-2.5 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <span>Buka Hall of Fame</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
