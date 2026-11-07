"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Compass,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { saveOnboardingData } from "@/actions/onboarding";

interface OnboardingFormProps {
  initialName?: string;
  userEmail: string;
  userImage?: string | null;
}

const SUGGESTION_CHIPS = [
  "Calon Anggota",
  "Tamu / Kolaborator",
  "Alumni SMAN 1 Bantul",
  "Eksplorasi Proyek",
];

export function OnboardingForm({
  initialName = "",
  userEmail,
  userImage,
}: OnboardingFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(
    initialName === "Pengguna Baru" ? "" : initialName
  );
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [asalTujuan, setAsalTujuan] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Validasi Nama: minimal 3 karakter
  const isNameValid = fullName.trim().length >= 3;

  // Validasi nomor WA: minimal 10 digit angka bersih
  const rawDigits = noWhatsapp.replace(/\D/g, "");
  const isWaValid = rawDigits.length >= 10 && rawDigits.length <= 15;

  const canSubmit = isNameValid && isWaValid && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isNameValid) {
      setErrorMessage("Nama lengkap resmi wajib diisi minimal 3 karakter.");
      return;
    }

    if (!isWaValid) {
      setErrorMessage("Nomor WhatsApp wajib diisi minimal 10 digit.");
      return;
    }

    startTransition(async () => {
      const res = await saveOnboardingData({
        fullName: fullName.trim(),
        noWhatsapp: noWhatsapp.trim(),
        asalTujuan: asalTujuan.trim() || undefined,
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
      {/* Brand & Greetings */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-card border border-primary/40 text-primary font-bold text-base shadow-lg shadow-primary/20">
          SE
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          Satu Langkah Lagi
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted max-w-xs mx-auto leading-relaxed">
          Akun Google Anda telah terhubung. Lengkapi nama resmi dan kontak WhatsApp Anda untuk verifikasi akses sistem.
        </p>
      </div>

      {/* User Mini Identity Card */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-edge">
        <div className="w-11 h-11 rounded-full bg-surface-container-low border border-edge overflow-hidden shrink-0 flex items-center justify-center">
          {userImage ? (
            <Image
              src={userImage}
              alt={fullName || initialName || "Foto profil pengguna"}
              width={44}
              height={44}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-ink font-mono">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-ink block truncate">
            {fullName || initialName || "Pengguna Baru"}
          </span>
          <span className="text-xs text-ink-muted block truncate">
            {userEmail}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Google SSO Terverifikasi</span>
          </span>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-card border border-edge shadow-xl space-y-4"
      >
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input 1: Nama Lengkap Resmi (Wajib) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary" />
              <span>
                Nama Lengkap Asli <span className="text-primary">*</span>
              </span>
            </span>
            <span className="text-[11px] text-ink-muted">Sesuai KTP / Rapor</span>
          </label>
          <input
            type="text"
            required
            maxLength={70}
            placeholder="Contoh: Fauzan Arif Aldiano"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-surface border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all font-medium"
          />
          <p className="text-[11px] text-ink-muted px-0.5">
            Nama resmi untuk pencatatan presensi rapat, sertifikat karya, dan KTA organisasi.
          </p>
        </div>

        {/* Input 2: Nomor WhatsApp (Wajib) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>
                Nomor WhatsApp <span className="text-primary">*</span>
              </span>
            </span>
            <span className="text-[11px] text-ink-muted">Wajib diisi</span>
          </label>
          <input
            type="tel"
            required
            inputMode="tel"
            placeholder="Contoh: 081234567890"
            value={noWhatsapp}
            onChange={(e) => setNoWhatsapp(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-surface border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all font-medium"
          />
          <div className="flex items-center justify-between text-[11px] text-ink-muted px-0.5">
            <span>Digunakan pengurus untuk verifikasi identitas &amp; koordinasi acara.</span>
            {rawDigits.length > 0 && (
              <span
                className={
                  isWaValid
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-amber-500"
                }
              >
                {rawDigits.length} digit
              </span>
            )}
          </div>
        </div>

        {/* Input 3: Asal / Tujuan (Opsional) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-ink flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-500" />
              <span>Asal / Tujuan Kunjungan</span>
            </span>
            <span className="text-[11px] text-ink-muted">Opsional</span>
          </label>
          <input
            type="text"
            maxLength={100}
            placeholder="Misal: Calon Anggota Gen 22, Tamu Workshop, Kolaborator..."
            value={asalTujuan}
            onChange={(e) => setAsalTujuan(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-surface border border-edge text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all font-medium"
          />

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setAsalTujuan(chip)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  asalTujuan === chip
                    ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                    : "bg-surface-container-low border-edge text-ink-muted hover:text-ink hover:border-slate-400"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Note info regarding Role GUEST */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-edge/80 text-[11px] text-ink-muted leading-relaxed flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            Akun baru akan berstatus <strong>Tamu (GUEST)</strong>. Pengurus/Operator akan memverifikasi akun Anda dan menetapkan divisi serta hak akses selanjutnya.
          </span>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 min-h-11 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Profil...</span>
              </>
            ) : (
              <>
                <span>Selesaikan &amp; Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
