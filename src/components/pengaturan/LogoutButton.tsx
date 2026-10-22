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
        className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 dark:border-rose-800/50 shadow-xs transition-colors text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400" />
            <span>Memproses Keluar...</span>
          </>
        ) : (
          <>
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
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
