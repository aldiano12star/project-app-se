"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  UserCheck,
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
  GraduationCap,
  Sparkles,
  Search,
  ChevronDown,
} from "lucide-react";
import { Role, Division } from "@prisma/client";
import { promoteUserRole, resetUserPasswordByOperator } from "@/actions/profile";
import { calculateGenFromGrade, getAcademicYear } from "@/lib/academic-year";
import { Modal } from "@/components/ui/Modal";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  classGrade?: string | null;
  gen?: number | null;
  generationNumber?: number | null;
  mainDivision?: Division | null;
  noWhatsapp?: string | null;
  asalTujuan?: string | null;
  status?: string | null;
  createdAt: string;
}

interface UserManagementClientViewProps {
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
      return "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/50";
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

/**
 * Ekstraksi nomor generasi (Gen) yang rollover-proof.
 * Memeriksa kolom gen, generationNumber, atau menghitung otomatis dari classGrade
 * berdasarkan tahun ajaran saat ini.
 */
export function resolveUserGen(user: ManagedUser): number | null {
  if (user.gen && typeof user.gen === "number") return user.gen;
  if (user.generationNumber && typeof user.generationNumber === "number") {
    return user.generationNumber;
  }
  if (user.classGrade && user.classGrade !== "ALUMNI") {
    try {
      const res = calculateGenFromGrade(user.classGrade);
      return res.gen;
    } catch {
      return null;
    }
  }
  return null;
}

export function formatGradeGen(user: ManagedUser) {
  if (user.classGrade === "ALUMNI" || user.status === "DEMISIONER") {
    const resolvedGen = resolveUserGen(user);
    return resolvedGen ? `Alumni (Gen ${resolvedGen})` : "Alumni";
  }
  const resolvedGen = resolveUserGen(user);
  if (resolvedGen) {
    if (user.classGrade === "KELAS_10") return `Kelas X (Gen ${resolvedGen})`;
    if (user.classGrade === "KELAS_11") return `Kelas XI (Gen ${resolvedGen})`;
    if (user.classGrade === "KELAS_12") return `Kelas XII (Gen ${resolvedGen})`;
    return `Gen ${resolvedGen}`;
  }
  return user.classGrade || null;
}

export function UserManagementClientView({
  currentUserRole,
  users,
}: UserManagementClientViewProps) {
  // Ekstraksi nilai gen unik dari basis data + tahun ajaran berjalan secara dinamis (Rollover-Proof)
  const dynamicGens = useMemo(() => {
    const genSet = new Set<number>();

    // 1. Ambil dari tahun ajaran saat ini (Kelas 10, 11, 12 selalu terdaftar otomatis)
    try {
      const active10 = calculateGenFromGrade("KELAS_10").gen;
      const active11 = calculateGenFromGrade("KELAS_11").gen;
      const active12 = calculateGenFromGrade("KELAS_12").gen;
      genSet.add(active10);
      genSet.add(active11);
      genSet.add(active12);
    } catch (e) {
      console.warn("Gagal menghitung gen tahun ajaran aktif:", e);
    }

    // 2. Ambil seluruh gen unik dari database (termasuk angkatan baru yang mendaftar atau angkatan lama)
    users.forEach((u) => {
      const g = resolveUserGen(u);
      if (g && typeof g === "number") {
        genSet.add(g);
      }
    });

    return Array.from(genSet).sort((a, b) => b - a); // Urutan Gen termuda ke tertua
  }, [users]);

  // Tab State: "GUEST" | `GEN_${number}` | "ALUMNI" | "KOLABORATOR" | "ALL"
  const [activeTab, setActiveTab] = useState<string>("GUEST");
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
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

  // Operator Password Override States
  const [resettingUser, setResettingUser] = useState<ManagedUser | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetResult, setResetResult] = useState<{
    temporaryPassword: string;
    targetWhatsapp?: string | null;
    targetName?: string;
  } | null>(null);

