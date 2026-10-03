"use client";

import React, { useState } from "react";
import { FileText, CheckCircle2, Sparkles, Clock, Edit3 } from "lucide-react";
import { markNotulensiRead } from "@/actions/acara";
import { Role } from "@prisma/client";
import { EditNotulensiModal } from "./EditNotulensiModal";

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
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4" />
            </div>
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
                className="h-8 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Tulis / Edit Notulensi"
              >
                <Edit3 className="h-3.5 w-3.5" />
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

          {notes && notes.trim() !== "" ? (
            <p className="whitespace-pre-line text-ink leading-relaxed">
              {notes}
            </p>
          ) : (
            <div className="py-2 text-center text-ink-muted text-xs italic">
              Belum ada notulensi untuk rapat ini.
            </div>
          )}
        </div>

        {/* Tombol Aksi Konfirmasi Baca Notulensi */}
        {notes && notes.trim() !== "" && (
          hasRead ? (
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
          )
        )}
      </section>

      {/* Modal Dialog Edit Notulensi */}
      {eventId && (
        <EditNotulensiModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          eventId={eventId}
          meetingId={meetingId}
          initialNotes={notes}
          eventTitle={title}
          onSuccess={(newNotes) => setNotes(newNotes)}
        />
      )}
    </>
  );
}
