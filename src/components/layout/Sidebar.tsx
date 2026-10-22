"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  CalendarDays,
  Compass,
  MessageSquareText,
  Settings,
} from "lucide-react";
import type { AppShellUser } from "./AppShell";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Beranda",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Kas",
    href: "/kas",
    icon: Wallet,
  },
  {
    label: "Acara",
    href: "/acara",
    icon: CalendarDays,
  },
  {
    label: "Eksplorasi",
    href: "/eksplorasi",
    icon: Compass,
  },
  {
    label: "Aspirasi",
    href: "/aspirasi",
    icon: MessageSquareText,
  },
];

interface SidebarProps {
  user?: AppShellUser | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);

  return (
    <aside
      aria-label="Navigasi Utama Desktop"
      className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-40 bg-surface-container border-r border-edge select-none"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-5 border-b border-edge shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group cursor-pointer"
        >
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
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold tracking-tight text-ink leading-tight truncate">
              Saba ExploIT
            </span>
            <span className="text-[11px] text-ink-muted leading-tight mt-0.5 truncate">
              SMAN 1 Bantul
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
          Menu Utama
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/eksplorasi" &&
              (pathname === "/eksplorasi" ||
                pathname.startsWith("/eksplorasi") ||
                pathname === "/showcase" ||
                pathname === "/arsip")) ||
            (item.href === "/aspirasi" &&
              (pathname === "/aspirasi" ||
                pathname.startsWith("/aspirasi") ||
                pathname === "/suara" ||
                pathname.startsWith("/suara"))) ||
            (item.href !== "/dashboard" &&
              item.href !== "/aspirasi" &&
              item.href !== "/eksplorasi" &&
              pathname.startsWith(item.href));

          if (isActive) {
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 font-semibold shadow-xs transition-all min-h-11"
              >
                <Icon className="h-5 w-5 stroke-[2.2] shrink-0" />
                <span className="text-xs leading-none tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-ink-secondary hover:text-ink hover:bg-surface-container-high/60 border border-transparent font-medium transition-all min-h-11"
            >
              <Icon className="h-5 w-5 stroke-[1.8] text-ink-muted shrink-0" />
              <span className="text-xs leading-none tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Pengaturan */}
      <div className="p-3 border-t border-edge shrink-0">
        <Link
          href="/pengaturan"
          prefetch={true}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            pathname.startsWith("/pengaturan")
              ? "bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 font-semibold shadow-xs"
              : "text-ink-secondary hover:text-ink hover:bg-surface-container-high/60 border border-transparent font-medium"
          }`}
          title="Pengaturan Akun & Profil"
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "User Avatar"}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full border border-edge object-cover ring-2 ring-primary/20 shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-surface text-xs font-semibold text-ink ring-2 ring-primary/20 shrink-0">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "SE"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-ink block truncate leading-tight">
              {user?.name || "Pengaturan"}
            </span>
            <span className="text-[10px] text-ink-muted block truncate mt-0.5">
              {user?.role ? user.role : "Profil & Akun"}
            </span>
          </div>
          <Settings className="h-4 w-4 text-ink-muted shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
