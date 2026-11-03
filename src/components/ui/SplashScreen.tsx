"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [startScale, setStartScale] = useState(false);
  const [startProgress, setStartProgress] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Periksa apakah splash screen sudah pernah ditampilkan pada sesi tab browser ini
    try {
      const hasShown = sessionStorage.getItem("se_splash_shown");
      if (hasShown) {
        setIsVisible(false);
        return;
      }
    } catch {
      // Fallback jika sessionStorage dinonaktifkan / private browsing
    }

    setMounted(true);

    // Trigger animasi scale dan progress bar pada frame berikutnya
    const frameId = requestAnimationFrame(() => {
      setStartScale(true);
      setStartProgress(true);
    });

    // Setelah 1500ms, mulai transisi fade out (500ms)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      try {
        sessionStorage.setItem("se_splash_shown", "true");
      } catch {
        // Abaikan
      }
    }, 1500);

    // Setelah 2000ms (1500ms display + 500ms fade), unmount dari DOM
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!isVisible || !mounted) {
    return null;
  }

  return (
    <aside
      aria-label="Loading Splash Screen"
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 pointer-events-auto ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Center Element: Logo dengan animasi scaling up halus */}
      <div
        className={`transform transition-transform duration-1000 ease-out select-none ${
          startScale ? "scale-100" : "scale-90"
        }`}
      >
        <Image
          src="/logo.png"
          alt="Saba ExploIT Logo"
          width={112}
          height={112}
          priority
          className="h-28 w-28 object-contain drop-shadow-sm"
        />
      </div>

      {/* Bottom Element: Minimalist Progress Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 max-w-sm h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-[1500ms] ease-out"
          style={{ width: startProgress ? "100%" : "0%" }}
        />
      </div>
    </aside>
  );
}
