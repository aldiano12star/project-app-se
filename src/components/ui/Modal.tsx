"use client";

import React, { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

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
  className?: string;
  backdropClassName?: string;
  zIndex?: string;
}

/**
 * Global Viewport-Centered Modal Wrapper
 * Uses React Portal to attach to document.body, guaranteeing the modal
 * is always centered on the user's active viewport regardless of page scroll.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  backdropClassName = "",
  zIndex = "z-[100]",
}: ModalProps) {
  const isClient = useIsClient();
  useBodyScrollLock(isOpen);

  if (!isOpen || !isClient) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 ${backdropClassName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
