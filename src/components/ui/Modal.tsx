"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { X } from "lucide-react";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  zIndex?: string;
  showCloseButton?: boolean;
}

/**
 * Saba ExploIT Unified Modal & BottomSheet Engine (v2.5.0)
 *
 * - Mobile (< md): Apple-style Bottom Sheet sliding up from screen bottom,
 *   with drag handle pill, max-height 88dvh, independent scrolling, and safe area clearance.
 * - Desktop (>= md): Viewport-centered dialog with hairline border, glass elevation,
 *   and responsive max-width.
 * - Global Escape key listener & background scroll locking with reference counting.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  footer,
  className = "",
  backdropClassName = "",
  zIndex = "z-[100]",
  showCloseButton = false,
}: ModalProps) {
  const isClient = useIsClient();
  useBodyScrollLock(isOpen);

  // Keyboard navigation: Escape key closes active modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isClient) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${zIndex} flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 ${backdropClassName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full rounded-t-3xl md:rounded-3xl bg-card border-t md:border border-edge/80 dark:border-white/10 shadow-2xl flex flex-col max-h-[88dvh] md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple-style Drag Handle Pill for Mobile Screens */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0 bg-card">
          <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80" />
        </div>

        {/* Optional Unified Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge/60 dark:border-white/8 shrink-0 bg-card">
            {title ? (
              <div className="min-w-0 flex-1 pr-3">
                <h2 className="text-base sm:text-lg font-bold text-ink font-display truncate">
                  {title}
                </h2>
                {description && (
                  <p className="text-xs text-ink-muted mt-0.5 truncate font-body">
                    {description}
                  </p>
                )}
              </div>
            ) : (
              <div />
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Dialog"
                className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body Content (strip duplicate outer card styling if passed from caller) */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 w-full [&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none">
          {children}
        </div>

        {/* Optional Sticky Action Footer with Safe-Area Inset */}
        {footer && (
          <div className="sticky bottom-0 z-10 shrink-0 bg-card/95 backdrop-blur-md border-t border-edge/60 dark:border-white/8 px-5 py-3.5 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
