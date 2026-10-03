"use client";

import React from "react";
import { Zap, ShieldCheck, CheckCircle2, IdCard, Sparkles } from "lucide-react";
import { Role, Division, ClassGrade } from "@prisma/client";

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  classGrade: ClassGrade;
  mainDivision: Division;
  totalPoints: number;
  monthlyPoints: number;
  noWhatsapp?: string | null;
  portfolioUrl?: string | null;
  nisn?: string | null;
  mustChangePassword?: boolean;
  createdAt: string;
}

interface ProfileHeroCardProps {
  user: UserProfileData;
  onOpenKTA?: () => void;
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Kelas 10 • Gen 21";
  if (grade === "KELAS_11") return "Kelas 11 • Gen 20";
  if (grade === "KELAS_12") return "Kelas 12 • Gen 19";
  return grade.replace("_", " ");
}

function formatDivision(division?: Division | string | null) {
  if (!division) return "Programming";
  switch (division) {
    case Division.PROGRAMMING:
    case "Programming":
      return "Programming";
    case Division.TECHNOPRENEURSHIP:
    case "Technopreneurship":
      return "Technopreneurship";
    case Division.DESIGN:
    case "Desain":
      return "Desain";
    case Division.PHOTOGRAPHY:
    case "Fotografi":
      return "Fotografi";
    case Division.CINEMATOGRAPHY:
    case "Cinematografi":
      return "Cinematografi";
    default:
      return division;
  }
}

/**
 * Sistem Pangkat Gamifikasi Berbasis totalPoints:
 * - Lv. 1 Novice (0 - 99 XP)
 * - Lv. 2 Explorer (100 - 249 XP)
 * - Lv. 3 Specialist (250 - 499 XP)
 * - Lv. 4 Vanguard (500+ XP)
 */
function getLevelInfo(totalXp: number) {
  if (totalXp < 100) {
    const min = 0;
    const max = 100;
    const progress = Math.min(100, Math.round(((totalXp - min) / (max - min)) * 100));
    return {
      level: 1,
      title: "Novice",
      icon: "🌱",
      minXp: min,
      nextLevelXp: max,
      progress,
    };
  } else if (totalXp < 250) {
    const min = 100;
    const max = 250;
    const progress = Math.min(100, Math.round(((totalXp - min) / (max - min)) * 100));
    return {
      level: 2,
      title: "Explorer",
      icon: "⚡",
      minXp: min,
      nextLevelXp: max,
      progress,
    };
  } else if (totalXp < 500) {
    const min = 250;
    const max = 500;
    const progress = Math.min(100, Math.round(((totalXp - min) / (max - min)) * 100));
    return {
      level: 3,
      title: "Specialist",
      icon: "🎯",
      minXp: min,
      nextLevelXp: max,
      progress,
    };
  } else {
    const min = 500;
    const max = 1000;
    const progress = Math.min(100, Math.round(((totalXp - min) / (max - min)) * 100));
    return {
      level: 4,
      title: "Vanguard",
      icon: "🛡️",
      minXp: min,
      nextLevelXp: max,
      progress,
    };
  }
}

export function ProfileHeroCard({ user, onOpenKTA }: ProfileHeroCardProps) {
  const levelInfo = getLevelInfo(user.totalPoints);
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case Role.OPERATOR:
        return "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/40";
      case Role.ADMIN:
        return "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/40";
      case Role.BENDAHARA:
        return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40";
      case Role.MEMBER:
        return "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-500/40";
      case Role.GUEST:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700";
      default:
        return "bg-primary-subtle text-primary border-primary/30";
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.OPERATOR:
        return "Operator";
      case Role.ADMIN:
        return "Admin";
      case Role.BENDAHARA:
        return "Bendahara";
      case Role.MEMBER:
        return "Member";
      case Role.GUEST:
        return "Menunggu Verifikasi";
      default:
        return role;
    }
  };

  return (
    <section className="bg-card border border-edge rounded-2xl p-6 relative overflow-hidden shadow-sm space-y-6">
      {/* Accent Header Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-primary to-amber-500" />

      {/* Banner Peringatan Wajib Ganti Kata Sandi Default */}
      {user.mustChangePassword && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3 animate-in fade-in">
          <span className="text-xl shrink-0">⚠️</span>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="font-semibold block text-amber-200 text-sm">
              Ganti Kata Sandi Bawaan Akun
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Demi keamanan akunmu, segera ganti kata sandi bawaan (default) dengan kata sandi pribadimu pada formulir di bawah.
            </p>
          </div>
        </div>
      )}

      {/* User Header Info: Large Avatar w-20 h-20 & Details */}
      <div className="flex items-start gap-4 pt-1">
        {/* Large Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-rose-500 to-amber-500 shadow-md">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-white tracking-wider">
                  {initials}
                </span>
              )}
            </div>
          </div>

          <span
            className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card ${
              user.role === Role.OPERATOR
                ? "bg-purple-500"
                : user.role === Role.ADMIN
                ? "bg-rose-500"
                : user.role === Role.BENDAHARA
                ? "bg-emerald-500"
                : user.role === Role.MEMBER
                ? "bg-sky-500"
                : "bg-slate-500"
            }`}
            title={`Status Role: ${user.role}`}
          />
        </div>

        {/* User Identity Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight truncate">
              {user.name}
            </h2>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>

          {/* Role Badge */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border ${getRoleBadgeStyle(
                user.role
              )}`}
            >
              {getRoleLabel(user.role)}
            </span>
          </div>

          {/* Details Grade & Division */}
          <p className="text-sm text-slate-400 mt-2 leading-relaxed font-normal">
            {formatGrade(user.classGrade)} • Divisi {formatDivision(user.mainDivision)}
          </p>
        </div>
      </div>

      {/* Gamification Summary Box (Total XP, Tier & Progress Bar) */}
      <div className="pt-4 border-t border-edge bg-surface-container-low/60 rounded-2xl p-4 border space-y-3">
        <div className="flex items-center justify-between text-sm">
          {/* Total Points */}
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
            </span>
            <span className="text-base font-bold text-ink font-mono tracking-tight">
              {user.totalPoints} XP
            </span>
            <span className="text-slate-400 font-normal text-xs">Total</span>
          </div>

          {/* Level Tier */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <span>{levelInfo.icon}</span>
            <span>
              Lv. {levelInfo.level} {levelInfo.title}{" "}
            </span>
          </div>
        </div>

        {/* Progress Bar to Next Level */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-edge/60">
            <div
              className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Progres Menuju Lv. {levelInfo.level + 1}</span>
            <span className="font-mono text-slate-300 font-medium">
              {levelInfo.progress}% ({user.totalPoints} / {levelInfo.nextLevelXp} XP)
            </span>
          </div>
        </div>
      </div>

      {/* Tombol Aksi Utama: Buka KTA Digital */}
      {onOpenKTA && (
        <div>
          <button
            type="button"
            onClick={onOpenKTA}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/30 active:scale-[0.99] text-rose-300 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <IdCard className="w-5 h-5 text-primary" />
            <span>🪪 Buka KTA Digital</span>
          </button>
        </div>
      )}
    </section>
  );
}
