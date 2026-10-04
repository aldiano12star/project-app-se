"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  User,
  Key,
  IdCard,
  Bell,
  Wallet,
  Moon,
  Sun,
  BookOpen,
  Code2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Globe,
  Lock,
  Save,
} from "lucide-react";
import { UserProfileData } from "./ProfileHeroCard";
import { updateProfileContact, updatePassword } from "@/actions/profile";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { useTheme } from "@/components/theme/ThemeProvider";

interface SettingsSectionProps {
  user: UserProfileData;
  onOpenKTA: () => void;
}

export function SettingsSection({ user, onOpenKTA }: SettingsSectionProps) {
  // Theme Switching
  const { resolvedTheme, setTheme } = useTheme();

  // Notifikasi & Preferensi
  const [notifMeeting, setNotifMeeting] = useState(true);
  const [notifKas, setNotifKas] = useState(true);

  // Accordion Toggles
  const [showContactForm, setShowContactForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // State Form Kontak
  const [noWhatsapp, setNoWhatsapp] = useState(user.noWhatsapp || "");
  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolioUrl || "");
  const [nisn, setNisn] = useState(user.nisn || "");
  const [contactFeedback, setContactFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isSavingContact, startContactTransition] = useTransition();

  // State Form Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isSavingPassword, startPasswordTransition] = useTransition();

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFeedback(null);

    startContactTransition(async () => {
      const res = await updateProfileContact({
        noWhatsapp,
        portfolioUrl,
        nisn,
      });

      if (res.success) {
        setContactFeedback({ text: res.message, type: "success" });
      } else {
        setContactFeedback({ text: res.message, type: "error" });
      }
    });
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({
        text: "Kata sandi baru minimal harus 6 karakter.",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        text: "Konfirmasi kata sandi baru tidak cocok.",
        type: "error",
      });
      return;
    }

    startPasswordTransition(async () => {
      const res = await updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setPasswordFeedback({ text: res.message, type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordFeedback({ text: res.message, type: "error" });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* GRUP 1: AKUN, KONTAK & KEAMANAN                           */}
      {/* ========================================================= */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1 font-mono">
          Akun &amp; Keamanan Data
        </h3>
        <div className="bg-card border border-edge rounded-2xl overflow-hidden divide-y divide-edge/60 shadow-xs">
          {/* Row 1: Form Data Kontak & Tautan Portofolio */}
          <div>
            <button
              type="button"
              onClick={() => setShowContactForm(!showContactForm)}
              className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low active:bg-surface-container transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                    Data Kontak &amp; Tautan Portofolio
                  </span>
                  <p className="text-[10px] text-ink-muted truncate max-w-[200px] sm:max-w-xs">
                    {user.noWhatsapp || "WhatsApp belum diatur"} • {user.portfolioUrl || "Portofolio"}
                  </p>
                </div>
              </div>
              {showContactForm ? (
                <ChevronDown className="w-4 h-4 text-ink-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
              )}
            </button>

            {showContactForm && (
              <form
                onSubmit={handleSaveContact}
                className="p-4 bg-surface-container-low/50 border-t border-edge/60 space-y-3 animate-in fade-in"
              >
                {contactFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      contactFeedback.type === "success"
                        ? "bg-success-subtle text-success border-success/30"
                        : "bg-danger-subtle text-danger border-danger/30"
                    }`}
                  >
                    {contactFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{contactFeedback.text}</span>
                  </div>
                )}

                {/* Input WhatsApp */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Nomor WhatsApp Aktif</span>
                  </label>
                  <input
                    type="tel"
                    value={noWhatsapp}
                    onChange={(e) => setNoWhatsapp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-card border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                </div>

                {/* Input Tautan Portofolio */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Tautan Portofolio / GitHub / LinkedIn</span>
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/username atau linktr.ee/..."
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-card border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                </div>

                {/* Input NISN */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-purple-500" />
                    <span>Nomor Induk Siswa Nasional (NISN)</span>
                  </label>
                  <input
                    type="text"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="Contoh: 0071234567"
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-card border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                </div>

                {/* Tombol Simpan Kontak */}
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="w-full h-11 min-h-[44px] rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingContact ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Kontak</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Row 2: Form Ganti Kata Sandi */}
          <div>
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low active:bg-surface-container transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                    Ganti Kata Sandi &amp; Keamanan Akun
                  </span>
                  <p className="text-[10px] text-ink-muted">
                    Atur atau ubah kata sandi autentikasi mandiri
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {showPasswordForm ? (
                  <ChevronDown className="w-4 h-4 text-ink-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            </button>

            {showPasswordForm && (
              <form
                onSubmit={handleSavePassword}
                className="p-4 bg-surface-container-low/50 border-t border-edge/60 space-y-3 animate-in fade-in"
              >
                {passwordFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      passwordFeedback.type === "success"
                        ? "bg-success-subtle text-success border-success/30"
                        : "bg-danger-subtle text-danger border-danger/30"
                    }`}
                  >
                    {passwordFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordFeedback.text}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kata Sandi Lama (Kosongkan jika pertama kali)</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-card border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kata Sandi Baru (Minimal 6 Karakter)</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-card border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Konfirmasi Kata Sandi Baru</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl bg-card border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full h-11 min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memperbarui Kata Sandi...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Perbarui Kata Sandi Akun</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Row 3: Kartu Tanda Anggota Digital (KTA) */}
          <button
            type="button"
            onClick={onOpenKTA}
            className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low active:bg-surface-container transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
                <IdCard className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                  Kartu Tanda Anggota (KTA) Digital
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded">
                  Aktif
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* GRUP 2: PREFERENSI SISTEM & NOTIFIKASI PWA               */}
      {/* ========================================================= */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1 font-mono">
          Preferensi Sistem &amp; Notifikasi HP
        </h3>

        {/* Kartu Khusus Izin Notifikasi Web/PWA */}
        <NotificationSettingsCard />

        <div className="bg-card border border-edge rounded-2xl overflow-hidden divide-y divide-edge/60 shadow-xs">
          {/* Row 1: Notifikasi Rapat & Acara */}
          <div className="min-h-[48px] px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-primary flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-ink">
                Notifikasi Rapat &amp; Acara
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-end">
              <input
                type="checkbox"
                checked={notifMeeting}
                onChange={(e) => setNotifMeeting(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-edge" />
            </label>
          </div>

          {/* Row 2: Pengingat Iuran Kas Mingguan */}
          <div className="min-h-[48px] px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-ink">
                Pengingat Iuran Kas Mingguan
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-end">
              <input
                type="checkbox"
                checked={notifKas}
                onChange={(e) => setNotifKas(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-edge" />
            </label>
          </div>

          {/* Row 3: Mode Tampilan / Tema Antarmuka */}
          <div className="min-h-[52px] px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                {resolvedTheme === "dark" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-ink">
                  Tema Antarmuka
                </span>
                <p className="text-[10px] text-ink-muted">
                  {resolvedTheme === "dark"
                    ? "Mode Gelap (Eye-Friendly Charcoal)"
                    : "Mode Terang (Soft Slate White)"}
                </p>
              </div>
            </div>

            {/* Segmented Button Dual-Theme Switch */}
            <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-edge shrink-0">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
                  resolvedTheme === "light"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-ink-muted hover:text-ink"
                }`}
                title="Aktifkan Mode Terang"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px]">Terang</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
                  resolvedTheme === "dark"
                    ? "bg-[#151D2E] text-white shadow-xs border border-[#222F46]"
                    : "text-ink-muted hover:text-ink"
                }`}
                title="Aktifkan Mode Gelap"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-[11px]">Gelap</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* GRUP 3: TENTANG & BANTUAN                                 */}
      {/* ========================================================= */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1 font-mono">
          Tentang &amp; Bantuan
        </h3>
        <div className="bg-card border border-edge rounded-2xl overflow-hidden divide-y divide-edge/60 shadow-xs">
          {/* Row 1: Panduan & Modul Organisasi */}
          <Link
            href="/eksplorasi"
            className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low active:bg-surface-container transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-500 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                Perpustakaan &amp; Panduan Organisasi
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Row 2: Laporkan Kendala / Bug Sistem */}
          <Link
            href="/aspirasi"
            className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low active:bg-surface-container transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                Laporkan Kendala / Bug Sistem
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Row 3: Versi Sistem */}
          <div className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-ink">
                  Saba ExploIT App
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  v1.2.1 • Build 2026
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container text-ink-secondary border border-edge font-mono">
              STABLE
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