  // Hitung jumlah anggota untuk setiap filter
  const counts = useMemo(() => {
    const guestCount = users.filter((u) => u.role === Role.GUEST).length;
    const alumniCount = users.filter(
      (u) => u.classGrade === "ALUMNI" || u.status === "DEMISIONER"
    ).length;
    const kolaboratorCount = users.filter(
      (u) => u.role === Role.KOLABORATOR
    ).length;

    const genCounts: Record<number, number> = {};
    dynamicGens.forEach((g) => {
      genCounts[g] = users.filter((u) => {
        const userGen = resolveUserGen(u);
        return (
          userGen === g &&
          u.role !== Role.GUEST &&
          u.role !== Role.KOLABORATOR &&
          u.classGrade !== "ALUMNI" &&
          u.status !== "DEMISIONER"
        );
      }).length;
    });

    return {
      guestCount,
      alumniCount,
      kolaboratorCount,
      genCounts,
      totalCount: users.length,
    };
  }, [users, dynamicGens]);

  // Progressive disclosure helper
  const isSecondaryActive = activeTab !== "ALL" && activeTab !== "GUEST";
  const activeSecondaryInfo = useMemo(() => {
    if (activeTab.startsWith("GEN_")) {
      const g = parseInt(activeTab.replace("GEN_", ""), 10);
      return {
        label: `Gen ${g}`,
        count: counts.genCounts[g] || 0,
      };
    }
    if (activeTab === "ALUMNI") {
      return {
        label: "Alumni",
        count: counts.alumniCount,
      };
    }
    if (activeTab === "KOLABORATOR") {
      return {
        label: "Kolaborator",
        count: counts.kolaboratorCount,
      };
    }
    return null;
  }, [activeTab, counts]);

  // Saring pengguna berdasarkan Tab Aktif
  const filteredUsers = useMemo(() => {
    let result = users;

    if (activeTab === "GUEST") {
      result = users.filter((u) => u.role === Role.GUEST);
    } else if (activeTab.startsWith("GEN_")) {
      const targetGen = parseInt(activeTab.replace("GEN_", ""), 10);
      result = users.filter((u) => {
        const userGen = resolveUserGen(u);
        return (
          userGen === targetGen &&
          u.role !== Role.GUEST &&
          u.role !== Role.KOLABORATOR &&
          u.classGrade !== "ALUMNI" &&
          u.status !== "DEMISIONER"
        );
      });
    } else if (activeTab === "ALUMNI") {
      result = users.filter(
        (u) => u.classGrade === "ALUMNI" || u.status === "DEMISIONER"
      );
    } else if (activeTab === "KOLABORATOR") {
      result = users.filter((u) => u.role === Role.KOLABORATOR);
    } else if (activeTab === "ALL") {
      result = users;
    }

    // Filter tambahan dengan search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.asalTujuan && u.asalTujuan.toLowerCase().includes(q)) ||
          (u.noWhatsapp && u.noWhatsapp.includes(q))
      );
    }

