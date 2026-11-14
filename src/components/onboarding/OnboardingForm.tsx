"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Compass,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { saveOnboardingData } from "@/actions/onboarding";
import { haptic } from "@/lib/haptic";

interface OnboardingFormProps {
  initialName?: string;
  userEmail: string;
  userImage?: string | null;
}

const ROLE_INTENT_OPTIONS = [
  {
    id: "Calon Anggota",
    title: "Calon Anggota",
    desc: "Ingin bergabung, belajar, dan berkarya di salah satu divisi.",
    icon: Sparkles,
  },
  {
    id: "Tamu / Kolaborator",
    title: "Tamu / Kolaborator",
    desc: "Kepanitiaan gabungan, mitra sekolah, atau kolaborasi proker.",
    icon: Compass,
  },
  {
    id: "Alumni",
    title: "Alumni Saba ExploIT",
    desc: "Meninjau perkembangan organisasi & berbagi pengalaman.",
    icon: User,
  },
  {
    id: "Eksplorasi Proyek",
    title: "Eksplorasi Proyek",
    desc: "Melihat portofolio karya & repositori perpustakaan digital.",
    icon: Compass,
  },
] as const;

export function OnboardingForm({
  initialName = "",
  userEmail,
  userImage,
}: OnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [fullName, setFullName] = useState(
    initialName === "Pengguna Baru" ? "" : initialName
  );
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [asalTujuan, setAsalTujuan] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Validasi Nama: minimal 3 karakter
  const isNameValid = fullName.trim().length >= 3;

  // Validasi nomor WA: minimal 10 digit angka bersih
  const rawDigits = noWhatsapp.replace(/\D/g, "");
  const isWaValid = rawDigits.length >= 10 && rawDigits.length <= 15;

  const isIntentValid = Boolean(asalTujuan.trim());
  const canSubmit = isNameValid && isWaValid && isIntentValid && !isPending;

  const handleNextStep1 = () => {
    if (!isNameValid) {
      setErrorMessage("Nama lengkap resmi wajib diisi minimal 3 karakter.");
      return;
    }
    setErrorMessage(null);
    haptic.tap();
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!isWaValid) {
      setErrorMessage("Nomor WhatsApp wajib diisi minimal 10 digit.");
      return;
    }
    setErrorMessage(null);
    haptic.tap();
    setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isNameValid || !isWaValid || !isIntentValid) {
      setErrorMessage("Pastikan seluruh langkah kelengkapan profil terisi dengan benar.");
      return;
    }

    haptic.success();
    startTransition(async () => {
      const res = await saveOnboardingData({
        fullName: fullName.trim(),
        noWhatsapp: noWhatsapp.trim(),
        asalTujuan: asalTujuan.trim(),
      });

      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMessage(res.message);
      }
    });
  };

  const initials =
    (fullName || initialName || userEmail)
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "SE";

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 space-y-6">
      {/* ── BRAND & PROGRESS STEPPER BAR (Arc Browser Style) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs font-mono">
              SE
            </div>
            <span className="text-xs font-bold font-display uppercase tracking-widest text-ink">
              Onboarding Anggota
            </span>
          </div>

          <span className="text-[11px] font-mono font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            Langkah {step} dari 3
          </span>
        </div>

        {/* 3-Step Segmented Bar */}
        <div className="grid grid-cols-3 gap-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 1 ? "bg-primary" : "bg-surface-container"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 2 ? "bg-primary" : "bg-surface-container"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 3 ? "bg-primary" : "bg-surface-container"
            }`}
          />
        </div>
      </div>

      {/* ── USER IDENTITY PILL (Google SSO Verified) ── */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border hairline-border shadow-xs">
        <div className="w-9 h-9 rounded-full bg-surface-container border hairline-border overflow-hidden shrink-0 flex items-center justify-center">
          {userImage ? (
            <Image
              src={userImage}
              alt={fullName || initialName || "Foto profil pengguna"}
              width={36}
              height={36}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-ink font-mono">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-ink block truncate font-display">
            {fullName || initialName || "Pengguna Baru"}
          </span>
          <span className="text-[11px] text-ink-muted block truncate font-mono">
            {userEmail}
          </span>
        </div>
        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Google SSO Terverifikasi" />
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── STEP 1: NAMA LENGKAP RESMI ── */}
      {step === 1 && (
        <div className="card-solid p-6 rounded-3xl border hairline-border space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight font-display">
              Siapa Nama Lengkapmu?
            </h1>
            <p className="text-xs text-ink-muted leading-relaxed">
              Nama resmi yang tercantum pada presensi rapat, sertifikat portofolio karya, dan penerbitan KTA Digital.
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                <User className="h-4 w-4 text-primary" />
              </div>
              <input
                type="text"
                required
                autoFocus
                maxLength={70}
                placeholder="Contoh: Fauzan Daniswara"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isNameValid) {
                    e.preventDefault();
                    handleNextStep1();
                  }
                }}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface border hairline-border text-ink text-sm focus:outline-none focus:border-primary font-medium transition-all"
              />
            </div>
            <p className="text-[11px] text-ink-muted px-1">
              Gunakan nama lengkap asli sesuai identitas sekolah/KTP.
            </p>
          </div>

          <button
            type="button"
            disabled={!isNameValid}
            onClick={handleNextStep1}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Lanjut ke Kontak WhatsApp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: NOMOR WHATSAPP ── */}
      {step === 2 && (
        <div className="card-solid p-6 rounded-3xl border hairline-border space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight font-display">
              Nomor WhatsApp Aktif
            </h1>
            <p className="text-xs text-ink-muted leading-relaxed">
              Digunakan pengurus untuk verifikasi identitas, notifikasi tagihan kas, dan koordinasi acara.
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                <Phone className="h-4 w-4 text-emerald-500" />
              </div>
              <input
                type="tel"
                required
                autoFocus
                inputMode="tel"
                placeholder="Contoh: 081234567890"
                value={noWhatsapp}
                onChange={(e) => setNoWhatsapp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isWaValid) {
                    e.preventDefault();
                    handleNextStep2();
                  }
                }}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface border hairline-border text-ink text-sm focus:outline-none focus:border-primary font-medium transition-all font-mono"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
              <span>Minimal 10 digit angka bersih</span>
              {rawDigits.length > 0 && (
                <span
                  className={
                    isWaValid
                      ? "text-emerald-600 dark:text-emerald-400 font-bold font-mono"
                      : "text-amber-500 font-mono"
                  }
                >
                  {rawDigits.length} digit
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                haptic.tap();
                setStep(1);
              }}
              className="h-12 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 text-ink font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              disabled={!isWaValid}
              onClick={handleNextStep2}
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Lanjut ke Tujuan Kunjungan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: ASAL / TUJUAN KUNJUNGAN & SUBMIT ── */}
      {step === 3 && (
        <form
          onSubmit={handleSubmit}
          className="card-solid p-6 rounded-3xl border hairline-border space-y-5 animate-in fade-in duration-200"
        >
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight font-display">
              Maksud Kunjungan Anda
            </h1>
            <p className="text-xs text-ink-muted leading-relaxed">
              Pilih orientasi peran untuk membantu pengurus memvalidasi hak akses akun Anda.
            </p>
          </div>

          <div className="space-y-2.5">
            {ROLE_INTENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = asalTujuan === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    haptic.tap();
                    setAsalTujuan(opt.id);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-edge/70 hover:border-edge bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-container text-ink-muted border-edge/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${isSelected ? "text-primary" : "text-ink"} font-display`}>
                        {opt.title}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-edge bg-card"
                    }`}
                  >
                    {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low border hairline-border text-[11px] text-ink-muted leading-relaxed flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Akun baru terdaftar dengan status <strong>Tamu (GUEST)</strong>. Pengurus akan mengaktivasi akunmu menjadi Anggota Resmi setelah verifikasi.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                haptic.tap();
                setStep(2);
              }}
              className="h-12 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 text-ink font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>Buka Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
