import React from "react";
import Image from "next/image";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { Division, Role } from "@prisma/client";

export interface ContributorItem {
  id: string;
  name: string;
  image?: string | null;
  role?: Role;
  classGrade?: string | null;
  mainDivision?: Division;
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

  const getDivisionBadgeColor = (division?: Division) => {
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

  const getDivisionLabel = (division?: Division) => {
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
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <span>Podium Apresiasi Kontributor</span>
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Panggung apresiasi kontribusi aktif, presensi &amp; karya teratas
          </p>
        </div>
        <div className="flex flex-row items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
          <Trophy className="h-4 w-4" />
          <span>Top 3</span>
        </div>
      </div>

      {/* Kartu Utama Podium Panggung Turnamen */}
      <div className="card-solid relative overflow-hidden p-6 shadow-md flex flex-col bg-card text-ink border-edge rounded-2xl">
        {/* Ambient Glow Emas di belakang Juara 1 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Banner Motivasi Kontribusi Komunitas */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-sm flex items-start gap-3 relative z-10">
          <Zap className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 space-y-1">
            <span className="font-bold block text-amber-800 dark:text-amber-400 text-sm">
              Kontribusi &amp; Keaktifan Komunitas
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
              Tingkatkan XP kontribusi melalui presensi rapat, kepanitiaan kegiatan, dan submit karya inovasi.
            </p>
          </div>
        </div>

        {/* 3 Pilar Fisik Podium Berjejang (Juara 2 - Juara 1 - Juara 3) */}
        <div className="flex items-end justify-center gap-3 sm:gap-4 pt-4 pb-2 relative z-10">
          {/* Juara 2 (Perak/Silver - Kiri) */}
          <div className="w-[30%] max-w-[110px] flex flex-col items-center">
            {renderAvatar(rank2, "ring-slate-400 ring-offset-2 ring-offset-card", "🥈")}
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 truncate text-center w-full block">
              {rank2 ? rank2.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-xs font-medium truncate max-w-full mt-0.5 ${getDivisionBadgeColor(
                rank2?.mainDivision
              )}`}
            >
              {rank2?.classGrade ? formatGrade(rank2.classGrade) : getDivisionLabel(rank2?.mainDivision)}
            </span>

            {/* Pilar Perak Berjejang */}
            <div className="w-full h-32 sm:h-36 bg-surface-container border border-edge rounded-t-2xl mt-3 flex flex-col items-center justify-center p-3 shadow-lg">
              <span className="text-xl font-extrabold text-slate-700 dark:text-slate-300">2</span>
              <div className="flex items-center gap-1 mt-1 bg-surface px-2 py-0.5 rounded-full border border-edge">
                <Zap className="h-3 w-3 text-slate-600 dark:text-slate-400 fill-slate-600 dark:fill-slate-400" />
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                  {rank2 ? rank2.totalPoints : 0}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mt-1">
                XP
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
              {rank1?.classGrade ? formatGrade(rank1.classGrade) : getDivisionLabel(rank1?.mainDivision)}
            </span>

            {/* Pilar Emas Tertinggi */}
            <div className="w-full h-44 sm:h-48 bg-surface-container border-2 border-amber-500 rounded-t-2xl mt-3 flex flex-col items-center justify-center p-3 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 shadow-sm" />
              <span className="text-3xl font-black text-amber-700 dark:text-amber-400">1</span>
              <div className="flex items-center gap-1.5 mt-1.5 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40">
                <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 tabular-nums">
                  {rank1 ? rank1.totalPoints : 0}
                </span>
                <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400">XP</span>
              </div>
              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-widest mt-1.5">
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
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 truncate text-center w-full block">
              {rank3 ? rank3.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-xs font-medium truncate max-w-full mt-0.5 ${getDivisionBadgeColor(
                rank3?.mainDivision
              )}`}
            >
              {rank3?.classGrade ? formatGrade(rank3.classGrade) : getDivisionLabel(rank3?.mainDivision)}
            </span>

            {/* Pilar Perunggu Berjejang */}
            <div className="w-full h-28 sm:h-32 bg-surface-container border border-edge rounded-t-2xl mt-3 flex flex-col items-center justify-center p-3 shadow-lg">
              <span className="text-xl font-extrabold text-slate-700 dark:text-slate-300">3</span>
              <div className="flex items-center gap-1 mt-1 bg-surface px-2 py-0.5 rounded-full border border-edge">
                <Zap className="h-3 w-3 text-amber-700 dark:text-amber-500 fill-amber-700 dark:fill-amber-500" />
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                  {rank3 ? rank3.totalPoints : 0}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mt-1">
                XP
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info Transparan */}
        <div className="pt-4 border-t border-edge mt-4 flex items-center justify-between text-xs text-ink-muted relative z-10">
          <span>Klasemen Peringkat Akumulasi XP</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">Kompetisi Terbuka &amp; Transparan</span>
        </div>
      </div>
    </section>
  );
}
