"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  CalendarDays,
  Compass,
  MessageSquareText,
} from "lucide-react";

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
    label: "Jelajah",
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

  return (
    <nav
      aria-label="Navigasi Utama Bawah"
      className="fixed bottom-0 inset-x-0 z-50 mx-auto w-full max-w-md border-t border-edge bg-card pb-safe shadow-[0_-1px_8px_rgba(0,0,0,0.04)]"
    >
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/eksplorasi" && (pathname === "/eksplorasi" || pathname.startsWith("/eksplorasi") || pathname === "/showcase" || pathname === "/arsip")) ||
            (item.href === "/aspirasi" && (pathname === "/aspirasi" || pathname.startsWith("/aspirasi") || pathname === "/suara" || pathname.startsWith("/suara"))) ||
            (item.href !== "/dashboard" && item.href !== "/aspirasi" && item.href !== "/eksplorasi" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-primary font-bold"
                  : "text-ink-secondary hover:text-ink font-medium"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive ? "scale-105 stroke-[2.4]" : "stroke-[1.7]"
                  }`}
                />
              </div>
              <span className="text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
