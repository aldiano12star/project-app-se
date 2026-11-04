"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
  Send,
  Smartphone,
} from "lucide-react";
import {
  isPushSupported,
  getActivePushSubscription,
  subscribeToPush,
} from "@/lib/pwa-utils";

export function NotificationSettingsCard() {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | "loading"
  >("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      if (!isPushSupported()) {
        setPermission("unsupported");
        return;
      }

      setPermission(Notification.permission);
      const sub = await getActivePushSubscription();
      setIsSubscribed(!!sub);
    }

    checkStatus();
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setFeedback(null);

    try {
      const result = await subscribeToPush();
      if (result.success) {
        setPermission("granted");
        setIsSubscribed(true);
        setFeedback("Perangkat Anda kini terhubung dengan notifikasi instan.");

        // Notifikasi konfirmasi selamat datang
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification("Saba ExploIT Push Aktif 🚀", {
            body: "Perangkat ini siap menerima agenda rapat & tagihan kas secara real-time.",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...({ vibrate: [100, 50, 100] } as any),
          });
        }
      } else {
        setFeedback(result.error || "Gagal menghubungkan notifikasi.");
        if (typeof window !== "undefined" && "Notification" in window) {
          setPermission(Notification.permission);
        }
      }
    } catch (err: any) {
      console.error("[Notifikasi] Error handleRequestPermission:", err);
      setFeedback("Terjadi kendala saat mengaktifkan notifikasi.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      setTestSent(true);
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification("Uji Notifikasi Saba ExploIT", {
            body: "Pengingat Rapat: Rapat Pleno Saba ExploIT akan dimulai pukul 15.30 WIB di Lab Komputer.",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...({ vibrate: [100, 50, 100] } as any),
          });
        } else {
          new Notification("Uji Notifikasi Saba ExploIT", {
            body: "Pengingat Rapat: Rapat Pleno Saba ExploIT akan dimulai pukul 15.30 WIB di Lab Komputer.",
            icon: "/icons/icon-192.png",
          });
        }
      } catch (err) {
        console.error("Gagal mengirim test notifikasi:", err);
      }
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  return (
    <div className="p-4 space-y-3 bg-surface-container-low/40 rounded-2xl border border-edge">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-primary flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-ink">
              🔔 Notifikasi Web Push (OS Native)
            </span>
            <p className="text-[11px] text-ink-muted">
              Pemberitahuan agenda rapat dan tagihan kas langsung di layar HP/Desktop
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {permission === "loading" ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 font-mono">
            ...
          </span>
        ) : permission === "granted" && isSubscribed ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 font-mono shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Terkoneksi ✅</span>
          </span>
        ) : permission === "granted" ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/30 font-mono shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Izin Aktif</span>
          </span>
        ) : permission === "denied" ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/30 font-mono shrink-0">
            <XCircle className="w-3 h-3" />
            <span>Diblokir ⚠️</span>
          </span>
        ) : permission === "unsupported" ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 font-mono shrink-0">
            Tidak Didukung
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-mono shrink-0">
            <AlertTriangle className="w-3 h-3" />
            <span>Perlu Izin ⚠️</span>
          </span>
        )}
      </div>

      {feedback && (
        <p className="text-[11px] text-ink-secondary bg-surface-container/60 p-2 rounded-lg border border-edge">
          {feedback}
        </p>
      )}

      {/* Description & Action Button */}
      {(!isSubscribed || permission !== "granted") && permission !== "unsupported" && permission !== "denied" && (
        <div className="pt-2 border-t border-edge/60 space-y-2.5">
          <p className="text-[11px] text-ink-secondary leading-relaxed">
            Hubungkan browser perangkat ini untuk menerima pemberitahuan langsung saat rapat pleno dibuat atau saat ada tagihan kas baru.
          </p>
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="w-full h-10 min-h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menghubungkan ke Server Push...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aktifkan Notifikasi di Perangkat Ini</span>
              </>
            )}
          </button>
        </div>
      )}

      {permission === "granted" && (
        <div className="pt-2 border-t border-edge/60 flex items-center justify-between gap-2">
          <p className="text-[11px] text-ink-muted">
            Perangkat siap menerima pemberitahuan otomatis di latar belakang.
          </p>
          <button
            type="button"
            onClick={handleSendTestNotification}
            disabled={testSent}
            className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-low text-ink font-semibold text-[11px] flex items-center gap-1.5 border border-edge transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Send className="w-3 h-3 text-primary" />
            <span>{testSent ? "Terkirim!" : "Uji Notifikasi"}</span>
          </button>
        </div>
      )}

      {permission === "denied" && (
        <div className="pt-2 border-t border-edge/60">
          <p className="text-[11px] text-rose-500 dark:text-rose-400 leading-relaxed">
            Notifikasi diblokir di pengaturan peramban/sistem. Buka info situs (ikon gembok/pengaturan peramban) dan ubah izin Notifikasi ke <strong>Izinkan (Allow)</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
