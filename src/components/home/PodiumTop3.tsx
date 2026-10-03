import React from "react";
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

  const isSeasonFresh =
    contributors.length === 0 ||
    contributors.every((c) => (c.totalPoints ?? 0) === 0);

  const getDivisionBadgeColor = (division?: Division) => {
    switch (division) {
      case Division.PROGRAMMING:
        return "text-blue-400";
      case Division.DESIGN:
        return "text-purple-400";
      case Division.PHOTOGRAPHY:
        return "text-amber-400";
      case Division.CINEMATOGRAPHY:
        return "text-rose-400";
      case Division.TECHNOPRENEURSHIP:
        return "text-emerald-400";
      default:
        return "text-slate-400";
    }
  };

  const renderAvatar = (
    user: ContributorItem | null,
    rank: number,
    ringColor: string,
    badgeText: string,
    isFirst: boolean = false
  ) => {
    const sizeClasses = isFirst ? "h-14 w-14" : "h-11 w-11";

    if (!user) {
      return (
        <div className="relative mb-2 flex flex-col items-center">
          {isFirst && (
            <span className="text-xl -mb-1 animate-bounce duration-1000">👑</span>
          )}
          <div
            className={`flex ${sizeClasses} items-center justify-center rounded-full border border-edge bg-slate-800 text-xs font-bold text-slate-400 shadow-md ring-2 ${ringColor}`}
          >
            -
          </div>
          <span className="absolute -bottom-1.5 -right-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700 font-black text-white shadow-xs font-mono">
            {badgeText}
          </span>
        </div>
      );
    }

    const initials = user.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <div className="relative mb-2 flex flex-col items-center">
        {isFirst && (
          <span className="text-xl -mb-1 animate-bounce duration-1000">👑</span>
        )}
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            referrerPolicy="no-referrer"
            className={`${sizeClasses} rounded-full object-cover ring-2 ${ringColor} shadow-lg`}
          />
        ) : (
          <div
            className={`flex ${sizeClasses} items-center justify-center rounded-full border border-edge bg-slate-800 text-xs font-bold text-white ring-2 ${ringColor} shadow-lg`}
          >
            {initials}
          </div>
        )}
        <span className="absolute -bottom-1.5 -right-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700 font-black text-white shadow-xs font-mono">
          {badgeText}
        </span>
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-2.5">
      {/* Header Seksi */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <span>Podium Apresiasi Kontributor</span>
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-400" />
          </h2>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Panggung apresiasi kontribusi aktif, presensi &amp; karya teratas
          </p>
        </div>
        <div className="flex flex-row items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          <Trophy className="h-3.5 w-3.5" />
          <span>Top 3</span>
        </div>
      </div>

      {/* Kartu Utama Podium Panggung Turnamen */}
      <div className="card-solid relative overflow-hidden p-4 sm:p-5 shadow-md flex flex-col bg-slate-950 text-white border-slate-800 rounded-2xl">
        {/* Ambient Glow Emas di belakang Juara 1 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Banner Motivasi Kontribusi Komunitas */}
        <div className="mb-4 p-3.5 rounded-xl bg-[#0D121F] border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 relative z-10">
          <span className="text-base shrink-0">⚡</span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="font-bold block text-amber-200">
              ⚡ Kontribusi &amp; Keaktifan Komunitas
            </span>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              Tingkatkan XP kontribusi melalui presensi rapat, kepanitiaan kegiatan, dan submit karya inovasi.
            </p>
          </div>
        </div>

        {/* 3 Pilar Fisik Podium Berjejang (Juara 2 - Juara 1 - Juara 3) */}
        <div className="flex items-end justify-center gap-2 sm:gap-3 pt-4 pb-1 relative z-10">
          {/* Juara 2 (Perak/Silver - Kiri) */}
          <div className="w-[30%] max-w-[110px] flex flex-col items-center">
            {renderAvatar(rank2, 2, "ring-slate-300 ring-offset-2 ring-offset-slate-950", "🥈")}
            <span className="text-xs font-bold text-slate-100 truncate text-center w-full block">
              {rank2 ? rank2.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-[10px] font-medium truncate max-w-full ${getDivisionBadgeColor(
                rank2?.mainDivision
              )}`}
            >
              {rank2?.classGrade ? formatGrade(rank2.classGrade) : rank2?.mainDivision || "Anggota"}
            </span>

            {/* Pilar Perak Berjejang */}
            <div className="w-full h-32 sm:h-36 bg-gradient-to-b from-slate-400/20 via-slate-900/90 to-slate-950 border border-slate-400/30 rounded-t-xl mt-2 flex flex-col items-center justify-center p-2 shadow-lg backdrop-blur-xs">
              <span className="text-lg font-black text-slate-300">2</span>
              <div className="flex items-center gap-1 mt-1">
                <Zap className="h-3 w-3 text-slate-300 fill-slate-300" />
                <span className="text-xs font-bold text-slate-200 tabular-nums">
                  {rank2 ? rank2.totalPoints : 0}
                </span>
              </div>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                XP
              </span>
            </div>
          </div>

          {/* Juara 1 (Emas/Gold - Tengah: Pilar Tertinggi) */}
          <div className="w-[36%] max-w-[130px] flex flex-col items-center">
            {renderAvatar(
              rank1,
              1,
              "ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-amber-500/50 shadow-lg",
              "🥇",
              true
            )}
            <span className="text-xs sm:text-sm font-black text-amber-200 truncate text-center w-full block">
              {rank1 ? rank1.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-[10px] font-bold truncate max-w-full ${getDivisionBadgeColor(
                rank1?.mainDivision
              )}`}
            >
              {rank1?.classGrade ? formatGrade(rank1.classGrade) : rank1?.mainDivision || "Anggota"}
            </span>

            {/* Pilar Emas Tertinggi */}
            <div className="w-full h-40 sm:h-44 bg-gradient-to-b from-amber-500/25 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-t-xl mt-2 flex flex-col items-center justify-center p-2 shadow-2xl relative overflow-hidden backdrop-blur-xs">
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-400 shadow-sm" />
              <span className="text-2xl font-black text-amber-400">1</span>
              <div className="flex items-center gap-1 mt-1 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-extrabold text-amber-300 tabular-nums">
                  {rank1 ? rank1.totalPoints : 0}
                </span>
                <span className="text-[10px] font-bold text-amber-400">XP</span>
              </div>
              <span className="text-[9px] font-black text-amber-400/90 uppercase tracking-widest mt-1">
                JUARA 1
              </span>
            </div>
          </div>

          {/* Juara 3 (Perunggu/Bronze - Kanan) */}
          <div className="w-[30%] max-w-[110px] flex flex-col items-center">
            {renderAvatar(
              rank3,
              3,
              "ring-amber-700 ring-offset-2 ring-offset-slate-950",
              "🥉"
            )}
            <span className="text-xs font-bold text-slate-100 truncate text-center w-full block">
              {rank3 ? rank3.name.split(" ")[0] : "Belum Ada"}
            </span>
            <span
              className={`text-[10px] font-medium truncate max-w-full ${getDivisionBadgeColor(
                rank3?.mainDivision
              )}`}
            >
              {rank3?.classGrade ? formatGrade(rank3.classGrade) : rank3?.mainDivision || "Anggota"}
            </span>

            {/* Pilar Perunggu Berjejang */}
            <div className="w-full h-28 sm:h-30 bg-gradient-to-b from-amber-700/20 via-slate-900/90 to-slate-950 border border-amber-700/30 rounded-t-xl mt-2 flex flex-col items-center justify-center p-2 shadow-lg backdrop-blur-xs">
              <span className="text-lg font-black text-amber-600">3</span>
              <div className="flex items-center gap-1 mt-1">
                <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-amber-200 tabular-nums">
                  {rank3 ? rank3.totalPoints : 0}
                </span>
              </div>
              <span className="text-[9px] font-semibold text-amber-500/80 uppercase tracking-wider">
                XP
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info Transparan */}
        <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
          <span>Klasemen Peringkat Akumulasi XP</span>
          <span className="text-amber-400 font-semibold">Kompetisi Terbuka &amp; Transparan</span>
        </div>
      </div>
    </section>
  );
}
