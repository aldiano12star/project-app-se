"use client";

import Link from "next/link";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  Layers,
  ArrowRight,
  ListTodo,
} from "lucide-react";
import { CalendarEventItem } from "./SnakingPathCalendar";
import {
  getLocalDateString,
  formatEventSchedule,
} from "@/utils/eventStatus";

interface MultiEventSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  events: CalendarEventItem[];
}

const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

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

export function MultiEventSelectorModal({
  isOpen,
  onClose,
  selectedDate,
  events,
}: MultiEventSelectorModalProps) {
  if (!isOpen || !selectedDate) return null;

  const dayName = INDONESIAN_DAYS[selectedDate.getDay()];
  const dayNum = selectedDate.getDate();
  const monthName = INDONESIAN_MONTHS[selectedDate.getMonth()];
  const yearNum = selectedDate.getFullYear();

  const formattedDate = `${dayName}, ${dayNum} ${monthName} ${yearNum}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">{formattedDate}</h2>
              <p className="text-[11px] text-ink-muted">
                Terdapat {events.length} kegiatan pada tanggal ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List of Events on this Day */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-ink-secondary">
            Pilih kegiatan yang ingin kamu buka detail kepanitiaan atau notulensinya:
          </p>

          <div className="space-y-2.5">
            {events.map((item) => {
              const isSingleDay =
                getLocalDateString(item.startDate) ===
                getLocalDateString(item.endDate);

              const formattedSchedule = formatEventSchedule(
                item.startDate,
                item.endDate,
                { shortMonth: true }
              );

              const hasSections = (item.sectionsCount ?? 0) > 0;
              const isRapat = !hasSections || isSingleDay;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-edge bg-surface hover:border-primary/50 transition-all space-y-2.5 shadow-xs"
                >
                  {/* Badge & Jam */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSingleDay
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {isSingleDay ? (
                        <MessageSquare className="h-3 w-3" />
                      ) : (
                        <Layers className="h-3 w-3" />
                      )}
                      <span>
                        {isSingleDay ? "Agenda Singkat" : "Proker / Multi-Hari"}
                      </span>
                    </span>

                    <span className="text-[11px] text-ink-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formattedSchedule}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-ink leading-snug">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-ink-secondary line-clamp-1 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-ink-muted shrink-0" />
                        <span className="truncate">{item.description}</span>
                      </p>
                    )}
                  </div>

                  {/* Seksi & Progress jika ada */}
                  {hasSections && item.totalTasksCount !== undefined && item.totalTasksCount > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1 border-t border-edge/60">
                      <span className="flex items-center gap-1">
                        <ListTodo className="h-3 w-3" />
                        <span>{item.sectionsCount} Seksi</span>
                      </span>
                      <span>
                        {item.completedTasksCount}/{item.totalTasksCount} Tugas Selesai
                      </span>
                    </div>
                  )}

                  {/* Tombol Navigasi ke Detail */}
                  <Link
                    href={`/acara/${item.id}`}
                    onClick={onClose}
                    className="w-full h-10 min-h-10 bg-surface-container-low hover:bg-surface-container text-ink hover:text-primary text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-edge"
                  >
                    <span>Buka Detail &amp; Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-edge bg-surface-container-low/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 min-h-10 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold border border-edge transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
