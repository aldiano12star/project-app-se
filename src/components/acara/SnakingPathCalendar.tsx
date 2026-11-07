"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Folder,
  ListTodo,
  Radio,
  Zap,
  Check,
  MessageSquare,
  Flag,
  X,
  QrCode,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import {
  getLocalDateString,
  getJakartaDateParts,
  formatEventSchedule,
  SHORT_MONTHS,
  FULL_MONTHS,
  INDONESIAN_DAYS,
} from "@/utils/eventStatus";
import { Role, TargetAudience } from "@prisma/client";
import { NestedMeetingData } from "./EventDetailCard";
import { getTargetAudienceBadge } from "@/utils/audience";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  targetAudience?: TargetAudience;
  targetUserIds?: string[];
  isIndependentMeeting?: boolean;
  driveUrl?: string | null;
  notulensiText?: string | null;
  status?: "COMPLETED" | "ACTIVE" | "UPCOMING";
  sectionsCount?: number;
  completedTasksCount?: number;
  totalTasksCount?: number;
  meetings?: NestedMeetingData[];
}

interface SnakingPathCalendarProps {
  currentYear: number;
  currentMonthIndex: number; // 0 = Jan, 11 = Des
  onMonthChange: (newMonthIndex: number, newYear: number) => void;
  events: CalendarEventItem[];
  currentUserRole?: Role;
  onOpenQr?: (meetingId: string) => void;
  onEditEvent?: (item: CalendarEventItem) => void;
  onEditMeeting?: (meeting: NestedMeetingData) => void;
  selectedDate?: Date | null;
  onSelectDate?: (date: Date, dayEvents: CalendarEventItem[]) => void;
  onSelectEvent?: (event: CalendarEventItem) => void;
  onSelectMultipleEvents?: (date: Date, dayEvents: CalendarEventItem[]) => void;
}

type TimelineEntry =
  | {
      type: "TODAY_CHECKPOINT";
      id: "today-checkpoint";
      date: Date;
      dateStr: string;
      dayNumber: number;
      dayName: string;
      dateLabel: string;
    }
  | {
      type: "EVENT";
      id: string;
      event: CalendarEventItem;
    };

