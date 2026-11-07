"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Sparkles, Trophy, Rocket, ArrowRight, X, Loader2 } from "lucide-react";
import { markWelcomeAsSeen } from "@/actions/profile";
import { triggerMicroConfetti } from "@/lib/confetti";
import { haptic } from "@/lib/haptic";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface WelcomeOnboardingModalProps {
  initialOpen: boolean;
  userName?: string;
}

export function WelcomeOnboardingModal({
  initialOpen,
  userName = "Anggota",
}: WelcomeOnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isPending, startTransition] = useTransition();

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleDismiss = () => {
    // 1. Sensasi Selebrasi & Haptic feedback
    haptic.success();
    triggerMicroConfetti({ originX: 0.5, originY: 0.5, particleCount: 45 });

    // 2. Tandai permanen di database
    startTransition(async () => {
      await markWelcomeAsSeen();
      setIsOpen(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-primary/25 p-6 sm:p-8 shadow-2xl overflow-hidden space-y-6 text-center animate-in zoom-in-95 duration-300">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button Minimalist */}
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isPending}
          className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-container-low transition-colors cursor-pointer"
          title="Tutup & Mulai"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Squircle Emblem with Radial Glow */}
        <div className="relative mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-container-low border border-primary/30 shadow-[0_0_35px_rgba(225,29,42,0.25)] p-3">
          <Image
            src="/logo.png"
            alt="SE-Core Logo"
            width={64}
            height={64}
            priority
            className="object-contain h-full w-full"
          />
        </div>

        {/* Hype Typography */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Halo, {userName.split(" ")[0]}!</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink leading-tight">
            Selamat Datang di Ekosistem Digital SE-Core!
          </h2>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
            Selesaikan tugas, kumpulkan XP, dan jadilah legenda di Lorong Waktu. Mari mulai kolaborasi kita!
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 gap-2.5 text-left pt-1">
          <div className="p-3 rounded-2xl bg-surface-container-low/60 border border-edge flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
              <Rocket className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-ink block">
                Eksplorasi &amp; Portofolio
              </span>
              <span className="text-[11px] text-ink-muted block truncate">
                Pamerkan ide cemerlang &amp; karya divisimu
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low/60 border border-edge flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-ink block">
                XP &amp; Podium Prestasi
              </span>
              <span className="text-[11px] text-ink-muted block truncate">
                Raih posisi puncak di Hall of Fame tahunan
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            className="w-full h-12 min-h-12 rounded-2xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuka Gerbang...</span>
              </>
            ) : (
              <>
                <span>Mulai Penjelajahan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
