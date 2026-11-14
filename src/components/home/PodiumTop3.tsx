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

function getTwoLetterInitials(name?: string | null): string {
  if (!name || !name.trim()) return "SE";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function PodiumTop3({ contributors }: PodiumTop3Props) {
  const rank1 = contributors[0] || null;
  const rank2 = contributors[1] || null;
  const rank3 = contributors[2] || null;

  const getDivisionBadgeColor = (division?: Division | null) => {
    switch (division) {
      case Division.PROGRAMMING:
        return "text-cyan-600 dark:text-cyan-400";
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
        return "Techno";
      case Division.DESIGN:
        return "Desain";
      case Division.PHOTOGRAPHY:
        return "Fotografi";
      case Division.CINEMATOGRAPHY:
        return "Cinema";
      default:
        return division || "Anggota";
    }
  };

  const renderAvatar = (
    user: ContributorItem | null,
    ringColor: string,
    badgeEmoji: string,
    isFirst: boolean = false
  ) => {
    const sizeClasses = isFirst ? "h-16 w-16 sm:h-18 sm:w-18" : "h-12 w-12 sm:h-14 sm:w-14";

    if (!user) {
      return (
        <div className="relative mb-2 flex flex-col items-center">
          {isFirst && (
            <span className="text-xl sm:text-2xl -mb-1 animate-bounce duration-1000">👑</span>
          )}
          <div
            className={`flex ${sizeClasses} items-center justify-center rounded-full border border-edge bg-surface-container-low text-xs font-semibold text-ink-muted shadow-sm ring-2 ${ringColor}`}
          >
            -
          </div>
          <span className="absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full bg-card border border-edge font-bold text-ink shadow-xs">
            {badgeEmoji}
          </span>
        </div>
      );
    }

    const initials = getTwoLetterInitials(user.name);

    return (
      <div className="relative mb-2 flex flex-col items-center">
        {isFirst && (
          <span className="text-xl sm:text-2xl -mb-1 animate-bounce duration-1000">👑</span>
        )}
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "Foto profil kontributor"}
            width={isFirst ? 72 : 56}
            height={isFirst ? 72 : 56}
            referrerPolicy="no-referrer"
            className={`${sizeClasses} rounded-full object-cover ring-2 ${ringColor} shadow-md`}
          />
        ) : (
          <div
            className={`flex ${sizeClasses} items-center justify-center rounded-full border border-edge bg-surface-container-high text-xs sm:text-sm font-bold text-ink ring-2 ${ringColor} shadow-md font-mono`}
          >
            {initials}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full bg-card border border-edge font-bold text-ink shadow-xs">
          {badgeEmoji}
        </span>
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-3">
      {/* Header Seksi */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-ink flex items-center gap-2 font-display uppercase tracking-widest">
            <span>Podium Apresiasi Kontributor</span>
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-sm text-ink-muted mt-0.5 leading-relaxed">
            Panggung apresiasi kontribusi aktif &amp; perolehan XP tertinggi
          </p>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold font-mono tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25">
          <Trophy className="h-4 w-4" />
          <span>Top 3</span>
        </div>
      </div>

      {/* Kartu Utama Panggung Turnamen */}
      <div className="specular-card relative overflow-hidden p-5 sm:p-6 flex flex-col bg-card text-ink border border-edge/80 dark:border-white/10 rounded-2xl shadow-xs">
        {/* Ambient Warm Golden Spotlight di belakang Juara 1 */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/12 dark:bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* 3 Pilar Fisik Podium Berjejang (Juara 2 - Juara 1 - Juara 3) */}
        <div className="flex items-end justify-center gap-2.5 sm:gap-4 pt-4 pb-1 relative z-10">
          {/* ========================================================= */}
          {/* Juara 2 (Perak / Silver - Kiri)                          */}
          {/* ========================================================= */}
          <div className="w-[31%] max-w-[120px] flex flex-col items-center">
            {renderAvatar(rank2, "ring-slate-300 dark:ring-slate-600 ring-offset-2 ring-offset-card", "🥈")}
            
            <span className="text-sm font-extrabold text-ink truncate text-center w-full block">
              {rank2 ? rank2.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-xs font-semibold truncate max-w-full ${getDivisionBadgeColor(
                rank2?.mainDivision
              )}`}
            >
              {getDivisionLabel(rank2?.mainDivision)}
            </span>

            {/* Pilar Perak Berjejang (~75% tinggi) */}
            <div className="w-full h-28 sm:h-34 bg-linear-to-b from-slate-100 to-slate-200/80 dark:from-slate-800/60 dark:to-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-t-2xl mt-2.5 flex flex-col items-center justify-center p-2.5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-slate-300 dark:bg-slate-600" />
              <span className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 font-display">2</span>
              
              <div className="flex items-center gap-1 mt-1 bg-card/80 dark:bg-black/40 px-2 py-0.5 rounded-full border border-slate-300/60 dark:border-slate-700">
                <Zap className="h-2.5 w-2.5 text-slate-500 fill-slate-500 shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-ink font-mono-num font-mono">
                  {rank2 ? rank2.totalPoints : 0}
                </span>
                <span className="text-xs font-bold text-ink-muted">XP</span>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 font-mono">
                JUARA 2
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Juara 1 (Emas / Gold - Tengah: Tertinggi & Paling Megah)   */}
          {/* ========================================================= */}
          <div className="w-[38%] max-w-[144px] flex flex-col items-center">
            {renderAvatar(
              rank1,
              "ring-amber-500 ring-offset-2 ring-offset-card shadow-amber-500/30 shadow-lg",
              "🥇",
              true
            )}
            
            <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 truncate text-center w-full block">
              {rank1 ? rank1.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-xs sm:text-sm font-bold truncate max-w-full ${getDivisionBadgeColor(
                rank1?.mainDivision
              )}`}
            >
              {getDivisionLabel(rank1?.mainDivision)}
            </span>

            {/* Pilar Emas Tertinggi (100% tinggi) */}
            <div className="w-full h-40 sm:h-46 bg-linear-to-b from-amber-500/20 via-amber-500/10 to-amber-950/20 dark:from-amber-950/50 dark:to-amber-950/80 border-2 border-amber-500/70 dark:border-amber-500/60 rounded-t-2xl mt-2.5 flex flex-col items-center justify-center p-3 shadow-[0_0_24px_rgba(245,158,11,0.2)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]" />
              <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 font-display">1</span>
              
              <div className="flex items-center gap-1 mt-1.5 bg-amber-500/20 dark:bg-amber-500/30 px-2.5 py-0.5 rounded-full border border-amber-500/40 shadow-xs">
                <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300 font-mono-num font-mono">
                  {rank1 ? rank1.totalPoints : 0}
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">XP</span>
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-1.5 font-mono">
                JUARA 1
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Juara 3 (Perunggu / Bronze - Kanan)                      */}
          {/* ========================================================= */}
          <div className="w-[31%] max-w-[120px] flex flex-col items-center">
            {renderAvatar(
              rank3,
              "ring-amber-700 dark:ring-amber-600 ring-offset-2 ring-offset-card",
              "🥉"
            )}
            
            <span className="text-sm font-extrabold text-ink truncate text-center w-full block">
              {rank3 ? rank3.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-xs font-semibold truncate max-w-full ${getDivisionBadgeColor(
                rank3?.mainDivision
              )}`}
            >
              {getDivisionLabel(rank3?.mainDivision)}
            </span>

            {/* Pilar Perunggu Berjejang (~60% tinggi) */}
            <div className="w-full h-24 sm:h-28 bg-linear-to-b from-amber-900/10 to-amber-950/20 dark:from-amber-950/30 dark:to-neutral-900/80 border border-amber-700/40 dark:border-amber-700/60 rounded-t-2xl mt-2.5 flex flex-col items-center justify-center p-2.5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-700/60 dark:bg-amber-600/60" />
              <span className="text-lg sm:text-xl font-black text-amber-800 dark:text-amber-500 font-display">3</span>
              
              <div className="flex items-center gap-1 mt-1 bg-card/80 dark:bg-black/40 px-2 py-0.5 rounded-full border border-amber-700/30 dark:border-amber-700/50">
                <Zap className="h-2.5 w-2.5 text-amber-700 dark:text-amber-500 fill-amber-700 dark:fill-amber-500 shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-ink font-mono-num font-mono">
                  {rank3 ? rank3.totalPoints : 0}
                </span>
                <span className="text-xs font-bold text-ink-muted">XP</span>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mt-1 font-mono">
                JUARA 3
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info Transparan & Akses Ergonomis Hall of Fame */}
        <div className="pt-3.5 border-t hairline-border mt-3 flex items-center justify-between text-sm text-ink-muted relative z-10">
          <span className="text-xs sm:text-sm font-medium">Akumulasi XP Organisasi</span>
          <Link
            href="/hall-of-fame"
            className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-semibold py-1 px-2.5 rounded-lg hover:bg-primary/5 active:scale-95 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <span>Buka Hall of Fame</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