export function SnakingPathCalendar({
  currentYear,
  currentMonthIndex,
  onMonthChange,
  events,
  currentUserRole,
  onOpenQr,
  onEditEvent,
  onEditMeeting,
}: SnakingPathCalendarProps) {
  const isOfficer =
    currentUserRole === Role.ADMIN || currentUserRole === Role.OPERATOR;

  // State untuk Month-Year Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(currentYear);

  useBodyScrollLock(isPickerOpen);

  // Ambil data hari ini berbasis zona waktu Jakarta (WIB)
  const todayJakarta = getJakartaDateParts(new Date());
  const todayStr = todayJakarta.dateString;
  const isCurrentMonthToday =
    currentYear === todayJakarta.year &&
    currentMonthIndex === todayJakarta.monthIndex;
  const todayDateNumber = todayJakarta.day;

  // Tentukan rentang string tanggal untuk bulan yang dipilih (YYYY-MM-DD)
  const monthStartStr = `${currentYear}-${String(
    currentMonthIndex + 1
  ).padStart(2, "0")}-01`;
  const lastDayOfCurMonth = new Date(
    currentYear,
    currentMonthIndex + 1,
    0
  ).getDate();
  const monthEndStr = `${currentYear}-${String(
    currentMonthIndex + 1
  ).padStart(2, "0")}-${String(lastDayOfCurMonth).padStart(2, "0")}`;

  // Filter & urutkan agenda kronologis pada rentang bulan terpilih
  const eventsInMonth = events
    .filter((ev) => {
      const startStr = getLocalDateString(ev.startDate);
      const endStr = getLocalDateString(ev.endDate);
      return startStr <= monthEndStr && endStr >= monthStartStr;
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  // Cek apakah ada agenda yang sedang berlangsung HARI INI
  const hasAnyEventToday = eventsInMonth.some((ev) => {
    const startStr = getLocalDateString(ev.startDate);
    const endStr = getLocalDateString(ev.endDate);
    return startStr <= todayStr && endStr >= todayStr;
  });

  // Susun daftar entri timeline (1 Kartu = 1 Node Terikat)
  const timelineEntries: TimelineEntry[] = [];

  if (isCurrentMonthToday && !hasAnyEventToday) {
    let todayInserted = false;
    eventsInMonth.forEach((ev) => {
      const evStartStr = getLocalDateString(ev.startDate);
      if (!todayInserted && evStartStr > todayStr) {
        timelineEntries.push({
          type: "TODAY_CHECKPOINT",
          id: "today-checkpoint",
          date: new Date(`${todayStr}T00:00:00+07:00`),
          dateStr: todayStr,
          dayNumber: todayDateNumber,
          dayName: INDONESIAN_DAYS[todayJakarta.dayOfWeek],
          dateLabel: `${todayDateNumber} ${SHORT_MONTHS[todayJakarta.monthIndex]}`,
        });
        todayInserted = true;
      }
      timelineEntries.push({
        type: "EVENT",
        id: ev.id,
        event: ev,
      });
    });

    if (!todayInserted) {
      timelineEntries.push({
        type: "TODAY_CHECKPOINT",
        id: "today-checkpoint",
        date: new Date(`${todayStr}T00:00:00+07:00`),
        dateStr: todayStr,
        dayNumber: todayDateNumber,
        dayName: INDONESIAN_DAYS[todayJakarta.dayOfWeek],
        dateLabel: `${todayDateNumber} ${SHORT_MONTHS[todayJakarta.monthIndex]}`,
      });
    }
  } else {
    eventsInMonth.forEach((ev) => {
      timelineEntries.push({
        type: "EVENT",
        id: ev.id,
        event: ev,
      });
    });
  }

  // Navigasi Bulan Cepat
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      onMonthChange(11, currentYear - 1);
    } else {
      onMonthChange(currentMonthIndex - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      onMonthChange(0, currentYear + 1);
    } else {
      onMonthChange(currentMonthIndex + 1, currentYear);
    }
  };

  const handleResetToCurrentMonth = () => {
    const nowParts = getJakartaDateParts(new Date());
    onMonthChange(nowParts.monthIndex, nowParts.year);
    setIsPickerOpen(false);
  };

  const handleSelectMonthYear = (monthIdx: number, year: number) => {
    onMonthChange(monthIdx, year);
    setIsPickerOpen(false);
  };

  return (
    <section className="card-solid bg-card p-4 sm:p-5 shadow-sm space-y-5 relative overflow-hidden rounded-2xl border border-edge">
      {/* Header Smart Circuit Trail & Navigasi Bulan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-edge pb-3.5">
        <h2 className="text-base font-bold text-ink tracking-tight">
          Timeline Agenda Kegiatan
        </h2>

        {/* Tombol Pengalih Bulan (< [📅 Bulan Tahun] >) */}
        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 border border-edge shadow-xs self-start sm:self-auto">
          <button
            type="button"
            aria-label="Bulan Sebelumnya"
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:bg-card hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Tombol Interaktif Pembuka Month-Year Picker Modal */}
          <button
            type="button"
            onClick={() => {
              setPickerYear(currentYear);
              setIsPickerOpen(true);
            }}
            title="Buka Pemilih Bulan & Tahun Cepat"
            className="text-xs font-bold text-ink px-3 py-1.5 rounded-xl border border-edge bg-surface-container-low hover:bg-surface-container transition-colors select-none min-w-32.5 text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
          >
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>
              {FULL_MONTHS[currentMonthIndex]} {currentYear}
            </span>
          </button>

          <button
            type="button"
            aria-label="Bulan Berikutnya"
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:bg-card hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KONDISI 1: Belum ada agenda sama sekali di bulan terpilih */}
      {eventsInMonth.length === 0 && !isCurrentMonthToday ? (
        <div className="py-12 px-4 text-center space-y-4 max-w-sm mx-auto">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-surface-container-low border border-dashed border-edge/80 animate-spin-slow" />
            <div className="h-12 w-12 rounded-2xl bg-surface-container border border-edge flex items-center justify-center shadow-xs text-ink-muted">
              <Zap className="h-5 w-5 stroke-[1.5]" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink">
              Belum ada agenda terencana di bulan ini
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Tidak ada kegiatan atau rapat yang terdaftar pada bulan{" "}
              <span className="font-semibold text-ink">
                {FULL_MONTHS[currentMonthIndex]} {currentYear}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetToCurrentMonth}
            className="h-9 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold border border-edge transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Lihat Bulan Ini</span>
          </button>
        </div>
      ) : eventsInMonth.length === 0 && isCurrentMonthToday ? (
        /* Kasus Khusus: Bulan ini belum ada acara, hanya penanda posisi Hari Ini */
        <div className="space-y-6 py-2">
          <div className="relative pl-7 sm:pl-9">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="h-5.5 w-5.5 rounded-full bg-primary ring-4 ring-primary/20 shadow-sm flex items-center justify-center text-white">
                <Radio className="h-2.5 w-2.5" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-edge bg-surface-container-low/60 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <span className="text-xs font-medium text-ink">
                📍 Hari Ini ({todayDateNumber}{" "}
                {SHORT_MONTHS[todayJakarta.monthIndex]} {todayJakarta.year}) —
                Tidak ada agenda kegiatan
              </span>
              <span className="text-[11px] text-ink-muted">
                {INDONESIAN_DAYS[todayJakarta.dayOfWeek]}, {todayDateNumber}{" "}
                {FULL_MONTHS[todayJakarta.monthIndex]} {todayJakarta.year}
              </span>
            </div>
          </div>

          <div className="py-6 px-4 text-center space-y-2 max-w-sm mx-auto bg-surface-container-low/40 rounded-xl border border-dashed border-edge">
            <Calendar className="h-5 w-5 text-ink-muted mx-auto" />
            <h4 className="text-xs font-bold text-ink">
              Belum ada agenda terencana di bulan ini
            </h4>
            <p className="text-[11px] text-ink-muted">
              Agenda kegiatan baru akan langsung terhubung ke jalur sirkuit ini.
            </p>
          </div>
        </div>
      ) : (
        /* KONDISI 2: Timeline Vertikal Terpadu (1 Kartu = 1 Node Terikat, Garis Solid) */
        <div className="relative pl-6 sm:pl-8 space-y-4 pt-1 select-none">
          {/* Garis Alur Vertikal Sirkuit Solid */}
          <div className="absolute left-2.75 sm:left-3.75 top-4 bottom-4 w-0.5 bg-edge pointer-events-none" />

          {timelineEntries.map((entry) => {
            if (entry.type === "TODAY_CHECKPOINT") {
              return (
                <div key={entry.id} className="relative group">
                  {/* Node Checkpoint Hari Ini */}
                  <div className="absolute -left-5.75 sm:-left-6.75 top-5 -translate-y-1/2 z-20">
                    <div className="relative h-5.5 w-5.5 rounded-full bg-primary text-white shadow-sm ring-4 ring-primary/20 flex items-center justify-center">
                      <Radio className="h-2.5 w-2.5" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-edge bg-surface-container-low/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink leading-snug">
                        📍 Hari Ini ({entry.dayNumber}{" "}
                        {SHORT_MONTHS[todayJakarta.monthIndex]}{" "}
                        {currentYear}) — Tidak ada agenda kegiatan
                      </span>
                    </div>

                    <span className="text-[11px] text-ink-muted font-medium shrink-0">
                      {entry.dayName}, {entry.dayNumber}{" "}
                      {FULL_MONTHS[todayJakarta.monthIndex]} {currentYear}
                    </span>
                  </div>
                </div>
              );
            }

            // Entry Acara: 1 Kartu = 1 Node Terikat
            const ev = entry.event;
            const now = new Date();
            const startObj = new Date(ev.startDate);
            const endObj = new Date(ev.endDate);

            // Logika Status Ketat Sesuai Spesifikasi
            const isFinished = now > endObj;
            const isOngoing = now >= startObj && now <= endObj;
            const isMultiDay =
              startObj.toDateString() !== endObj.toDateString();

            const startStr = getLocalDateString(ev.startDate);
            const endStr = getLocalDateString(ev.endDate);
            const isTodayEvent = startStr <= todayStr && endStr >= todayStr;

            const formattedSchedule = formatEventSchedule(
              ev.startDate,
              ev.endDate,
              { shortMonth: true }
            );

            const hasSections = (ev.sectionsCount ?? 0) > 0;
            const totalTasks = ev.totalTasksCount ?? 0;
            const completedTasks = ev.completedTasksCount ?? 0;
            const progressPct =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            const isIndependent = Boolean(ev.isIndependentMeeting);
            const childMeetings = ev.meetings || [];
            const isParentMegaCard = !isIndependent && (isMultiDay || childMeetings.length > 0);
            const audienceBadge = ev.targetAudience
              ? getTargetAudienceBadge(ev.targetAudience)
              : null;

            // Diferensiasi Border & Background Kartu Kegiatan
            const cardStyleClass = isFinished
              ? "border border-emerald-500/25 bg-card"
              : isParentMegaCard
              ? "border-2 border-slate-300 dark:border-[#27344A] bg-card shadow-sm"
              : isMultiDay
              ? "border border-indigo-500/40 bg-card shadow-sm"
              : "border border-edge bg-card shadow-xs";

            const todayAccentClass = isTodayEvent ? "ring-2 ring-primary/30" : "";

            return (
              <div key={ev.id} className="relative group">
                {/* TITIK CHECKPOINT NODE (1 KARTU = 1 NODE TERIKAT) */}
                <div className="absolute -left-5.75 sm:-left-6.75 top-5 -translate-y-1/2 z-20">
                  {isFinished ? (
                    /* 1. Selesai (Past Event): Lingkaran Hijau Emerald dengan Ikon Check */
                    <div className="h-5.5 w-5.5 rounded-full bg-emerald-500 text-slate-950 border border-emerald-400 flex items-center justify-center shadow-xs">
                      <Check className="h-3 w-3 stroke-3" />
                    </div>
                  ) : isParentMegaCard || isMultiDay ? (
                    /* 2. Proker Multi-Hari / Mega-Card: Lingkaran Ungu Indigo dengan Ikon Flag */
                    <div
                      className={`relative h-5.5 w-5.5 rounded-full bg-indigo-600 text-white border-2 border-indigo-400 flex items-center justify-center shadow-md ${
                        isOngoing || isTodayEvent
                          ? "ring-4 ring-indigo-500/25 animate-pulse"
                          : ""
                      }`}
                    >
                      <Flag className="h-2.5 w-2.5 fill-white" />
                    </div>
                  ) : (
                    /* 3. Agenda Singkat / Rapat Mandiri: Lingkaran Biru/Cyan dengan Ikon Kilat Zap */
                    <div
                      className={`relative h-5.5 w-5.5 rounded-full bg-cyan-500 text-slate-950 border-2 border-cyan-300 flex items-center justify-center shadow-md ${
                        isOngoing || isTodayEvent
                          ? "ring-4 ring-cyan-500/25 animate-pulse"
                          : ""
                      }`}
                    >
                      <Zap className="h-2.5 w-2.5 fill-slate-950" />
                    </div>
                  )}
                </div>

                {/* KONTEN KARTU KEGIATAN */}
                <div
                  className={`p-5 rounded-2xl transition-all space-y-3.5 ${cardStyleClass} ${todayAccentClass}`}
                >
                  {/* Header Tag & Tanggal */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {/* Status Badge (Cyan: Berlangsung, Emerald: Selesai, Slate: Mendatang) */}
                        {isFinished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                            <span>✓ Selesai</span>
                          </span>
                        ) : isOngoing ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-xs">
                            <Radio className="h-2.5 w-2.5 text-cyan-400 animate-pulse" />
                            <span>Sedang Berlangsung</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-ink-secondary border border-edge">
                            <Clock className="h-2.5 w-2.5 text-ink-muted" />
                            <span>Mendatang</span>
                          </span>
                        )}

                        {/* Tipe Acara */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isIndependent
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : isParentMegaCard || isMultiDay
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}
                        >
                          {isIndependent ? (
                            <MessageSquare className="h-3 w-3" />
                          ) : isParentMegaCard || isMultiDay ? (
                            <Layers className="h-3 w-3" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                          <span>
                            {isIndependent
                              ? "Rapat Mandiri"
                              : isParentMegaCard
                              ? "Program Kerja Utama"
                              : isMultiDay
                              ? "Proker / Multi-Hari"
                              : "Agenda Singkat"}
                          </span>
                        </span>

                        {/* Privacy Target Audience Badge */}
                        {audienceBadge && ev.targetAudience !== TargetAudience.ALL && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${audienceBadge.badgeClass}`}
                          >
                            {audienceBadge.label}
                          </span>
                        )}

                        {/* Penanda Insentif Poin Khusus Acara Hari Ini */}
                        {isTodayEvent && !isFinished && (
                          <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 text-[10px] font-extrabold shadow-xs transition-colors cursor-pointer"
                            title="Lakukan presensi kehadiran kegiatan hari ini untuk mendapatkan +10 XP"
                          >
                            <span>⚡ Hadiri Presensi (+10 XP)</span>
                          </Link>
                        )}

                        <span className="font-semibold text-ink text-[11px] flex items-center gap-1">
                          <Clock className="h-3 w-3 text-ink-muted" />
                          <span>{formattedSchedule}</span>
                        </span>
                      </div>

                      {isIndependent ? (
                        <Link
                          href={`/acara/rapat/${ev.id}`}
                          className="text-base font-bold text-ink hover:text-primary transition-colors inline-block leading-snug"
                        >
                          {ev.title}
                        </Link>
                      ) : (
                        <Link
                          href={`/acara/${ev.id}`}
                          className="text-base font-bold text-ink hover:text-primary transition-colors inline-block leading-snug"
                        >
                          {ev.title}
                        </Link>
                      )}
                    </div>

                    {ev.driveUrl && (
                      <a
                        href={ev.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink-secondary border border-edge transition-colors shrink-0"
                        title="Buka Google Drive"
                      >
                        <Folder className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {/* Deskripsi Singkat */}
                  {ev.description && (
                    <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  )}

                  {/* Progress Bar Seksi / Tugas (Khusus Proker Induk) */}
                  {hasSections && totalTasks > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-ink-muted">
                        <span className="flex items-center gap-1">
                          <ListTodo className="h-3 w-3" />
                          <span>{ev.sectionsCount} Seksi Panitia</span>
                        </span>
                        <span className="font-semibold text-ink">
                          {completedTasks}/{totalTasks} Tugas ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* THE NESTED CHILDREN: Meetings inside Parent Mega-Card   */}
                  {/* ======================================================== */}
                  {childMeetings.length > 0 && !isIndependent && (
                    <div className="pt-2 space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Sesi Rapat Koordinasi ({childMeetings.length})</span>
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          Lihat Detail
                        </span>
                      </div>

                      <div className="space-y-2">
                        {childMeetings.map((meeting) => {
                          const mDateStr = new Date(meeting.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) + " WIB";
                          const mBadge = meeting.targetAudience
                            ? getTargetAudienceBadge(meeting.targetAudience)
                            : null;

                          return (
                            <div
                              key={meeting.id}
                              className="bg-surface-container-low border border-edge/70 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/acara/rapat/${meeting.id}`}
                                    className="text-xs font-bold text-ink hover:text-primary transition-colors truncate block"
                                  >
                                    {meeting.title}
                                  </Link>
                                  {mBadge && meeting.targetAudience !== TargetAudience.ALL && (
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${mBadge.badgeClass}`}
                                    >
                                      {mBadge.label}
                                    </span>
                                  )}
                                  {meeting.attendanceStatus === "HADIR" || (meeting.isAttended && !meeting.attendanceStatus) ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                      <span>Hadir</span>
                                    </span>
                                  ) : meeting.attendanceStatus === "ALPHA" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                                      <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                      <span>Alfa</span>
                                    </span>
                                  ) : meeting.attendanceStatus === "SAKIT" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                                      <span>Sakit</span>
                                    </span>
                                  ) : meeting.attendanceStatus === "IZIN" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                                      <span>Izin</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-ink-muted border border-edge">
                                      Belum Presensi
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-ink-muted flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                                  <span>{mDateStr}</span>
                                </p>
                                {meeting.notes && (
                                  <p className="text-[11px] text-ink-secondary line-clamp-1 italic">
                                    "{meeting.notes}"
                                  </p>
                                )}
                              </div>

                              {/* AKSI PENGURUS: NAKED EDIT & QR CODE */}
                              {isOfficer && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {onEditMeeting && (
                                    <button
                                      type="button"
                                      onClick={() => onEditMeeting(meeting)}
                                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                      title="Edit Sesi Rapat Ini"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}
                                  {onOpenQr && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenQr(meeting.id)}
                                      className="h-9 px-3 rounded-xl bg-card hover:bg-surface-container text-ink border border-edge text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-[0.98]"
                                      title="Tampilkan QR Presensi Sesi Rapat Ini"
                                    >
                                      <QrCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                      <span>QR</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tombol Aksi di Bawah Kartu */}
                  {isIndependent ? (
                    isOfficer && (
                      <div className="pt-1 flex items-center justify-end gap-1.5">
                        {onEditEvent && (
                          <button
                            type="button"
                            onClick={() => onEditEvent(ev)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Edit Rapat Mandiri Ini"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onOpenQr && (
                          <button
                            type="button"
                            onClick={() => onOpenQr(ev.id)}
                            className="h-9 px-3 rounded-xl bg-card hover:bg-surface-container text-ink border border-edge text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-[0.98]"
                            title="Tampilkan QR Presensi Sesi Rapat Ini"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Tampilkan QR</span>
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="pt-1 flex items-center justify-center gap-2 w-full">
                      <Link
                        href={`/acara/${ev.id}`}
                        className="flex-1 h-11 min-h-11 px-4 bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold rounded-xl flex items-center justify-center text-center gap-2 transition-colors border border-edge"
                      >
                        <span>Buka Workspace &amp; Kepanitiaan</span>
                        <ArrowRight className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                      </Link>
                      {isOfficer && onEditEvent && (
                        <button
                          type="button"
                          onClick={() => onEditEvent(ev)}
                          className="h-11 min-h-11 px-3.5 rounded-xl bg-card hover:bg-surface-container text-ink border border-edge text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-[0.98]"
                          title="Edit Program Kerja Ini"
                        >
                          <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DIALOG PEMILIH BULAN & TAHUN CEPAT (MONTH-YEAR PICKER) */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-card border border-edge shadow-2xl p-5 space-y-4">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-ink">
                  Pilih Bulan &amp; Tahun
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selektor Tahun dengan Panah Kiri/Kanan */}
            <div className="flex items-center justify-between bg-surface-container-low rounded-2xl p-1.5 border border-edge">
              <button
                type="button"
                aria-label="Tahun Sebelumnya"
                onClick={() => setPickerYear((prev) => prev - 1)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-sm font-black text-ink font-mono tracking-wider">
                {pickerYear}
              </span>

              <button
                type="button"
                aria-label="Tahun Berikutnya"
                onClick={() => setPickerYear((prev) => prev + 1)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Grid 12 Bulan */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {SHORT_MONTHS.map((monthName, idx) => {
                const isSelected =
                  idx === currentMonthIndex && pickerYear === currentYear;
                const isCurrentCalendarMonth =
                  idx === todayJakarta.monthIndex &&
                  pickerYear === todayJakarta.year;

                return (
                  <button
                    key={monthName}
                    type="button"
                    onClick={() => handleSelectMonthYear(idx, pickerYear)}
                    className={`h-11 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                      isSelected
                        ? "bg-primary text-white shadow-md ring-2 ring-primary/40 scale-[1.02]"
                        : isCurrentCalendarMonth
                        ? "bg-surface-container text-primary border border-primary/30 hover:bg-surface-container-high"
                        : "bg-surface-container-low hover:bg-surface-container text-ink-secondary hover:text-ink border border-edge"
                    }`}
                  >
                    <span>{monthName}</span>
                    {isCurrentCalendarMonth && !isSelected && (
                      <span className="text-[9px] font-normal text-primary/80 leading-none">
                        Bulan Ini
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Modal & Tombol Pintas Lompat ke Hari Ini */}
            <div className="pt-2 border-t border-edge flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="h-9 px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold border border-edge transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Lompat ke Hari Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="h-9 px-4 rounded-xl bg-surface hover:bg-surface-container text-ink-muted text-xs font-semibold border border-edge transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
