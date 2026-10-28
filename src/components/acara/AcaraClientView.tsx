"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Role } from "@prisma/client";
import { Plus, LayoutGrid, Calendar } from "lucide-react";
import {
  SnakingPathCalendar,
  CalendarEventItem,
} from "./SnakingPathCalendar";
import { EventDetailData, NestedMeetingData } from "./EventDetailCard";
import { EventGroupingView } from "./EventGroupingView";
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
  independentMeetings?: NestedMeetingData[];
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
  independentMeetings = [],
  initialMonth,
  initialYear,
}: AcaraClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nowParts = getJakartaDateParts(new Date());

  // Tab view: "grouping" (Contextual Grouping Mega-Cards) vs "calendar" (Snaking Timeline)
  const [activeTab, setActiveTab] = useState<"grouping" | "calendar">("grouping");

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

  const parentEventsList = events.map((e) => ({
    id: e.id,
    title: e.title,
  }));

  return (
    <div className="space-y-4">
      {/* Top Bar Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#E2E8F0] tracking-tight">
            Modul Acara &amp; Kepanitiaan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat kalender agenda, mega-cards terpadu, dan koordinasi kepanitiaan organisasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector: Grouping vs Timeline */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#151D2A] border border-slate-200 dark:border-[#27344A]">
            <button
              type="button"
              onClick={() => setActiveTab("grouping")}
              className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "grouping"
                  ? "bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#E2E8F0]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Daftar Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#E2E8F0]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline Sirkuit</span>
            </button>
          </div>

          {isOfficer && (
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="h-10 min-h-10 px-3.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Agenda</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Contextual Grouping Mega-Cards */}
      {activeTab === "grouping" && (
        <EventGroupingView
          events={events}
          independentMeetings={independentMeetings}
          currentUser={currentUser}
        />
      )}

      {/* VIEW 2: Timeline Sirkuit Vertikal Tunggal Terpadu */}
      {activeTab === "calendar" && (
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
      )}

      {/* Modal Dialog Buat Agenda Baru (Admin/Operator) */}
      <AdminEventModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        parentEvents={parentEventsList}
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
