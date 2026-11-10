"use client";

import React, { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Building2,
  Code2,
  Palette,
  Camera,
  Film,
  Briefcase,
  ArrowRight,
  Loader2,
  AlertCircle,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Division, Role } from "@prisma/client";
import { calculateGenFromGrade } from "@/lib/academic-year";
import {
  completePhase2Profile,
  completePhase2Kolaborator,
} from "@/actions/onboarding";
import { triggerMicroConfetti } from "@/lib/confetti";
import { haptic } from "@/lib/haptic";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export interface CompleteProfileUserData {
  id: string;
  name: string;
  role: Role;
  mainDivision?: Division | string | null;
  classGrade?: string | null;
  instansi?: string | null;
}

interface CompleteProfileModalProps {
  user: CompleteProfileUserData;
}

const DIVISION_OPTIONS = [
  {
    id: Division.PROGRAMMING,
    title: "Programming",
    desc: "Web, Mobile, AI & Rekayasa Software",
    icon: Code2,
    badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  },
  {
    id: Division.DESIGN,
    title: "Desain Grafis",
    desc: "UI/UX, Visual Branding & Ilustrasi",
    icon: Palette,
    badgeColor: "text-purple-500 bg-purple-500/10 border-purple-500/30",
  },
  {
    id: Division.PHOTOGRAPHY,
    title: "Fotografi",
    desc: "Dokumentasi Karya, Studio & Editorial",
    icon: Camera,
    badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  {
    id: Division.CINEMATOGRAPHY,
    title: "Sinematografi",
    desc: "Video Produksi, Motion & Directing",
    icon: Film,
    badgeColor: "text-rose-500 bg-rose-500/10 border-rose-500/30",
  },
  {
    id: Division.TECHNOPRENEURSHIP,
    title: "Technopreneurship",
    desc: "Bisnis Digital, Sponsorship & Danus",
    icon: Briefcase,
    badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
];

const GRADE_OPTIONS: Array<{
  value: "KELAS_10" | "KELAS_11" | "KELAS_12";
  label: string;
  gradeNum: 10 | 11 | 12;
}> = [
  { value: "KELAS_10", label: "Kelas 10", gradeNum: 10 },
  { value: "KELAS_11", label: "Kelas 11", gradeNum: 11 },
  { value: "KELAS_12", label: "Kelas 12", gradeNum: 12 },
];

export function CompleteProfileModal({ user }: CompleteProfileModalProps) {
  const router = useRouter();

  // Evaluasi apakah modal perlu ditampilkan
  const isMemberOrAdmin =
    user.role === Role.MEMBER ||
    user.role === Role.ADMIN ||
    user.role === Role.BENDAHARA;

  const isKolaborator = user.role === Role.KOLABORATOR;

  const needsMemberSetup = isMemberOrAdmin && (!user.mainDivision || !user.classGrade);
  const needsKolaboratorSetup = isKolaborator && !user.instansi;

  const isOpen = needsMemberSetup || needsKolaboratorSetup;
  useBodyScrollLock(isOpen);

  // Form States untuk Member/Admin
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    (user.mainDivision as Division) || null
  );
  const [selectedGrade, setSelectedGrade] = useState<
    "KELAS_10" | "KELAS_11" | "KELAS_12" | null
  >((user.classGrade as "KELAS_10" | "KELAS_11" | "KELAS_12") || null);

  // Form State untuk Kolaborator
  const [instansi, setInstansi] = useState(user.instansi || "");

  // Form State Kata Sandi Sekunder (Wajib)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Validasi Kata Sandi
  const isPasswordValid = password.length >= 6 && password === confirmPassword;

  // Kalkulasi Auto-Gen Dinamis secara real-time saat pengguna memilih Kelas
  const autoGenInfo = useMemo(() => {
    if (!selectedGrade) return null;
    return calculateGenFromGrade(selectedGrade);
  }, [selectedGrade]);

  if (!isOpen) return null;

  const handleSubmitMember = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedDivision) {
      setErrorMessage("Silakan pilih Divisi utama Anda.");
      return;
    }

    if (!selectedGrade) {
      setErrorMessage("Silakan pilih Tingkat Kelas Anda.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Kata sandi akun minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    startTransition(async () => {
      const res = await completePhase2Profile({
        division: selectedDivision,
        grade: selectedGrade,
        password: password.trim(),
      });

      if (res.success) {
        haptic.success();
        triggerMicroConfetti({ originX: 0.5, originY: 0.5, particleCount: 50 });
        router.refresh();
      } else {
        haptic.warning();
        setErrorMessage(res.message);
      }
    });
  };

  const handleSubmitKolaborator = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!instansi.trim() || instansi.trim().length < 3) {
      setErrorMessage("Nama instansi/organisasi minimal 3 karakter.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Kata sandi akun minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    startTransition(async () => {
      const res = await completePhase2Kolaborator({
        instansi: instansi.trim(),
        password: password.trim(),
      });

      if (res.success) {
        haptic.success();
        triggerMicroConfetti({ originX: 0.5, originY: 0.5, particleCount: 45 });
        router.refresh();
      } else {
        haptic.warning();
        setErrorMessage(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col text-ink animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-edge/60 relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Akun Anda Telah Disetujui</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
            Lengkapi Profil {isKolaborator ? "Kolaborator" : "Anggota"} Anda
          </h2>

          <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
            {isKolaborator
              ? "Masukkan informasi organisasi atau instansi tempat Anda bernaung untuk memulai kolaborasi proyek."
              : "Pilih divisi peminatan dan kelas Anda. Sistem kami akan secara otomatis menghitung nomor angkatan (Gen) Anda."}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Alur MEMBER / ADMIN */}
          {needsMemberSetup && (
            <form onSubmit={handleSubmitMember} id="member-phase2-form" className="space-y-5">
              {/* Langkah 1: Pilih Kelas */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>1. Pilih Tingkat Kelas Saat Ini *</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {GRADE_OPTIONS.map((opt) => {
                    const isSelected = selectedGrade === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedGrade(opt.value)}
                        className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]"
                            : "bg-surface-container-low border-edge text-ink hover:border-slate-400 hover:bg-surface-container"
                        }`}
                      >
                        <span className="text-xs font-bold block">{opt.label}</span>
                        <span
                          className={`text-[10px] block ${
                            isSelected ? "text-white/80" : "text-ink-muted"
                          }`}
                        >
                          Kelas {opt.gradeNum}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Banner Dynamic Auto-Gen Preview */}
              {autoGenInfo && (
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                      #{autoGenInfo.gen}
                    </span>
                    <span className="text-xs font-bold text-ink">
                      Teralokasi ke Generasi {autoGenInfo.gen} (Gen {autoGenInfo.gen})
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-relaxed pl-8">
                    Dihitung otomatis untuk Tahun Ajaran {autoGenInfo.academicYear} berdasarkan Kelas {autoGenInfo.kelasLabel}.
                  </p>
                </div>
              )}

              {/* Langkah 2: Pilih Divisi */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>2. Pilih Divisi Peminatan Utama *</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DIVISION_OPTIONS.map((div) => {
                    const isSelected = selectedDivision === div.id;
                    const Icon = div.icon;
                    return (
                      <button
                        key={div.id}
                        type="button"
                        onClick={() => setSelectedDivision(div.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? "bg-primary/5 border-primary ring-2 ring-primary/30 shadow-sm scale-[1.01]"
                            : "bg-surface-container-low/70 border-edge hover:border-slate-400 hover:bg-surface-container"
                        }`}
                      >
                        <div
                          className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${div.badgeColor}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-ink block truncate">
                            {div.title}
                          </span>
                          <span className="text-[10px] text-ink-muted block line-clamp-1">
                            {div.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Langkah 3: Buat Kata Sandi Akun */}
              <div className="space-y-3 pt-2 border-t border-edge/60">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>3. Buat Kata Sandi Akun *</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? "Sembunyikan" : "Lihat"}</span>
                    </button>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink flex items-center justify-between">
                    <span>Konfirmasi Kata Sandi *</span>
                    {confirmPassword && (
                      <span className={`text-[11px] ${password === confirmPassword ? "text-emerald-500" : "text-rose-500"}`}>
                        {password === confirmPassword ? "Cocok ✓" : "Belum Cocok"}
                      </span>
                    )}
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Ulangi kata sandi di atas"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all font-mono"
                  />
                  <p className="text-[11px] text-ink-muted px-0.5">
                    Digunakan untuk autentikasi sekunder &amp; keamanan akun Anda di perangkat bersama.
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* Form Alur KOLABORATOR */}
          {needsKolaboratorSetup && (
            <form
              onSubmit={handleSubmitKolaborator}
              id="kolaborator-phase2-form"
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-teal-500" />
                    <span>
                      Asal Organisasi / Instansi <span className="text-primary">*</span>
                    </span>
                  </span>
                  <span className="text-[11px] text-ink-muted">Wajib diisi</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Contoh: PT Telkom Indonesia / Komunitas IT Bantul / SMAN 2"
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all font-medium"
                />
                <p className="text-[11px] text-ink-muted px-0.5">
                  Akun kolaborator berkolaborasi pada proyek karya tanpa kewajiban iuran kas, kuis, maupun KTA digital.
                </p>
              </div>

              {/* Kata Sandi untuk Kolaborator */}
              <div className="space-y-3 pt-2 border-t border-edge/60">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Buat Kata Sandi Akun *</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? "Sembunyikan" : "Lihat"}</span>
                    </button>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink flex items-center justify-between">
                    <span>Konfirmasi Kata Sandi *</span>
                    {confirmPassword && (
                      <span className={`text-[11px] ${password === confirmPassword ? "text-emerald-500" : "text-rose-500"}`}>
                        {password === confirmPassword ? "Cocok ✓" : "Belum Cocok"}
                      </span>
                    )}
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Ulangi kata sandi di atas"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all font-mono"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-edge bg-surface-container-low/60 shrink-0 flex items-center justify-end">
          <button
            type="submit"
            form={needsMemberSetup ? "member-phase2-form" : "kolaborator-phase2-form"}
            disabled={
              isPending ||
              !isPasswordValid ||
              (needsMemberSetup && (!selectedDivision || !selectedGrade)) ||
              (needsKolaboratorSetup && !instansi.trim())
            }
            className="w-full sm:w-auto px-6 h-12 min-h-11 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Profil...</span>
              </>
            ) : (
              <>
                <span>Selesaikan &amp; Buka Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
