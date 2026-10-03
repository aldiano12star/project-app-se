"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Role } from "@prisma/client";
import { Zap } from "lucide-react";

interface TopHeaderUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: Role;
  monthlyPoints?: number;
  totalPoints?: number;
}

interface TopHeaderProps {
  user?: TopHeaderUser | null;
}

export function TopHeader({ user }: TopHeaderProps) {
  const [logoError, setLogoError] = useState(false);
  const role = user?.role || "GUEST";
  const points = user?.totalPoints ?? user?.monthlyPoints ?? 0;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SE";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-edge bg-card pt-safe shadow-sm">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo & Brand Identity */}
        <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low border border-edge overflow-hidden shadow-xs shrink-0 group-hover:border-primary/50 transition-colors">
            {!logoError ? (
              <Image
                src="/logo.png"
                alt="Saba ExploIT Logo"
                width={32}
                height={32}
                priority
                onError={() => setLogoError(true)}
                className="object-contain h-7 w-7"
              />
            ) : (
              <span className="font-bold text-xs text-primary">SE</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-ink leading-tight">
              Saba ExploIT
            </span>
            <span className="text-xs text-slate-400 tracking-normal leading-tight mt-0.5">
              SMAN 1 Bantul
            </span>
          </div>
        </Link>

        {/* Action Widgets & User Profile Avatar */}
        <div className="flex items-center gap-3">
          {/* XP Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-edge bg-surface-container-low px-3 py-1.5 min-h-[36px]">
            <Zap className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span className="text-xs font-semibold text-ink tabular-nums">
              {points.toLocaleString("id-ID")}{" "}
              <span className="text-[11px] font-normal text-slate-400">XP</span>
            </span>
          </div>

          {/* Avatar Profil dengan Role Ring (Pintu Navigasi Langsung ke /pengaturan) */}
          <Link
            href="/pengaturan"
            className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="Akun & Pengaturan Profil"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full border border-edge object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-surface text-xs font-semibold text-ink ring-2 ring-primary/20">
                {initials}
              </div>
            )}
            <span
              className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-card ${
                role === "OPERATOR"
                  ? "bg-purple-500"
                  : role === "ADMIN"
                  ? "bg-rose-500"
                  : role === "BENDAHARA"
                  ? "bg-emerald-500"
                  : role === "MEMBER"
                  ? "bg-sky-500"
                  : "bg-slate-500"
              }`}
              title={`Role: ${role}`}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

