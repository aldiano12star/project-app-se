"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Role, TargetAudience } from "@prisma/client";
import {
  Plus,
  CalendarDays,
  ListFilter,
  QrCode,
  ChevronRight,
  Edit3,
  Layers,
  MessageSquare,
  Radio,
  Clock,
  CheckCircle2,
} from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"CIRCUIT" | "LIST">("LIST");

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
          <p className="text-xs text-ink-muted">
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
            className="self-start sm:self-auto inline-flex items-center justify-center gap-1.5 h-11 px-5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Agenda</span>
          </button>
        )}
      </div>

      {/* ── DUAL-MODE VIEW SWITCHER (Luma Pass & Circuit Switcher) ── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-container/60 border hairline-border overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            setViewMode("LIST");
          }}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === "LIST"
              ? "bg-card text-ink shadow-xs border hairline-border font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" />
          <span>Daftar Acara &amp; Tiket Pass</span>
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            setViewMode("CIRCUIT");
          }}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-semibold transition-all min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer ${
            viewMode === "CIRCUIT"
              ? "bg-card text-ink shadow-xs border hairline-border font-bold"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Timeline Sirkuit Kalender</span>
        </button>
      </div>

      {/* ── MODE 1: LUMA TICKET PASS LIST FEED ── */}
      {viewMode === "LIST" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {calendarItems.length === 0 ? (
            <div className="card-solid p-10 text-center space-y-2 rounded-3xl border hairline-border">
              <CalendarDays className="h-10 w-10 text-ink-muted mx-auto stroke-[1.5]" />
              <h3 className="text-sm font-bold text-ink">Belum Ada Agenda Terjadwal</h3>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Belum ada kegiatan atau rapat yang terdaftar pada periode ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calendarItems.map((item) => {
                const start = new Date(item.startDate);
                const dayNum = start.getDate();
                const monthStr = start.toLocaleDateString("id-ID", { month: "short" }).toUpperCase();
                const targetUrl = item.isIndependentMeeting
                  ? `/acara/rapat/${item.id}`
                  : `/acara/${item.id}`;

                return (
                  <div
                    key={item.id}
                    className="specular-card bg-card border rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden group shadow-xs hover:border-primary/40"
                  >
                    {/* Top Row: Date Badge & Category / Time Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Luma-style Date Block */}
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-2xl bg-surface-container border hairline-border text-center shrink-0">
                          <span className="text-[10px] font-mono font-bold text-primary uppercase leading-tight">
                            {monthStr}
                          </span>
                          <span className="text-base font-extrabold text-ink font-mono-num leading-tight">
                            {dayNum}
                          </span>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.isIndependentMeeting
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
                              }`}
                            >
                              {item.isIndependentMeeting ? (
                                <MessageSquare className="h-2.5 w-2.5" />
                              ) : (
                                <Layers className="h-2.5 w-2.5" />
                              )}
                              <span>{item.isIndependentMeeting ? "Rapat" : "Program Kerja"}</span>
                            </span>

                            {item.status === "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                                <Radio className="h-2.5 w-2.5 animate-pulse" />
                                <span>Berlangsung</span>
                              </span>
                            ) : item.status === "UPCOMING" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-ink-muted border hairline-border">
                                <Clock className="h-2.5 w-2.5" />
                                <span>Mendatang</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                <span>Selesai</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-ink line-clamp-1 group-hover:text-primary transition-colors font-display">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      {/* Quick Edit for Officer */}
                      {isOfficer && (
                        <button
                          type="button"
                          onClick={() => handleEditEvent(item)}
                          className="h-8 w-8 rounded-xl bg-surface-container flex items-center justify-center text-ink-muted hover:text-ink border hairline-border active:scale-95 transition-all shrink-0 cursor-pointer"
                          title="Sunting Agenda"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Proker Task Progress (if available) */}
                    {!item.isIndependentMeeting && item.totalTasksCount !== undefined && item.totalTasksCount > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-ink-muted">
                          <span>Progres Kepanitiaan</span>
                          <span className="font-mono font-bold text-ink">
                            {item.completedTasksCount}/{item.totalTasksCount} Tugas
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{
                              width: `${(item.completedTasksCount! / item.totalTasksCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Ticket Perforated Divider & Bottom Action Bar */}
                    <div className="pt-3 border-t border-dashed hairline-border flex items-center justify-between gap-2">
                      {item.isIndependentMeeting ? (
                        <button
                          type="button"
                          onClick={() => handleOpenQr(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline min-h-[36px] py-1 px-2 rounded-lg hover:bg-surface-container active:scale-95 cursor-pointer"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>QR Presensi</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-ink-muted font-medium">
                          {item.sectionsCount ?? 0} Seksi Terdaftar
                        </span>
                      )}

                      <Link
                        href={targetUrl}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover active:scale-95 transition-all min-h-[36px] py-1.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border hairline-border"
                      >
                        <span>Buka Workspace</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: TIMELINE SIRKUIT KALENDER ── */}
      {viewMode === "CIRCUIT" && (
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
