"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Folder,
  FileText,
  MessageSquare,
  Layers,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { createEvent, createMeeting, CreateEventInput } from "@/actions/acara";
import { TargetAudience } from "@prisma/client";

interface AdminEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  parentEvents?: { id: string; title: string }[];
}

type EventCategoryType = "RAPAT" | "ACARA_BESAR";

interface RapatFormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  targetAudience: TargetAudience;
  eventId: string;
  location: string;
  notes: string;
}

export function AdminEventModal({
  isOpen,
  onClose,
  onSuccess,
  parentEvents = [],
}: AdminEventModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [categoryType, setCategoryType] = useState<EventCategoryType>("RAPAT");

  // State untuk form Rapat Singkat (1 Hari)
  const [rapatForm, setRapatForm] = useState<RapatFormState>({
    title: "",
    date: "",
    startTime: "09:00",
    endTime: "11:30",
    targetAudience: TargetAudience.ALL,
    eventId: "",
    location: "Ruang Eksploit / Lab Komputer",
    notes: "",
  });

  // State untuk form Program Kerja / Acara Besar
  const [acaraForm, setAcaraForm] = useState<CreateEventInput>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    targetAudience: TargetAudience.ALL,
    driveUrl: "",
    notulensiText: "",
    autoGenerateSOP: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setStep(1);
    setCategoryType("RAPAT");
    setErrorMessage(null);
    onClose();
  };

  const handleSelectType = (type: EventCategoryType) => {
    setCategoryType(type);
    setStep(2);
    setErrorMessage(null);
  };

  const handleSubmitRapat = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!rapatForm.title.trim()) {
      setErrorMessage("Nama rapat/agenda wajib diisi.");
      return;
    }

    if (!rapatForm.date) {
      setErrorMessage("Tanggal rapat wajib ditentukan.");
      return;
    }

    const startDateTime = new Date(`${rapatForm.date}T${rapatForm.startTime}:00`);
    const endDateTime = new Date(`${rapatForm.date}T${rapatForm.endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setErrorMessage("Format tanggal atau waktu tidak valid.");
      return;
    }

    if (endDateTime < startDateTime) {
      setErrorMessage("Jam selesai tidak boleh sebelum jam mulai.");
      return;
    }

    setIsLoading(true);

    try {
      const combinedNotes = [
        rapatForm.location ? `Lokasi: ${rapatForm.location.trim()}` : "",
        rapatForm.notes ? rapatForm.notes.trim() : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await createMeeting({
        title: rapatForm.title.trim(),
        date: startDateTime.toISOString(),
        targetAudience: rapatForm.targetAudience,
        eventId: rapatForm.eventId.trim() ? rapatForm.eventId.trim() : null,
        notes: combinedNotes || undefined,
      });

      if (res.success) {
        onSuccess?.();
        handleResetAndClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menyimpan rapat.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAcaraBesar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!acaraForm.title.trim()) {
      setErrorMessage("Nama kegiatan wajib diisi.");
      return;
    }

    if (!acaraForm.startDate || !acaraForm.endDate) {
      setErrorMessage("Tanggal mulai dan selesai kegiatan wajib ditentukan.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await createEvent({
        title: acaraForm.title.trim(),
        description: acaraForm.description?.trim() || undefined,
        startDate: acaraForm.startDate,
        endDate: acaraForm.endDate,
        targetAudience: acaraForm.targetAudience,
        driveUrl: acaraForm.driveUrl?.trim() || undefined,
        notulensiText: acaraForm.notulensiText?.trim() || undefined,
        autoGenerateSOP: acaraForm.autoGenerateSOP,
      });

      if (res.success) {
        onSuccess?.();
        handleResetAndClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menyimpan kegiatan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-[#27344A] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#27344A] bg-slate-50 dark:bg-[#101622]/60">
          <div className="flex items-center gap-2.5">
            {/* Naked Icon */}
            <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#E2E8F0]">
                {step === 1
                  ? "Pilih Jenis Agenda Kegiatan"
                  : categoryType === "RAPAT"
                  ? "Buat Rapat / Agenda Singkat"
                  : "Buat Program Kerja / Acara Besar"}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Khusus Pengurus &amp; Operator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Pemilihan Jenis Agenda */}
        {step === 1 && (
          <div className="p-5 space-y-4 overflow-y-auto">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pilih format agenda yang sesuai untuk menyesuaikan formulir dan pengaturan kepanitiaan:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {/* Card Opsi 1: Rapat Singkat */}
              <button
                type="button"
                onClick={() => handleSelectType("RAPAT")}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#27344A] bg-slate-50/50 dark:bg-[#101622]/40 hover:bg-slate-100/70 dark:hover:bg-[#101622] transition-all text-left group cursor-pointer space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Naked Icon: Zero decorative box wrappers */}
                    <MessageSquare className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-[#E2E8F0] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        Rapat / Agenda Singkat (1 Hari)
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        Format Presensi QR Cepat
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-1">
                  Untuk rapat pleno, briefing teknis mingguan, atau rapat koordinasi proker. Mendukung penautan ke proker induk (Nested Card) atau rapat mandiri.
                </p>
              </button>

              {/* Card Opsi 2: Program Kerja / Acara Besar */}
              <button
                type="button"
                onClick={() => handleSelectType("ACARA_BESAR")}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#27344A] bg-slate-50/50 dark:bg-[#101622]/40 hover:bg-slate-100/70 dark:hover:bg-[#101622] transition-all text-left group cursor-pointer space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Naked Icon: Zero decorative box wrappers */}
                    <Layers className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-[#E2E8F0] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        Program Kerja / Acara Besar (Parent Mega-Card)
                      </h3>
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                        Workspace &amp; Seksi SOP
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-1">
                  Untuk workshop, expo lomba, studi banding, atau proker berskala besar dengan rentang hari, folder Google Drive, RAB, dan seksi panitia otomatis.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Formulir Input Sesuai Jenis Agenda */}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigasi Balik ke Step 1 */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-[#101622]/40 border-b border-slate-200 dark:border-[#27344A] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#E2E8F0] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Ganti Jenis Agenda</span>
              </button>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {categoryType === "RAPAT" ? "Format Rapat" : "Format Proker"}
              </span>
            </div>

            {/* FORMULIR RAPAT SINGKAT */}
            {categoryType === "RAPAT" && (
              <form onSubmit={handleSubmitRapat} className="p-5 space-y-4 overflow-y-auto flex-1">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Judul Rapat */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                    Nama Rapat / Agenda <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rapat Koordinasi Panitia ExploIT Fest"
                    value={rapatForm.title}
                    onChange={(e) => setRapatForm({ ...rapatForm, title: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>

                {/* Sasaran Angkatan (TargetAudience) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                    Sasaran Peserta / Privasi Angkatan <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={rapatForm.targetAudience}
                    onChange={(e) =>
                      setRapatForm({
                        ...rapatForm,
                        targetAudience: e.target.value as TargetAudience,
                      })
                    }
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  >
                    <option value={TargetAudience.ALL}>Semua Angkatan (Publik Organisasi)</option>
                    <option value={TargetAudience.GEN_20}>Khusus Kelas 11 (Gen 20)</option>
                    <option value={TargetAudience.GEN_21}>Khusus Kelas 10 (Gen 21)</option>
                  </select>
                </div>

                {/* Hubungkan ke Proker Induk (Contextual Grouping) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                    Hubungkan ke Program Kerja Induk (Opsional)
                  </label>
                  <select
                    value={rapatForm.eventId}
                    onChange={(e) => setRapatForm({ ...rapatForm, eventId: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  >
                    <option value="">-- Rapat Mandiri / Tanpa Proker Induk --</option>
                    {parentEvents.map((pe) => (
                      <option key={pe.id} value={pe.id}>
                        {pe.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Jika dipilih, rapat akan bersarang di dalam kartu proker tersebut (Nested Mega-Card).
                  </p>
                </div>

                {/* Tanggal & Waktu Jam */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                      Tanggal <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={rapatForm.date}
                      onChange={(e) => setRapatForm({ ...rapatForm, date: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                      Jam Mulai (WIB) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={rapatForm.startTime}
                      onChange={(e) => setRapatForm({ ...rapatForm, startTime: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                      Jam Selesai (WIB) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={rapatForm.endTime}
                      onChange={(e) => setRapatForm({ ...rapatForm, endTime: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>
                </div>

                {/* Lokasi Rapat */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                    Lokasi / Tempat Rapat
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Lab Komputer 2 / Google Meet"
                    value={rapatForm.location}
                    onChange={(e) => setRapatForm({ ...rapatForm, location: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>

                {/* Notulensi / Pokok Bahasan Awal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Pokok Bahasan / Notulensi Rapat (Opsional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Poin-poin kesepakatan atau agenda utama pembahasan..."
                    value={rapatForm.notes}
                    onChange={(e) => setRapatForm({ ...rapatForm, notes: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 mt-2 border-t border-slate-200 dark:border-[#27344A] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    disabled={isLoading}
                    className="h-11 min-h-11 px-4 rounded-xl border border-slate-200 dark:border-[#27344A] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 min-h-11 px-5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isLoading ? "Menyimpan..." : "Simpan Jadwal Rapat"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* FORMULIR ACARA BESAR */}
            {categoryType === "ACARA_BESAR" && (
              <form onSubmit={handleSubmitAcaraBesar} className="p-5 space-y-4 overflow-y-auto flex-1">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Nama Kegiatan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                    Nama Program Kerja / Acara <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Workshop ExploIT Fest & Web Competition"
                    value={acaraForm.title}
                    onChange={(e) => setAcaraForm({ ...acaraForm, title: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>

                {/* Sasaran Angkatan (TargetAudience) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                    Sasaran Peserta / Privasi Angkatan <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={acaraForm.targetAudience}
                    onChange={(e) =>
                      setAcaraForm({
                        ...acaraForm,
                        targetAudience: e.target.value as TargetAudience,
                      })
                    }
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  >
                    <option value={TargetAudience.ALL}>Semua Angkatan (Publik Organisasi)</option>
                    <option value={TargetAudience.GEN_20}>Khusus Kelas 11 (Gen 20)</option>
                    <option value={TargetAudience.GEN_21}>Khusus Kelas 10 (Gen 21)</option>
                  </select>
                </div>

                {/* Tanggal & Waktu Mulai & Selesai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                      Waktu Mulai <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={acaraForm.startDate}
                      onChange={(e) => setAcaraForm({ ...acaraForm, startDate: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                      Waktu Selesai <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={acaraForm.endDate}
                      onChange={(e) => setAcaraForm({ ...acaraForm, endDate: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>
                </div>

                {/* Deskripsi & Lokasi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] block">
                    Lokasi &amp; Rincian Kegiatan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Aula Utama SMA 1 & Lab Komputer Eksploit"
                    value={acaraForm.description || ""}
                    onChange={(e) => setAcaraForm({ ...acaraForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                  />
                </div>

                {/* Tautan Google Drive Acara */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Tautan Root Folder Google Drive Acara</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={acaraForm.driveUrl || ""}
                    onChange={(e) => setAcaraForm({ ...acaraForm, driveUrl: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>

                {/* Notulensi / Kesepakatan Awal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-[#E2E8F0] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Notulensi Koordinasi Awal (Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Poin-poin kesepakatan rapat koordinasi awal panitia..."
                    value={acaraForm.notulensiText || ""}
                    onChange={(e) => setAcaraForm({ ...acaraForm, notulensiText: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#27344A] bg-white dark:bg-[#101622] text-slate-900 dark:text-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                  />
                </div>

                {/* Inisialisasi Seksi SOP Otomatis */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#101622]/60 border border-slate-200 dark:border-[#27344A] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acaraForm.autoGenerateSOP}
                    onChange={(e) => setAcaraForm({ ...acaraForm, autoGenerateSOP: e.target.checked })}
                    className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-[#E2E8F0] block">
                      Inisialisasi Seksi &amp; SOP Standar
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Otomatis membuat Seksi Kesekretariatan, Acara, dan Humas.
                    </span>
                  </div>
                </label>

                {/* Action Buttons */}
                <div className="pt-3 mt-2 border-t border-slate-200 dark:border-[#27344A] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    disabled={isLoading}
                    className="h-11 min-h-11 px-4 rounded-xl border border-slate-200 dark:border-[#27344A] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 min-h-11 px-5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{isLoading ? "Menyimpan..." : "Simpan Agenda Proker"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
