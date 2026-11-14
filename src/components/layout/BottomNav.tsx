"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  CalendarDays,
  Compass,
  MessageSquareText,
} from "lucide-react";
import { haptic } from "@/lib/haptic";
import { useIsModalOpen } from "@/hooks/useBodyScrollLock";

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

export function BottomNav() {
  const pathname = usePathname();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Pure React 19 external store hook to reactively hide navigation when any modal opens
  const isModalActive = useIsModalOpen();

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOptimisticPath(null);
  }

  const activePath = optimisticPath || pathname;

  if (pathname.startsWith("/pengaturan") || pathname.startsWith("/operator")) {
    return null;
  }

  // Tentukan indeks tab aktif (0..4)
  const getActiveIndex = () => {
    if (activePath === "/dashboard" || activePath === "/") return 0;
    if (activePath.startsWith("/kas")) return 1;
    if (activePath.startsWith("/acara")) return 2;
    if (
      activePath.startsWith("/eksplorasi") ||
      activePath.startsWith("/showcase") ||
      activePath.startsWith("/arsip")
    )
      return 3;
    if (activePath.startsWith("/aspirasi") || activePath.startsWith("/suara"))
      return 4;
    return 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <nav
      data-nav="true"
      aria-label="Navigasi Utama Bawah"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[420px] rounded-full bg-white/70 dark:bg-[#1C1C1F]/65 backdrop-blur-2xl saturate-150 shadow-[0_12px_36px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.7)] border border-white/40 dark:border-white/10 md:hidden p-1.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        isModalActive
          ? "translate-y-28 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100 pointer-events-auto"
      }`}
    >
      {/* Specular Top Edge Highlight catching light from above (Apple Optical Material) */}
      <div className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white/80 dark:via-white/25 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-between w-full">
        {/* ── TACTILE SLIDING ACTIVE LENS PILL (Apple-Style Refined Glass Indicator) ── */}
        <div
          className="absolute top-0 bottom-0 rounded-full bg-white dark:bg-white/15 border border-black/5 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: "20%",
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {/* ── 5 NAVIGATION ITEMS DENGAN TOUCH SCALE & INSTANT PREFETCH ── */}
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => {
                haptic.tap();
                setOptimisticPath(item.href);
              }}
              title={item.label}
              aria-label={item.label}
              className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full min-h-[46px] transition-transform duration-150 active:scale-95 ${
                isActive
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-all duration-200 ${
                  isActive
                    ? "stroke-[2.3] scale-105 text-zinc-950 dark:text-zinc-50"
                    : "stroke-[1.75] scale-100 opacity-70 hover:opacity-100"
                }`}
              />
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[10px] tracking-tight font-display transition-all duration-200 ${
                    isActive
                      ? "font-bold text-zinc-950 dark:text-zinc-50"
                      : "font-medium opacity-75"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="h-1 w-1 rounded-full bg-primary shrink-0 animate-in fade-in zoom-in duration-200" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
