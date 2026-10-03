"use client";

import React, { useState, useEffect } from "react";
import {
  Vote,
  MessageSquare,
  Plus,
  Filter,
  Inbox,
  Globe,
  Lock,
} from "lucide-react";
import { Role } from "@prisma/client";
import { PollCard, PollCardData } from "./PollCard";
import { AspirationCard, AspirationCardData } from "./AspirationCard";
import { CreateAspirationModal } from "./CreateAspirationModal";
import { CreatePollModal } from "./CreatePollModal";

interface AspirasiClientViewProps {
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
  polls: PollCardData[];
  aspirations: AspirationCardData[];
}

export function AspirasiClientView({
  currentUser,
  polls,
  aspirations,
}: AspirasiClientViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"POLL" | "ASPIRASI">("POLL");
  const [isCreateAspirationOpen, setIsCreateAspirationOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);

  // Filter untuk aspirasi (Scope & Kategori - Status tiket telah dieliminasi agar ramah & non-birokratis)
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isOperator = currentUser.role === Role.OPERATOR;
  const isOfficer =
    currentUser.role === Role.ADMIN || currentUser.role === Role.OPERATOR;
  const canCreate = currentUser.role !== Role.GUEST;

  const filteredAspirations = aspirations.filter((item) => {
    const matchesScope =
      scopeFilter === "ALL"
        ? true
        : scopeFilter === "PUBLIC"
        ? item.targetScope === "PUBLIC" || !item.targetScope
        : item.targetScope === "PRIVATE_ADMIN";

    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;

    return matchesScope && matchesCategory;
  });

  const now = new Date();
  const activePollsCount = polls.filter((p) => {
    const isExpired = p.closesAt ? now > new Date(p.closesAt) : false;
    return p.isActive && !isExpired;
  }).length;

  if (!isMounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-surface-container-low rounded-xl w-1/2" />
        <div className="h-14 bg-surface-container-low rounded-2xl w-full" />
        <div className="h-48 bg-surface-container-low rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Header & Action Buttons */}
      <div className="flex items-center justify-between pt-1 relative z-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink">
            Suara &amp; Aspirasi Komunitas
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Pemungutan suara &amp; kotak aspirasi terbuka
          </p>
        </div>

        {canCreate && (
          activeTab === "POLL" ? (
            <button
              type="button"
              onClick={() => setIsCreatePollOpen(true)}
              className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px] relative z-10"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Polling</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateAspirationOpen(true)}
              className="h-11 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px] relative z-10"
            >
              <Plus className="h-4 w-4" />
              <span>Tulis Aspirasi</span>
            </button>
          )
        )}
      </div>

      {/* Segmented Pill Switcher (Tab 1: Polling vs Tab 2: Aspirasi) */}
      <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-surface-container-low border border-edge shadow-xs relative z-10">
        <button
          type="button"
          onClick={() => setActiveTab("POLL")}
          className={`h-12 min-h-[48px] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "POLL"
              ? "bg-card text-ink shadow-xs border border-edge"
              : "text-slate-400 hover:text-ink"
          }`}
        >
          <Vote className="h-4 w-4 text-emerald-400" />
          <span>Polling Organisasi</span>
          {activePollsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              {activePollsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ASPIRASI")}
          className={`h-12 min-h-[48px] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "ASPIRASI"
              ? "bg-card text-ink shadow-xs border border-edge"
              : "text-slate-400 hover:text-ink"
          }`}
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>Kotak Aspirasi</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-slate-300 text-xs font-semibold border border-edge">
            {aspirations.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DAFTAR POLLING */}
      {activeTab === "POLL" && (
        <section className="space-y-4 animate-in fade-in">
          {polls.length === 0 ? (
            <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
              <div className="h-12 w-12 rounded-full bg-emerald-950/40 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <Vote className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink">Belum Ada Polling Aktif</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Saat ini belum ada pemungutan suara atau polling kebijakan yang sedang dibuka.
              </p>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setIsCreatePollOpen(true)}
                  className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px] active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Polling Pertama</span>
                </button>
              )}
            </div>
          ) : (
            polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                currentUserRole={currentUser.role}
                currentUserId={currentUser.id}
              />
            ))
          )}
        </section>
      )}

      {/* TAB 2: DAFTAR ASPIRASI */}
      {activeTab === "ASPIRASI" && (
        <section className="space-y-4 animate-in fade-in">
          {/* Sub-Filter Pill Scope (Semua vs Publik vs Privat) */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-container-low border border-edge">
            <button
              type="button"
              onClick={() => setScopeFilter("ALL")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                scopeFilter === "ALL"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-slate-400 hover:text-ink"
              }`}
            >
              Semua ({aspirations.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("PUBLIC")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                scopeFilter === "PUBLIC"
                  ? "bg-card text-sky-400 shadow-xs border border-edge"
                  : "text-slate-400 hover:text-ink"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Publik</span>
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("PRIVATE")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                scopeFilter === "PRIVATE"
                  ? "bg-card text-purple-400 shadow-xs border border-purple-500/30"
                  : "text-slate-400 hover:text-ink"
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{isOperator ? "Privat Operator" : "Privat Saya"}</span>
            </button>
          </div>

          {/* Filter Bar Kategori */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2 bg-card border border-edge rounded-xl px-3 py-2 text-xs shrink-0 shadow-xs min-h-[40px]">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-ink text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori Usulan</option>
                <option value="IDE_KEGIATAN">💡 Ide Kegiatan</option>
                <option value="SARAN_PENGURUS">📢 Saran Pengurus</option>
                <option value="DISKUSI_UMUM">💬 Diskusi Bebas</option>
                <option value="BUG_SISTEM">🐞 Bug &amp; Sistem (Dev)</option>
              </select>
            </div>
          </div>

          {filteredAspirations.length === 0 ? (
            <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center border border-primary/20">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink">Kotak Aspirasi Masih Bersih</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Belum ada saran atau usulan yang sesuai dengan filter saat ini. Jadilah yang pertama menyampaikan gagasan!
              </p>
              <button
                type="button"
                onClick={() => setIsCreateAspirationOpen(true)}
                className="h-11 px-5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px] active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Tulis Aspirasi (+10 XP)</span>
              </button>
            </div>
          ) : (
            filteredAspirations.map((item) => (
              <AspirationCard
                key={item.id}
                aspiration={item}
                currentUserRole={currentUser.role}
                currentUserId={currentUser.id}
              />
            ))
          )}
        </section>
      )}

      {/* Modal Dialog Form Buat Aspirasi */}
      <CreateAspirationModal
        isOpen={isCreateAspirationOpen}
        onClose={() => setIsCreateAspirationOpen(false)}
      />

      {/* Modal Dialog Form Buat Polling */}
      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
      />
    </div>
  );
}
