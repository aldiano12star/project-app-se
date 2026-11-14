"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Folder,
  FileText,
  MessageSquare,
  Layers,
  ArrowLeft,
  CheckCircle,
  Search,
  Users,
} from "lucide-react";
import {
  createEvent,
  updateEvent,
  createMeeting,
  updateMeeting,
  CreateEventInput,
} from "@/actions/acara";
import { TargetAudience } from "@prisma/client";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { Modal } from "@/components/ui/Modal";

export interface AdminEventInitialData {
  id: string;
  type: "RAPAT" | "ACARA_BESAR";
  title: string;
  description?: string | null;
  startDate?: Date | string;
  endDate?: Date | string;
  targetAudience: TargetAudience;
  targetUserIds?: string[];
  eventId?: string | null;
  driveUrl?: string | null;
  notulensiText?: string | null;
  notes?: string | null;
}

interface AdminEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  parentEvents?: { id: string; title: string }[];
  allMembers?: {
    id: string;
    name: string;
    role?: string;
    classGrade?: string | null;
    mainDivision?: string | null;
  }[];
  initialData?: AdminEventInitialData | null;
}

type EventCategoryType = "RAPAT" | "ACARA_BESAR";

interface RapatFormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  targetAudience: TargetAudience;
  targetUserIds: string[];
  eventId: string;
  location: string;
  notes: string;
}

const DIVISIONS = [
  "PROGRAMMING",
  "DESIGN",
  "PHOTOGRAPHY",
  "CINEMATOGRAPHY",
  "TECHNOPRENEURSHIP",
];

/**
 * Memformat objek Date atau ISO string ke format standar input datetime-local: "YYYY-MM-DDThh:mm"
 * Memperhitungkan zona waktu lokal pengguna agar tidak terjadi pergeseran jam/tanggal.
 */
function formatToDateTimeLocal(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Memformat objek Date atau ISO string ke format tanggal lokal: "YYYY-MM-DD"
 */
function formatToLocalDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());

  return `${year}-${month}-${day}`;
}

