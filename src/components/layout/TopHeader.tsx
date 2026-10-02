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
  const role = user?.role || "ANGGOTA";
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
    <header className="sticky top-0 z-50 w-full border-b border-edge bg-card pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo & Brand Identity */}
        <Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low border border-edge overflow-hidden shadow-xs shrink-0 group-hover:border-primary/40 transition-colors">
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
              <span className="font-black text-xs text-primary">SE</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-ink leading-tight">
              Saba ExploIT
            </span>
            <span className="text-[11px] font-medium text-ink-muted tracking-wide leading-tight">
              SMAN 1 Bantul
            </span>
          </div>
        </Link>

        {/* Action Widgets & User Profile Avatar */}
        <div className="flex items-center gap-2">
          {/* XP Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-edge bg-surface-container-low px-2.5 py-1">
            <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            <span className="text-xs font-bold text-ink tabular-nums">
              {points.toLocaleString("id-ID")}{" "}
              <span className="text-[10px] font-normal text-ink-muted">XP</span>
            </span>
          </div>

          {/* Avatar Profil dengan Role Ring (Pintu Navigasi Langsung ke /pengaturan) */}
          <Link
            href="/pengaturan"
            className="relative flex h-11 w-11 items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="Akun & Pengaturan Profil"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full border border-edge object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-surface text-xs font-bold text-ink ring-2 ring-primary/20">
                {initials}
              </div>
            )}
            <span
              className={`absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                role === "OPERATOR"
                  ? "bg-purple-600"
                  : role === "ADMIN"
                  ? "bg-primary"
                  : role === "BENDAHARA"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              title={`Role: ${role}`}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

