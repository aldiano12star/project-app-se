"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  UserCheck,
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Ban,
  Phone,
  Compass,
  Settings2,
  X,
  Check,
  Handshake,
  KeyRound,
  Copy,
  MessageCircle,
} from "lucide-react";
import { Role, Division } from "@prisma/client";
import { promoteUserRole, resetUserPasswordByOperator } from "@/actions/profile";
import { calculateGenFromGrade } from "@/lib/academic-year";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  classGrade?: string | null;
  mainDivision?: Division | null;
  noWhatsapp?: string | null;
  asalTujuan?: string | null;
  createdAt: string;
}

interface AdminUserManagementSectionProps {
  currentUserRole: Role;
  users: ManagedUser[];
}

function getRoleBadgeStyle(role: Role) {
  switch (role) {
    case Role.OPERATOR:
      return "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/50 shadow-xs";
    case Role.ADMIN:
      return "bg-rose-100 dark:bg-red-950/60 text-rose-700 dark:text-red-400 border-rose-300 dark:border-red-500/50";
    case Role.BENDAHARA:
      return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/50";
    case Role.MEMBER:
      return "bg-sky-100 dark:bg-blue-950/60 text-sky-700 dark:text-blue-400 border-sky-300 dark:border-blue-500/50";
    case Role.KOLABORATOR:
      return "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-500/50";
    case Role.GUEST:
      return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700";
    case Role.BLOCKED:
      return "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-900";
    default:
      return "bg-surface-container text-ink-muted border-edge";
  }
}

function getRoleLabel(role: Role) {
  switch (role) {
    case Role.OPERATOR:
      return "Operator";
    case Role.ADMIN:
      return "Admin";
    case Role.BENDAHARA:
      return "Bendahara";
    case Role.MEMBER:
      return "Member";
    case Role.KOLABORATOR:
      return "Kolaborator";
    case Role.GUEST:
      return "Menunggu Verifikasi";
    case Role.BLOCKED:
      return "Diblokir";
    default:
      return role;
  }
}

function getDivisionMeta(division?: Division | string | null) {
  switch (division) {
    case Division.PROGRAMMING:
    case "Programming":
      return {
        label: "Programming",
        style: "bg-cyan-950/60 text-cyan-400 border-cyan-500/50",
      };
    case Division.TECHNOPRENEURSHIP:
    case "Technopreneurship":
      return {
        label: "Technopreneurship",
        style: "bg-amber-950/60 text-amber-400 border-amber-500/50",
      };
    case Division.DESIGN:
    case "Desain":
      return {
        label: "Desain",
        style: "bg-purple-950/60 text-purple-400 border-purple-500/50",
      };
    case Division.PHOTOGRAPHY:
    case "Fotografi":
      return {
        label: "Fotografi",
        style: "bg-emerald-950/60 text-emerald-400 border-emerald-500/50",
      };
    case Division.CINEMATOGRAPHY:
    case "Cinematografi":
      return {
        label: "Cinematografi",
        style: "bg-rose-950/60 text-rose-400 border-rose-500/50",
      };
    default:
      return {
        label: division || "Tanpa Divisi",
        style: "bg-surface-container text-ink-muted border-edge",
      };
  }
}

function formatGradeGen(grade?: string | null) {
  if (!grade) return null;
  if (grade === "KELAS_10") return "Kelas X (Gen 21)";
  if (grade === "KELAS_11") return "Kelas XI (Gen 20)";
  if (grade === "KELAS_12") return "Kelas XII (Gen 19)";
  return grade;
}

