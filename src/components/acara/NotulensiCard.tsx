"use client";

import React, { useState } from "react";
import { FileText, CheckCircle2, Sparkles, Clock, BookOpen } from "lucide-react";
import { markNotulensiRead } from "@/actions/acara";

interface NotulensiCardProps {
  meetingId?: string;
  title?: string;
  notes?: string | null;
  date?: Date | string;
  isRead?: boolean;
}

export function NotulensiCard({
  meetingId,
  title = "Notulensi Acara & Koordinasi",
  notes,
  date,
  isRead = false,
}: NotulensiCardProps) {
  const [hasRead, setHasRead] = useState(isRead);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleMarkAsRead = async () => {
    if (!meetingId) {
      setHasRead(true);
      setMessage("Notulensi telah ditandai dibaca!");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await markNotulensiRead(meetingId);
      if (res.success) {
        setHasRead(true);
        setMessage(res.message);
      } else {
        setMessage(res.message);
      }
    } catch {
      setMessage("Gagal menandai notulensi dibaca.");
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = date
    ? new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : "Terbaru";

  return (
    <section className="card-solid bg-card p-4 sm:p-5 shadow-sm space-y-3">
      {/* Header Notulensi */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">{title}</h3>
            <p className="text-[11px] text-ink-muted">
              Catatan Rapat Koordinasi &amp; Briefing Teknis
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-ink-secondary text-[11px] font-semibold">
          {formattedDate}
        </span>
      </div>

      {/* Pesan Feedback */}
      {message && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          {message}
        </div>
      )}

      {/* Konten Isi Notulensi */}
      <div className="p-3.5 rounded-lg bg-surface-container-low/60 border border-edge space-y-2 text-xs text-ink-secondary leading-relaxed">
        <div className="flex items-center justify-between text-ink font-semibold text-xs">
          <span>Poin Penting Kesepakatan:</span>
          <span className="text-[11px] text-ink-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Notulensi Resmi</span>
          </span>
        </div>

        {notes ? (
          <p className="whitespace-pre-line text-ink leading-relaxed">
            {notes}
          </p>
        ) : (
          <ul className="space-y-1.5 list-disc list-inside text-ink text-xs pl-0.5">
            <li>Kunci Lab Komputer 2 sudah diserahterimakan dari pihak Waka Sarpras.</li>
            <li>Konsumsi 40 kotak snack dan piagam sertifikat siap diambil H-1 siang.</li>
            <li>Instalasi Node.js 20 LTS &amp; VS Code di 35 PC lab sudah 100% selesai.</li>
          </ul>
        )}
      </div>

      {/* Tombol Aksi Konfirmasi Baca Notulensi */}
      {hasRead ? (
        <div className="h-11 min-h-[44px] w-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          <span>Notulensi Sudah Dibaca (+5 XP Telah Diklaim)</span>
        </div>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={handleMarkAsRead}
          className="min-h-[44px] h-11 w-full bg-card hover:bg-surface-container-low text-primary border border-primary/30 hover:border-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>
            {isLoading
              ? "Menyimpan..."
              : "Tandai Notulensi Dibaca (+5 Poin)"}
          </span>
        </button>
      )}
    </section>
  );
}
