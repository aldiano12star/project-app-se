"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Role, TargetAudience } from "@prisma/client";
import { Plus } from "lucide-react";
import { haptic } from "@/lib/haptic";
import {
  SnakingPathCalendar,
  CalendarEventItem,
} from "./SnakingPathCalendar";
import { EventDetailData, NestedMeetingData } from "./EventDetailCard";
import { AdminEventInitialData } from "./AdminEventModal";
import {
  getEventTimeStatus,
  getJakartaDateParts,
} from "@/utils/eventStatus";

const AdminEventModal = dynamic(
  () => import("./AdminEventModal").then((mod) => mod.AdminEventModal),
  { ssr: false }
);

const MultiEventSelectorModal = dynamic(
  () =>
    import("./MultiEventSelectorModal").then(
      (mod) => mod.MultiEventSelectorModal
    ),
  { ssr: false }
);

const MeetingQrModal = dynamic(
  () => import("@/components/home/MeetingQrModal").then((mod) => mod.MeetingQrModal),
  { ssr: false }
);

export interface AcaraClientViewProps {
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
  events: EventDetailData[];
  independentMeetings?: NestedMeetingData[];
  allMembers?: {
    id: string;
    name: string;
    role?: Role;
    classGrade?: string | null;
    mainDivision?: string | null;
  }[];
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
  allMembers = [],
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

  // State untuk Relokasi QR Code Modal langsung dari Main View
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // State untuk Multi-Event Selector Modal
  const [isMultiEventModalOpen, setIsMultiEventModalOpen] = useState(false);
  const [multiEventDate, setMultiEventDate] = useState<Date | null>(null);
  const [multiEventsList, setMultiEventsList] = useState<CalendarEventItem[]>([]);

  const isOfficer =
    currentUser.role === Role.ADMIN ||
    currentUser.role === Role.OPERATOR;

  // State untuk Edit Agenda / Rapat Modal
  const [editingItem, setEditingItem] = useState<AdminEventInitialData | null>(null);

  const handleOpenQr = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setIsQrModalOpen(true);
  };

  const handleEditEvent = (ev: CalendarEventItem) => {
    if (ev.isIndependentMeeting) {
      setEditingItem({
        id: ev.id,
        type: "RAPAT",
        title: ev.title,
        startDate: ev.startDate,
        targetAudience: ev.targetAudience || TargetAudience.ALL,
        targetUserIds: ev.targetUserIds || [],
        notes: ev.description || "",
        eventId: null,
      });
    } else {
      setEditingItem({
        id: ev.id,
        type: "ACARA_BESAR",
        title: ev.title,
        description: ev.description || "",
        startDate: ev.startDate,
        endDate: ev.endDate,
        targetAudience: ev.targetAudience || TargetAudience.ALL,
        targetUserIds: ev.targetUserIds || [],
        driveUrl: ev.driveUrl || "",
        notulensiText: ev.notulensiText || "",
      });
    }
    setIsAdminModalOpen(true);
  };

  const handleEditMeeting = (m: NestedMeetingData) => {
    setEditingItem({
      id: m.id,
      type: "RAPAT",
      title: m.title,
      startDate: m.date,
      targetAudience: m.targetAudience || TargetAudience.ALL,
      targetUserIds: m.targetUserIds || [],
      notes: m.notes || "",
      eventId: m.eventId || null,
    });
    setIsAdminModalOpen(true);
  };

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

  // 1. Petakan Program Kerja Utama (Proker Mega-Cards beserta anak pertemuannya)
  const eventItems: CalendarEventItem[] = events.map((ev) => {
    const status = getEventTimeStatus(ev.startDate, ev.endDate);
    const allTasks = ev.sections.flatMap((s) => s.tasks);
    const completed = allTasks.filter((t) => t.status === "DONE").length;

    return {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      startDate: ev.startDate,
      endDate: ev.endDate,
      targetAudience: ev.targetAudience,
      targetUserIds: ev.targetUserIds,
      isIndependentMeeting: false,
      driveUrl: ev.driveUrl,
      notulensiText: ev.notulensiText,
      status,
      sectionsCount: ev.sections.length,
      completedTasksCount: completed,
      totalTasksCount: allTasks.length,
      meetings: ev.meetings,
    };
  });

  // 2. Petakan Rapat Mandiri (Truly Independent Meetings, eventId === null)
  const meetingItems: CalendarEventItem[] = independentMeetings.map((m) => {
    const status = getEventTimeStatus(m.date, m.date);
    return {
      id: m.id,
      title: m.title,
      description: m.notes,
      startDate: m.date,
      endDate: m.date,
      targetAudience: m.targetAudience,
      targetUserIds: m.targetUserIds,
      isIndependentMeeting: true,
      status,
      meetings: [m],
    };
  });

  // Gabungkan seluruh item ke dalam feed kronologis Timeline Sirkuit
  const calendarItems: CalendarEventItem[] = [...eventItems, ...meetingItems];

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

  // Filter ketat: Hanya Program Kerja / Acara Jangka Panjang yang sah yang dapat menjadi induk rapat.
  // Agenda singkat 1 hari tanpa kepanitiaan tidak dapat menjadi induk rapat lain.
  const parentEventsList = events
    .filter((e) => {
      const isMultiDay =
        new Date(e.startDate).toDateString() !== new Date(e.endDate).toDateString();
      const hasSections = (e.sections?.length ?? 0) > 0;
      return isMultiDay || hasSections;
    })
    .map((e) => ({
      id: e.id,
      title: e.title,
    }));

  return (
    <div className="space-y-6">
      {/* ── TOP BAR HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-display">
            Acara &amp; Kepanitiaan
          </h2>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            Pusat kalender agenda, timeline sirkuit terpadu, dan koordinasi kepanitiaan organisasi.
          </p>
        </div>

        {isOfficer && (
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setEditingItem(null);
              setIsAdminModalOpen(true);
            }}
            className="self-start sm:self-auto inline-flex items-center justify-center gap-2 h-11 px-5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Agenda</span>
          </button>
        )}
      </div>

      {/* ── TIMELINE SIRKUIT KALENDER (TAMPILAN TUNGGAL UTAMA) ── */}
      <div className="animate-in fade-in duration-200">
        <SnakingPathCalendar
          currentYear={currentYear}
          currentMonthIndex={currentMonthIndex}
          onMonthChange={handleMonthChange}
          events={calendarItems}
          currentUserRole={currentUser.role}
          onOpenQr={handleOpenQr}
          onEditEvent={handleEditEvent}
          onEditMeeting={handleEditMeeting}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onSelectEvent={handleSelectEvent}
          onSelectMultipleEvents={handleSelectMultipleEvents}
        />
      </div>

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

      {/* Modal Dialog Buat / Edit Agenda (Admin/Operator) */}
      <AdminEventModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setEditingItem(null);
        }}
        parentEvents={parentEventsList}
        allMembers={allMembers}
        initialData={editingItem}
      />

      {/* Modal Dialog Pemilih Multi-Agenda */}
      <MultiEventSelectorModal
        isOpen={isMultiEventModalOpen}
        onClose={() => setIsMultiEventModalOpen(false)}
        selectedDate={multiEventDate}
        events={multiEventsList}
      />
    </div>
  );
}
