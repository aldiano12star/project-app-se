import React from "react";
import { TopHeader } from "./TopHeader";
import { BottomNav } from "./BottomNav";
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
    <div className="min-h-screen w-full bg-surface text-ink flex justify-center">
      <div className="relative flex min-h-screen w-full max-w-md flex-col bg-surface border-x border-edge/30 shadow-sm">
        {/* Header Lengkap dengan Brand & Identitas */}
        {showHeader && <TopHeader user={user} />}

        {/* Banner Proteksi Akun GUEST */}
        {user?.role === Role.GUEST && (
          <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
            <span className="text-lg shrink-0">⏳</span>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="font-bold block text-amber-200 text-xs">
                Menunggu Verifikasi Pengurus
              </span>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Akun Anda sedang menunggu verifikasi pengurus Saba ExploIT. Hubungi pengurus untuk aktivasi akun.
              </p>
            </div>
          </div>
        )}

        {/* Slot Konten Utama */}
        <main className={`flex-1 px-4 py-4 ${showNav ? "pb-28" : "pb-8"}`}>
          {children}
        </main>

        {/* Navigasi Bawah */}
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
