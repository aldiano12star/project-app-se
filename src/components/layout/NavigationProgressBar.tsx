"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsVisible(true);
    setProgress(18);

    // Trickle progress incrementally
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          return prev;
        }
        // Maju bertahap mendekati 85%
        const remaining = 85 - prev;
        const step = Math.max(1, Math.floor(remaining * 0.1));
        return prev + step;
      });
    }, 150);
  };

  const completeProgress = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setProgress(100);
    finishTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 250);
  };

  // Selesaikan progress bar saat rute / search params telah berganti
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams]);

  // Intersep klik pada seluruh link internal
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // Abaikan jika modifier key ditekan (buka tab baru)
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;

      if (anchor.hasAttribute("download")) return;

      // Periksa apakah link menuju URL internal
      try {
        const currentUrl = new URL(window.location.href);
        const targetUrl = new URL(anchor.href, window.location.href);

        if (targetUrl.origin !== currentUrl.origin) {
          // Link eksternal
          return;
        }

        // Jika hanya anchor hash pada halaman yang sama, abaikan
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }

        // Tautan internal yang valid: mulai progress bar seketika
        startTransition(() => {
          startProgress();
        });
      } catch {
        // Abaikan parse error (misal: mailto:, tel:)
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick, {
        capture: true,
      });
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] w-full"
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out relative"
        style={{
          width: `${progress}%`,
          opacity: isVisible ? 1 : 0,
          boxShadow: "0 0 10px var(--saba-primary), 0 0 5px var(--saba-primary)",
        }}
      >
        {/* Glow bead di ujung bar */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 blur-[1px]" />
      </div>
    </div>
  );
}
