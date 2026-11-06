import React from "react";
import { getCurrentDbUser } from "@/lib/currentUser";
import { AppShell } from "@/components/layout/AppShell";
import { getHallOfFameEntries } from "@/actions/hallOfFame";
import { HallOfFameList } from "@/components/hall-of-fame/HallOfFameList";
import { Trophy, Film, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hall of Fame — Lorong Waktu Abadi | Saba ExploIT",
  description:
    "Pita film sejarah abadi organisasi Saba ExploIT: mengabadikan juara XP, acara terbaik, dan mahakarya karya lintas generasi.",
};

export default async function HallOfFamePage() {
  const current = await getCurrentDbUser();
  const dbUser = current?.dbUser;

  const { entries, hasMore, totalCount } = await getHallOfFameEntries(1, 10);

  const content = (
    <div className="space-y-6 pb-12">
      {/* ── CINEMATIC HERO HEADER ── */}
      <section className="relative rounded-3xl bg-[#18181B] border border-[#27272A] p-6 sm:p-10 overflow-hidden shadow-2xl">
        {/* Ambient atmospheric glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              <span>THE TIME CAPSULE</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#121214] text-[#A1A1AA] border border-[#27272A] font-mono">
              <Film className="w-3.5 h-3.5" />
              <span>{totalCount} GENERASI</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F4F4F5] tracking-tight leading-tight">
            Hall of Fame: Lorong Waktu Abadi
          </h1>

          <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
            Pita film sejarah organisasi Saba ExploIT. Di sinilah dedikasi para juara, acara terhebat, dan mahakarya terbaik setiap generasi diabadikan untuk selamanya.
          </p>
        </div>
      </section>

      {/* ── FILMSTRIP FRAMES LIST ── */}
      <HallOfFameList
        initialEntries={entries as any}
        initialHasMore={hasMore}
        totalCount={totalCount}
      />
    </div>
  );

  if (dbUser) {
    return <AppShell user={dbUser}>{content}</AppShell>;
  }

  // Standalone public layout if accessed without login session
  return (
    <div className="min-h-screen bg-[#121214] text-[#E4E4E7] p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-bold text-primary hover:underline"
        >
          Masuk ke Portal
        </Link>
      </div>
      {content}
    </div>
  );
}
