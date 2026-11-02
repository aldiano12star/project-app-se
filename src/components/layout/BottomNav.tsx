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
  const [isModalActive, setIsModalActive] = useState(false);

  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  const activePath = optimisticPath || pathname;

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

  if (pathname.startsWith("/pengaturan")) {
    return null;
  }

  return (
    <nav
      data-nav="true"
      aria-label="Navigasi Utama Bawah"
      className={`fixed bottom-5 left-4 right-4 max-w-sm mx-auto z-50 px-5 py-2.5 rounded-full flex items-center justify-between bg-white/80 backdrop-blur-lg border border-slate-200/80 shadow-lg text-slate-500 dark:bg-[#151D2A]/80 dark:border-[#27344A] dark:text-slate-400 transition-colors md:hidden ${
        isModalActive ? "hidden" : ""
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
                onClick={() => setOptimisticPath(item.href)}
                className="bg-rose-100 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50 font-semibold rounded-full px-3.5 py-1.5 flex items-center gap-1.5 transition-all shadow-xs min-h-11 shrink-0"
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
              onClick={() => setOptimisticPath(item.href)}
              title={item.label}
              aria-label={item.label}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-[#E2E8F0] p-2.5 rounded-full transition-all active:scale-90 flex items-center justify-center min-h-11 min-w-11 shrink-0"
            >
              <Icon className="h-5 w-5 stroke-[1.8]" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
