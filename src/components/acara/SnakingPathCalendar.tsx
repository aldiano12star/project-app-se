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
} from "lucide-react";
import {
  getLocalDateString,
  getJakartaDateParts,
  formatEventSchedule,
  SHORT_MONTHS,
  FULL_MONTHS,
  INDONESIAN_DAYS,
} from "@/utils/eventStatus";

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  driveUrl?: string | null;
  status?: "COMPLETED" | "ACTIVE" | "UPCOMING";
  sectionsCount?: number;
  completedTasksCount?: number;
  totalTasksCount?: number;
}

interface SnakingPathCalendarProps {
  currentYear: number;
  currentMonthIndex: number; // 0 = Jan, 11 = Des
  onMonthChange: (newMonthIndex: number, newYear: number) => void;
  events: CalendarEventItem[];
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
}: SnakingPathCalendarProps) {
  // State untuk Month-Year Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(currentYear);

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

            // Diferensiasi Border & Background Kartu Kegiatan
            const cardStyleClass = isFinished
              ? "border border-emerald-500/25 bg-card"
              : isMultiDay
              ? "border border-indigo-500/40 bg-card shadow-sm"
              : "border border-cyan-500/40 bg-card shadow-sm";

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
                  ) : isMultiDay ? (
                    /* 2. Proker Multi-Hari: Lingkaran Ungu Indigo dengan Ikon Flag */
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
                    /* 3. Agenda Singkat: Lingkaran Biru/Cyan dengan Ikon Kilat Zap */
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
                  className={`p-4 rounded-2xl transition-all space-y-3 ${cardStyleClass} ${todayAccentClass}`}
                >
                  {/* Header Tag & Tanggal */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
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

                        {/* Tipe Acara: Indigo untuk Proker Multi-Hari, Amber untuk Agenda Singkat */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isMultiDay
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isMultiDay ? (
                            <Layers className="h-3 w-3" />
                          ) : (
                            <MessageSquare className="h-3 w-3" />
                          )}
                          <span>
                            {isMultiDay
                              ? "Proker / Multi-Hari"
                              : "Agenda Singkat"}
                          </span>
                        </span>

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

                      <Link
                        href={`/acara/${ev.id}`}
                        className="text-sm font-bold text-ink hover:text-primary transition-colors inline-block leading-snug"
                      >
                        {ev.title}
                      </Link>
                    </div>

                    {ev.driveUrl && (
                      <a
                        href={ev.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-ink-secondary border border-edge transition-colors shrink-0"
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

                  {/* Tombol Aksi Buka Detail & Kepanitiaan */}
                  <Link
                    href={`/acara/${ev.id}`}
                    className="w-full h-10 min-h-10 bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-edge"
                  >
                    <span>Buka Detail &amp; Kepanitiaan</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
                  </Link>
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
