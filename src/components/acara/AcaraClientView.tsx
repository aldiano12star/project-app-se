"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Role } from "@prisma/client";
import { Plus } from "lucide-react";
import {
  SnakingPathCalendar,
  CalendarEventItem,
} from "./SnakingPathCalendar";
import { EventDetailData } from "./EventDetailCard";
import { AdminEventModal } from "./AdminEventModal";
import { MultiEventSelectorModal } from "./MultiEventSelectorModal";
import {
  getEventTimeStatus,
  getJakartaDateParts,
} from "@/utils/eventStatus";

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

  const nowParts = getJakartaDateParts(new Date());

  // Baca query params atau gunakan initial/default saat ini
  const queryMonth = searchParams.get("month");
  const queryYear = searchParams.get("year");

  const resolvedMonth = queryMonth
    ? parseInt(queryMonth, 10) - 1
    : initialMonth ?? nowParts.monthIndex;
  const resolvedYear = queryYear
    ? parseInt(queryYear, 10)
    : initialYear ?? nowParts.year;

  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(resolvedMonth);
  const [currentYear, setCurrentYear] = useState<number>(resolvedYear);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  // Petakan event database ke CalendarEventItem dengan status presisi
  const calendarItems: CalendarEventItem[] = events.map((ev) => {
    const status = getEventTimeStatus(ev.startDate, ev.endDate);

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

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSelectEvent = () => {
    // Dipicu saat event diklik di calendar jika diperlukan
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
          <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">
            Modul Acara &amp; Kepanitiaan
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Pusat kalender agenda, timeline sirkuit, dan koordinasi kepanitiaan organisasi.
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

      {/* Timeline Sirkuit Vertikal Tunggal Terpadu */}
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
