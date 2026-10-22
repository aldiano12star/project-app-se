"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react";
import { registerUser } from "@/actions/auth";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nisn, setNisn] = useState("");
  const [kelas, setKelas] = useState<"X" | "XI" | "XII">("X");
  const [divisi, setDivisi] = useState("Programming");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Validasi Frontend: minimal 8 karakter dan harus sama persis
  const isPasswordLengthValid = password.length >= 8;
  const isPasswordMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit =
    name.trim().length >= 3 &&
    email.trim().includes("@") &&
    isPasswordLengthValid &&
    isPasswordMatch &&
    !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isPasswordLengthValid) {
      setErrorMessage("Kata sandi harus terdiri dari minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok dengan kata sandi.");
      return;
    }

    startTransition(async () => {
      const res = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        nisn: nisn.trim() || undefined,
        kelas,
        divisi,
      });

      if (res.success) {
        setSuccessMessage(res.message);
        onSuccess?.();
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setErrorMessage(res.message);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Form */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-card border border-primary/40 text-primary font-bold text-base shadow-lg shadow-primary/20">
          SE
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Pendaftaran Akun Anggota
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Buat akun baru Saba ExploIT untuk mengakses fitur presensi, acara, dan portofolio karya.
        </p>
      </div>

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

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Input: Nama Lengkap */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <User className="w-4 h-4 text-primary" />
            <span>
              Nama Lengkap <span className="text-primary">*</span>
            </span>
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Fauzan Arif Aldiano"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium"
          />
        </div>

        {/* Input: Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-sky-500" />
            <span>
              Alamat Email <span className="text-primary">*</span>
            </span>
          </label>
          <input
            type="email"
            required
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium"
          />
        </div>

        {/* Input: Tingkat Kelas & Divisi */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>Kelas</span>
            </label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value as "X" | "XI" | "XII")}
              className="w-full h-11 px-3 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium cursor-pointer"
            >
              <option value="X">Kelas X (Gen 21)</option>
              <option value="XI">Kelas XI (Gen 20)</option>
              <option value="XII">Kelas XII (Gen 19)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>Divisi</span>
            </label>
            <select
              value={divisi}
              onChange={(e) => setDivisi(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium cursor-pointer"
            >
              <option value="Programming">Programming</option>
              <option value="Technopreneurship">Technopreneur</option>
              <option value="Desain">Desain</option>
              <option value="Fotografi">Fotografi</option>
              <option value="Cinematografi">Cinematografi</option>
            </select>
          </div>
        </div>

        {/* Input: Kata Sandi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-500" />
              <span>
                Kata Sandi <span className="text-primary">*</span>
              </span>
            </span>
            <span className="text-[11px] text-ink-muted">Min. 8 karakter</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted hover:text-ink transition-colors cursor-pointer rounded-lg"
              title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {password.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px]">
              {isPasswordLengthValid ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Panjang kata sandi valid ({password.length} karakter)</span>
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Kurang {8 - password.length} karakter lagi</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Input: Konfirmasi Kata Sandi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-purple-500" />
            <span>
              Konfirmasi Kata Sandi <span className="text-primary">*</span>
            </span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Ulangi kata sandi"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted hover:text-ink transition-colors cursor-pointer rounded-lg"
              title={
                showConfirmPassword
                  ? "Sembunyikan kata sandi"
                  : "Lihat kata sandi"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px]">
              {isPasswordMatch ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Kata sandi cocok persis</span>
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Konfirmasi kata sandi belum sama</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-11 min-h-11 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mendaftarkan Akun...</span>
              </>
            ) : (
              <>
                <span>Daftar Akun Anggota</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
