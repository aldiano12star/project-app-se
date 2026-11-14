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

  return (
    <nav
      data-nav="true"
      aria-label="Navigasi Utama Bawah"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[410px] rounded-full bg-card/85 backdrop-blur-xl shadow-[0_16px_40px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.65)] border hairline-border md:hidden p-1.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isModalActive
          ? "translate-y-28 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100 pointer-events-auto"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            activePath === item.href ||
            (item.href === "/eksplorasi" &&
              (activePath === "/eksplorasi" ||
                activePath.startsWith("/eksplorasi") ||
                activePath === "/showcase" ||
                activePath === "/arsip")) ||
            (item.href === "/aspirasi" &&
              (activePath === "/aspirasi" ||
                activePath.startsWith("/aspirasi") ||
                activePath === "/suara" ||
                activePath.startsWith("/suara"))) ||
            (item.href !== "/dashboard" &&
              item.href !== "/aspirasi" &&
              item.href !== "/eksplorasi" &&
              activePath.startsWith(item.href));

          if (isActive) {
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  haptic.tap();
                  setOptimisticPath(item.href);
                }}
                className="bg-linear-to-r from-primary to-rose-600 text-white border border-rose-400/30 font-semibold rounded-full px-3.5 py-1.5 flex items-center gap-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 shadow-[0_0_18px_rgba(225,29,42,0.35)] min-h-11 shrink-0"
              >
                <Icon className="h-5 w-5 stroke-[2.2] shrink-0" />
                <span className="text-xs font-semibold leading-none tracking-tight font-display">
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
              onClick={() => {
                haptic.tap();
                setOptimisticPath(item.href);
              }}
              title={item.label}
              aria-label={item.label}
              className="text-ink-muted hover:text-ink hover:bg-surface-container-high/60 p-2.5 rounded-full transition-all duration-150 ease-out active:scale-95 flex items-center justify-center min-h-11 min-w-11 shrink-0"
            >
              <Icon className="h-5 w-5 stroke-[1.8]" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
