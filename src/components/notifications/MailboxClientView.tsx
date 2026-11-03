"use client";

import { useState } from "react";
import Link from "next/link";
import { NotifType, type Notification } from "@prisma/client";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notification";
import {
  Bell,
  Receipt,
  Megaphone,
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Inbox,
} from "lucide-react";

interface MailboxClientViewProps {
  initialNotifications: Notification[];
}

export function MailboxClientView({ initialNotifications }: MailboxClientViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedTab, setSelectedTab] = useState<"ALL" | NotifType>("ALL");
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredNotifications = notifications.filter((item) => {
    if (selectedTab === "ALL") return true;
    return item.type === selectedTab;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isUpdating) return;
    setIsUpdating(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsAsRead();
    setIsUpdating(false);
  };

  const getNotifIcon = (type: NotifType) => {
    switch (type) {
      case NotifType.BILLING:
        return <Receipt className="h-5 w-5 text-rose-500 shrink-0" />;
      case NotifType.JARKOM:
        return <Megaphone className="h-5 w-5 text-amber-500 shrink-0" />;
      case NotifType.ALERT:
        return <AlertTriangle className="h-5 w-5 text-sky-500 shrink-0" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500 shrink-0" />;
    }
  };

  const getBadgeLabel = (type: NotifType) => {
    switch (type) {
      case NotifType.BILLING:
        return "Tagihan Kas";
      case NotifType.JARKOM:
        return "Jarkom Siaran";
      case NotifType.ALERT:
        return "Peringatan";
      default:
        return "Info";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Mark All as Read Action */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span>Kotak Masuk</span>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold">
                {unreadCount} Baru
              </span>
            )}
          </h1>
          <p className="text-xs text-ink-muted">
            Peringatan tagihan kas, siaran informasi (Jarkom), &amp; instruksi resmi
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isUpdating}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-edge bg-card text-ink-secondary hover:text-ink hover:bg-surface-container-low transition-colors min-h-11 cursor-pointer active:scale-98"
          >
            <CheckCheck className="h-4 w-4 text-emerald-500" />
            <span>Tandai Semua Dibaca</span>
          </button>
        )}
      </section>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-low border border-edge overflow-x-auto">
        <button
          type="button"
          onClick={() => setSelectedTab("ALL")}
          className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-11 flex items-center justify-center cursor-pointer ${
            selectedTab === "ALL"
              ? "bg-card text-ink shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Semua ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab(NotifType.BILLING)}
          className={`flex-1 min-w-[85px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-11 flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedTab === NotifType.BILLING
              ? "bg-card text-rose-500 shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Tagihan</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab(NotifType.JARKOM)}
          className={`flex-1 min-w-[85px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-11 flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedTab === NotifType.JARKOM
              ? "bg-card text-amber-500 shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Megaphone className="h-3.5 w-3.5" />
          <span>Jarkom</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab(NotifType.ALERT)}
          className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-11 flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedTab === NotifType.ALERT
              ? "bg-card text-sky-500 shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Peringatan</span>
        </button>
      </div>

      {/* Daftar Notifikasi Personal */}
      {filteredNotifications.length === 0 ? (
        <div className="card-solid p-10 flex flex-col items-center justify-center text-center gap-3">
          <Inbox className="h-10 w-10 text-slate-400 stroke-[1.5]" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-ink">Tidak Ada Pesan</h3>
            <p className="text-xs text-ink-muted max-w-xs">
              Kotak masuk Anda bersih. Seluruh notifikasi tagihan dan jarkom personal akan ditampilkan di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNotifications.map((notif) => {
            const formattedDate = new Date(notif.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={notif.id}
                className={`card-solid p-4 transition-all relative flex flex-col gap-3 ${
                  !notif.isRead
                    ? "border-rose-300 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10"
                    : "opacity-85 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="pt-0.5">{getNotifIcon(notif.type)}</div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-ink leading-tight">
                          {notif.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container border border-edge text-ink-muted font-medium">
                          {getBadgeLabel(notif.type)}
                        </span>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-ink-muted shrink-0 tabular-nums">
                    {formattedDate}
                  </span>
                </div>

                {/* Baris Aksi */}
                <div className="flex items-center justify-between pt-2 border-t border-edge/40">
                  {notif.actionUrl ? (
                    <Link
                      href={notif.actionUrl}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline min-h-11 py-2 px-1 cursor-pointer"
                    >
                      <span>Buka Tautan</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span />
                  )}

                  {!notif.isRead ? (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-emerald-500 transition-colors min-h-11 py-2 px-2 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Tandai dibaca</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-ink-muted/60 flex items-center gap-1 py-2">
                      <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Dibaca</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
