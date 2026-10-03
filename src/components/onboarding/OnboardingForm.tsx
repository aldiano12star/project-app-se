"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  User,
  GraduationCap,
  Layers,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { saveOnboardingData } from "@/actions/onboarding";

interface OnboardingFormProps {
  initialName?: string;
  userEmail: string;
  userImage?: string | null;
}

export function OnboardingForm({
  initialName = "",
  userEmail,
  userImage,
}: OnboardingFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [kelas, setKelas] = useState<"X" | "XI" | "XII">("X");
  const [divisi, setDivisi] = useState("Programming");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Hitung generasi otomatis berdasarkan kelas
  const getGen = (k: "X" | "XI" | "XII") => {
    switch (k) {
      case "X":
        return { gen: 21, label: "Kelas 10 • Generasi 21 (Gen 21)" };
      case "XI":
        return { gen: 20, label: "Kelas 11 • Generasi 20 (Gen 20)" };
      case "XII":
        return { gen: 19, label: "Kelas 12 • Generasi 19 (Gen 19)" };
    }
  };

  const currentGenInfo = getGen(kelas);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMessage("Nama lengkap wajib diisi minimal 3 karakter.");
      return;
    }

    startTransition(async () => {
      const res = await saveOnboardingData({
        fullName: fullName.trim(),
        kelas,
        divisi,
      });

      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMessage(res.message);
      }
    });
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SE";

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#151D2E] border border-primary/40 text-primary font-bold text-base shadow-lg shadow-primary/20">
          SE
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Lengkapi Data Anggota
        </h1>
        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
          Selamat datang di Saba ExploIT. Silakan lengkapi identitas akademik dan minat divisi Anda.
        </p>
      </div>

      {/* User Mini Card */}
      <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#151D2E] border border-[#222F46]">
        <div className="w-11 h-11 rounded-full bg-slate-900 border border-[#222F46] overflow-hidden shrink-0 flex items-center justify-center">
          {userImage ? (
            <img
              src={userImage}
              alt={fullName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-white font-mono">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-white block truncate">
            {userEmail}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Akun Google Terautentikasi</span>
          </span>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-[#151D2E] border border-[#222F46] shadow-xl space-y-5"
      >
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input 1: Nama Lengkap */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <User className="w-4 h-4 text-primary" />
            <span>Nama Lengkap <span className="text-primary">*</span></span>
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Fauzan Arif Aldiano"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-[#0B0F19] border border-[#222F46] text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium"
          />
        </div>

        {/* Input 2: Pilihan Kelas (Dropdown: X, XI, XII) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>Tingkat Kelas <span className="text-primary">*</span></span>
          </label>
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value as "X" | "XI" | "XII")}
            className="w-full h-12 px-4 rounded-xl bg-[#0B0F19] border border-[#222F46] text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium cursor-pointer"
          >
            <option value="X">Kelas X (Sepuluh)</option>
            <option value="XI">Kelas XI (Sebelas)</option>
            <option value="XII">Kelas XII (Dua Belas)</option>
          </select>

          {/* Dynamic Auto-Calculated Generation Badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Otomatis Terdeteksi: <strong>{currentGenInfo.label}</strong></span>
          </div>
        </div>

        {/* Input 3: Pilihan Divisi */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Peminatan Divisi Utama <span className="text-primary">*</span></span>
          </label>
          <select
            value={divisi}
            onChange={(e) => setDivisi(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-[#0B0F19] border border-[#222F46] text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium cursor-pointer"
          >
            <option value="Programming">Programming</option>
            <option value="Technopreneurship">Technopreneurship</option>
            <option value="Desain">Desain</option>
            <option value="Fotografi">Fotografi</option>
            <option value="Cinematografi">Cinematografi</option>
          </select>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 min-h-[48px] rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Data Profil...</span>
              </>
            ) : (
              <>
                <span>Simpan &amp; Lanjutkan ke Beranda</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
