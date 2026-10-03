"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import {
  ArrowLeft,
  Folder,
  Plus,
  MessageSquare,
  Layers,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { EventDetailCard, EventDetailData } from "./EventDetailCard";
import { CommitteeSection } from "./CommitteeSection";
import { NotulensiCard } from "./NotulensiCard";
import { AddTaskModal } from "./AddTaskModal";
import { AddSectionModal } from "./AddSectionModal";
import { EventRABSection } from "./EventRABSection";
import { BudgetItemData } from "./PrintRABModal";
import { deleteEvent } from "@/actions/acara";

interface EventDetailClientViewProps {
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
  event: EventDetailData;
  budgetItems?: BudgetItemData[];
  allMembers?: { id: string; name: string; classGrade?: string | null }[];
  latestMeeting?: {
    id: string;
    title: string;
    notes?: string | null;
    date: Date | string;
    isRead?: boolean;
  } | null;
}

export function EventDetailClientView({
  currentUser,
  event,
  budgetItems = [],
  allMembers = [],
  latestMeeting,
}: EventDetailClientViewProps) {
  const router = useRouter();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | undefined>();
  const [isDriveAlertOpen, setIsDriveAlertOpen] = useState(false);

  // State untuk Modal Hapus Acara di Bagian Paling Bawah Halaman Detail
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const isOfficer =
    currentUser.role === Role.ADMIN ||
    currentUser.role === Role.OPERATOR;

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isSingleDay = startDate.toDateString() === endDate.toDateString();
  const hasSections = event.sections.length > 0;
  const isRapat = !hasSections || isSingleDay;

  const handleOpenAddTask = (sectionId?: string) => {
    setTargetSectionId(sectionId || event.sections[0]?.id);
    setIsAddTaskModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const res = await deleteEvent(event.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/acara");
      } else {
        setDeleteErrorMessage(res.message);
      }
    } catch {
      setDeleteErrorMessage("Gagal menghapus kegiatan. Terjadi kesalahan internal server.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Navigasi Kembali */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/acara"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold border border-edge transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4 text-primary" />
          <span>Kembali ke Kalender</span>
        </Link>

        {isOfficer && !isRapat && (
          <button
            type="button"
            onClick={() => setIsAddSectionModalOpen(true)}
            className="h-11 px-3.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>+ Seksi Baru</span>
          </button>
        )}
      </div>

      {/* SECTION 1: Event Detail Hero, WhatsApp Share & Drive Link */}
      <EventDetailCard
        event={event}
        onOpenDriveModal={() => setIsDriveAlertOpen(true)}
      />

      {/* SECTION 2: Notulensi Acara & Rapat */}
      <NotulensiCard
        eventId={event.id}
        meetingId={latestMeeting?.id}
        title={`Notulensi: ${event.title}`}
        notes={event.notulensiText || latestMeeting?.notes}
        date={event.startDate}
        isRead={latestMeeting?.isRead}
        currentUserRole={currentUser.role}
      />

      {/* SECTION 4: Modul Rancangan Anggaran Biaya (RAB Acara Siap Cetak Proposal) */}
      <EventRABSection
        eventId={event.id}
        event={event}
        budgetItems={budgetItems}
        currentUserRole={currentUser.role}
      />

      {/* SECTION 5: Seksi Kepanitiaan & Task Board (Khusus untuk Acara Besar / Proker) */}
      {!isRapat && (hasSections || isOfficer) && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-ink">
                Seksi Kepanitiaan &amp; SOP
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-ink-muted">
              {event.sections.length} Seksi Terdaftar
            </span>
          </div>

          <CommitteeSection
            sections={event.sections}
            currentUserId={currentUser.id}
            currentUserRole={currentUser.role}
            allMembers={allMembers}
            onOpenAddSectionModal={() => setIsAddSectionModalOpen(true)}
            onOpenAddTaskModal={handleOpenAddTask}
          />
        </div>
      )}

      {/* SECTION 6 (Paling Bawah): Zona Bahaya / Hapus Acara Khusus Pengurus */}
      {isOfficer && (
        <div className="pt-4 border-t border-edge">
          <div className="p-4 rounded-2xl bg-red-50/20 dark:bg-red-950/15 border border-red-200/60 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Trash2 className="h-4 w-4 text-red-500" />
                <span>Pengaturan Kegiatan &amp; Zona Bahaya</span>
              </h4>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Hapus seluruh kepanitiaan, data rincian anggaran, notulensi, dan tugas acara ini secara permanen.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="h-10 min-h-[40px] px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus Acara Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog Tambah Tugas Ad-Hoc */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        sections={event.sections}
        defaultSectionId={targetSectionId}
      />

      {/* Modal Dialog Tambah Seksi Baru */}
      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={() => setIsAddSectionModalOpen(false)}
        eventId={event.id}
      />

      {/* Alert Modal Tautan Google Drive Belum Diatur */}
      {isDriveAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full border border-edge shadow-xl space-y-3 text-center">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center">
              <Folder className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-ink">Folder Drive Belum Diatur</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Pengurus belum menautkan tautan Google Drive untuk kegiatan ini. Silakan hubungi Sekretaris atau Koordinator Acara.
            </p>
            <button
              type="button"
              onClick={() => setIsDriveAlertOpen(false)}
              className="w-full h-11 bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold rounded-xl border border-edge transition-colors min-h-[44px] cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Acara */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-edge shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/60 text-primary flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-ink">
                Hapus Acara Ini?
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Apakah Anda yakin ingin menghapus acara ini? Data presensi dan agenda terkait akan ikut terhapus.
              </p>
            </div>

            {deleteErrorMessage && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-primary font-medium">
                {deleteErrorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="h-9 px-3.5 rounded-lg border border-edge text-xs font-semibold text-ink hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? "Menghapus..." : "Hapus Acara"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
