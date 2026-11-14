"use client";

import { useState } from "react";
import Link from "next/link";
import { NotifType, type Notification } from "@prisma/client";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteReadNotifications,
} from "@/actions/notification";
import {
  Bell,
  Receipt,
  Megaphone,
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Sparkles,
  Trash2,
  Loader2,
} from "lucide-react";
import { haptic } from "@/lib/haptic";

interface MailboxClientViewProps {
  initialNotifications: Notification[];
}

function groupNotificationsByDate(items: Notification[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const groups: { title: string; items: Notification[] }[] = [
    { title: "Hari Ini", items: [] },
    { title: "Kemarin", items: [] },
    { title: "Pekan Ini", items: [] },
    { title: "Terdahulu", items: [] },
  ];

  for (const item of items) {
    const itemTime = new Date(item.createdAt).getTime();
    if (itemTime >= startOfToday) {
      groups[0].items.push(item);
    } else if (itemTime >= startOfYesterday) {
      groups[1].items.push(item);
    } else if (itemTime >= startOfWeek) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

export function MailboxClientView({ initialNotifications }: MailboxClientViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedTab, setSelectedTab] = useState<"ALL" | NotifType>("ALL");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingRead, setIsDeletingRead] = useState(false);

  const filteredNotifications = notifications.filter((item) => {
    if (selectedTab === "ALL") return true;
    return item.type === selectedTab;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    haptic.tap();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isUpdating) return;
    haptic.success();
    setIsUpdating(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsAsRead();
    setIsUpdating(false);
  };

  const handleDeleteRead = async () => {
    if (readCount === 0 || isDeletingRead) return;
    haptic.tap();
    setIsDeletingRead(true);
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    const res = await deleteReadNotifications();
    if (res.success) {
      haptic.success();
    }
    setIsDeletingRead(false);
  };

  const getNotifIcon = (type: NotifType) => {
    switch (type) {
      case NotifType.BILLING:
        return <Receipt className="h-4 w-4 text-rose-500 shrink-0" />;
      case NotifType.JARKOM:
        return <Megaphone className="h-4 w-4 text-amber-500 shrink-0" />;
      case NotifType.ALERT:
        return <AlertTriangle className="h-4 w-4 text-sky-500 shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400 shrink-0" />;
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

  const grouped = groupNotificationsByDate(filteredNotifications);

  return (
    <div className="flex flex-col gap-6">
      {/* ── EDITORIAL HEADER DENGAN DISCRETE ACTION (Things 3 Style) ── */}
      <section className="flex items-center justify-between pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display">
              Kotak Masuk
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/25 text-[11px] font-bold font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                {unreadCount} Baru
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            Pusat instruksi resmi, siaran jarkom, dan status tagihan kas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {readCount > 0 && (
            <button
              type="button"
              onClick={handleDeleteRead}
              disabled={isDeletingRead}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors py-2 px-3 rounded-full hover:bg-rose-500/10 border border-rose-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Hapus semua notifikasi yang sudah dibaca"
            >
              {isDeletingRead ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Hapus yang Dibaca</span>
              <span className="sm:hidden">Hapus Dibaca</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/15 text-[10px] font-mono font-bold">
                {readCount}
              </span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-emerald-500 transition-colors py-2 px-3 rounded-full hover:bg-surface-container border hairline-border active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Tandai Semua Dibaca</span>
              <span className="sm:hidden">Tandai Baca</span>
            </button>
          )}
        </div>
      </section>

      {/* ── GLASS SEGMENTED FILTER CAPSULE (Apple iOS 18 Filter) ── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-container/60 border hairline-border overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            setSelectedTab("ALL");
          }}
          className={`flex-1 min-w-[70px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[38px] flex items-center justify-center cursor-pointer ${
            selectedTab === "ALL"
              ? "bg-card text-ink shadow-xs border hairline-border font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Semua ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            setSelectedTab(NotifType.BILLING);
          }}
          className={`flex-1 min-w-[85px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedTab === NotifType.BILLING
              ? "bg-card text-rose-500 shadow-xs border hairline-border font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Tagihan</span>
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            setSelectedTab(NotifType.JARKOM);
          }}
          className={`flex-1 min-w-[85px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedTab === NotifType.JARKOM
              ? "bg-card text-amber-500 shadow-xs border hairline-border font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Megaphone className="h-3.5 w-3.5" />
          <span>Jarkom</span>
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            setSelectedTab(NotifType.ALERT);
          }}
          className={`flex-1 min-w-[95px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[38px] flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedTab === NotifType.ALERT
              ? "bg-card text-sky-500 shadow-xs border hairline-border font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Peringatan</span>
        </button>
      </div>

      {/* ── CHRONOLOGICALLY GROUPED INBOX FEED (Things 3 Pattern) ── */}
      {grouped.length === 0 ? (
        <div className="card-solid p-12 flex flex-col items-center justify-center text-center gap-3 rounded-3xl border hairline-border">
          <div className="h-12 w-12 rounded-2xl bg-surface-container flex items-center justify-center text-ink-muted">
            <Inbox className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink font-display">Semua Pesan Selesai</h3>
            <p className="text-xs text-ink-muted max-w-xs">
              Kotak masukmu bersih dan teratur. Setiap notifikasi penting akan langsung tampil di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.title} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-mono font-bold tracking-wider text-ink-muted uppercase">
                  {group.title}
                </span>
                <span className="h-px flex-1 bg-edge/40" />
              </div>

              <div className="space-y-2">
                {group.items.map((notif) => {
                  const formattedTime = new Date(notif.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={notif.id}
                      className={`specular-card bg-card border rounded-2xl p-4 transition-all relative flex flex-col gap-3 group ${
                        !notif.isRead
                          ? "border-rose-500/30 dark:border-rose-500/20 shadow-xs bg-rose-500/[0.02]"
                          : "border-edge/70 dark:border-white/5 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Naked Icon + Status Dot */}
                          <div className="relative pt-0.5 shrink-0">
                            {getNotifIcon(notif.type)}
                            {!notif.isRead && (
                              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card" />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs leading-snug ${
                                  !notif.isRead
                                    ? "font-extrabold text-ink"
                                    : "font-semibold text-ink-secondary"
                                }`}
                              >
                                {notif.title}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container border hairline-border text-ink-muted font-medium">
                                {getBadgeLabel(notif.type)}
                              </span>
                            </div>
                            <p className="text-xs text-ink-muted leading-relaxed font-body">
                              {notif.message}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-ink-muted shrink-0 tabular-nums">
                          {formattedTime}
                        </span>
                      </div>

                      {/* Baris Aksi Tactile */}
                      <div className="flex items-center justify-between pt-2 border-t hairline-border">
                        {notif.actionUrl ? (
                          <Link
                            href={notif.actionUrl}
                            onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline min-h-[36px] py-1.5 px-1 cursor-pointer"
                          >
                            <span>Buka Tindakan</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span />
                        )}

                        {!notif.isRead ? (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-muted hover:text-emerald-500 transition-colors min-h-[36px] py-1.5 px-2.5 rounded-lg hover:bg-surface-container active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Tandai sudah dibaca</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-ink-muted/60 flex items-center gap-1 py-1.5 font-mono">
                            <CheckCheck className="h-3 w-3 text-slate-400" />
                            <span>Telah dibaca</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
