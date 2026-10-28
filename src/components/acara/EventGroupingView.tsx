"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Role, TargetAudience } from "@prisma/client";
import {
  Calendar,
  Clock,
  ArrowRight,
  ListTodo,
  Folder,
  QrCode,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { EventDetailData, NestedMeetingData } from "./EventDetailCard";
import { getTargetAudienceBadge } from "@/utils/audience";
import { formatEventSchedule, getEventTimeStatus } from "@/utils/eventStatus";

const MeetingQrModal = dynamic(
  () => import("@/components/home/MeetingQrModal").then((mod) => mod.MeetingQrModal),
  { ssr: false }
);

interface EventGroupingViewProps {
  events: EventDetailData[];
  independentMeetings?: NestedMeetingData[];
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
}

export function EventGroupingView({
  events,
  independentMeetings = [],
  currentUser,
}: EventGroupingViewProps) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const isOfficer =
    currentUser.role === Role.ADMIN || currentUser.role === Role.OPERATOR;

  const handleOpenQr = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setIsQrModalOpen(true);
  };

  const hasContent = events.length > 0 || independentMeetings.length > 0;

  if (!hasContent) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-card border border-edge space-y-3 shadow-xs">
        <Calendar className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-ink">
          Belum Ada Kegiatan atau Rapat Terjadwal
        </h3>
        <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
          Agenda kegiatan dan rapat yang ditargetkan untuk Anda akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. DAFTAR PROGRAM KERJA BESAR (PARENT MEGA-CARDS)       */}
      {/* ======================================================== */}
      {events.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-ink tracking-wider uppercase">
              Program Kerja &amp; Kegiatan Utama ({events.length})
            </h3>
            <span className="text-[11px] text-ink-muted">
              Contextual Grouping
            </span>
          </div>

          <div className="space-y-4">
            {events.map((event) => {
              const timeStatus = getEventTimeStatus(event.startDate, event.endDate);
              const scheduleText = formatEventSchedule(
                event.startDate,
                event.endDate,
                { shortMonth: false, includeDayName: true }
              );

              const allTasks = event.sections.flatMap((s) => s.tasks);
              const completedTasks = allTasks.filter((t) => t.status === "DONE").length;
              const totalTasks = allTasks.length;

              const audienceBadge = event.targetAudience
                ? getTargetAudienceBadge(event.targetAudience)
                : null;

              const childMeetings = event.meetings || [];

              return (
                <div
                  key={event.id}
                  className="bg-card border border-edge shadow-xs rounded-2xl p-5 space-y-4 transition-all"
                >
                  {/* Header Parent Mega-Card */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Badge Metadata Bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            timeStatus === "COMPLETED"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
                              : timeStatus === "ACTIVE"
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                              : "bg-surface-container text-ink-secondary border border-edge"
                          }`}
                        >
                          {timeStatus === "COMPLETED"
                            ? "✓ Selesai"
                            : timeStatus === "ACTIVE"
                            ? "Sedang Berlangsung"
                            : "Mendatang"}
                        </span>

                        {/* Privacy Target Audience Badge */}
                        {audienceBadge && event.targetAudience !== TargetAudience.ALL && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${audienceBadge.badgeClass}`}
                          >
                            {audienceBadge.label}
                          </span>
                        )}

                        <span className="text-[11px] text-ink-muted flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{scheduleText}</span>
                        </span>
                      </div>

                      {/* Judul Acara Induk */}
                      <Link
                        href={`/acara/${event.id}`}
                        className="text-base font-bold text-ink hover:text-primary transition-colors block"
                      >
                        {event.title}
                      </Link>

                      {/* Deskripsi Acara */}
                      {event.description && (
                        <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Quick Link Drive */}
                    {event.driveUrl && (
                      <a
                        href={event.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3 rounded-xl bg-surface-container-low text-ink-secondary border border-edge text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-surface-container transition-colors shrink-0"
                        title="Buka Folder Google Drive Acara"
                      >
                        <Folder className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Google Drive</span>
                      </a>
                    )}
                  </div>

                  {/* Ringkasan Tugas Kepanitiaan jika ada */}
                  {totalTasks > 0 && (
                    <div className="flex items-center justify-between text-xs text-ink-muted pt-1 border-t border-edge">
                      <span className="flex items-center gap-1.5">
                        <ListTodo className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>{event.sections.length} Seksi Panitia</span>
                      </span>
                      <span className="font-semibold text-ink">
                        {completedTasks} / {totalTasks} Tugas Selesai
                      </span>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* THE NESTED CHILDREN: Meetings inside Parent Card        */}
                  {/* ======================================================== */}
                  {childMeetings.length > 0 && (
                    <div className="pt-2 space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Sesi Rapat Koordinasi ({childMeetings.length})</span>
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          Terkait Kegiatan Ini
                        </span>
                      </div>

                      <div className="space-y-2">
                        {childMeetings.map((meeting) => {
                          const meetingDateStr = new Date(meeting.date).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          );

                          const mAudienceBadge = meeting.targetAudience
                            ? getTargetAudienceBadge(meeting.targetAudience)
                            : null;

                          return (
                            <div
                              key={meeting.id}
                              className="bg-surface-container-low border border-edge/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              {/* Info Rapat Anak */}
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-ink truncate">
                                    {meeting.title}
                                  </span>

                                  {mAudienceBadge &&
                                    meeting.targetAudience !== TargetAudience.ALL && (
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${mAudienceBadge.badgeClass}`}
                                      >
                                        {mAudienceBadge.label}
                                      </span>
                                    )}

                                  {meeting.isAttended ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                      <span>Hadir</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-ink-muted border border-edge">
                                      Belum Presensi
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-ink-muted flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                                  <span>{meetingDateStr} WIB</span>
                                </p>

                                {meeting.notes && (
                                  <p className="text-[11px] text-ink-secondary line-clamp-1 italic">
                                    "{meeting.notes}"
                                  </p>
                                )}
                              </div>

                              {/* Aksi Khusus Pengurus: Tampilkan QR Rapat */}
                              {isOfficer && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenQr(meeting.id)}
                                  className="h-8 px-3 rounded-lg bg-card hover:bg-surface-container text-ink border border-edge text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                  title="Tampilkan QR Presensi Sesi Rapat"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                  <span>Tampilkan QR</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer Tombol Navigasi Buka Detail */}
                  <div className="pt-2 flex items-center justify-end">
                    <Link
                      href={`/acara/${event.id}`}
                      className="h-10 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold inline-flex items-center gap-1.5 border border-edge transition-colors"
                    >
                      <span>Buka Workspace &amp; Detail Acara</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. RAPAT MANDIRI (INDEPENDENT MEETINGS: eventId === null) */}
      {/* ======================================================== */}
      {independentMeetings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-ink tracking-wider uppercase">
              Rapat Mandiri &amp; Pleno Umum ({independentMeetings.length})
            </h3>
            <span className="text-[11px] text-ink-muted">
              Sesi Terpisah Tanpa Proker
            </span>
          </div>

          <div className="space-y-3">
            {independentMeetings.map((meeting) => {
              const meetingDateStr = new Date(meeting.date).toLocaleDateString(
                "id-ID",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              const audienceBadge = meeting.targetAudience
                ? getTargetAudienceBadge(meeting.targetAudience)
                : null;

              return (
                <div
                  key={meeting.id}
                  className="bg-card border border-edge shadow-xs rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink truncate">
                        {meeting.title}
                      </span>

                      {/* Privacy Badge */}
                      {audienceBadge && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${audienceBadge.badgeClass}`}
                        >
                          {audienceBadge.label}
                        </span>
                      )}

                      {/* Attendance Badge */}
                      {meeting.isAttended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Sudah Hadir</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-ink-muted border border-edge">
                          Belum Presensi
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink-muted flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{meetingDateStr} WIB</span>
                    </p>

                    {meeting.notes && (
                      <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                        {meeting.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isOfficer && (
                      <button
                        type="button"
                        onClick={() => handleOpenQr(meeting.id)}
                        className="h-9 px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink border border-edge text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Tampilkan QR Presensi Rapat"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Tampilkan QR</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Dialog QR Code Pengurus */}
      {selectedMeetingId && (
        <MeetingQrModal
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            setSelectedMeetingId(null);
          }}
          meetingId={selectedMeetingId}
        />
      )}
    </div>
  );
}
