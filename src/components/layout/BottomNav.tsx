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
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[420px] rounded-full bg-surface/85 backdrop-blur-2xl shadow-[0_16px_40px_-10px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.75)] border hairline-border md:hidden p-1.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        isModalActive
          ? "translate-y-28 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100 pointer-events-auto"
      }`}
    >
      <div className="relative flex items-center justify-between w-full">
        {/* ── SMOOTH SLIDING ACTIVE PILL INDICATOR (60fps Spring Translation) ── */}
        <div
          className="absolute top-0 bottom-0 rounded-full bg-linear-to-r from-primary to-rose-600 shadow-[0_4px_18px_rgba(225,29,42,0.4)] pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
              className={`relative z-10 flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full min-h-[46px] transition-transform duration-150 active:scale-85 ${
                isActive ? "text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-all duration-200 ${
                  isActive
                    ? "stroke-[2.4] scale-105 text-white"
                    : "stroke-[1.8] scale-100 opacity-70 hover:opacity-100"
                }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-display transition-all duration-200 ${
                  isActive
                    ? "font-bold text-white opacity-100"
                    : "font-medium opacity-65"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
