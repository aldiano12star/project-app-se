"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Cek apakah splash screen sudah pernah ditampilkan pada sesi aktif
    try {
      if (sessionStorage.getItem("se_splash_shown")) {
        setIsVisible(false);
        return;
      }
      sessionStorage.setItem("se_splash_shown", "true");
    } catch {
      // Abaikan jika storage dinonaktifkan di browser
    }

    // Jalankan animasi setelah komponen di-mount
    setIsMounted(true);

    // Fade out dimulai pada 1.1 detik (1100ms) untuk transisi yang cepat dan responsif
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1100);

    // Unmount sepenuhnya dari DOM pada 1.45 detik (1450ms)
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1450);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      id="se-splash-screen"
      role="status"
      aria-label="Memuat aplikasi SE-Core..."
      aria-live="polite"
      className={`fixed inset-0 z-[99999] bg-surface flex flex-col items-center justify-center select-none transition-opacity duration-350 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Container Logo dengan efek Apple-style Ambient Aura */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow Lingkaran Halus */}
          <div className="absolute w-36 h-36 rounded-full bg-primary/10 blur-2xl" />

          {/* Logo dengan transisi skala halus */}
          <div
            className={`relative transform transition-all duration-700 ease-out ${
              isMounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <Image
              src="/logo.png"
              alt="Logo Saba ExploIT"
              width={112}
              height={112}
              priority
              className="h-24 w-24 sm:h-28 sm:w-28 object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Indikator Pemuatan Elegan (Minimalist Progress Bar) */}
        <div className="w-36 sm:w-44 h-1 bg-surface-container-high/60 rounded-full overflow-hidden">
          <div
            className={`h-full bg-primary rounded-full transition-all duration-1000 ease-out ${
              isMounted ? "w-full" : "w-0"
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase font-mono">
            SE-Core
          </span>
          <span className="text-[10px] text-ink-muted/50">•</span>
          <span className="text-[11px] font-medium tracking-wide text-ink-muted/80">
            Saba ExploIT
          </span>
        </div>
      </div>
    </aside>
  );
}
