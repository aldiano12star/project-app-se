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
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#0D121F] border border-red-500/30 text-primary font-black text-base shadow-lg shadow-red-950/40">
          SE
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Lengkapi Data Anggota
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Selamat datang di Saba ExploIT. Silakan lengkapi identitas akademik dan minat divisi Anda.
        </p>
      </div>

      {/* User Mini Card */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0D121F] border border-slate-800">
        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
          {userImage ? (
            <img
              src={userImage}
              alt={fullName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-white font-mono">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-white block truncate">
            {userEmail}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Akun Google Terautentikasi</span>
          </span>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-2xl bg-[#0D121F] border border-slate-800 shadow-xl space-y-4"
      >
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input 1: Nama Lengkap */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Nama Lengkap <span className="text-primary">*</span></span>
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Fauzan Arif Aldiano"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-[#070A11] border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium"
          />
        </div>

        {/* Input 2: Pilihan Kelas (Dropdown: X, XI, XII) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
            <span>Tingkat Kelas <span className="text-primary">*</span></span>
          </label>
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value as "X" | "XI" | "XII")}
            className="w-full h-11 px-3.5 rounded-xl bg-[#070A11] border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium cursor-pointer"
          >
            <option value="X">Kelas X (Sepuluh)</option>
            <option value="XI">Kelas XI (Sebelas)</option>
            <option value="XII">Kelas XII (Dua Belas)</option>
          </select>

          {/* Dynamic Auto-Calculated Generation Badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Otomatis Terdeteksi: <strong>{currentGenInfo.label}</strong></span>
          </div>
        </div>

        {/* Input 3: Pilihan Divisi */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Peminatan Divisi Utama <span className="text-primary">*</span></span>
          </label>
          <select
            value={divisi}
            onChange={(e) => setDivisi(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-[#070A11] border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium cursor-pointer"
          >
            <option value="Programming">Programming &amp; Software Development</option>
            <option value="Multimedia & Desain">Multimedia &amp; UI/UX Desain</option>
            <option value="Hardware/Jaringan">Hardware, IoT &amp; Jaringan Komputer</option>
            <option value="Humas/Technopreneur">Humas, Event &amp; Technopreneurship</option>
          </select>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 min-h-[44px] rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer disabled:opacity-50"
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
