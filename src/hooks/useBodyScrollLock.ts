"use client";

import { useEffect, useSyncExternalStore } from "react";

// Global reference counter to handle nested or consecutive modals
let lockCount = 0;
let originalOverflow = "";
let originalPaddingRight = "";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Subscribe to changes in active modal status.
 * Used by useSyncExternalStore to reactively trigger UI updates (e.g. hiding BottomNav).
 */
export function subscribeModal(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get current count of active locked modals.
 */
export function getActiveModalCount(): number {
  return lockCount;
}

/**
 * Hook to reactively observe whether ANY modal or overlay is active.
 * Replaces brittle DOM MutationObserver with pure React 19 external store.
 */
export function useIsModalOpen(): boolean {
  return useSyncExternalStore(
    subscribeModal,
    () => lockCount > 0,
    () => false
  );
}

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
    notify();

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
      notify();
    };
  }, [isLocked]);
}