    return result;
  }, [users, activeTab, searchQuery]);

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
      if (gradeVal === "ALUMNI") {
        kelasName = "Alumni";
      } else {
        const genResult = calculateGenFromGrade(gradeVal);
        genNum = genResult.gen;
        kelasName = genResult.kelasLabel;
      }
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

  // Ambil label tahun ajaran untuk edukasi UI
  const academicYearInfo = getAcademicYear();

  return (
    <div className="space-y-5">
      {/* Top Header Navigasi Kembali */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/pengaturan"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink text-xs font-semibold border border-edge transition-colors min-h-11"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          <span>Kembali</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
            TA {academicYearInfo.label}
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Manajemen Akun &amp; Role
            </h1>
            <p className="text-xs text-ink-muted">
              Pusat aktivasi pengguna, filter angkatan dinamis, &amp; otorisasi sistem
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Dynamic Filter Tabs (Progressive Disclosure) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-container-low border border-edge shadow-xs">
          {/* Tab 1: Semua */}
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`flex-1 sm:flex-none px-4 py-2.5 min-h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
              activeTab === "ALL"
                ? "bg-card text-ink shadow-xs border border-edge font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Users className="w-4 h-4 text-sky-500 shrink-0" />
            <span>Semua</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-[10px] text-ink-secondary border border-edge font-mono">
              {counts.totalCount}
            </span>
          </button>

          {/* Tab 2: Menunggu Verifikasi (GUEST) */}
          <button
            type="button"
            onClick={() => setActiveTab("GUEST")}
            className={`flex-1 sm:flex-none px-4 py-2.5 min-h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
              activeTab === "GUEST"
                ? "bg-card text-ink shadow-xs border border-edge font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Menunggu</span>
            {counts.guestCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/40 font-mono animate-pulse">
                {counts.guestCount}
              </span>
            ) : (
              <span className="text-[10px] text-ink-muted font-mono">(0)</span>
            )}
          </button>

          {/* Tab 3: Progressive Disclosure "Lainnya..." */}
          <button
            type="button"
            onClick={() => setIsMoreFiltersOpen(true)}
            className={`flex-1 sm:flex-none px-3.5 py-2.5 min-h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              isSecondaryActive
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-500/50 shadow-xs font-bold"
                : "text-ink-muted hover:text-ink bg-surface-container/60 hover:bg-surface-container border border-edge/60"
            }`}
            title="Buka pilihan filter angkatan & kategori"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSecondaryActive ? "text-purple-600 dark:text-purple-400" : "text-primary"}`} />
            <span>{isSecondaryActive ? activeSecondaryInfo?.label : "Lainnya"}</span>
            {isSecondaryActive && activeSecondaryInfo && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-200/80 dark:bg-purple-900/60 text-[10px] font-bold font-mono">
                {activeSecondaryInfo.count}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted shrink-0" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, WhatsApp, atau keterangan pendaftaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-edge bg-card text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* User Cards List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="p-10 rounded-2xl bg-card border border-edge text-center space-y-2.5">
            <UserCheck className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-ink">
              {activeTab === "GUEST"
                ? "Semua Akun Telah Terverifikasi"
                : "Tidak Ada Data Anggota Ditemukan"}
            </p>
            <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
              {activeTab === "GUEST"
                ? "Tidak ada akun tamu baru yang sedang menunggu persetujuan Operator saat ini."
                : "Tidak ada akun yang cocok dengan tab filter atau kata kunci pencarian yang dimasukkan."}
            </p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isProcessing = processingUserId === u.id && isPending;
            const initials = u.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const gradeLabel = formatGradeGen(u);

            return (
              <div
                key={u.id}
                className="p-4 sm:p-5 rounded-2xl bg-card border border-edge shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-edge/80"
              >
                {/* User Identity Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-surface-container border border-edge overflow-hidden shrink-0 flex items-center justify-center mt-0.5">
                    {u.image ? (
                      <Image
                        src={u.image}
                        alt={u.name || "Foto profil pengguna"}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xs font-bold text-ink-muted font-mono">
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
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-ink-muted border border-edge font-mono">
                          {gradeLabel}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink-muted truncate">
                      {u.email}
                    </p>

                    {/* Info Kontak & Asal / Tujuan */}
                    <div className="flex items-center gap-3 text-xs text-ink-muted pt-0.5 flex-wrap">
                      {u.noWhatsapp && (
                        <a
                          href={`https://wa.me/${u.noWhatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline transition-colors font-medium"
                          title="Buka percakapan WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{u.noWhatsapp}</span>
                        </a>
                      )}

                      {u.asalTujuan && (
                        <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
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

      {/* Modal: Atur Gen & Divisi Pengguna (Viewport Centered via Global Modal) */}
      <Modal
        isOpen={!!assigningUser}
        onClose={() => setAssigningUser(null)}
        className="max-w-sm"
      >
        <div className="w-full rounded-2xl bg-card border border-edge p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-edge">
            <div>
              <h4 className="text-sm font-bold text-ink">
                Atur Penugasan Akun
              </h4>
              <p className="text-xs text-ink-muted truncate max-w-60">
                {assigningUser?.name}
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

            {/* Dropdown Kelas & Angkatan Dinamis */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                Tingkat Kelas &amp; Generasi (Gen)
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface border border-edge text-ink text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="NONE">Tanpa Kelas (Luar Sekolah / Tamu)</option>
                <option value="KELAS_10">
                  Kelas X (Gen {calculateGenFromGrade("KELAS_10").gen})
                </option>
                <option value="KELAS_11">
                  Kelas XI (Gen {calculateGenFromGrade("KELAS_11").gen})
                </option>
                <option value="KELAS_12">
                  Kelas XII (Gen {calculateGenFromGrade("KELAS_12").gen})
                </option>
                <option value="ALUMNI">Alumni / Demisioner</option>
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
      </Modal>

      {/* Modal Dialog Operator Reset Password (Viewport Centered via Global Modal) */}
      <Modal
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        className="max-w-sm"
      >
        <div className="w-full rounded-2xl bg-card border border-edge p-5 shadow-2xl space-y-4 text-ink">
          <div className="flex items-center justify-between pb-2 border-b border-edge">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Reset Kata Sandi Akun</h4>
                <p className="text-[11px] text-ink-muted truncate max-w-48">
                  {resettingUser?.name}
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
                className="w-full h-11 min-h-11 rounded-xl border border-edge text-xs font-semibold text-ink hover:bg-surface-container transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>
          ) : (
            /* Formulir Input Reset Sandi Sementara */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink block">
                  Kata Sandi Baru Sementara (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk buat otomatis acak..."
                  value={customPasswordInput}
                  onChange={(e) => setCustomPasswordInput(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Bila dikosongkan, sistem akan membuat kata sandi acak aman (contoh: Saba-XXXX!).
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="flex-1 h-11 min-h-11 rounded-xl border border-edge text-xs font-semibold text-ink hover:bg-surface-container transition-all cursor-pointer"
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
                  <span>Eksekusi Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Dialog: Progressive Disclosure "Lainnya" (Filter Angkatan & Kategori) */}
      <Modal
        isOpen={isMoreFiltersOpen}
        onClose={() => setIsMoreFiltersOpen(false)}
        className="max-w-md"
      >
        <div className="w-full rounded-2xl bg-card border border-edge p-5 shadow-2xl space-y-4 text-ink">
          <div className="flex items-center justify-between pb-3 border-b border-edge">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">
                  Filter Angkatan &amp; Kategori
                </h4>
                <p className="text-[11px] text-ink-muted">
                  Pilih angkatan aktif atau kategori khusus pengguna
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMoreFiltersOpen(false)}
              className="p-1 rounded-lg text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Generasi / Angkatan Dinamis */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono block">
              Generasi / Angkatan (Dinamis)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {dynamicGens.map((genNumber) => {
                const tabKey = `GEN_${genNumber}`;
                const isSelected = activeTab === tabKey;
                const count = counts.genCounts[genNumber] || 0;

                return (
                  <button
                    key={genNumber}
                    type="button"
                    onClick={() => {
                      setActiveTab(tabKey);
                      setIsMoreFiltersOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                        : "bg-surface-container-low border-edge text-ink hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-primary" : "text-ink-muted"
                        }`}
                      />
                      <span className="text-xs font-semibold">
                        Gen {genNumber}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                        isSelected
                          ? "bg-primary text-white font-bold"
                          : "bg-surface-container text-ink-muted border border-edge"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Kategori Khusus (Alumni & Kolaborator) */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono block">
              Status Khusus
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Alumni */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ALUMNI");
                  setIsMoreFiltersOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 ${
                  activeTab === "ALUMNI"
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                    : "bg-surface-container-low border-edge text-ink hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap
                    className={`w-4 h-4 ${
                      activeTab === "ALUMNI" ? "text-primary" : "text-ink-muted"
                    }`}
                  />
                  <span className="text-xs font-semibold">Alumni</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeTab === "ALUMNI"
                      ? "bg-primary text-white font-bold"
                      : "bg-surface-container text-ink-muted border border-edge"
                  }`}
                >
                  {counts.alumniCount}
                </span>
              </button>

              {/* Kolaborator */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("KOLABORATOR");
                  setIsMoreFiltersOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 ${
                  activeTab === "KOLABORATOR"
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                    : "bg-surface-container-low border-edge text-ink hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Handshake
                    className={`w-4 h-4 ${
                      activeTab === "KOLABORATOR"
                        ? "text-primary"
                        : "text-ink-muted"
                    }`}
                  />
                  <span className="text-xs font-semibold">Kolaborator</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                    activeTab === "KOLABORATOR"
                      ? "bg-primary text-white font-bold"
                      : "bg-surface-container text-ink-muted border border-edge"
                  }`}
                >
                  {counts.kolaboratorCount}
                </span>
              </button>
            </div>
          </div>

          {/* Reset Action (Hanya jika sedang memfilter sekunder) */}
          {isSecondaryActive && (
            <div className="pt-2 border-t border-edge">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ALL");
                  setIsMoreFiltersOpen(false);
                }}
                className="w-full h-11 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-edge"
              >
                <span>Hapus Filter (Tampilkan Semua)</span>
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
