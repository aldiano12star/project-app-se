"use client";

import React, { useState, useTransition, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Check, Upload, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { ImagePickerField } from "@/components/ui/ImagePickerField";
import { updateUserAvatar } from "@/actions/profile";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { haptic } from "@/lib/haptic";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export interface AvatarTemplate {
  id: string;
  name: string;
  url: string;
  badge: string;
}

export const AVATAR_TEMPLATES: AvatarTemplate[] = [
  {
    id: "avatar-1",
    name: "Cyber Cadet",
    url: "/avatars/avatar-1.svg",
    badge: "Tech",
  },
  {
    id: "avatar-2",
    name: "Code Wizard",
    url: "/avatars/avatar-2.svg",
    badge: "Logic",
  },
  {
    id: "avatar-3",
    name: "Pixel Artisan",
    url: "/avatars/avatar-3.svg",
    badge: "Desain",
  },
  {
    id: "avatar-4",
    name: "Robotics Ace",
    url: "/avatars/avatar-4.svg",
    badge: "Maker",
  },
  {
    id: "avatar-5",
    name: "Creative Audio",
    url: "/avatars/avatar-5.svg",
    badge: "Media",
  },
  {
    id: "avatar-6",
    name: "Quantum Explorer",
    url: "/avatars/avatar-6.svg",
    badge: "Future",
  },
];

interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  currentName?: string;
  onAvatarUpdated?: (url: string) => void;
}

export function AvatarSelectorModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  currentName = "Pengguna",
  onAvatarUpdated,
}: AvatarSelectorModalProps) {
  const isClient = useIsClient();
  useBodyScrollLock(isOpen);

  const [activeTab, setActiveTab] = useState<"TEMPLATE" | "UPLOAD">("TEMPLATE");
  const [selectedUrl, setSelectedUrl] = useState<string>(
    currentAvatarUrl || AVATAR_TEMPLATES[0].url
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !isClient) return null;

  const initials = currentName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSave = () => {
    if (!selectedUrl) {
      setErrorMessage("Silakan pilih template avatar atau unggah foto terlebih dahulu.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateUserAvatar(selectedUrl);
      if (res.success) {
        haptic.success();
        onAvatarUpdated?.(selectedUrl);
        onClose();
      } else {
        haptic.warning();
        setErrorMessage(res.message);
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col text-ink animate-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/60 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-ink">
              Ubah Foto Profil &amp; Avatar
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Pilih karakter ilustrasi bawaan atau unggah foto pribadimu
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Tutup Modal Avatar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Preview Circle */}
          <div className="flex flex-col items-center justify-center gap-2 py-1">
            <div className="w-20 h-20 rounded-full p-[2.5px] bg-linear-to-tr from-primary via-rose-500 to-amber-500 shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center relative">
                {selectedUrl ? (
                  <Image
                    src={selectedUrl}
                    alt="Pratinjau Avatar"
                    width={80}
                    height={80}
                    unoptimized={selectedUrl.endsWith(".svg")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-ink-secondary">
                    {initials}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold text-ink-muted">
              Pratinjau Avatar Terpilih
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-edge">
            <button
              type="button"
              onClick={() => setActiveTab("TEMPLATE")}
              className={`flex-1 py-2 min-h-[40px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "TEMPLATE"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Template Avatar ({AVATAR_TEMPLATES.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("UPLOAD")}
              className={`flex-1 py-2 min-h-[40px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "UPLOAD"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Unggah Foto</span>
            </button>
          </div>

          {/* Tab 1: Template Avatars Grid */}
          {activeTab === "TEMPLATE" && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-ink-muted block px-0.5">
                Pilih salah satu karakter default di bawah:
              </span>
              <div className="grid grid-cols-3 gap-3">
                {AVATAR_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedUrl === tmpl.url;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedUrl(tmpl.url)}
                      className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 group ${
                        isSelected
                          ? "bg-primary/5 border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]"
                          : "bg-surface-container-low/70 border-edge hover:border-slate-400 hover:bg-surface-container"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-surface border border-edge flex items-center justify-center shrink-0">
                        <Image
                          src={tmpl.url}
                          alt={tmpl.name}
                          width={56}
                          height={56}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="text-xs font-bold text-ink block truncate">
                          {tmpl.name}
                        </span>
                        <span className="text-xs text-ink-muted block font-medium">
                          {tmpl.badge}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Custom Photo Upload with ImagePickerField */}
          {activeTab === "UPLOAD" && (
            <div className="space-y-3">
              <ImagePickerField
                value={selectedUrl.startsWith("http") ? selectedUrl : ""}
                onChange={(url) => {
                  if (url) setSelectedUrl(url);
                }}
                aspectRatio="square"
                label="Unggah Foto Profil Pribadi"
                placeholder="Pilih foto dari galeri / kamera perangkat..."
                helperText="Otomatis dikompresi ke WebP resolusi tajam & ultra-ringan sebelum diunggah ke Cloudinary."
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-edge bg-surface-container-low/40 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-edge bg-surface hover:bg-surface-container text-ink text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Gunakan Avatar Ini</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
