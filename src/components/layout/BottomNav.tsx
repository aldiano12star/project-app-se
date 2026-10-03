"use client";

import React, { useEffect, useState } from "react";
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
  const [isModalActive, setIsModalActive] = useState(false);

  useEffect(() => {
    const checkModalInDOM = () => {
      // Deteksi modal overlay yang aktif di DOM (fixed inset-0 di luar nav)
      const activeModal = document.querySelector(
        '[role="dialog"], .fixed.inset-0:not([data-nav="true"])'
      );
      setIsModalActive(!!activeModal);
    };

    checkModalInDOM();

    const observer = new MutationObserver(checkModalInDOM);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      data-nav="true"
      aria-label="Navigasi Utama Bawah"
      className={`fixed bottom-5 left-4 right-4 max-w-sm mx-auto z-50 px-5 py-2.5 rounded-full border shadow-xl flex items-center justify-between bg-[#FFFFFF] border-slate-200 shadow-slate-300/60 dark:bg-[#151D2E] dark:border-[#222F46] dark:shadow-black/60 transition-colors ${
        isModalActive ? "hidden" : ""
      }`}
    >
      <div className="flex items-center justify-between w-full">
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
                className="bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:border-primary/30 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 transition-all shadow-xs min-h-[44px] shrink-0"
              >
                <Icon className="h-5 w-5 stroke-[2.2] shrink-0" />
                <span className="text-xs font-semibold leading-none tracking-tight">
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
              title={item.label}
              aria-label={item.label}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 p-2.5 rounded-full transition-all active:scale-90 flex items-center justify-center min-h-[44px] min-w-[44px] shrink-0"
            >
              <Icon className="h-5 w-5 stroke-[1.8]" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
