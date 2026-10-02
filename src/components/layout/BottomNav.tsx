"use client";

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
      className="fixed bottom-4 inset-x-3 z-40 mx-auto w-auto max-w-md"
    >
      <div className="rounded-full bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 px-2 py-1.5 flex items-center justify-between min-h-14">
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
                className="bg-primary/15 text-primary border border-primary/25 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 transition-all shadow-xs min-h-11"
              >
                <Icon className="h-5 w-5 stroke-[2.2] shrink-0" />
                <span className="text-xs font-bold leading-none tracking-tight">
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
              className="text-slate-400 hover:text-slate-200 p-2 rounded-full transition-all active:scale-90 active:text-white flex items-center justify-center min-h-11 min-w-11"
            >
              <Icon className="h-5 w-5 stroke-[1.8]" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