export function AdminUserManagementSection({
  currentUserRole,
  users,
}: AdminUserManagementSectionProps) {
  const [activeTab, setActiveTab] = useState<"GUEST" | "ALL">("GUEST");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [assigningUser, setAssigningUser] = useState<ManagedUser | null>(null);
  const [selectedDivisi, setSelectedDivisi] = useState<string>("NONE");
  const [selectedGrade, setSelectedGrade] = useState<string>("NONE");
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Password Reset Override States
  const [resettingUser, setResettingUser] = useState<ManagedUser | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetResult, setResetResult] = useState<{
    temporaryPassword: string;
    targetWhatsapp?: string | null;
    targetName?: string;
  } | null>(null);

  const isOfficer =
    currentUserRole === Role.ADMIN || currentUserRole === Role.OPERATOR;

  if (!isOfficer) return null;

  const guestUsers = users.filter((u) => u.role === Role.GUEST);

  const displayedUsers = (activeTab === "GUEST" ? guestUsers : users).filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.asalTujuan && u.asalTujuan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.noWhatsapp && u.noWhatsapp.includes(searchQuery))
  );

  const handlePromote = (
    targetUserId: string,
    newRole: Role,
    divisionVal?: Division | null,
    gradeVal?: string | null
  ) => {
    setProcessingUserId(targetUserId);
    setFeedback(null);

    let genNum: number | null = null;
    let kelasName: string | null = null;
    if (gradeVal && gradeVal !== "NONE") {
      const genResult = calculateGenFromGrade(gradeVal);
      genNum = genResult.gen;
      kelasName = genResult.kelasLabel;
    }

    startTransition(async () => {
      const res = await promoteUserRole({
        targetUserId,
        newRole,
        mainDivision: divisionVal,
        classGrade: gradeVal,
        kelas: kelasName,
        gen: genNum,
      });

      if (res.success) {
        setFeedback({ text: res.message, type: "success" });
        setAssigningUser(null);
      } else {
        setFeedback({ text: res.message, type: "error" });
      }
      setProcessingUserId(null);
    });
  };

  const openAssignModal = (u: ManagedUser) => {
    setAssigningUser(u);
    setSelectedDivisi(u.mainDivision || "NONE");
    setSelectedGrade(u.classGrade || "NONE");
  };

  const handleSaveAssignment = () => {
    if (!assigningUser) return;
    const div =
      selectedDivisi === "NONE" ? null : (selectedDivisi as Division);
    const grade = selectedGrade === "NONE" ? null : selectedGrade;

    // Jika sedang GUEST dan diatur divisi/gen, otomatis promote ke MEMBER
    const nextRole =
      assigningUser.role === Role.GUEST ? Role.MEMBER : assigningUser.role;

    handlePromote(assigningUser.id, nextRole, div, grade);
  };

  const openResetPasswordModal = (u: ManagedUser) => {
    setResettingUser(u);
    setCustomPasswordInput("");
    setResetResult(null);
    setCopied(false);
  };

  const handleExecuteResetPassword = () => {
    if (!resettingUser) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await resetUserPasswordByOperator({
        targetUserId: resettingUser.id,
        customPassword: customPasswordInput.trim() || undefined,
      });

      if (res.success && res.temporaryPassword) {
        setResetResult({
          temporaryPassword: res.temporaryPassword,
          targetWhatsapp: res.targetWhatsapp,
          targetName: res.targetName || resettingUser.name,
        });
      } else {
        setFeedback({ text: res.message, type: "error" });
      }
    });
  };

  const handleCopyPassword = () => {
    if (!resetResult?.temporaryPassword) return;
    navigator.clipboard.writeText(resetResult.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Aktivasi Akun &amp; Manajemen Role</span>
        </h3>
        {guestUsers.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            {guestUsers.length} Menunggu
          </span>
        )}
      </div>

      <div className="bg-card border border-edge rounded-2xl p-6 shadow-xs space-y-4">
        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-edge">
            <button
              type="button"
              onClick={() => setActiveTab("GUEST")}
              className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "GUEST"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-slate-400 hover:text-ink"
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Menunggu ({guestUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-2 min-h-10 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-slate-400 hover:text-ink"
              }`}
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Semua ({users.length})</span>
            </button>
          </div>

          <input
            type="text"
            placeholder="Cari nama, email, WA, atau asal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 px-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/40 border-red-500/40 text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* User List */}
        <div className="space-y-3 max-h-115 overflow-y-auto pr-0.5">
          {displayedUsers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-container-low/40 border border-edge text-center space-y-2">
              <UserCheck className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-ink">
                {activeTab === "GUEST"
                  ? "Tidak ada akun yang menunggu verifikasi."
                  : "Tidak ada data pengguna ditemukan."}
              </p>
              <p className="text-xs text-slate-400">
                {activeTab === "GUEST"
                  ? "Semua akun terdaftar sudah memiliki role aktif."
                  : "Coba gunakan kata kunci pencarian yang berbeda."}
              </p>
            </div>
          ) : (
            displayedUsers.map((u) => {
              const isProcessing = processingUserId === u.id && isPending;
              const initials = u.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const gradeLabel = formatGradeGen(u.classGrade);

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-surface-container-low/70 border border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-600/50"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-slate-900 border border-edge overflow-hidden shrink-0 flex items-center justify-center mt-0.5">
                      {u.image ? (
                        <Image
                          src={u.image}
                          alt={u.name || "Foto pengguna"}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-white font-mono">
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink truncate">
                          {u.name}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(
                            u.role
                          )}`}
                        >
                          {getRoleLabel(u.role)}
                        </span>
                        {u.mainDivision && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              getDivisionMeta(u.mainDivision).style
                            }`}
                          >
                            {getDivisionMeta(u.mainDivision).label}
                          </span>
                        )}
                        {gradeLabel && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-ink-muted border border-edge">
                            {gradeLabel}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 truncate">
                        {u.email}
                      </p>

                      {/* Info Kontak & Asal / Tujuan */}
                      <div className="flex items-center gap-3 text-xs text-ink-muted pt-0.5 flex-wrap">
                        {u.noWhatsapp && (
                          <a
                            href={`https://wa.me/${u.noWhatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
                            title="Buka percakapan WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{u.noWhatsapp}</span>
                          </a>
                        )}

                        {u.asalTujuan && (
                          <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                            <Compass className="w-3.5 h-3.5" />
                            <span>{u.asalTujuan}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons for Role Promotion & Assignment */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                    {/* Tombol Atur Gen & Divisi */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => openAssignModal(u)}
                      className="h-10 min-h-10 px-3 rounded-xl border border-edge bg-surface hover:bg-surface-container text-ink text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Atur Divisi & Angkatan Akun"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                      <span>Atur Divisi/Gen</span>
                    </button>

                    {/* Tombol Operator Reset Password */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => openResetPasswordModal(u)}
                      className="h-10 min-h-10 px-3 rounded-xl border border-edge bg-surface hover:bg-surface-container text-ink text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Reset Kata Sandi Akun"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reset Sandi</span>
                    </button>

                    {u.role === Role.GUEST ? (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handlePromote(u.id, Role.MEMBER)}
                          className="h-10 min-h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Setujui Member</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handlePromote(u.id, Role.KOLABORATOR)}
                          className="h-10 min-h-10 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Handshake className="w-3.5 h-3.5" />
                          )}
                          <span>Setujui Kolaborator</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handlePromote(u.id, Role.BLOCKED)}
                          className="h-10 min-h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Blokir akun dari sistem"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Blokir</span>
                        </button>
                      </>
                    ) : (
                      <select
                        value={u.role}
                        disabled={isProcessing}
                        onChange={(e) =>
                          handlePromote(u.id, e.target.value as Role)
                        }
                        className="h-10 min-h-10 px-3 rounded-xl bg-card border border-edge text-ink text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/30 cursor-pointer"
                      >
                        <option value={Role.MEMBER}>Set: Member</option>
                        <option value={Role.KOLABORATOR}>Set: Kolaborator</option>
                        <option value={Role.BENDAHARA}>Set: Bendahara</option>
                        <option value={Role.ADMIN}>Set: Admin</option>
                        {currentUserRole === Role.OPERATOR && (
                          <option value={Role.OPERATOR}>Set: Operator</option>
                        )}
                        <option value={Role.GUEST}>Set: Guest (Tangguhkan)</option>
                        <option value={Role.BLOCKED}>Set: Blokir Akses</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Atur Gen & Divisi Pengguna */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-edge p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-edge">
              <div>
                <h4 className="text-sm font-bold text-ink">
                  Atur Penugasan Akun
                </h4>
                <p className="text-xs text-ink-muted truncate max-w-60">
                  {assigningUser.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningUser(null)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Dropdown Divisi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">
                  Divisi Organisasi
                </label>
                <select
                  value={selectedDivisi}
                  onChange={(e) => setSelectedDivisi(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface border border-edge text-ink text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="NONE">Tanpa Divisi (Kolaborator / Tamu)</option>
                  <option value={Division.PROGRAMMING}>Programming</option>
                  <option value={Division.TECHNOPRENEURSHIP}>Technopreneurship</option>
                  <option value={Division.DESIGN}>Desain</option>
                  <option value={Division.PHOTOGRAPHY}>Fotografi</option>
                  <option value={Division.CINEMATOGRAPHY}>Cinematografi</option>
                </select>
              </div>

              {/* Dropdown Kelas & Angkatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">
                  Tingkat Kelas &amp; Generasi (Gen)
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface border border-edge text-ink text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="NONE">Tanpa Kelas (Alumni / Luar Sekolah)</option>
                  <option value="KELAS_10">Kelas X (Gen 21)</option>
                  <option value="KELAS_11">Kelas XI (Gen 20)</option>
                  <option value="KELAS_12">Kelas XII (Gen 19)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssigningUser(null)}
                className="flex-1 h-11 min-h-11 rounded-xl border border-edge text-xs font-semibold text-ink hover:bg-surface-container transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveAssignment}
                className="flex-1 h-11 min-h-11 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Operator Reset Password */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-edge p-5 shadow-2xl space-y-4 text-ink animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-edge">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Reset Kata Sandi Akun</h4>
                  <p className="text-[11px] text-ink-muted truncate max-w-48">
                    {resettingUser.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetResult ? (
              /* Tampilan Sukses Reset & WhatsApp Handoff */
              <div className="space-y-3.5 py-1">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Kata Sandi Berhasil Di-reset!</span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    Kata sandi sementara akun telah aktif. Pengguna akan diwajibkan menggantinya saat login berikutnya.
                  </p>
                </div>

                {/* Box Sandi Sementara + Tombol Copy */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink-muted block">
                    Kata Sandi Sementara:
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-edge font-mono text-sm font-bold text-ink">
                    <span>{resetResult.temporaryPassword}</span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-edge text-xs font-medium hover:border-primary/50 text-ink flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tombol Kirim Langsung via WhatsApp jika No WA tersedia */}
                {resetResult.targetWhatsapp && (
                  <a
                    href={`https://wa.me/${resetResult.targetWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Halo ${resetResult.targetName},\n\nKata sandi sementara akun SE-Core kamu telah di-reset oleh pengurus menjadi:\n\n*${resetResult.temporaryPassword}*\n\nSilakan segera masuk ke aplikasi dan ganti dengan kata sandi pribadimu.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 min-h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim Sandi via WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="w-full h-10 rounded-xl border border-edge text-xs font-semibold text-ink hover:bg-surface-container transition-all cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : (
              /* Formulir Konfirmasi Reset */
              <div className="space-y-3">
                <p className="text-xs text-ink-muted leading-relaxed">
                  Tindakan ini akan mengganti kata sandi akun <strong>{resettingUser.name}</strong> dengan kata sandi sementara baru.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">
                    Kata Sandi Sementara Khusus (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Kosongkan untuk otomatis generate"
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface border border-edge text-ink text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-[10px] text-ink-muted block">
                    Bila dikosongkan, sistem membuat sandi acak (contoh: Saba-A8X9!).
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResettingUser(null)}
                    disabled={isPending}
                    className="flex-1 h-11 min-h-11 rounded-xl border border-edge text-xs font-semibold text-ink hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleExecuteResetPassword}
                    className="flex-1 h-11 min-h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>Reset Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
