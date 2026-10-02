"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import {
  Plus,
  CalendarDays,
  Calendar,
  Clock,
  ListTodo,
  Folder,
  ArrowRight,
  MessageSquare,
  Layers,
} from "lucide-react";
import {
  SnakingPathCalendar,
  CalendarEventItem,
} from "./SnakingPathCalendar";
import { EventDetailData } from "./EventDetailCard";
import { AdminEventModal } from "./AdminEventModal";
import { MultiEventSelectorModal } from "./MultiEventSelectorModal";

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

export interface AcaraClientViewProps {
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
  events: EventDetailData[];
  latestMeeting?: {
    id: string;
    title: string;
    notes?: string | null;
    date: Date | string;
    isRead?: boolean;
  } | null;
  initialMonth?: number;
  initialYear?: number;
}

export function AcaraClientView({
  currentUser,
  events,
  initialMonth,
  initialYear,
}: AcaraClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();

  // Baca query params atau gunakan initial/default saat ini
  const queryMonth = searchParams.get("month");
  const queryYear = searchParams.get("year");

  const resolvedMonth = queryMonth ? parseInt(queryMonth, 10) - 1 : (initialMonth ?? now.getMonth());
  const resolvedYear = queryYear ? parseInt(queryYear, 10) : (initialYear ?? now.getFullYear());

  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(resolvedMonth);
  const [currentYear, setCurrentYear] = useState<number>(resolvedYear);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // State untuk Multi-Event Selector Modal
  const [isMultiEventModalOpen, setIsMultiEventModalOpen] = useState(false);
  const [multiEventDate, setMultiEventDate] = useState<Date | null>(null);
  const [multiEventsList, setMultiEventsList] = useState<CalendarEventItem[]>([]);

  const isOfficer =
    currentUser.role === Role.ADMIN ||
    currentUser.role === Role.OPERATOR;

  // Sinkronisasi state jika URL berubah
  useEffect(() => {
    if (queryMonth) {
      const m = parseInt(queryMonth, 10) - 1;
      if (!isNaN(m) && m >= 0 && m <= 11) setCurrentMonthIndex(m);
    }
    if (queryYear) {
      const y = parseInt(queryYear, 10);
      if (!isNaN(y)) setCurrentYear(y);
    }
  }, [queryMonth, queryYear]);

  const handleMonthChange = (newMonthIndex: number, newYear: number) => {
    setCurrentMonthIndex(newMonthIndex);
    setCurrentYear(newYear);
    setSelectedDate(null);

    // Perbarui URL Query Params
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", (newMonthIndex + 1).toString());
    params.set("year", newYear.toString());
    router.push(`/acara?${params.toString()}`, { scroll: false });
  };

  // Petakan event database ke CalendarEventItem
  const calendarItems: CalendarEventItem[] = events.map((ev) => {
    const nowDate = new Date();
    const start = new Date(ev.startDate);
    const end = new Date(ev.endDate);

    let status: "COMPLETED" | "ACTIVE" | "UPCOMING" = "UPCOMING";
    if (end < nowDate) {
      status = "COMPLETED";
    } else if (start <= nowDate && end >= nowDate) {
      status = "ACTIVE";
    }

    const allTasks = ev.sections.flatMap((s) => s.tasks);
    const completed = allTasks.filter((t) => t.status === "DONE").length;

    return {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      startDate: ev.startDate,
      endDate: ev.endDate,
      driveUrl: ev.driveUrl,
      status,
      sectionsCount: ev.sections.length,
      completedTasksCount: completed,
      totalTasksCount: allTasks.length,
    };
  });

  // Filter kegiatan yang berada pada rentang bulan terpilih
  const monthStartDate = new Date(currentYear, currentMonthIndex, 1);
  const monthEndDate = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59);

  const eventsInCurrentMonth = events.filter((ev) => {
    const s = new Date(ev.startDate);
    const e = new Date(ev.endDate);
    return s <= monthEndDate && e >= monthStartDate;
  });

  const handleSelectDate = (date: Date, dayEvents: CalendarEventItem[]) => {
    setSelectedDate(date);
    if (dayEvents.length === 1) {
      setSelectedEventId(dayEvents[0].id);
    }
  };

  const handleSelectEvent = (event: CalendarEventItem) => {
    setSelectedEventId(event.id);
  };

  const handleSelectMultipleEvents = (date: Date, dayEvents: CalendarEventItem[]) => {
    setMultiEventDate(date);
    setMultiEventsList(dayEvents);
    setIsMultiEventModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar Header & Action */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-ink">
            Modul Acara &amp; Kepanitiaan
          </h2>
          <p className="text-xs text-ink-muted">
            Kalender jalur agenda &amp; koordinasi kegiatan
          </p>
        </div>

        {isOfficer && (
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="h-9 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Kegiatan</span>
          </button>
        )}
      </div>

      {/* SECTION 1: Kalender Jalur Mengular 1 s/d N Hari (Duolingo Style) */}
      <SnakingPathCalendar
        currentYear={currentYear}
        currentMonthIndex={currentMonthIndex}
        onMonthChange={handleMonthChange}
        events={calendarItems}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onSelectEvent={handleSelectEvent}
        onSelectMultipleEvents={handleSelectMultipleEvents}
      />

      {/* SECTION 2: Daftar Agenda Kegiatan Bulan Ini (Agenda Feed) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-ink">
              Agenda {INDONESIAN_MONTHS[currentMonthIndex]} {currentYear}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-container-low text-ink-secondary border border-edge">
            {eventsInCurrentMonth.length} Agenda
          </span>
        </div>

        {eventsInCurrentMonth.length > 0 ? (
          <div className="space-y-3">
            {eventsInCurrentMonth.map((ev) => {
              const start = new Date(ev.startDate);
              const end = new Date(ev.endDate);
              const isSelected = selectedEventId === ev.id;

              const isSingleDay = start.toDateString() === end.toDateString();
              const hasSections = ev.sections.length > 0;
              const isRapat = !hasSections || isSingleDay;

              const startDay = start.getDate();
              const endDay = end.getDate();
              const startMonthName = INDONESIAN_MONTHS[start.getMonth()];

              const timeStr = `${start.getHours().toString().padStart(2, "0")}:${start
                .getMinutes()
                .toString()
                .padStart(2, "0")} WIB`;

              const dateLabel =
                startDay === endDay
                  ? `${startDay} ${startMonthName} ${start.getFullYear()}`
                  : `${startDay} - ${endDay} ${startMonthName} ${start.getFullYear()}`;

              const allTasks = ev.sections.flatMap((s) => s.tasks);
              const completedTasks = allTasks.filter((t) => t.status === "DONE").length;
              const totalTasks = allTasks.length;
              const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={ev.id}
                  className={`card-solid bg-card p-4 rounded-xl shadow-xs border transition-all space-y-3 ${
                    isSelected
                      ? "border-primary ring-2 ring-red-100 dark:ring-red-950/80"
                      : "border-edge hover:border-primary/40"
                  }`}
                >
                  {/* Header Tag & Tanggal */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isRapat
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60"
                              : "bg-red-50 dark:bg-red-950/40 text-primary border border-red-200 dark:border-red-900/60"
                          }`}
                        >
                          {isRapat ? (
                            <MessageSquare className="h-3 w-3" />
                          ) : (
                            <Layers className="h-3 w-3" />
                          )}
                          <span>{isRapat ? "Rapat Singkat" : "Program Kerja"}</span>
                        </span>

                        <span className="font-semibold text-ink text-[11px] flex items-center gap-1">
                          <Clock className="h-3 w-3 text-ink-muted" />
                          <span>{dateLabel} • {timeStr}</span>
                        </span>
                      </div>

                      <Link
                        href={`/acara/${ev.id}`}
                        className="text-sm font-bold text-ink hover:text-primary transition-colors inline-block"
                      >
                        {ev.title}
                      </Link>
                    </div>

                    {ev.driveUrl && (
                      <a
                        href={ev.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-ink-secondary border border-edge transition-colors"
                        title="Buka Google Drive"
                      >
                        <Folder className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Deskripsi Singkat */}
                  {ev.description && (
                    <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  )}

                  {/* Progress Bar Seksi / Tugas */}
                  {hasSections && totalTasks > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-ink-muted">
                        <span className="flex items-center gap-1">
                          <ListTodo className="h-3 w-3" />
                          <span>{ev.sections.length} Seksi Panitia</span>
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

                  {/* Tombol Aksi Buka Detail & Kepanitiaan */}
                  <Link
                    href={`/acara/${ev.id}`}
                    className="w-full h-10 min-h-10 bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-edge"
                  >
                    <span>Buka Detail &amp; Kepanitiaan</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-solid bg-card p-6 text-center space-y-2 rounded-xl border border-edge">
            <div className="h-10 w-10 rounded-full bg-surface-container-low text-ink-muted mx-auto flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-ink">Belum Ada Agenda</h4>
            <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
              Tidak ada jadwal kegiatan atau rapat yang terdaftar pada bulan {INDONESIAN_MONTHS[currentMonthIndex]} {currentYear}.
            </p>
          </div>
        )}
      </section>

      {/* Modal Dialog Buat Agenda Baru (Admin/Operator) */}
      <AdminEventModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Modal Dialog Pemilih Multi-Agenda pada Tanggal yang Sama */}
      <MultiEventSelectorModal
        isOpen={isMultiEventModalOpen}
        onClose={() => setIsMultiEventModalOpen(false)}
        selectedDate={multiEventDate}
        events={multiEventsList}
      />
    </div>
  );
}
