"use client";

import React, { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <section className="pt-2">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isLoading}
        className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 active:scale-[0.98] text-red-400 border border-red-800/60 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
            <span>Memproses Keluar...</span>
          </>
        ) : (
          <>
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Keluar dari Akun</span>
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-ink-muted mt-3 font-mono">
        Saba ExploIT App v1.0.0-beta • Build 2026
      </p>
    </section>
  );
}
