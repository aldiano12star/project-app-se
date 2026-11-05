"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Jalankan animasi setelah komponen di-mount
    setIsMounted(true);

    // Fade out dimulai pada 1.5 detik (1500ms)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    // Unmount sepenuhnya dari DOM pada 2.0 detik (2000ms)
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

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
      id="se-custom-splash-screen"
      role="status"
      aria-label="Memuat aplikasi..."
      aria-live="polite"
      className={`fixed inset-0 z-[99999] bg-surface flex flex-col items-center justify-center select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Container Logo dengan efek Pulse & Scale halus */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow Lingkaran */}
          <div className="absolute w-32 h-32 rounded-full bg-primary/10 blur-xl animate-pulse" />

          {/* Logo Placeholder / Image */}
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
              className="h-24 w-24 sm:h-28 sm:w-28 object-contain drop-shadow-md animate-pulse"
            />
          </div>
        </div>

        {/* Indikator Pemuatan Elegan (Minimalist Progress Bar) */}
        <div className="w-40 sm:w-48 h-1 bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full bg-primary rounded-full transition-all duration-1500 ease-out ${
              isMounted ? "w-full" : "w-0"
            }`}
          />
        </div>

        <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
          SE-Core
        </span>
      </div>
    </aside>
  );
}
