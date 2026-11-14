"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfileHeroCard, UserProfileData } from "./ProfileHeroCard";
import {
  PersonalSummarySection,
  AttendanceSummaryData,
} from "./PersonalSummarySection";
import { SettingsSection } from "./SettingsSection";
import { AdminBackupSection } from "./AdminBackupSection";
import { LogoutButton } from "./LogoutButton";

const KTADigitalModal = dynamic(
  () => import("./KTADigitalModal").then((mod) => mod.KTADigitalModal),
  { ssr: false }
);

const AvatarSelectorModal = dynamic(
  () => import("./AvatarSelectorModal").then((mod) => mod.AvatarSelectorModal),
  { ssr: false }
);

interface PengaturanClientViewProps {
  user: UserProfileData;
  attendanceSummary: AttendanceSummaryData;
}

function formatGrade(grade?: string | null) {
  if (!grade) return "Anggota";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export function PengaturanClientView({
  user,
  attendanceSummary,
}: PengaturanClientViewProps) {
  const [isKTAOpen, setIsKTAOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Sub-Header Navigasi Atas ("← Kembali ke Beranda") */}
      <header className="sticky top-0 z-40 -mx-4 -mt-4 px-4 py-2.5 bg-card border-b border-edge flex items-center justify-between shadow-xs">
        {/* Back Button to Dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-ink-secondary hover:text-ink hover:bg-surface-container-low transition-all active:scale-95 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          <span>Kembali</span>
        </Link>

        {/* Screen Title */}
        <h1 className="text-xs sm:text-sm font-bold text-ink tracking-tight">
          Profil &amp; Pengaturan
        </h1>

        {/* Right Indicator Badge */}
        <div className="min-h-[44px] flex items-center justify-end">
          {user.role === "OPERATOR" ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-mono">
              OPERATOR
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-subtle border border-primary/20 text-primary font-mono">
              {formatGrade(user.classGrade)}
            </span>
          )}
        </div>
      </header>

      {/* Main Content Sections */}
      <div className="space-y-4 pt-1">
        {/* 1. Profile Hero Card with Gamification & Level XP */}
        <ProfileHeroCard
          user={user}
          onOpenKTA={() => setIsKTAOpen(true)}
          onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
        />

        {/* 2. Personal Summary Section (Presensi Mandiri Privat) */}
        <PersonalSummarySection
          attendanceSummary={attendanceSummary}
        />

        {/* 3. Panel Cadangan Data Khusus Role ADMIN & OPERATOR */}
        <AdminBackupSection currentUserRole={user.role} />

        {/* 4. Structured Settings Sections (Kontak, Password, Preferensi, Bantuan) */}
        <SettingsSection
          user={user}
          onOpenKTA={() => setIsKTAOpen(true)}
        />

        {/* 5. Official Danger Logout Action */}
        <LogoutButton />

        {/* 6. Footer Hak Cipta Resmi Eksklusif di Halaman Pengaturan */}
        <footer className="pt-8 pb-12 text-center space-y-1.5 text-xs text-ink-muted select-none border-t hairline-border">
          <p className="font-semibold text-ink-secondary">
            &copy; 2026 Saba ExploIT • SMAN 1 Bangsal
          </p>
          <p className="text-[11px] font-mono text-ink-muted">
            SE-Core v1.3.0 • Zero-Cost Cloud Architecture
          </p>
        </footer>
      </div>

      {/* Modal Dialog KTA Digital */}
      <KTADigitalModal
        isOpen={isKTAOpen}
        onClose={() => setIsKTAOpen(false)}
        user={user}
      />

      {/* Modal Dialog Avatar Selector */}
      <AvatarSelectorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={user.avatarUrl || user.image}
        currentName={user.name}
      />
    </div>
  );
}
