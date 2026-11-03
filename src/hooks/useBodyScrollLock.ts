"use client";

import { useEffect } from "react";

// Global reference counter to handle nested or consecutive modals
let lockCount = 0;
let originalOverflow = "";
let originalPaddingRight = "";

/**
 * Hook to lock background body scrolling when a modal or overlay is open.
 * Supports multiple concurrent modals using reference counting.
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      // Compensate for scrollbar width to prevent layout shift
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      document.body.style.overflow = "hidden";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [isLocked]);
}
