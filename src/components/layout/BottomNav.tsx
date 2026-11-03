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
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isModalActive, setIsModalActive] = useState(false);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOptimisticPath(null);
  }

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
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[400px] rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-md shadow-2xl border border-edge md:hidden px-3 py-1.5 transition-all ${
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
