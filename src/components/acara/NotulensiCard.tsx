"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { FileText, CheckCircle2, Clock, Edit3 } from "lucide-react";
import { markNotulensiRead } from "@/actions/acara";
import { Role } from "@prisma/client";

const EditNotulensiModal = dynamic(
  () => import("./EditNotulensiModal").then((mod) => mod.EditNotulensiModal),
  { ssr: false }
);

interface NotulensiCardProps {
  eventId?: string;
  meetingId?: string;
  title?: string;
  notes?: string | null;
  date?: Date | string;
  isRead?: boolean;
  currentUserRole?: Role;
}

export function NotulensiCard({
  eventId,
  meetingId,
  title = "Notulensi Acara & Koordinasi",
  notes: initialNotes,
  date,
  isRead = false,
  currentUserRole,
}: NotulensiCardProps) {
  const [notes, setNotes] = useState<string | null | undefined>(initialNotes);
  const [hasRead, setHasRead] = useState(isRead);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canEdit =
    currentUserRole === Role.ADMIN || currentUserRole === Role.OPERATOR;

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
    <>
      <section className="card-solid bg-card p-4 sm:p-5 shadow-sm space-y-3">
        {/* Header Notulensi */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink truncate">{title}</h3>
              <p className="text-[11px] text-ink-muted">
                Catatan Rapat Koordinasi &amp; Briefing Teknis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && eventId && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-ink border border-edge text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tulis / Edit Notulensi"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Edit Notulensi</span>
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-ink-secondary text-[11px] font-semibold">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Pesan Feedback */}
        {message && (
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            {message}
          </div>
        )}

        {/* Konten Isi Notulensi */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-edge space-y-2 text-xs text-ink-secondary leading-relaxed">
          <div className="flex items-center justify-between text-ink font-semibold text-xs">
            <span>Poin Penting Kesepakatan:</span>
            <span className="text-[11px] text-ink-muted flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Notulensi Resmi</span>
            </span>
          </div>

          <div className="whitespace-pre-line font-sans text-ink">
            {notes || "Belum ada notulensi atau ringkasan rapat yang dicatat untuk acara ini."}
          </div>
        </div>

        {/* Action Mark as Read */}
        <div className="flex items-center justify-end pt-1">
          {!hasRead ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleMarkAsRead}
              className="h-9 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isLoading ? "Menandai..." : "Tandai Telah Dibaca"}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Sudah Dibaca</span>
            </span>
          )}
        </div>
      </section>

      {/* Modal Edit Notulensi */}
      {eventId && (
        <EditNotulensiModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          eventId={eventId}
          eventTitle={title}
          initialNotes={notes}
          onSuccess={(newNotes) => setNotes(newNotes)}
        />
      )}
    </>
  );
}
