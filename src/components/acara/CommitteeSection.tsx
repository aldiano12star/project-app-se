"use client";

import React, { useState, useTransition } from "react";
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock,
  User,
  AlertCircle,
  CheckCheck,
  Plus,
  FolderPlus,
  ShieldCheck,
  Crown,
  Users,
  X,
  Loader2,
  Sparkles,
  Check,
} from "lucide-react";
import { Role } from "@prisma/client";
import {
  claimEventTask,
  submitTaskCompletion,
  updateTaskStatus,
  verifyEventTask,
  assignSectionPJ,
  addSectionMember,
  removeSectionMember,
} from "@/actions/acara";

export interface CommitteeTask {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  isSOP: boolean;
  dueDate?: Date | string | null;
  assigneeId?: string | null;
  assignee?: { id: string; name: string } | null;
  verifiedById?: string | null;
  verifiedBy?: { id: string; name: string } | null;
  pointsAwarded?: boolean;
}

export interface SectionMember {
  id: string;
  name: string;
  classGrade?: string | null;
  image?: string | null;
}

export interface SectionPJ {
  id: string;
  name: string;
  classGrade?: string | null;
  image?: string | null;
}

export interface CommitteeSectionData {
  id: string;
  name: string;
  pjId?: string | null;
  pj?: SectionPJ | null;
  members?: SectionMember[];
  tasks: CommitteeTask[];
}

