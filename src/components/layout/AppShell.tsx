import React from "react";
import { TopHeader } from "./TopHeader";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Role } from "@prisma/client";

export interface AppShellUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: Role;
  monthlyPoints?: number;
  totalPoints?: number;
}

interface AppShellProps {
  user?: AppShellUser | null;
  children: React.ReactNode;
  showHeader?: boolean;
  showNav?: boolean;
}

export function AppShell({
  user,
  children,
  showHeader = true,
  showNav = true,
}: AppShellProps) {
  return (
    <div className="min-h-screen w-full bg-surface text-ink flex justify-center md:justify-start">
      {/* Sidebar Desktop (Hanya di Layar Lebar) */}
      {showNav && <Sidebar user={user} />}

      {/* Kontainer Konten Utama */}
      <div
        className={`relative flex min-h-screen w-full max-w-md md:max-w-none md:w-auto md:flex-1 min-w-0 flex-col bg-surface border-x md:border-x-0 border-edge/30 shadow-sm transition-all ${
          showNav ? "md:ml-64" : "mx-auto"
        }`}
      >
        {/* Header Lengkap dengan Brand & Identitas */}
        {showHeader && <TopHeader user={user} />}

        {/* Banner Proteksi Akun GUEST */}
        {user?.role === Role.GUEST && (
          <div className="mx-4 md:mx-8 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3 shadow-sm animate-in fade-in">
            <span className="text-xl shrink-0">⏳</span>
            <div className="space-y-1 min-w-0 flex-1">
              <span className="font-semibold block text-amber-200 text-sm">
                Menunggu Verifikasi Pengurus
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Akun Anda sedang menunggu verifikasi pengurus Saba ExploIT. Hubungi pengurus untuk aktivasi akun.
              </p>
            </div>
          </div>
        )}

        {/* Slot Konten Utama */}
        <main
          className={`flex-1 px-4 md:px-8 py-6 w-full max-w-7xl mx-auto ${
            showNav ? "pb-32 md:pb-12" : "pb-8"
          }`}
        >
          {children}
        </main>

        {/* Navigasi Bawah (Hanya Mobile via md:hidden) */}
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