export function AdminEventModal({
  isOpen,
  onClose,
  onSuccess,
  parentEvents = [],
  allMembers = [],
  initialData,
}: AdminEventModalProps) {
  useBodyScrollLock(isOpen);
  const [step, setStep] = useState<1 | 2>(initialData ? 2 : 1);
  const [categoryType, setCategoryType] = useState<EventCategoryType>(
    initialData ? initialData.type : "RAPAT"
  );

  // State untuk form Rapat Singkat (1 Hari)
  const [rapatForm, setRapatForm] = useState<RapatFormState>({
    title: "",
    date: "",
    startTime: "09:00",
    endTime: "11:30",
    targetAudience: TargetAudience.ALL,
    targetUserIds: [],
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
    targetUserIds: [],
    driveUrl: "",
    notulensiText: "",
    autoGenerateSOP: true,
  });

  // State pencarian & filter divisi anggota untuk target audience custom
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>("ALL");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sinkronisasi data saat modal dibuka dalam mode Edit atau Create
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setStep(2);
      setCategoryType(initialData.type);
      setErrorMessage(null);

      if (initialData.type === "RAPAT") {
        const d = initialData.startDate ? new Date(initialData.startDate) : new Date();
        const dateStr = formatToLocalDate(d);
        const hours = !isNaN(d.getTime())
          ? String(d.getHours()).padStart(2, "0")
          : "09";
        const minutes = !isNaN(d.getTime())
          ? String(d.getMinutes()).padStart(2, "0")
          : "00";

        setRapatForm({
          title: initialData.title || "",
          date: dateStr,
          startTime: `${hours}:${minutes}`,
          endTime: "12:00",
          targetAudience: initialData.targetAudience || TargetAudience.ALL,
          targetUserIds: initialData.targetUserIds || [],
          eventId: initialData.eventId || "",
          location: "",
          notes: initialData.notes || "",
        });
      } else {
        const startStr = formatToDateTimeLocal(initialData.startDate);
        const endStr = formatToDateTimeLocal(initialData.endDate);

        setAcaraForm({
          title: initialData.title || "",
          description: initialData.description || "",
          startDate: startStr,
          endDate: endStr,
          targetAudience: initialData.targetAudience || TargetAudience.ALL,
          targetUserIds: initialData.targetUserIds || [],
          driveUrl: initialData.driveUrl || "",
          notulensiText: initialData.notulensiText || "",
          autoGenerateSOP: false,
        });
      }
    } else {
      setStep(1);
      setCategoryType("RAPAT");
      setErrorMessage(null);
      setRapatForm({
        title: "",
        date: "",
        startTime: "09:00",
        endTime: "11:30",
        targetAudience: TargetAudience.ALL,
        targetUserIds: [],
        eventId: "",
        location: "Ruang Eksploit / Lab Komputer",
        notes: "",
      });
      setAcaraForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        targetAudience: TargetAudience.ALL,
        targetUserIds: [],
        driveUrl: "",
        notulensiText: "",
        autoGenerateSOP: true,
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setStep(1);
    setCategoryType("RAPAT");
    setErrorMessage(null);
    setMemberSearchQuery("");
    setSelectedDivisionFilter("ALL");
    onClose();
  };

  const handleSelectType = (type: EventCategoryType) => {
    setCategoryType(type);
    setStep(2);
    setErrorMessage(null);
  };

  // Helper toggle member checklist
  const handleToggleMember = (userId: string, isRapat: boolean) => {
    if (isRapat) {
      setRapatForm((prev) => ({
        ...prev,
        targetUserIds: prev.targetUserIds.includes(userId)
          ? prev.targetUserIds.filter((id) => id !== userId)
          : [...prev.targetUserIds, userId],
      }));
    } else {
      setAcaraForm((prev) => ({
        ...prev,
        targetUserIds: (prev.targetUserIds || []).includes(userId)
          ? (prev.targetUserIds || []).filter((id) => id !== userId)
          : [...(prev.targetUserIds || []), userId],
      }));
    }
  };

  const handleSelectAll = (isRapat: boolean) => {
    const allIds = allMembers.map((m) => m.id);
    if (isRapat) {
      setRapatForm((prev) => ({ ...prev, targetUserIds: allIds }));
    } else {
      setAcaraForm((prev) => ({ ...prev, targetUserIds: allIds }));
    }
  };

  const handleDeselectAll = (isRapat: boolean) => {
    if (isRapat) {
      setRapatForm((prev) => ({ ...prev, targetUserIds: [] }));
    } else {
      setAcaraForm((prev) => ({ ...prev, targetUserIds: [] }));
    }
  };

  const handleSelectDivision = (div: string, isRapat: boolean) => {
    const divUserIds = allMembers
      .filter((m) => m.mainDivision?.toUpperCase() === div.toUpperCase())
      .map((m) => m.id);

    if (isRapat) {
      setRapatForm((prev) => ({
        ...prev,
        targetUserIds: Array.from(new Set([...prev.targetUserIds, ...divUserIds])),
      }));
    } else {
      setAcaraForm((prev) => ({
        ...prev,
        targetUserIds: Array.from(
          new Set([...(prev.targetUserIds || []), ...divUserIds])
        ),
      }));
    }
  };

  const filteredMembers = allMembers.filter((m) => {
    const matchesQuery =
      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      (m.mainDivision || "").toLowerCase().includes(memberSearchQuery.toLowerCase());
    const matchesDiv =
      selectedDivisionFilter === "ALL" ||
      m.mainDivision?.toUpperCase() === selectedDivisionFilter.toUpperCase();
    return matchesQuery && matchesDiv;
  });

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

    if (
      rapatForm.targetAudience === TargetAudience.CUSTOM &&
      rapatForm.targetUserIds.length === 0
    ) {
      setErrorMessage("Pilih minimal satu anggota untuk target peserta khusus.");
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

      const res = initialData
        ? await updateMeeting(initialData.id, {
            title: rapatForm.title.trim(),
            date: startDateTime.toISOString(),
            targetAudience: rapatForm.targetAudience,
            targetUserIds:
              rapatForm.targetAudience === TargetAudience.CUSTOM
                ? rapatForm.targetUserIds
                : undefined,
            eventId: rapatForm.eventId.trim() ? rapatForm.eventId.trim() : null,
            notes: combinedNotes || undefined,
          })
        : await createMeeting({
            title: rapatForm.title.trim(),
            date: startDateTime.toISOString(),
            targetAudience: rapatForm.targetAudience,
            targetUserIds:
              rapatForm.targetAudience === TargetAudience.CUSTOM
                ? rapatForm.targetUserIds
                : undefined,
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

    if (
      acaraForm.targetAudience === TargetAudience.CUSTOM &&
      (!acaraForm.targetUserIds || acaraForm.targetUserIds.length === 0)
    ) {
      setErrorMessage("Pilih minimal satu anggota untuk target peserta khusus.");
      return;
    }

    setIsLoading(true);

    try {
      const res = initialData
        ? await updateEvent(initialData.id, {
            title: acaraForm.title.trim(),
            description: acaraForm.description?.trim() || undefined,
            startDate: acaraForm.startDate,
            endDate: acaraForm.endDate,
            targetAudience: acaraForm.targetAudience,
            targetUserIds:
              acaraForm.targetAudience === TargetAudience.CUSTOM
                ? acaraForm.targetUserIds
                : undefined,
            driveUrl: acaraForm.driveUrl?.trim() || undefined,
            notulensiText: acaraForm.notulensiText?.trim() || undefined,
          })
        : await createEvent({
            title: acaraForm.title.trim(),
            description: acaraForm.description?.trim() || undefined,
            startDate: acaraForm.startDate,
            endDate: acaraForm.endDate,
            targetAudience: acaraForm.targetAudience,
            targetUserIds:
              acaraForm.targetAudience === TargetAudience.CUSTOM
                ? acaraForm.targetUserIds
                : undefined,
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
    <Modal isOpen={isOpen} onClose={handleResetAndClose} className="max-w-lg">
      <div className="relative w-full rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            {/* Naked Icon */}
            <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <div>
              <h2 className="text-sm font-bold text-ink">
                {initialData
                  ? categoryType === "RAPAT"
                    ? "Edit Sesi Rapat"
                    : "Edit Program Kerja"
                  : step === 1
                  ? "Pilih Jenis Agenda Kegiatan"
                  : categoryType === "RAPAT"
                  ? "Buat Rapat / Agenda Singkat"
                  : "Buat Program Kerja / Acara Besar"}
              </h2>
              <p className="text-xs text-ink-muted">Khusus Pengurus &amp; Operator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Pemilihan Jenis Agenda */}
        {step === 1 && (
          <div className="p-5 space-y-4 overflow-y-auto">
            <p className="text-xs text-ink-secondary">
              Pilih format agenda yang sesuai untuk menyesuaikan formulir dan pengaturan kepanitiaan:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {/* Card Opsi 1: Rapat Singkat */}
              <button
                type="button"
                onClick={() => handleSelectType("RAPAT")}
                className="p-4 rounded-xl border border-edge bg-surface-container-low/40 hover:bg-surface-container-low transition-all text-left group cursor-pointer space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Naked Icon */}
                    <MessageSquare className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
                    <div>
                      <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                        Rapat / Agenda Singkat (1 Hari)
                      </h3>
                      <span className="text-xs font-semibold text-ink-secondary px-2 py-0.5 rounded bg-surface-container border border-edge">
                        Format Presensi QR Cepat
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-ink-muted group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed pl-1">
                  Untuk rapat pleno, briefing mingguan, atau koordinasi proker. Mendukung penautan ke proker induk (Nested Card) atau rapat mandiri.
                </p>
              </button>

              {/* Card Opsi 2: Program Kerja / Acara Besar */}
              <button
                type="button"
                onClick={() => handleSelectType("ACARA_BESAR")}
                className="p-4 rounded-xl border border-edge bg-surface-container-low/40 hover:bg-surface-container-low transition-all text-left group cursor-pointer space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Naked Icon */}
                    <Layers className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
                    <div>
                      <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                        Program Kerja / Acara Besar (Parent Mega-Card)
                      </h3>
                      <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded bg-primary-subtle border border-primary/20">
                        Workspace &amp; Seksi SOP
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-ink-muted group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed pl-1">
                  Untuk workshop, expo lomba, studi banding, atau proker berskala besar dengan rentang hari, folder Google Drive, RAB, dan seksi panitia otomatis.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Formulir Input Sesuai Jenis Agenda */}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigasi Balik ke Step 1 (Hanya jika mode Create baru) */}
            {!initialData && (
              <div className="px-5 py-2.5 bg-surface-container-low/30 border-b border-edge flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ganti Jenis Agenda</span>
                </button>
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  {categoryType === "RAPAT" ? "Format Rapat" : "Format Proker"}
                </span>
              </div>
            )}

            {/* FORMULIR RAPAT SINGKAT */}
            {categoryType === "RAPAT" && (
              <form onSubmit={handleSubmitRapat} className="p-5 space-y-4 overflow-y-auto flex-1">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Judul Rapat */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink block">
                    Nama Rapat / Agenda <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rapat Koordinasi Panitia ExploIT Fest"
                    value={rapatForm.title}
                    onChange={(e) => setRapatForm({ ...rapatForm, title: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Sasaran Angkatan / Privasi (TargetAudience) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink block">
                    Sasaran Peserta / Privasi Angkatan <span className="text-primary">*</span>
                  </label>
                  <select
                    value={rapatForm.targetAudience}
                    onChange={(e) =>
                      setRapatForm({
                        ...rapatForm,
                        targetAudience: e.target.value as TargetAudience,
                      })
                    }
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value={TargetAudience.ALL}>Semua Angkatan (Publik Organisasi)</option>
                    <option value={TargetAudience.GEN_20}>Khusus Kelas 11 (Gen 20)</option>
                    <option value={TargetAudience.GEN_21}>Khusus Kelas 10 (Gen 21)</option>
                    <option value={TargetAudience.CUSTOM}>Peserta Khusus (Pilih Manual / Divisi)</option>
                  </select>
                </div>

                {/* MULTI-SELECT CHECKLIST JIKA CUSTOM */}
                {rapatForm.targetAudience === TargetAudience.CUSTOM && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-surface-container-low border border-edge">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-ink block">
                          Pilih Anggota Peserta Rapat <span className="text-primary">*</span>
                        </span>
                        <span className="text-xs text-ink-muted">
                          {rapatForm.targetUserIds.length} dari {allMembers.length} anggota terpilih
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleSelectAll(true)}
                          className="px-2 py-1 rounded-md bg-card text-ink hover:text-primary font-semibold border border-edge transition-colors cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeselectAll(true)}
                          className="px-2 py-1 rounded-md bg-card text-ink-muted hover:text-danger font-semibold border border-edge transition-colors cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    {/* Filter Cepat per Divisi */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-xs font-bold text-ink-muted mr-1">Divisi:</span>
                      {DIVISIONS.map((div) => (
                        <button
                          key={div}
                          type="button"
                          onClick={() => handleSelectDivision(div, true)}
                          className="px-2 py-0.5 rounded-full text-xs font-semibold bg-card border border-edge text-ink-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer"
                        >
                          +{div.slice(0, 4)}
                        </button>
                      ))}
                    </div>

                    {/* Filter Input Pencarian */}
                    <div className="relative">
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder="Saring nama atau divisi anggota..."
                        className="w-full h-8 pl-8 pr-2.5 bg-surface text-ink border border-edge rounded-lg text-xs outline-none focus:border-primary"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Daftar Checklist Anggota */}
                    <div className="max-h-44 overflow-y-auto space-y-1 p-1 bg-surface rounded-lg border border-edge">
                      {filteredMembers.length === 0 ? (
                        <p className="text-xs sm:text-sm text-ink-muted text-center py-3">
                          Tidak ada anggota yang cocok dengan pencarian.
                        </p>
                      ) : (
                        filteredMembers.map((member) => {
                          const isSelected = rapatForm.targetUserIds.includes(member.id);
                          return (
                            <label
                              key={member.id}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-purple-500/10 border-purple-500/40"
                                  : "bg-surface hover:bg-surface-container-low border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleMember(member.id, true)}
                                  className="h-4 w-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs sm:text-sm font-semibold text-ink truncate leading-tight">
                                      {member.name}
                                    </span>
                                    {member.role === "KOLABORATOR" && (
                                      <span className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                                        Kolaborator
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-ink-muted block truncate mt-0.5">
                                    {member.role === "KOLABORATOR"
                                      ? "Mitra Eksternal"
                                      : member.classGrade === "KELAS_10"
                                      ? "Gen 21"
                                      : member.classGrade === "KELAS_11"
                                      ? "Gen 20"
                                      : (member.classGrade || "").replace("_", " ")}{" "}
                                    • {member.mainDivision}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Hubungkan ke Proker Induk (Contextual Grouping) */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-ink block">
                    Hubungkan ke Program Kerja Induk (Opsional)
                  </label>
                  <select
                    value={rapatForm.eventId}
                    onChange={(e) => setRapatForm({ ...rapatForm, eventId: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">-- Rapat Mandiri / Tanpa Proker Induk --</option>
                    {parentEvents.map((pe) => (
                      <option key={pe.id} value={pe.id}>
                        {pe.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-muted">
                    Hanya program kerja jangka panjang resmi yang dapat menjadi induk rapat.
                  </p>
                </div>

                {/* Tanggal & Waktu Jam */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink block">
                      Tanggal <span className="text-primary">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={rapatForm.date}
                      onChange={(e) => setRapatForm({ ...rapatForm, date: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink block">
                      Jam Mulai (WIB) <span className="text-primary">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={rapatForm.startTime}
                      onChange={(e) => setRapatForm({ ...rapatForm, startTime: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink block">
                      Jam Selesai (WIB) <span className="text-primary">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={rapatForm.endTime}
                      onChange={(e) => setRapatForm({ ...rapatForm, endTime: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Lokasi Rapat */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink block">
                    Lokasi / Tempat Rapat
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Lab Komputer 2 / Google Meet"
                    value={rapatForm.location}
                    onChange={(e) => setRapatForm({ ...rapatForm, location: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Notulensi / Pokok Bahasan Awal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Pokok Bahasan / Notulensi Rapat (Opsional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Poin-poin kesepakatan atau agenda utama pembahasan..."
                    value={rapatForm.notes}
                    onChange={(e) => setRapatForm({ ...rapatForm, notes: e.target.value })}
                    className="w-full p-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 mt-2 border-t border-edge flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    disabled={isLoading}
                    className="h-11 min-h-11 px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
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
                  <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Nama Kegiatan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink block">
                    Nama Program Kerja / Acara <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Workshop ExploIT Fest & Web Competition"
                    value={acaraForm.title}
                    onChange={(e) => setAcaraForm({ ...acaraForm, title: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Sasaran Angkatan / Privasi (TargetAudience) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink block">
                    Sasaran Peserta / Privasi Angkatan <span className="text-primary">*</span>
                  </label>
                  <select
                    value={acaraForm.targetAudience}
                    onChange={(e) =>
                      setAcaraForm({
                        ...acaraForm,
                        targetAudience: e.target.value as TargetAudience,
                      })
                    }
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value={TargetAudience.ALL}>Semua Angkatan (Publik Organisasi)</option>
                    <option value={TargetAudience.GEN_20}>Khusus Kelas 11 (Gen 20)</option>
                    <option value={TargetAudience.GEN_21}>Khusus Kelas 10 (Gen 21)</option>
                    <option value={TargetAudience.CUSTOM}>Peserta Khusus (Pilih Manual / Divisi)</option>
                  </select>
                </div>

                {/* MULTI-SELECT CHECKLIST JIKA CUSTOM */}
                {acaraForm.targetAudience === TargetAudience.CUSTOM && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-surface-container-low border border-edge">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-ink block">
                          Pilih Anggota Peserta Kegiatan <span className="text-primary">*</span>
                        </span>
                        <span className="text-xs text-ink-muted">
                          {(acaraForm.targetUserIds || []).length} dari {allMembers.length} anggota terpilih
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleSelectAll(false)}
                          className="px-2 py-1 rounded-md bg-card text-ink hover:text-primary font-semibold border border-edge transition-colors cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeselectAll(false)}
                          className="px-2 py-1 rounded-md bg-card text-ink-muted hover:text-danger font-semibold border border-edge transition-colors cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    {/* Filter Cepat per Divisi */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-xs font-bold text-ink-muted mr-1">Divisi:</span>
                      {DIVISIONS.map((div) => (
                        <button
                          key={div}
                          type="button"
                          onClick={() => handleSelectDivision(div, false)}
                          className="px-2 py-0.5 rounded-full text-xs font-semibold bg-card border border-edge text-ink-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer"
                        >
                          +{div.slice(0, 4)}
                        </button>
                      ))}
                    </div>

                    {/* Filter Input Pencarian */}
                    <div className="relative">
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder="Saring nama atau divisi anggota..."
                        className="w-full h-8 pl-8 pr-2.5 bg-surface text-ink border border-edge rounded-lg text-xs outline-none focus:border-primary"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Daftar Checklist Anggota */}
                    <div className="max-h-44 overflow-y-auto space-y-1 p-1 bg-surface rounded-lg border border-edge">
                      {filteredMembers.length === 0 ? (
                        <p className="text-xs sm:text-sm text-ink-muted text-center py-3">
                          Tidak ada anggota yang cocok dengan pencarian.
                        </p>
                      ) : (
                        filteredMembers.map((member) => {
                          const isSelected = (acaraForm.targetUserIds || []).includes(member.id);
                          return (
                            <label
                              key={member.id}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-purple-500/10 border-purple-500/40"
                                  : "bg-surface hover:bg-surface-container-low border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleMember(member.id, false)}
                                  className="h-4 w-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs sm:text-sm font-semibold text-ink truncate leading-tight">
                                      {member.name}
                                    </span>
                                    {member.role === "KOLABORATOR" && (
                                      <span className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                                        Kolaborator
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-ink-muted block truncate mt-0.5">
                                    {member.role === "KOLABORATOR"
                                      ? "Mitra Eksternal"
                                      : member.classGrade === "KELAS_10"
                                      ? "Gen 21"
                                      : member.classGrade === "KELAS_11"
                                      ? "Gen 20"
                                      : (member.classGrade || "").replace("_", " ")}{" "}
                                    • {member.mainDivision}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Tanggal & Waktu Mulai & Selesai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink block">
                      Waktu Mulai <span className="text-primary">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={acaraForm.startDate}
                      onChange={(e) => setAcaraForm({ ...acaraForm, startDate: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink block">
                      Waktu Selesai <span className="text-primary">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={acaraForm.endDate}
                      onChange={(e) => setAcaraForm({ ...acaraForm, endDate: e.target.value })}
                      className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Deskripsi & Lokasi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink block">
                    Lokasi &amp; Rincian Kegiatan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Aula Utama SMA 1 & Lab Komputer Eksploit"
                    value={acaraForm.description || ""}
                    onChange={(e) => setAcaraForm({ ...acaraForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Tautan Google Drive Acara */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Tautan Root Folder Google Drive Acara</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={acaraForm.driveUrl || ""}
                    onChange={(e) => setAcaraForm({ ...acaraForm, driveUrl: e.target.value })}
                    className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Notulensi / Kesepakatan Awal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Notulensi Koordinasi Awal (Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Poin-poin kesepakatan rapat koordinasi awal panitia..."
                    value={acaraForm.notulensiText || ""}
                    onChange={(e) => setAcaraForm({ ...acaraForm, notulensiText: e.target.value })}
                    className="w-full p-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Inisialisasi Seksi SOP Otomatis */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-edge cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acaraForm.autoGenerateSOP}
                    onChange={(e) => setAcaraForm({ ...acaraForm, autoGenerateSOP: e.target.checked })}
                    className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-ink block">
                      Inisialisasi Seksi &amp; SOP Standar
                    </span>
                    <span className="text-ink-muted text-xs sm:text-sm">
                      Otomatis membuat Seksi Kesekretariatan, Acara, dan Humas.
                    </span>
                  </div>
                </label>

                {/* Action Buttons */}
                <div className="pt-3 mt-2 border-t border-edge flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    disabled={isLoading}
                    className="h-11 min-h-11 px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
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
    </Modal>
  );
}