interface CommitteeSectionProps {
  sections: CommitteeSectionData[];
  currentUserId?: string;
  currentUserRole?: Role;
  allMembers?: { id: string; name: string; classGrade?: string | null }[];
  onOpenAddSectionModal?: () => void;
  onOpenAddTaskModal?: (sectionId?: string) => void;
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export function CommitteeSection({
  sections,
  currentUserId,
  currentUserRole,
  allMembers = [],
  onOpenAddSectionModal,
  onOpenAddTaskModal,
}: CommitteeSectionProps) {
  // Buka semua seksi secara default agar tugas langsung terlihat
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((sec, idx) => {
      initial[sec.id] = idx < 2; // Buka 2 seksi pertama
    });
    return initial;
  });

  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("error");

  // State untuk modal/form assign PJ & tambah member
  const [activePJModalSectionId, setActivePJModalSectionId] = useState<string | null>(null);
  const [selectedPJUserId, setSelectedPJUserId] = useState<string>("");
  const [activeAddMemberSectionId, setActiveAddMemberSectionId] = useState<string | null>(null);
  const [selectedNewMemberUserId, setSelectedNewMemberUserId] = useState<string>("");
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const isOfficer =
    currentUserRole === Role.ADMIN ||
    currentUserRole === Role.OPERATOR;

  const handleClaimTask = async (taskId: string) => {
    setLoadingTaskId(taskId);
    setFeedbackMessage(null);
    try {
      const res = await claimEventTask(taskId);
      if (!res.success) {
        setFeedbackType("error");
        setFeedbackMessage(res.message);
      } else {
        setFeedbackType("success");
        setFeedbackMessage(res.message);
      }
    } catch {
      setFeedbackType("error");
      setFeedbackMessage("Terjadi kesalahan saat mengambil tugas.");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleSubmitDone = async (taskId: string) => {
    setLoadingTaskId(taskId);
    setFeedbackMessage(null);
    try {
      const res = await submitTaskCompletion(taskId);
      if (!res.success) {
        setFeedbackType("error");
        setFeedbackMessage(res.message);
      } else {
        setFeedbackType("success");
        setFeedbackMessage(res.message);
      }
    } catch {
      setFeedbackType("error");
      setFeedbackMessage("Gagal menandai tugas selesai.");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleToggleTaskStatus = async (task: CommitteeTask) => {
    setLoadingTaskId(task.id);
    setFeedbackMessage(null);
    try {
      const nextStatus = task.status === "DONE" ? "IN_PROGRESS" : "DONE";
      const res = await updateTaskStatus(task.id, nextStatus);
      if (!res.success) {
        setFeedbackType("error");
        setFeedbackMessage(res.message);
      }
    } catch {
      setFeedbackType("error");
      setFeedbackMessage("Gagal memperbarui status tugas.");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleVerifyTask = async (taskId: string) => {
    setLoadingTaskId(taskId);
    setFeedbackMessage(null);
    try {
      const res = await verifyEventTask(taskId);
      if (!res.success) {
        setFeedbackType("error");
        setFeedbackMessage(res.message);
      } else {
        setFeedbackType("success");
        setFeedbackMessage(res.message);
      }
    } catch {
      setFeedbackType("error");
      setFeedbackMessage("Gagal memverifikasi tugas.");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleAssignPJSubmit = async (sectionId: string) => {
    if (!selectedPJUserId) return;
    setIsSubmittingMember(true);
    setFeedbackMessage(null);
    try {
      const res = await assignSectionPJ(sectionId, selectedPJUserId);
      if (res.success) {
        setFeedbackType("success");
        setFeedbackMessage(res.message);
        setActivePJModalSectionId(null);
        setSelectedPJUserId("");
      } else {
        setFeedbackType("error");
        setFeedbackMessage(res.message);
      }
    } catch {
      setFeedbackType("error");
      setFeedbackMessage("Gagal menunjuk PJ seksi.");
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleAddMemberSubmit = async (sectionId: string) => {
    if (!selectedNewMemberUserId) return;
    setIsSubmittingMember(true);
    setFeedbackMessage(null);
    try {
      const res = await addSectionMember(sectionId, selectedNewMemberUserId);
      if (res.success) {
        setFeedbackType("success");
        setFeedbackMessage(res.message);
        setActiveAddMemberSectionId(null);
        setSelectedNewMemberUserId("");
      } else {
        setFeedbackType("error");
        setFeedbackMessage(res.message);
      }
    } catch {
      setFeedbackType("error");
      setFeedbackMessage("Gagal menambahkan anggota.");
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleRemoveMember = async (sectionId: string, userId: string) => {
    setFeedbackMessage(null);
    try {
      const res = await removeSectionMember(sectionId, userId);
      if (res.success) {
        setFeedbackType("success");
        setFeedbackMessage(res.message);
      } else {
        setFeedbackType("error");
        setFeedbackMessage(res.message);
      }
    } catch {
      setFeedbackType("error");
      setFeedbackMessage("Gagal mengeluarkan anggota.");
    }
  };

  return (
    <div className="space-y-3">
      {/* Alert feedback jika ada pesan */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedbackType === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 font-medium"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-primary font-medium"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackType === "success" ? (
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold underline ml-2 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Daftar Seksi Kepanitiaan (Accordions) */}
      {sections.length === 0 ? (
        <div className="card-solid bg-card p-6 text-center space-y-2 rounded-2xl border border-edge">
          <p className="text-xs text-ink-muted">
            Belum ada seksi kepanitiaan untuk kegiatan ini.
          </p>
          {isOfficer && (
            <button
              type="button"
              onClick={onOpenAddSectionModal}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Seksi Pertama</span>
            </button>
          )}
        </div>
      ) : (
        sections.map((section) => {
          const isExpanded = expandedSections[section.id] ?? false;
          const completedCount = section.tasks.filter((t) => t.status === "DONE").length;
          const totalCount = section.tasks.length;
          const sectionMembers = section.members || [];

          // Otorisasi: Verifikasi tugas HANYA boleh dilakukan oleh PJ Seksi atau ADMIN/OPERATOR
          const canVerifyTasks =
            isOfficer || (section.pjId && section.pjId === currentUserId);

          const canManageMembers =
            isOfficer || (section.pjId && section.pjId === currentUserId);

          return (
            <div
              key={section.id}
              className="bg-card rounded-2xl shadow-xs border border-edge overflow-hidden"
            >
              {/* Header Accordion Seksi */}
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleSection(section.id)}
                className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between bg-surface-container-low/40 hover:bg-surface-container-low text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FolderPlus className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-ink truncate">
                      {section.name}
                    </h2>
                    <p className="text-[11px] text-ink-muted">
                      {totalCount} item pekerjaan • {sectionMembers.length} anggota
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      totalCount > 0 && completedCount === totalCount
                        ? "bg-success-subtle text-success border border-success/30"
                        : "bg-surface-container-high/60 text-ink-secondary border border-edge"
                    }`}
                  >
                    {completedCount}/{totalCount} Selesai
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-ink-muted transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Konten Seksi & PJ Panel */}
              {isExpanded && (
                <div className="p-4 space-y-3.5 bg-card border-t border-edge/60">
                  {/* BARIS 1: Penanggung Jawab (PJ) Seksi & Keanggotaan */}
                  <div className="p-3 rounded-xl bg-surface-container-low/60 border border-edge space-y-2.5">
                    {/* Info PJ Seksi */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                          <Crown className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-ink-muted block leading-none font-mono">
                            Penanggung Jawab (PJ)
                          </span>
                          <span className="text-xs font-bold text-ink truncate block mt-0.5">
                            {section.pj ? (
                              <span>
                                {section.pj.name}
                                {section.pj.id === currentUserId ? " (Anda)" : ""}
                              </span>
                            ) : (
                              <span className="text-amber-500 font-semibold">
                                Belum ditunjuk
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Tombol Tunjuk PJ (Hanya Pengurus) */}
                      {isOfficer && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePJModalSectionId(section.id);
                            setSelectedPJUserId(section.pjId || "");
                          }}
                          className="h-8 min-h-[32px] px-3 rounded-lg bg-surface hover:bg-card border border-edge text-[11px] font-bold text-ink-secondary hover:text-ink transition-colors cursor-pointer"
                        >
                          {section.pj ? "Ganti PJ" : "+ Tunjuk PJ"}
                        </button>
                      )}
                    </div>

                    {/* Daftar Anggota Seksi */}
                    <div className="pt-2 border-t border-edge/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-ink-muted flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>Anggota Seksi ({sectionMembers.length})</span>
                        </span>

                        {canManageMembers && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAddMemberSectionId(section.id);
                              setSelectedNewMemberUserId("");
                            }}
                            className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            + Tambah Anggota
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {sectionMembers.length > 0 ? (
                          sectionMembers.map((member) => (
                            <span
                              key={member.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] ${
                                member.id === section.pjId
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold"
                                  : "bg-surface border-edge text-ink"
                              }`}
                            >
                              {member.id === section.pjId && (
                                <Crown className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                              )}
                              <span>{member.name}</span>
                              {canManageMembers && member.id !== section.pjId && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(section.id, member.id)}
                                  className="text-ink-muted hover:text-primary transition-colors cursor-pointer ml-0.5"
                                  title="Hapus dari seksi"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-ink-muted italic">
                            Belum ada anggota yang bergabung di seksi ini.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Pop-up Tunjuk PJ (HANYA DARI ANGGOTA SEKSI) */}
                  {activePJModalSectionId === section.id && (
                    <div className="p-3.5 rounded-xl bg-card border-2 border-amber-400 dark:border-amber-600 space-y-2.5 animate-in fade-in">
                      <span className="text-xs font-bold text-ink block">
                        Tunjuk Penanggung Jawab (PJ) Seksi &quot;{section.name}&quot;
                      </span>
                      {sectionMembers.length === 0 ? (
                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                          Belum ada anggota di seksi ini. Tambahkan anggota terlebih dahulu sebelum menunjuk PJ.
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] text-ink-muted">
                            PJ wajib dipilih dari anggota yang sudah terdaftar di seksi ini:
                          </p>
                          <select
                            value={selectedPJUserId}
                            onChange={(e) => setSelectedPJUserId(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          >
                            <option value="">-- Pilih Anggota Seksi --</option>
                            {sectionMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} {m.classGrade ? `(${m.classGrade})` : ""}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActivePJModalSectionId(null)}
                          className="h-9 min-h-[36px] px-3 rounded-lg border border-edge text-xs font-semibold text-ink-secondary cursor-pointer"
                        >
                          Tutup
                        </button>
                        {sectionMembers.length > 0 && (
                          <button
                            type="button"
                            disabled={!selectedPJUserId || isSubmittingMember}
                            onClick={() => handleAssignPJSubmit(section.id)}
                            className="h-9 min-h-[36px] px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                          >
                            {isSubmittingMember ? "Menyimpan..." : "Simpan PJ"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form Pop-up Tambah Anggota */}
                  {activeAddMemberSectionId === section.id && (
                    <div className="p-3.5 rounded-xl bg-card border-2 border-primary/40 space-y-2.5 animate-in fade-in">
                      <span className="text-xs font-bold text-ink block">
                        Tambah Anggota ke Seksi &quot;{section.name}&quot;
                      </span>
                      <select
                        value={selectedNewMemberUserId}
                        onChange={(e) => setSelectedNewMemberUserId(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      >
                        <option value="">-- Pilih Anggota Organisasi --</option>
                        {allMembers
                          .filter(
                            (m) =>
                              !sectionMembers.some((existing) => existing.id === m.id)
                          )
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.classGrade ? `(${formatGrade(m.classGrade)})` : ""}
                            </option>
                          ))}
                      </select>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveAddMemberSectionId(null)}
                          className="h-9 min-h-[36px] px-3 rounded-lg border border-edge text-xs font-semibold text-ink-secondary cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={!selectedNewMemberUserId || isSubmittingMember}
                          onClick={() => handleAddMemberSubmit(section.id)}
                          className="h-9 min-h-[36px] px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingMember ? "Menyimpan..." : "Tambahkan"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DAFTAR TUGAS DALAM SEKSI */}
                  <div className="space-y-2.5 pt-1">
                    {section.tasks.length === 0 ? (
                      <div className="py-4 text-center text-xs text-ink-muted italic border border-dashed border-edge rounded-xl">
                        Belum ada tugas di seksi ini.
                      </div>
                    ) : (
                      section.tasks.map((task) => {
                        const isTaskDone = task.status === "DONE";
                        const isTaskInProgress = task.status === "IN_PROGRESS";
                        const isAssignedToMe = task.assigneeId === currentUserId;
                        const isTaskLoading = loadingTaskId === task.id;
                        const isVerified = Boolean(task.verifiedById);

                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                              isVerified
                                ? "bg-emerald-950/15 border-emerald-500/30"
                                : isTaskDone
                                ? "bg-amber-950/15 border-amber-500/30"
                                : isTaskInProgress
                                ? "bg-blue-950/15 border-blue-500/30"
                                : "bg-card border-edge"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              {/* Checkbox / Status Indicator */}
                              <button
                                type="button"
                                disabled={isTaskLoading}
                                onClick={() => handleToggleTaskStatus(task)}
                                className="mt-0.5 text-ink-muted hover:text-primary transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                title={
                                  isTaskDone
                                    ? "Tandai belum selesai"
                                    : "Tandai tugas selesai"
                                }
                              >
                                {isVerified ? (
                                  <CheckCheck className="h-5 w-5 text-emerald-400 stroke-[2.2]" />
                                ) : isTaskDone ? (
                                  <CheckCircle2 className="h-5 w-5 text-amber-400 stroke-[2.2]" />
                                ) : isTaskInProgress ? (
                                  <Clock className="h-5 w-5 text-blue-400 stroke-[2.2]" />
                                ) : (
                                  <Circle className="h-5 w-5 stroke-[1.8]" />
                                )}
                              </button>

                              {/* Deskripsi & Judul Tugas */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <p
                                  className={`text-xs font-bold leading-snug ${
                                    isVerified
                                      ? "text-slate-200"
                                      : isTaskDone
                                      ? "text-amber-200"
                                      : "text-ink"
                                  }`}
                                >
                                  {task.title}
                                </p>

                                {task.description && (
                                  <p className="text-[11px] text-ink-muted leading-relaxed">
                                    {task.description}
                                  </p>
                                )}

                                {/* Lencana Status Tugas Sesuai Spesifikasi */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {/* Lencana 1: SOP Otomatis */}
                                  {task.isSOP && (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-semibold border border-purple-500/30 font-mono">
                                      SOP
                                    </span>
                                  )}

                                  {/* Lencana Status Utama */}
                                  {isVerified ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 font-mono">
                                      <CheckCheck className="h-3 w-3" />
                                      <span>
                                        ✅ Terverifikasi Selesai{" "}
                                        {task.verifiedBy ? `oleh ${task.verifiedBy.name}` : "(+20 XP)"}
                                      </span>
                                    </span>
                                  ) : isTaskDone ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/40 animate-pulse font-mono">
                                      <Clock className="h-3 w-3" />
                                      <span>⏳ Menunggu Verifikasi PJ</span>
                                    </span>
                                  ) : task.assignee ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-semibold border border-blue-500/30 font-mono">
                                      <User className="h-3 w-3" />
                                      <span>
                                        Sedang Dikerjakan oleh {task.assignee.name}
                                        {isAssignedToMe ? " (Saya)" : ""}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-semibold border border-amber-500/30 font-mono">
                                      <AlertCircle className="h-3 w-3" />
                                      <span>Mencari Relawan</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Tombol Aksi Tugas (Ambil, Tandai Selesai, atau Verifikasi PJ) */}
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-edge/40">
                              {/* 1. Belum ada pelaksana: Tombol "Saya Siap Mengerjakan" */}
                              {!task.assigneeId && !isTaskDone && (
                                <button
                                  type="button"
                                  disabled={isTaskLoading}
                                  onClick={() => handleClaimTask(task.id)}
                                  className="h-10 min-h-[44px] px-3.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                  {isTaskLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                  )}
                                  <span>Saya Siap Mengerjakan</span>
                                </button>
                              )}

                              {/* 2. Pelaksana tugas: Tombol "Tandai Sudah Selesai" */}
                              {isAssignedToMe && isTaskInProgress && (
                                <button
                                  type="button"
                                  disabled={isTaskLoading}
                                  onClick={() => handleSubmitDone(task.id)}
                                  className="h-10 min-h-[44px] px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                  {isTaskLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                  <span>Tandai Sudah Selesai</span>
                                </button>
                              )}

                              {/* 3. Tombol Verifikasi Khusus PJ Seksi atau Admin/Operator */}
                              {canVerifyTasks && isTaskDone && !isVerified && (
                                <button
                                  type="button"
                                  disabled={isTaskLoading}
                                  onClick={() => handleVerifyTask(task.id)}
                                  className="h-11 min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 border border-emerald-500/30"
                                  title="Verifikasi pekerjaan & berikan +20 XP"
                                >
                                  {isTaskLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-4 w-4" />
                                  )}
                                  <span>✅ Verifikasi &amp; Selesaikan (+20 XP)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Workspace Action Buttons di Bagian Bawah */}
      <div className="pt-2 grid grid-cols-2 gap-3">
        {isOfficer && (
          <button
            type="button"
            onClick={onOpenAddSectionModal}
            className="min-h-[44px] h-11 px-3.5 bg-card hover:bg-surface-container-low text-ink text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all border border-edge shadow-xs cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-ink-secondary" />
            <span>+ Seksi Baru</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenAddTaskModal?.()}
          className={`min-h-[44px] h-11 px-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-xs cursor-pointer ${
            !isOfficer ? "col-span-2" : ""
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>+ Tugas Baru</span>
        </button>
      </div>
    </div>
  );
}
