"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Calendar,
  Clock,
  QrCode,
  Share2,
  Trash2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MessageSquare,
  X,
  Loader2,
} from "lucide-react";
import { Role, TargetAudience } from "@prisma/client";
import { NotulensiCard } from "./NotulensiCard";
import { deleteMeeting } from "@/actions/acara";
import { getTargetAudienceBadge } from "@/utils/audience";
import {
  generateWhatsAppLink,
  formatEventBroadcastMessage,
} from "@/utils/whatsappShare";

const MeetingQrModal = dynamic(
  () => import("@/components/home/MeetingQrModal").then((mod) => mod.MeetingQrModal),
  { ssr: false }
);

export interface RapatAttendanceItem {
  id: string;
  checkedAt: Date | string;
  user: {
    id: string;
    name: string;
    classGrade?: string | null;
    image?: string | null;
    mainDivision?: string | null;
  };
}

export interface RapatDetailData {
  id: string;
  title: string;
  date: Date | string;
  targetAudience: TargetAudience;
  notes?: string | null;
  eventId?: string | null;
  event?: {
    id: string;
    title: string;
  } | null;
  attendances: RapatAttendanceItem[];
  isRead?: boolean;
}

interface RapatDetailClientViewProps {
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
  meeting: RapatDetailData;
}

export function RapatDetailClientView({
  currentUser,
  meeting,
}: RapatDetailClientViewProps) {
  const router = useRouter();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOfficer =
    currentUser.role === Role.ADMIN || currentUser.role === Role.OPERATOR;

  const mDate = new Date(meeting.date);
  const dateFormatted = !isNaN(mDate.getTime())
    ? mDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : "-";

  const audienceBadge = getTargetAudienceBadge(meeting.targetAudience);

  // Generator 1-Klik Broadcast Jarkom WhatsApp
  const handleShareWA = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const message = formatEventBroadcastMessage(
      {
        id: meeting.id,
        title: meeting.title,
        startDate: meeting.date,
        endDate: meeting.date,
        description: meeting.notes || "Rapat koordinasi dan evaluasi teknis kegiatan.",
        location: "Ruang Ekskul Saba / Lab Komputer",
      },
      origin
    );

    const waLink = generateWhatsAppLink("", message);
    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  const handleDeleteMeeting = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await deleteMeeting(meeting.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/acara");
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Gagal menghapus sesi rapat. Terjadi kesalahan internal server.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Tombol Navigasi Kembali */}
      <div className="flex items-center justify-between">
        <Link
          href="/acara"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Timeline Acara</span>
        </Link>

        {meeting.event && (
          <Link
            href={`/acara/${meeting.event.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bagian dari: {meeting.event.title}</span>
          </Link>
        )}
      </div>

      {/* Hero Header Sesi Rapat */}
      <section className="card-solid bg-card p-6 rounded-2xl border border-edge shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Sesi Rapat Koordinasi</span>
            </span>

            {audienceBadge && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${audienceBadge.badgeClass}`}
              >
                {audienceBadge.label}
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-ink-muted">
            ID: MEET-{meeting.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
            {meeting.title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted flex items-center gap-2 mt-1.5">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-ink">{dateFormatted}</span>
          </p>
        </div>

        {/* Action Buttons: Jarkom Broadcast WA & Tampilkan QR */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-edge/60">
          <button
            type="button"
            onClick={handleShareWA}
            className="h-11 min-h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            title="Kirim Pesan Siaran Rapat Resmi ke WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span>Broadcast Jarkom WA</span>
          </button>

          {isOfficer && (
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="h-11 min-h-11 px-4 rounded-xl bg-card hover:bg-surface-container text-ink border border-edge text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              title="Tampilkan QR Presensi Sesi Rapat Ini"
            >
              <QrCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Tampilkan QR Presensi</span>
            </button>
          )}
        </div>
      </section>

      {/* Kartu Notulensi Sesi Rapat */}
      <NotulensiCard
        eventId={meeting.eventId || undefined}
        meetingId={meeting.id}
        title={`Notulensi: ${meeting.title}`}
        notes={meeting.notes}
        date={meeting.date}
        isRead={meeting.isRead}
        currentUserRole={currentUser.role}
      />

      {/* Rekapitulasi Presensi Kehadiran Anggota */}
      <section className="card-solid bg-card p-5 sm:p-6 rounded-2xl border border-edge shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 className="text-sm font-bold text-ink">
              Rekapitulasi Kehadiran Presensi
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-container border border-edge text-ink">
            {meeting.attendances.length} Peserta Hadir
          </span>
        </div>

        {meeting.attendances.length === 0 ? (
          <div className="py-8 text-center bg-surface-container-low rounded-xl border border-edge/60 space-y-1.5">
            <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs text-ink-muted">
              Belum ada anggota yang mencatat presensi pada sesi rapat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-edge/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low border-b border-edge text-ink-muted font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Anggota</th>
                  <th className="px-4 py-3">Kelas / Gen</th>
                  <th className="px-4 py-3">Divisi</th>
                  <th className="px-4 py-3 text-right">Waktu Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge/60 bg-card">
                {meeting.attendances.map((item) => {
                  const checkTime = new Date(item.checkedAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low/50">
                      <td className="px-4 py-2.5 font-semibold text-ink">
                        {item.user.name}
                      </td>
                      <td className="px-4 py-2.5 text-ink-secondary">
                        {item.user.classGrade?.replace("_", " ") || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-ink-secondary">
                        {item.user.mainDivision || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {checkTime} WIB
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Zona Bahaya / Hapus Sesi Rapat (Khusus Pengurus) */}
      {isOfficer && (
        <section className="pt-2 border-t border-edge">
          <div className="card-solid bg-card p-5 rounded-2xl border border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Pengaturan Sesi Rapat &amp; Zona Bahaya</span>
              </h4>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Hapus sesi rapat ini beserta notulensi dan riwayat presensi kehadirannya secara permanen.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="h-11 min-h-11 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus Sesi Rapat Ini</span>
            </button>
          </div>
        </section>
      )}

      {/* Modal Dialog QR Code Pengurus */}
      <MeetingQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        meetingId={meeting.id}
      />

      {/* Modal Konfirmasi Hapus Sesi Rapat */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-ink">Hapus Sesi Rapat?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger font-medium">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2 text-xs text-ink-secondary leading-relaxed">
              <p>
                Apakah Anda yakin ingin menghapus sesi rapat{" "}
                <strong className="text-ink">"{meeting.title}"</strong>?
              </p>
              <p className="text-danger font-medium">
                Tindakan ini tidak dapat dibatalkan. Riwayat notulensi dan catatan presensi kehadiran pada sesi rapat ini akan terhapus permanen.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-edge">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="h-11 min-h-11 px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteMeeting}
                disabled={isDeleting}
                className="h-11 min-h-11 px-5 rounded-xl bg-danger hover:bg-danger/90 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeleting ? "Menghapus..." : "Hapus Rapat"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
