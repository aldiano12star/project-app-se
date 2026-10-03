"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Folder,
  FileText,
  Sparkles,
  MessageSquare,
  Layers,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { createEvent, CreateEventInput } from "@/actions/acara";

interface AdminEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type EventCategoryType = "RAPAT" | "ACARA_BESAR";

export function AdminEventModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminEventModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [categoryType, setCategoryType] = useState<EventCategoryType>("RAPAT");

  // State untuk form Rapat Singkat (1 Hari)
  const [rapatForm, setRapatForm] = useState({
    title: "",
    date: "",
    startTime: "09:00",
    endTime: "11:30",
    location: "Ruang Eksploit / Lab Komputer",
    notes: "",
  });

  // State untuk form Program Kerja / Acara Besar
  const [acaraForm, setAcaraForm] = useState<CreateEventInput>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
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
      const res = await createEvent({
        title: rapatForm.title.trim(),
        description: rapatForm.location.trim() || undefined,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        notulensiText: rapatForm.notes.trim() || undefined,
        autoGenerateSOP: false, // Rapat singkat tidak membuat seksi SOP kompleks
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                {step === 1
                  ? "Pilih Jenis Agenda Kegiatan"
                  : categoryType === "RAPAT"
                  ? "Buat Rapat / Agenda Singkat"
                  : "Buat Program Kerja / Acara Besar"}
              </h2>
              <p className="text-[11px] text-ink-muted">Khusus Pengurus &amp; Operator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
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
                className="p-4 rounded-xl border border-edge bg-surface-container-low/40 hover:bg-surface-container-low hover:border-blue-500/60 transition-all text-left group cursor-pointer space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Rapat / Agenda Singkat (1 Hari)
                      </h3>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40">
                        Format Cepat
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-ink-muted group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="text-xs text-ink-muted leading-relaxed pl-1">
                  Untuk rapat pleno, briefing teknis mingguan, atau koordinasi satu hari. Fokus pada notulensi dan daftar hadir presensi tanpa struktur kepanitiaan rumit.
                </p>
              </button>

              {/* Card Opsi 2: Program Kerja / Acara Besar */}
              <button
                type="button"
                onClick={() => handleSelectType("ACARA_BESAR")}
                className="p-4 rounded-xl border border-edge bg-surface-container-low/40 hover:bg-surface-container-low hover:border-primary/60 transition-all text-left group cursor-pointer space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-primary flex items-center justify-center">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                        Program Kerja / Acara Besar
                      </h3>
                      <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary-subtle">
                        Workspace &amp; Seksi SOP
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-ink-muted group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs text-ink-muted leading-relaxed pl-1">
                  Untuk workshop, expo lomba, studi banding, atau kegiatan berskala besar dengan rentang hari, folder Google Drive, dan pembagian seksi panitia otomatis.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Formulir Input Sesuai Jenis Agenda */}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigasi Balik ke Step 1 */}
            <div className="px-5 py-2.5 bg-surface-container-low/30 border-b border-edge flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Ganti Jenis Agenda</span>
              </button>
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                {categoryType === "RAPAT" ? "Format Rapat" : "Format Proker"}
              </span>
            </div>

            {/* FORMULIR RAPAT SINGKAT */}
            {categoryType === "RAPAT" && (
              <form onSubmit={handleSubmitRapat} className="p-5 space-y-4 overflow-y-auto flex-1">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-primary font-medium">
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
                    placeholder="Contoh: Rapat Pleno Mingguan Divisi Programming"
                    value={rapatForm.title}
                    onChange={(e) => setRapatForm({ ...rapatForm, title: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
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
                      className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                      className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                      className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                    className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Notulensi / Pokok Bahasan Awal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span>Pokok Bahasan / Notulensi Rapat (Opsional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Poin-poin kesepakatan atau agenda utama pembahasan..."
                    value={rapatForm.notes}
                    onChange={(e) => setRapatForm({ ...rapatForm, notes: e.target.value })}
                    className="w-full p-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 mt-2 border-t border-edge bg-card flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    disabled={isLoading}
                    className="h-11 min-h-[44px] px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-lg shadow-blue-950/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{isLoading ? "Menyimpan..." : "Simpan Jadwal Rapat"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* FORMULIR ACARA BESAR */}
            {categoryType === "ACARA_BESAR" && (
              <form onSubmit={handleSubmitAcaraBesar} className="p-5 space-y-4 overflow-y-auto flex-1">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-primary font-medium">
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
                    className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

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
                      className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                      className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                    className="w-full p-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Tautan Google Drive Acara */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink flex items-center gap-1">
                    <Folder className="h-3.5 w-3.5 text-amber-500" />
                    <span>Tautan Root Folder Google Drive Acara</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={acaraForm.driveUrl || ""}
                    onChange={(e) => setAcaraForm({ ...acaraForm, driveUrl: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Notulensi / Kesepakatan Awal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>Notulensi Koordinasi Awal (Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Poin-poin kesepakatan rapat koordinasi awal panitia..."
                    value={acaraForm.notulensiText || ""}
                    onChange={(e) => setAcaraForm({ ...acaraForm, notulensiText: e.target.value })}
                    className="w-full p-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Inisialisasi Seksi SOP Otomatis */}
                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-container-low/60 border border-edge cursor-pointer select-none">
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
                    <span className="text-ink-muted text-[11px]">
                      Otomatis membuat Seksi Kesekretariatan, Acara, dan Humas.
                    </span>
                  </div>
                </label>

                {/* Action Buttons */}
                <div className="pt-3 mt-2 border-t border-edge bg-card flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    disabled={isLoading}
                    className="h-11 min-h-[44px] px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 min-h-[44px] px-5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-bold shadow-lg shadow-red-950/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isLoading ? "Menyimpan..." : "Buat Program Kerja"}</span>
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
