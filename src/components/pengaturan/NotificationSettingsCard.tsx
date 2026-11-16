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
  Calendar,
  Copy,
  Check,
  ExternalLink,
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
  const [copiedCalendarUrl, setCopiedCalendarUrl] = useState(false);

  const calendarIcsUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/calendar/ics`
      : "/api/calendar/ics";

  const handleCopyCalendarUrl = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(calendarIcsUrl);
      setCopiedCalendarUrl(true);
      setTimeout(() => setCopiedCalendarUrl(false), 3000);
    } catch {
      // fallback
    }
  };

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

    // Safety timeout untuk memastikan spinner tombol tidak pernah macet
    const safetyTimer = setTimeout(() => {
      setIsRequesting((current) => {
        if (current) {
          setFeedback(
            "Waktu permintaan habis. Pastikan peramban mengizinkan notifikasi dan coba lagi."
          );
          return false;
        }
        return current;
      });
    }, 10000);

    try {
      const result = await subscribeToPush();
      if (result.success) {
        setPermission("granted");
        setIsSubscribed(true);
        setFeedback("Perangkatmu kini terhubung dengan notifikasi instan.");

        // Notifikasi konfirmasi selamat datang
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Saba ExploIT Push Aktif 🚀", {
              body: "Perangkat ini siap menerima agenda rapat & tagihan kas secara real-time.",
              icon: "/logo.png",
              badge: "/logo.png",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...({ vibrate: [100, 50, 100] } as any),
            });
          } catch (notifErr) {
            console.warn("[Notifikasi] Local welcome notification error:", notifErr);
          }
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
      clearTimeout(safetyTimer);
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
            icon: "/logo.png",
            badge: "/logo.png",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...({ vibrate: [100, 50, 100] } as any),
          });
        } else {
          new Notification("Uji Notifikasi Saba ExploIT", {
            body: "Pengingat Rapat: Rapat Pleno Saba ExploIT akan dimulai pukul 15.30 WIB di Lab Komputer.",
            icon: "/logo.png",
          });
        }
      } catch (err) {
        console.error("Gagal mengirim test notifikasi:", err);
      }
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  return (
    <div className="space-y-3">
      {/* KARTU 1: Notifikasi Web Push (OS Native) */}
      <div className="p-4 space-y-3 bg-surface-container-low/40 rounded-2xl border border-edge">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-primary flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-ink">
              🔔 Notifikasi Web Push (OS Native)
            </span>
          </div>

          {/* Status Badge */}
          {permission === "loading" ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 font-mono">
              ...
            </span>
          ) : permission === "granted" && isSubscribed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 font-mono shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terkoneksi ✅</span>
            </span>
          ) : permission === "granted" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/30 font-mono shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Izin Aktif</span>
            </span>
          ) : permission === "denied" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/30 font-mono shrink-0">
              <XCircle className="w-3.5 h-3.5" />
              <span>Diblokir ⚠️</span>
            </span>
          ) : permission === "unsupported" ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 font-mono shrink-0">
              Tidak Didukung
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-mono shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Perlu Izin ⚠️</span>
            </span>
          )}
        </div>

        {/* Deskripsi Full-Width di Bawah Judul */}
        <p className="text-sm text-ink-muted leading-relaxed">
          Pemberitahuan agenda rapat dan tagihan kas langsung di layar HP/Desktop.
        </p>

        {feedback && (
          <p className="text-xs text-ink-secondary bg-surface-container/60 p-2.5 rounded-xl border border-edge">
            {feedback}
          </p>
        )}

        {/* Description & Action Button */}
        {(!isSubscribed || permission !== "granted") && permission !== "unsupported" && permission !== "denied" && (
          <div className="pt-2 border-t border-edge/60 space-y-2.5">
            <p className="text-sm text-ink-secondary leading-relaxed">
              Hubungkan browser perangkat ini untuk menerima pemberitahuan langsung saat rapat pleno dibuat atau saat ada tagihan kas baru.
            </p>
            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="w-full h-11 min-h-11 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghubungkan ke Server Push...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Aktifkan Notifikasi di Perangkat Ini</span>
                </>
              )}
            </button>
          </div>
        )}

        {permission === "granted" && (
          <div className="pt-2 border-t border-edge/60 flex items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">
              Perangkat siap menerima pemberitahuan otomatis di latar belakang.
            </p>
            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={testSent}
              className="h-9 px-3.5 rounded-lg bg-surface-container hover:bg-surface-container-low text-ink font-semibold text-xs flex items-center gap-1.5 border border-edge transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-primary" />
              <span>{testSent ? "Terkirim!" : "Uji Notifikasi"}</span>
            </button>
          </div>
        )}

        {permission === "denied" && (
          <div className="pt-2 border-t border-edge/60">
            <p className="text-xs text-rose-500 dark:text-rose-400 leading-relaxed">
              Notifikasi diblokir di pengaturan peramban/sistem. Buka info situs (ikon gembok/pengaturan peramban) dan ubah izin Notifikasi ke <strong>Izinkan (Allow)</strong>.
            </p>
          </div>
        )}
      </div>

      {/* KARTU 2: Sinkronisasi Google Calendar (.ics) */}
      <div className="p-4 space-y-3 bg-surface-container-low/40 rounded-2xl border border-edge">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-ink">
              📅 Sinkronisasi Google Calendar (.ics)
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-mono shrink-0">
            Feed Aktif
          </span>
        </div>

        {/* Deskripsi Full-Width */}
        <p className="text-sm text-ink-muted leading-relaxed">
          Berlangganan feed kalender agar seluruh agenda kegiatan dan jadwal rapat organisasi otomatis tersinkronisasi ke Google Calendar di HP atau laptopmu.
        </p>

        <div className="pt-2 border-t border-edge/60 space-y-2.5">
          <div className="p-2.5 rounded-xl bg-surface-container/60 border border-edge flex items-center justify-between gap-2 overflow-hidden">
            <span className="text-xs font-mono text-ink-secondary truncate select-all">
              {calendarIcsUrl}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCalendarUrl}
              className="w-full sm:flex-1 h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-ink border border-edge text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              {copiedCalendarUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Tautan Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-ink-muted" />
                  <span>Salin Tautan .ics</span>
                </>
              )}
            </button>

            <a
              href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
                calendarIcsUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Buka di Google Calendar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
