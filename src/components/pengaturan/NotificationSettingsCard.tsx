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
} from "lucide-react";

export function NotificationSettingsCard() {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | "loading"
  >("loading");
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setPermission(Notification.permission);
      } else {
        setPermission("unsupported");
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted" && "serviceWorker" in navigator) {
        // Kirim notifikasi uji coba via Service Worker jika tersedia
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Saba ExploIT Notifikasi", {
          body: "Selamat! Notifikasi rapat & iuran kas Saba ExploIT telah aktif di perangkat Anda. 🚀",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ vibrate: [100, 50, 100] } as any),
        });
      }
    } catch (err) {
      console.error("[Notifikasi] Gagal meminta izin notifikasi:", err);
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
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-ink">
              🔔 Notifikasi Rapat &amp; Kas
            </span>
            <p className="text-[11px] text-ink-muted">
              Pemberitahuan agenda rapat dan pengingat kas mingguan
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {permission === "loading" ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 font-mono">
            ...
          </span>
        ) : permission === "granted" ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 font-mono shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Aktif ✅</span>
          </span>
        ) : permission === "denied" ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/30 font-mono shrink-0">
            <XCircle className="w-3 h-3" />
            <span>Dinonaktifkan / Diblokir ⚠️</span>
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

      {/* Description & Action Button */}
      {permission === "default" && (
        <div className="pt-2 border-t border-edge/60 space-y-2.5">
          <p className="text-[11px] text-ink-secondary leading-relaxed">
            Aktifkan izin notifikasi peramban agar Anda tidak ketinggalan jadwal rapat pleno, tugas seksi acara, dan informasi kas organisasi.
          </p>
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="w-full h-10 min-h-[40px] px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menghubungkan Peramban...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aktifkan Notifikasi HP</span>
              </>
            )}
          </button>
        </div>
      )}

      {permission === "granted" && (
        <div className="pt-2 border-t border-edge/60 flex items-center justify-between gap-2">
          <p className="text-[11px] text-ink-muted">
            Perangkat siap menerima pemberitahuan otomatis.
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
