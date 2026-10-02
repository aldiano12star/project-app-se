"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Layers,
  MousePointerClick,
} from "lucide-react";

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
  selectedDate: Date | null;
  onSelectDate: (date: Date, dayEvents: CalendarEventItem[]) => void;
  onSelectEvent?: (event: CalendarEventItem) => void;
  onSelectMultipleEvents?: (date: Date, dayEvents: CalendarEventItem[]) => void;
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

const INDONESIAN_DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/**
 * Cek apakah targetDate berada dalam rentang start - end (inklusif per tanggal)
 */
function isDateWithinRange(
  targetDate: Date,
  startDateStr: Date | string,
  endDateStr: Date | string
): boolean {
  const target = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  ).getTime();

  const start = new Date(startDateStr);
  const startOnly = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  ).getTime();

  const end = new Date(endDateStr);
  const endOnly = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  ).getTime();

  return target >= startOnly && target <= endOnly;
}

export function SnakingPathCalendar({
  currentYear,
  currentMonthIndex,
  onMonthChange,
  events,
  selectedDate,
  onSelectDate,
  onSelectEvent,
  onSelectMultipleEvents,
}: SnakingPathCalendarProps) {
  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === currentYear && today.getMonth() === currentMonthIndex;
  const todayDateNumber = today.getDate();

  // Hitung total hari dalam bulan terpilih
  const totalDaysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  // Parameter Matematika Jalur Mengular S-Curve
  const CONTAINER_WIDTH = 340;
  const CENTER_X = CONTAINER_WIDTH / 2; // 170
  const AMPLITUDE = 65; // Amplitudo gelombang X
  const STEP_Y = 84; // Jarak vertikal antar node
  const START_Y = 48; // Padding atas titik pertama
  const TOTAL_HEIGHT = START_Y + (totalDaysInMonth - 1) * STEP_Y + 60;

  // Hitung koordinat (x, y) presisi untuk setiap hari (0 s/d totalDays-1)
  const nodeCoordinates = daysArray.map((_, index) => {
    // Pola sinusoidal 6-langkah: Center -> Kanan -> Kanan -> Center -> Kiri -> Kiri -> Center
    const xOffset = Math.sin((index * Math.PI) / 3) * AMPLITUDE;
    const x = Math.round(CENTER_X + xOffset);
    const y = START_Y + index * STEP_Y;
    return { x, y };
  });

  // Bangun path SVG Bézier kubik yang menghubungkan persis setiap titik (X_i, Y_i)
  let svgDPath = "";
  if (nodeCoordinates.length > 0) {
    svgDPath = `M ${nodeCoordinates[0].x} ${nodeCoordinates[0].y}`;
    for (let i = 0; i < nodeCoordinates.length - 1; i++) {
      const p1 = nodeCoordinates[i];
      const p2 = nodeCoordinates[i + 1];
      const cy1 = p1.y + STEP_Y * 0.5;
      const cy2 = p2.y - STEP_Y * 0.5;
      svgDPath += ` C ${p1.x} ${cy1}, ${p2.x} ${cy2}, ${p2.x} ${p2.y}`;
    }
  }

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
    const now = new Date();
    onMonthChange(now.getMonth(), now.getFullYear());
  };

  return (
    <section className="card-solid bg-card p-4 sm:p-5 shadow-sm space-y-4 relative overflow-hidden rounded-2xl border border-edge">
      {/* Month Header Switcher */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-ink tracking-tight flex items-center gap-1.5">
            <span>Kalender Jalur Acara</span>
          </h2>
          <span className="text-xs text-ink-muted">
            Kelola Agenda &amp; Tugas Terpadu • {INDONESIAN_MONTHS[currentMonthIndex]} {currentYear}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1 border border-edge shadow-xs">
          <button
            type="button"
            aria-label="Bulan Sebelumnya"
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-md text-ink-secondary hover:bg-card hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleResetToCurrentMonth}
            title="Kembali ke Bulan Ini"
            className="text-xs font-bold text-ink px-2.5 py-1 rounded hover:bg-card transition-colors select-none min-w-27.5 text-center cursor-pointer"
          >
            {INDONESIAN_MONTHS[currentMonthIndex]} {currentYear}
          </button>

          <button
            type="button"
            aria-label="Bulan Berikutnya"
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-md text-ink-secondary hover:bg-card hover:text-ink transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hint banner Sesuai Stitch Reference */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-div-programming-bg-light dark:bg-blue-950/40 text-div-programming dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shadow-xs">
        <MousePointerClick className="h-4 w-4 shrink-0" />
        <p className="text-xs leading-tight">
          Sentuh lingkaran tanggal untuk membuka rincian agenda atau panitia.
        </p>
      </div>

      {/* Legend & Milestone Info */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-container-low/60 border border-edge/60 text-[11px] text-ink-muted relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-red-200 dark:ring-red-950 inline-block" />
            <span className="font-medium text-ink">Sedang Aktif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span className="font-medium text-ink">Ada Agenda</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-ink-muted">
          <Trophy className="h-3 w-3 text-amber-500" />
          <span>Milestone Mingguan</span>
        </div>
      </div>

      {/* Snaking Path Canvas Area (Sistem Koordinat Terpadu) */}
      <div className="w-full flex justify-center py-2 select-none">
        <div
          className="relative"
          style={{
            width: `${CONTAINER_WIDTH}px`,
            height: `${TOTAL_HEIGHT}px`,
          }}
        >
          {/* S-curve Dotted Connecting Line SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${CONTAINER_WIDTH} ${TOTAL_HEIGHT}`}
            fill="none"
          >
            {/* Garis Dasar Abu-Abu */}
            <path
              d={svgDPath}
              stroke="#CBD5E1"
              className="dark:stroke-slate-700"
              strokeDasharray="6 6"
              strokeLinecap="round"
              strokeWidth="4"
            />
          </svg>

          {/* Render Node per Tanggal (1 s/d N) */}
          {daysArray.map((dayNumber, index) => {
            const coord = nodeCoordinates[index];
            const nodeDate = new Date(currentYear, currentMonthIndex, dayNumber);
            const dayOfWeek = nodeDate.getDay();
            const dayName = INDONESIAN_DAYS[dayOfWeek];
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Status tanggal hari ini
            const isToday = isCurrentMonthToday && dayNumber === todayDateNumber;

            // Status masa lalu
            const todayReset = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            ).getTime();
            const nodeReset = new Date(
              currentYear,
              currentMonthIndex,
              dayNumber
            ).getTime();
            const isPast = nodeReset < todayReset;

            // Cek agenda pada tanggal ini
            const dayEvents = events.filter((ev) =>
              isDateWithinRange(nodeDate, ev.startDate, ev.endDate)
            );
            const hasEvents = dayEvents.length > 0;
            const isMultipleEvents = dayEvents.length > 1;
            const firstEvent = dayEvents[0];

            // Node Aktif
            const isActiveNode =
              isToday ||
              dayEvents.some((ev) => {
                const s = new Date(ev.startDate).getTime();
                const e = new Date(ev.endDate).getTime();
                const nowT = today.getTime();
                return nowT >= s && nowT <= e;
              });

            // Status Terpilih
            const isSelected =
              selectedDate !== null &&
              selectedDate.getFullYear() === currentYear &&
              selectedDate.getMonth() === currentMonthIndex &&
              selectedDate.getDate() === dayNumber;

            const handleNodeClick = () => {
              onSelectDate(nodeDate, dayEvents);
              if (isMultipleEvents) {
                if (onSelectMultipleEvents) {
                  onSelectMultipleEvents(nodeDate, dayEvents);
                }
              } else if (hasEvents && onSelectEvent) {
                onSelectEvent(dayEvents[0]);
              }
            };

            return (
              <div
                key={`day-${dayNumber}`}
                style={{
                  left: `${coord.x}px`,
                  top: `${coord.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
                className="absolute flex flex-col items-center z-10"
              >
                {/* Lencana SEDANG AKTIF Sesuai Stitch Spec */}
                {isActiveNode && (
                  <div className="absolute -top-3.5 px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-bold shadow-md animate-pulse uppercase tracking-wider z-20 flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Sedang Aktif</span>
                  </div>
                )}

                {/* Badge Indikator Multi-Agenda */}
                {!isActiveNode && isMultipleEvents && (
                  <div className="absolute -top-3.5 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold z-20 shadow-md ring-2 ring-white dark:ring-slate-900 flex items-center gap-0.5 animate-bounce whitespace-nowrap">
                    <Layers className="h-2.5 w-2.5" />
                    <span>{dayEvents.length} Agenda</span>
                  </div>
                )}

                {/* Bulatan Node Tanggal */}
                {isMultipleEvents ? (
                  <button
                    type="button"
                    onClick={handleNodeClick}
                    className={`relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 w-12 h-12 rounded-full bg-amber-500 text-white shadow-md border-2 border-white dark:border-slate-900 ring-4 ring-amber-100 dark:ring-amber-950/80 hover:bg-amber-600 ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900"
                        : ""
                    }`}
                    aria-label={`Tanggal ${dayNumber} memiliki ${dayEvents.length} kegiatan.`}
                  >
                    <span className="text-[13px] font-semibold leading-none">
                      {dayNumber}
                    </span>
                    <span className="text-[9px] text-white/90 leading-none mt-0.5">
                      {dayName}
                    </span>
                  </button>
                ) : hasEvents ? (
                  <Link
                    href={`/acara/${firstEvent.id}`}
                    onClick={handleNodeClick}
                    className={`relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                      isActiveNode
                        ? "w-14 h-14 rounded-full bg-primary text-white shadow-lg border-2 border-white dark:border-slate-900 ring-4 ring-red-100 dark:ring-red-950/80"
                        : isPast
                        ? "w-11 h-11 rounded-full bg-blue-600 text-white shadow-md border-2 border-white dark:border-slate-900 hover:bg-blue-700"
                        : "w-12 h-12 rounded-full bg-blue-600 text-white shadow-md border-2 border-white dark:border-slate-900 ring-2 ring-blue-100 dark:ring-blue-950/80 hover:bg-blue-700"
                    } ${
                      isSelected && !isActiveNode
                        ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900"
                        : ""
                    }`}
                    aria-label={`Tanggal ${dayNumber} ${dayName}. ${firstEvent.title}. Buka detail.`}
                  >
                    {isActiveNode ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[13px] font-extrabold leading-none">
                          {dayNumber}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-white/90 leading-none mt-0.5">
                          {dayName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {isPast ? (
                          <CheckCircle2 className="h-3.5 w-3.5 mb-0.5 text-white/90" />
                        ) : (
                          <span className="text-[13px] font-semibold leading-none">
                            {dayNumber}
                          </span>
                        )}
                        <span className="text-[9px] text-white/90 leading-none mt-0.5">
                          {dayName}
                        </span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleNodeClick}
                    className={`relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                      isActiveNode
                        ? "w-14 h-14 rounded-full bg-primary text-white shadow-lg border-2 border-white dark:border-slate-900 ring-4 ring-red-100 dark:ring-red-950/80"
                        : isPast
                        ? "w-11 h-11 rounded-full bg-card border border-edge shadow-xs text-ink-muted hover:bg-surface-container-low"
                        : isWeekend
                        ? "w-11 h-11 rounded-full bg-card border border-edge/80 shadow-xs text-ink hover:border-amber-400/60"
                        : "w-11 h-11 rounded-full bg-card border border-edge shadow-xs text-ink hover:bg-surface-container-low hover:border-primary/40"
                    } ${
                      isSelected && !isActiveNode
                        ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900"
                        : ""
                    }`}
                    aria-label={`Tanggal ${dayNumber} ${dayName}`}
                  >
                    <span
                      className={`text-[13px] font-semibold leading-none ${
                        isActiveNode
                          ? "text-white font-extrabold"
                          : isPast
                          ? "text-ink-muted"
                          : isWeekend
                          ? "text-amber-600 dark:text-amber-400 font-bold"
                          : "text-ink"
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <span
                      className={`text-[9px] leading-none mt-0.5 ${
                        isActiveNode ? "text-white/90" : "text-ink-muted"
                      }`}
                    >
                      {dayName}
                    </span>
                  </button>
                )}

                {/* Judul Acara di Bawah Bulatan Node */}
                {isMultipleEvents ? (
                  <button
                    type="button"
                    onClick={handleNodeClick}
                    className="flex flex-col items-center mt-1 cursor-pointer text-center max-w-[120px] group"
                  >
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 truncate w-full group-hover:underline flex items-center justify-center gap-1">
                      <span>{dayEvents.length} Agenda</span>
                      <ArrowRight className="h-2.5 w-2.5 shrink-0 opacity-70" />
                    </span>
                  </button>
                ) : hasEvents ? (
                  <Link
                    href={`/acara/${firstEvent.id}`}
                    className="flex flex-col items-center mt-1 cursor-pointer text-center max-w-[120px] group"
                  >
                    <span
                      className={`text-[11px] font-bold truncate w-full group-hover:underline flex items-center justify-center gap-0.5 ${
                        isActiveNode
                          ? "text-primary"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      <span className="truncate">{firstEvent.title}</span>
                    </span>
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
