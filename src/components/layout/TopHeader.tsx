"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Role } from "@prisma/client";
import { Zap, Bell } from "lucide-react";
import { getUnreadNotificationCount } from "@/actions/notification";

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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const role = user?.role || "GUEST";
  const points = user?.totalPoints ?? user?.monthlyPoints ?? 0;

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      getUnreadNotificationCount()
        .then((count) => {
          if (isMounted) setUnreadCount(count);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SE";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-edge bg-card pt-safe shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 w-full max-w-7xl mx-auto">
        {/* Logo & Brand Identity (Mobile) / Workspace Context (Desktop) */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex md:hidden items-center gap-3 cursor-pointer group min-h-11">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low border border-edge overflow-hidden shadow-xs shrink-0 group-hover:border-primary/50 transition-colors">
              {!logoError ? (
                <Image
                  src="/logo.png"
                  alt="SE-Core Logo"
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
                SE-Core
              </span>
              <span className="text-xs text-ink-muted tracking-normal leading-tight mt-0.5">
                SMAN 1 Bantul
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-ink">Saba ExploIT Portal Organisasi</span>
            <span>&bull;</span>
            <span className="text-ink-muted font-normal">Powered by SE-Core</span>
          </div>
        </div>

        {/* Action Widgets & User Profile Avatar */}
        <div className="flex items-center gap-2">
          {/* XP Pill: Khusus anggota reguler/pengurus, disembunyikan untuk KOLABORATOR */}
          {role !== "KOLABORATOR" && (
            <div className="flex items-center gap-1.5 rounded-full border border-edge bg-surface-container-low px-3 py-1.5 min-h-9">
              <Zap className="h-4 w-4 fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-500" />
              <span className="text-xs font-semibold text-ink tabular-nums">
                {points.toLocaleString("id-ID")}{" "}
                <span className="text-[11px] font-normal text-ink-muted">XP</span>
              </span>
            </div>
          )}

          {/* Kotak Masuk (Mailbox Notifikasi Personal) */}
          <Link
            href="/kotak-masuk"
            aria-label="Kotak Masuk Notifikasi"
            className="relative flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-full text-slate-500 hover:text-ink hover:bg-surface-container-low transition-colors active:scale-95 cursor-pointer"
            title="Kotak Masuk"
          >
            <Bell className="h-5 w-5 stroke-[1.8]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            )}
          </Link>

          {/* Avatar Profil dengan Role Ring (Pintu Navigasi Langsung ke /pengaturan) */}
          <Link
            href="/pengaturan"
            className="relative flex h-11 w-11 min-h-11 min-w-11 items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="Akun & Pengaturan Profil"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || "Foto profil pengguna"}
                width={36}
                height={36}
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
                  : role === "KOLABORATOR"
                  ? "bg-teal-500"
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

