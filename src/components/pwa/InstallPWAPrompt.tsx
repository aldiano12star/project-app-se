"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  Share,
  PlusSquare,
  X,
  Smartphone,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWAPrompt() {
  const [isStandalone, setIsStandalone] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Cek apakah aplikasi sudah berjalan dalam mode standalone (terpasang)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // 2. Cek apakah pengguna sudah menutup prompt di sesi ini
    const dismissedSession = sessionStorage.getItem("pwa_prompt_dismissed");
    if (dismissedSession === "true") {
      setIsDismissed(true);
    }

    // 3. Deteksi perangkat iOS / Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    setIsIOS(isAppleDevice);

    // 4. Tangkap event 'beforeinstallprompt' untuk Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("[PWA] Aplikasi Saba ExploIT berhasil dipasang di perangkat.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Handler untuk eksekusi instalasi di Android/Chrome
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("[PWA] Galat saat memicu instalasi:", err);
    }
  };

  // Handler untuk menutup prompt sementara
  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  // Jika sudah terpasang, dalam mode standalone, ditutup sementara, atau baru saja berhasil dipasang
  if (isStandalone || isDismissed || isInstalled) {
    return null;
  }

  // Hanya tampilkan jika ada prompt Android atau terdeteksi perangkat iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Floating Installation Banner Card */}
      <aside
        aria-label="Prompt Pasang Aplikasi Saba ExploIT"
        className="fixed bottom-20 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-24 z-50 max-w-md mx-auto sm:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="relative rounded-2xl bg-[#090D16]/95 border border-[#23304B] p-4 text-slate-100 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          {/* Tombol Tutup X */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup saran instalasi"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            {/* App Icon Badge */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E11D2A] to-[#991B1B] text-white font-black text-sm shadow-md ring-2 ring-[#E11D2A]/40">
              SE
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>

            {/* Banner Text */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#E11D2A]/20 text-[#FF4D5E] border border-[#E11D2A]/30 font-mono uppercase tracking-wider">
                  Mobile App
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Saba ExploIT
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-100 leading-snug">
                Pasang Aplikasi Saba ExploIT di HP untuk presensi QR instan &amp; layar penuh!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-800/80">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 h-10 min-h-[40px] px-3.5 rounded-xl bg-[#E11D2A] hover:bg-[#BE123C] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pasang Sekarang</span>
              </button>
            ) : isIOS ? (
              <button
                type="button"
                onClick={() => setShowIOSModal(true)}
                className="flex-1 h-10 min-h-[40px] px-3.5 rounded-xl bg-[#E11D2A] hover:bg-[#BE123C] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Cara Pasang di iPhone</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleDismiss}
              className="h-10 min-h-[40px] px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Petunjuk Instalasi Khusus iOS / Safari */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#090D16] border border-[#23304B] p-5 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#23304B]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#E11D2A]/10 border border-[#E11D2A]/30 text-[#E11D2A]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="ios-install-title" className="text-sm font-bold text-white">
                    Pasang di iOS / iPhone
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Panduan 2 langkah mudah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Langkah-langkah */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold text-xs">
                  1
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    Ketuk tombol <span className="text-blue-400 font-bold">Bagikan (Share)</span>
                    <Share className="w-3.5 h-3.5 text-blue-400 inline shrink-0" />
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Ikon kotak panah ke atas di bagian bawah layar peramban Safari.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-xs">
                  2
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    Pilih <span className="text-emerald-400 font-bold">Tambahkan ke Layar Utama</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Gulir ke bawah pada menu pop-up, lalu ketuk tombol <strong>Tambah (Add)</strong> di sudut kanan atas.
                  </p>
                </div>
              </div>
            </div>

            {/* Keuntungan Standalone */}
            <div className="p-3 rounded-xl bg-[#E11D2A]/10 border border-[#E11D2A]/20 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#E11D2A] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-300 leading-tight">
                Aplikasi akan langsung muncul di layar utama HP Anda dengan pengalaman layar penuh tanpa bilah peramban.
              </p>
            </div>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full h-11 min-h-[44px] rounded-xl bg-[#E11D2A] hover:bg-[#BE123C] text-white font-bold text-xs flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
