"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Trophy,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Medal,
  Layers,
} from "lucide-react";
import {
  getRolloverCuratedData,
  executeRolloverWithCuratedData,
  RolloverWizardData,
} from "@/actions/rollover";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { haptic } from "@/lib/haptic";
import { triggerMicroConfetti } from "@/lib/confetti";
import Link from "next/link";

interface RolloverWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5; // 5 is celebration success

export function RolloverWizardModal({
  isOpen,
  onClose,
  onSuccess,
}: RolloverWizardModalProps) {
  useBodyScrollLock(isOpen);

  const [step, setStep] = useState<WizardStep>(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [wizardData, setWizardData] = useState<RolloverWizardData | null>(null);

  // Selections
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [workSearch, setWorkSearch] = useState("");

  // Confirmation
  const [confirmationInput, setConfirmationInput] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedEventIds([]);
      setSelectedWorkIds([]);
      setConfirmationInput("");
      setAdminNotes("");
      setErrorMessage(null);
      return;
    }

    async function loadData() {
      setIsLoadingData(true);
      const res = await getRolloverCuratedData();
      if (res.success && res.data) {
        setWizardData(res.data);
        // Pre-select first 3 events and works if available as sensible defaults
        if (res.data.allEvents.length >= 3) {
          setSelectedEventIds(res.data.allEvents.slice(0, 3).map((e) => e.id));
        }
        if (res.data.allWorks.length >= 3) {
          setSelectedWorkIds(res.data.allWorks.slice(0, 3).map((w) => w.id));
        }
      } else {
        setErrorMessage(res.message || "Gagal memuat data persiapan rollover.");
      }
      setIsLoadingData(false);
    }

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleEvent = (id: string) => {
    haptic.tap();
    setSelectedEventIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], id]; // Geser pilihan jika sudah 3
      }
      return [...prev, id];
    });
  };

  const handleToggleWork = (id: string) => {
    haptic.tap();
    setSelectedWorkIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], id]; // Geser pilihan jika sudah 3
      }
      return [...prev, id];
    });
  };

  const handleNextStep = () => {
    haptic.tap();
    setErrorMessage(null);
    if (step === 2 && selectedEventIds.length !== 3) {
      setErrorMessage("Silakan pilih tepat 3 Acara / Proker Terbaik periode ini.");
      return;
    }
    if (step === 3 && selectedWorkIds.length !== 3) {
      setErrorMessage("Silakan pilih tepat 3 Karya / Showcase Unggulan periode ini.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4) as WizardStep);
  };

  const handlePrevStep = () => {
    haptic.tap();
    setErrorMessage(null);
    setStep((prev) => Math.max(prev - 1, 1) as WizardStep);
  };

  const handleExecute = () => {
    if (confirmationInput.trim() !== "TUTUP BUKU PERIODE") {
      setErrorMessage("Ketik 'TUTUP BUKU PERIODE' dengan huruf besar persis.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await executeRolloverWithCuratedData({
        confirmationText: confirmationInput.trim(),
        selectedEventIds,
        selectedWorkIds,
        notes: adminNotes.trim() || undefined,
      });

      if (res.success) {
        triggerMicroConfetti({ particleCount: 60 });
        haptic.success();
        setStep(5);
        onSuccess?.();
      } else {
        haptic.warning();
        setErrorMessage(res.message);
      }
    });
  };

  // Filter lists
  const filteredEvents = (wizardData?.allEvents || []).filter((e) =>
    e.title.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredWorks = (wizardData?.allWorks || []).filter(
    (w) =>
      w.title.toLowerCase().includes(workSearch.toLowerCase()) ||
      w.authorName.toLowerCase().includes(workSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 5 && !isPending) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl bg-card border border-edge rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* HEADER & STEPPER */}
        <div className="p-5 sm:p-6 border-b border-edge/80 bg-surface-container-low/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                ⏳
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-ink">
                  {step === 5 ? "Rollover Selesai! 🎉" : "Time Capsule: Rollover Wizard"}
                </h2>
                <p className="text-xs text-ink-muted">
                  {wizardData?.periodName || "Kurasi Akhir Tahun & Lorong Waktu Abadi"}
                </p>
              </div>
            </div>

            {step !== 5 && !isPending && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-edge flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stepper Dots (1-4) */}
          {step !== 5 && (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { s: 1, label: "Top Juara" },
                { s: 2, label: "Acara Pilihan" },
                { s: 3, label: "Karya Terbaik" },
                { s: 4, label: "Konfirmasi" },
              ].map((item) => (
                <div key={item.s} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step >= item.s
                        ? "bg-primary"
                        : "bg-surface-container-high/60"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold block truncate text-center ${
                      step === item.s ? "text-primary" : "text-ink-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BODY CONTENT (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {isLoadingData ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-xs font-semibold text-ink-muted">
                Memuat metrik, Top 3 anggota, dan daftar karya periode berjalan...
              </p>
            </div>
          ) : step === 1 ? (
            /* ========================================================= */
            /* STEP 1: THE CHAMPIONS (TOP 3 XP MEMBERS)                  */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  Langkah 1: Para Juara Periode Ini
                </span>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Sistem otomatis mendeteksi 3 anggota berdedikasi tertinggi berdasarkan perolehan XP. Mereka akan diabadikan di Hall of Fame generasi ini.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(wizardData?.topMembers || []).map((member, idx) => {
                  const rankBadge =
                    idx === 0
                      ? { label: "Juara 1", color: "border-amber-500/60 bg-amber-500/10 text-amber-500", icon: "🥇" }
                      : idx === 1
                      ? { label: "Juara 2", color: "border-slate-400/60 bg-slate-400/10 text-slate-300", icon: "🥈" }
                      : { label: "Juara 3", color: "border-amber-700/60 bg-amber-700/10 text-amber-600", icon: "🥉" };

                  return (
                    <div
                      key={member.id}
                      className={`card-solid p-4 rounded-2xl border ${rankBadge.color} flex flex-col items-center text-center space-y-2.5 relative overflow-hidden`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-surface-container border border-edge/80 flex items-center justify-center font-bold text-xl overflow-hidden shadow-xs">
                        {member.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{member.name.charAt(0)}</span>
                        )}
                      </div>

                      <div className="space-y-0.5 w-full">
                        <span className="text-[11px] font-extrabold block">
                          {rankBadge.icon} {rankBadge.label}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-ink truncate">
                          {member.name}
                        </h4>
                        <span className="text-[10px] text-ink-muted block truncate">
                          {member.mainDivision || "Anggota"}
                        </span>
                      </div>

                      <div className="w-full pt-2 border-t border-edge/60 flex items-center justify-around text-[11px] font-mono">
                        <div>
                          <span className="text-ink-muted text-[10px] block font-sans">XP Total</span>
                          <span className="font-bold text-primary">{member.totalPoints.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-ink-muted text-[10px] block font-sans">Karya</span>
                          <span className="font-bold text-ink">{member.workCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-edge flex items-center justify-between text-xs text-ink-muted">
                <span>Total Rapat Selesai: <strong className="text-ink">{wizardData?.totalMeetings} sesi</strong></span>
                <span>Saldo Kas Akhir: <strong className="text-emerald-500 font-mono">Rp {wizardData?.closingCashBalance.toLocaleString("id-ID")}</strong></span>
              </div>
            </div>
          ) : step === 2 ? (
            /* ========================================================= */
            /* STEP 2: THE BEST EVENTS (PILIH 3 ACARA TERBAIK)           */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Langkah 2: Pilih 3 Acara &amp; Proker Terbaik
                  </span>
                  <p className="text-xs text-ink-muted">
                    Pilih tepat 3 kegiatan yang paling berkesan untuk dipajang di galeri sejarah.
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start ${
                  selectedEventIds.length === 3
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}>
                  Dipilih: {selectedEventIds.length}/3
                </span>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama acara..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-edge bg-card text-ink focus:outline-none focus:border-primary"
                />
              </div>

              {/* Event Cards Grid */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {filteredEvents.length === 0 ? (
                  <p className="text-xs text-ink-muted text-center py-8">Tidak ada acara ditemukan.</p>
                ) : (
                  filteredEvents.map((evt) => {
                    const isSelected = selectedEventIds.includes(evt.id);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => handleToggleEvent(evt.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-xs"
                            : "bg-card border-edge hover:bg-surface-container-low"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-ink truncate">
                            {evt.title}
                          </h4>
                          <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                            {evt.description || "Acara organisasi"}
                          </p>
                          <span className="text-[10px] text-ink-muted font-mono mt-1 block">
                            {new Date(evt.startDate).toLocaleDateString("id-ID")}
                          </span>
                        </div>

                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary text-white border-primary"
                            : "border-edge bg-surface-container-low text-transparent"
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : step === 3 ? (
            /* ========================================================= */
            /* STEP 3: THE MASTERPIECES (PILIH 3 KARYA TERBAIK)          */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-500 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Langkah 3: Pilih 3 Karya / Showcase Unggulan
                  </span>
                  <p className="text-xs text-ink-muted">
                    Pilih tepat 3 karya terbaik hasil keringat anggota untuk diabadikan di Hall of Fame.
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start ${
                  selectedWorkIds.length === 3
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                }`}>
                  Dipilih: {selectedWorkIds.length}/3
                </span>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari judul karya atau nama kreator..."
                  value={workSearch}
                  onChange={(e) => setWorkSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-edge bg-card text-ink focus:outline-none focus:border-primary"
                />
              </div>

              {/* Works Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {filteredWorks.length === 0 ? (
                  <p className="col-span-2 text-xs text-ink-muted text-center py-8">Tidak ada karya ditemukan.</p>
                ) : (
                  filteredWorks.map((work) => {
                    const isSelected = selectedWorkIds.includes(work.id);
                    return (
                      <div
                        key={work.id}
                        onClick={() => handleToggleWork(work.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-xs"
                            : "bg-card border-edge hover:bg-surface-container-low"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-surface-container border border-edge overflow-hidden shrink-0">
                          {work.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={work.thumbnailUrl}
                              alt={work.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
                              🎨
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-ink truncate">
                            {work.title}
                          </h4>
                          <span className="text-[10px] text-ink-muted block truncate">
                            Oleh: {work.authorName} • {work.primaryDivision}
                          </span>
                        </div>

                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary text-white border-primary"
                            : "border-edge bg-surface-container-low text-transparent"
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : step === 4 ? (
            /* ========================================================= */
            /* STEP 4: FINAL CONFIRMATION & EXECUTION                    */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Peringatan Penting Penutupan Buku Kepengurusan</span>
                </div>
                <ul className="text-xs space-y-1 list-disc list-inside opacity-90 leading-relaxed">
                  <li>Poin keaktifan (XP) seluruh anggota akan di-reset menjadi 0.</li>
                  <li>Kenaikan kelas otomatis: Kelas 10 $\to$ 11, Kelas 11 $\to$ 12, Kelas 12 $\to$ Alumni Demisioner.</li>
                  <li><strong>Identitas Angkatan (Gen) dan Saldo Dompet Saya tetap utuh &amp; aman.</strong></li>
                  <li>Snapshot Juara, Acara, dan Karya akan diabadikan di <strong>Hall of Fame</strong>.</li>
                </ul>
              </div>

              {/* Curated Snapshot Summary Chips */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-ink block">Rangkuman Kurasi Terpilih:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-edge space-y-1">
                    <span className="font-bold text-ink block">Top 3 Anggota:</span>
                    <p className="text-ink-muted truncate">
                      1. {wizardData?.topMembers[0]?.name || "-"} | 2. {wizardData?.topMembers[1]?.name || "-"} | 3. {wizardData?.topMembers[2]?.name || "-"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-edge space-y-1">
                    <span className="font-bold text-ink block">Kurasi Acara &amp; Karya:</span>
                    <p className="text-ink-muted">
                      {selectedEventIds.length} Acara &amp; {selectedWorkIds.length} Karya Unggulan
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation Keyword Input */}
              <div className="space-y-2 pt-2 border-t border-edge">
                <label className="text-xs font-semibold text-ink block">
                  Ketik teks persetujuan: <strong className="text-primary font-mono select-all">TUTUP BUKU PERIODE</strong>
                </label>
                <input
                  type="text"
                  placeholder="Ketik TUTUP BUKU PERIODE"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-edge bg-card text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-ink-muted block">Catatan Estafet Periode (Opsional):</label>
                <textarea
                  placeholder="Pesan untuk pengurus generasi berikutnya..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-edge bg-card text-ink focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* STEP 5: SUCCESS & TIME CAPSULE ACTIVATED                  */
            /* ========================================================= */
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-3xl">
                🏆
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink">
                  Rollover Kepengurusan Berhasil!
                </h3>
                <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                  Buku kas telah ditutup, anggota berhasil dipromosikan, dan lembaran sejarah periode ini resmi diabadikan di dalam Hall of Fame.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/hall-of-fame"
                  onClick={onClose}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Lihat Lorong Waktu (Hall of Fame)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl border border-edge text-ink-muted hover:text-ink text-xs font-semibold cursor-pointer"
                >
                  Tutup Jendela
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* FOOTER CONTROLS */}
        {step !== 5 && (
          <div className="p-4 sm:p-5 border-t border-edge/80 bg-surface-container-low/40 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                disabled={isPending}
                onClick={handlePrevStep}
                className="h-10 px-4 rounded-xl border border-edge text-ink font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-surface-container active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-edge text-ink-muted font-semibold text-xs hover:text-ink transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={
                  isLoadingData ||
                  (step === 2 && selectedEventIds.length !== 3) ||
                  (step === 3 && selectedWorkIds.length !== 3)
                }
                onClick={handleNextStep}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={
                  isPending ||
                  confirmationInput.trim() !== "TUTUP BUKU PERIODE"
                }
                onClick={handleExecute}
                className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengabadikan Sejarah...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Eksekusi Rollover &amp; Abadikan</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
