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
