"use client";

import {
  Clock,
  MapPin,
  Folder,
  ExternalLink,
  CheckCircle2,
  Hourglass,
  UserPlus,
  MessageSquare,
  Layers,
  Share2,
} from "lucide-react";
import {
  generateWhatsAppLink,
  formatEventBroadcastMessage,
} from "@/utils/whatsappShare";

export interface SectionMember {
  id: string;
  name: string;
  classGrade?: string | null;
  image?: string | null;
}

export interface SectionPJ {
  id: string;
  name: string;
  classGrade?: string | null;
  image?: string | null;
}

export interface EventDetailData {
  id: string;
  title: string;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  driveUrl?: string | null;
  notulensiText?: string | null;
  sections: {
    id: string;
    name: string;
    pjId?: string | null;
    pj?: SectionPJ | null;
    members?: SectionMember[];
    tasks: {
      id: string;
      title: string;
      description?: string | null;
      status: "TODO" | "IN_PROGRESS" | "DONE";
      isSOP: boolean;
      dueDate?: Date | string | null;
      assigneeId?: string | null;
      assignee?: { id: string; name: string } | null;
      verifiedById?: string | null;
      verifiedBy?: { id: string; name: string } | null;
      pointsAwarded?: boolean;
    }[];
  }[];
}

interface EventDetailCardProps {
  event: EventDetailData;
  onOpenDriveModal?: () => void;
}

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function EventDetailCard({
  event,
  onOpenDriveModal,
}: EventDetailCardProps) {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = INDONESIAN_MONTHS[startDate.getMonth()];
  const startYear = startDate.getFullYear();

  const formattedHours = startDate.getHours().toString().padStart(2, "0");
  const formattedMinutes = startDate.getMinutes().toString().padStart(2, "0");
  const timeString = `${formattedHours}:${formattedMinutes} WIB`;

  const isSingleDay = startDate.toDateString() === endDate.toDateString();
  const hasSections = event.sections.length > 0;
  const isRapat = !hasSections || isSingleDay;

  const dateRangeString =
    startDay === endDay
      ? `${startDay} ${startMonth} ${startYear} • ${timeString}`
      : `${startDay} - ${endDay} ${startMonth} ${startYear} • ${timeString}`;

  // Hitung agregat metrik tugas secara dinamis & real-time dari database
  const allTasks = event.sections.flatMap((sec) => sec.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "DONE").length;
  const terverifikasiCount = allTasks.filter((t) => Boolean(t.verifiedById)).length;
  const sedangBerjalanCount = allTasks.filter(
    (t) => Boolean(t.assigneeId) && !t.verifiedById
  ).length;
  const butuhRelawanCount = allTasks.filter((t) => !t.assigneeId).length;

  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleShareWA = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const message = formatEventBroadcastMessage(
      {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        description: event.description,
        location: "Lab Komputer / Ruang Ekskul Saba",
      },
      origin
    );

    const waLink = generateWhatsAppLink("", message);
    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3" id="workspace-detail">
      {/* Kartu Utama Workspace Kegiatan */}
      <section className="card-solid bg-card p-4 sm:p-5 shadow-sm space-y-4 rounded-2xl border border-edge">
        {/* Tag & ID Kegiatan */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isRapat
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60"
                    : "bg-red-50 dark:bg-red-950/40 text-primary border border-red-200 dark:border-red-900/60"
                }`}
              >
                {isRapat ? (
                  <MessageSquare className="h-3.5 w-3.5" />
                ) : (
                  <Layers className="h-3.5 w-3.5" />
                )}
                <span>{isRapat ? "Rapat / Agenda Singkat" : "Program Kerja & Workspace"}</span>
              </span>

              <span className="text-[11px] text-ink-muted">
                ID: EVT-{event.id.slice(-6).toUpperCase()}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-subtle text-success text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Aktif
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-ink leading-snug">
            {event.title}
          </h1>

          <div className="space-y-1 pt-0.5">
            <p className="text-xs text-ink-secondary flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-ink-muted shrink-0" />
              <span>{dateRangeString}</span>
            </p>
            <p className="text-xs text-ink-secondary flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-ink-muted shrink-0" />
              <span className="truncate">
                {event.description || "Laboratorium Komputer & Ruang Eksploit"}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons: WhatsApp Share & Google Drive */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {/* Tombol 1-Klik Broadcast WA */}
          <button
            type="button"
            onClick={handleShareWA}
            className="flex-1 h-11 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>📱 Bagikan ke Grup WA</span>
          </button>

          {/* Tombol Tautan Google Drive Acara */}
          {event.driveUrl ? (
            <a
              href={event.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:w-auto h-11 min-h-[44px] px-4 bg-div-technopreneurship-bg-light dark:bg-emerald-950/40 text-div-technopreneurship dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors border border-emerald-200 dark:border-emerald-800 shadow-sm"
            >
              <Folder className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Drive Acara</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : !isRapat ? (
            <button
              type="button"
              onClick={onOpenDriveModal}
              className="sm:w-auto h-11 min-h-[44px] px-4 bg-surface-container-low hover:bg-surface-container text-ink-secondary rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-colors border border-edge shadow-sm cursor-pointer"
            >
              <Folder className="h-4 w-4 text-amber-500" />
              <span>Drive Belum Diatur</span>
            </button>
          ) : null}
        </div>

        {/* Indikator Progres Persiapan (Khusus Kegiatan yang Memiliki Tugas) */}
        {totalTasks > 0 && (
          <div className="space-y-2 pt-1 border-t border-edge">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink font-medium">Total Progres Persiapan</span>
              <span className="text-primary font-bold">
                {completedTasks}/{totalTasks} Tugas Selesai ({progressPercentage}%)
              </span>
            </div>

            <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden border border-edge">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>Target Kesiapan: 100% Selesai</span>
              <span>{totalTasks - completedTasks} Tugas Menunggu</span>
            </div>
          </div>
        )}
      </section>

      {/* Quick Stats Strip Dinamis (Real-Time dari Database) */}
      {totalTasks > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-edge shadow-sm shrink-0 text-xs">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-ink-secondary">
              <strong className="text-ink font-bold font-mono">{terverifikasiCount}</strong>{" "}
              Terverifikasi PJ
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-edge shadow-sm shrink-0 text-xs">
            <Hourglass className="h-4 w-4 text-warning" />
            <span className="text-ink-secondary">
              <strong className="text-ink font-bold font-mono">{sedangBerjalanCount}</strong>{" "}
              Sedang Berjalan
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-edge shadow-sm shrink-0 text-xs">
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="text-ink-secondary">
              <strong className="text-ink font-bold font-mono">{butuhRelawanCount}</strong>{" "}
              Butuh Relawan
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
