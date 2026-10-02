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

  // Filter untuk aspirasi
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isOfficer =
    currentUser.role === Role.ADMIN || currentUser.role === Role.OPERATOR;

  const filteredAspirations = aspirations.filter((item) => {
    const matchesScope =
      scopeFilter === "ALL"
        ? true
        : scopeFilter === "PUBLIC"
        ? item.targetScope === "PUBLIC" || !item.targetScope
        : item.targetScope === "PRIVATE_ADMIN";

    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "OPEN"
        ? item.status === "OPEN" || !item.status
        : statusFilter === "RESPONDED"
        ? item.status === "RESPONDED" || Boolean(item.adminReply)
        : item.status === "RESOLVED";

    return matchesScope && matchesCategory && matchesStatus;
  });

  const activePollsCount = polls.filter((p) => p.isActive).length;

  if (!isMounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface-container-low rounded-lg w-1/2" />
        <div className="h-12 bg-surface-container-low rounded-xl w-full" />
        <div className="h-44 bg-surface-container-low rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Bar Header & Action Buttons */}
      <div className="flex items-center justify-between pt-1 relative z-10">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-ink">
            Suara &amp; Aspirasi Komunitas
          </h1>
          <p className="text-xs text-ink-muted">
            Pemungutan suara &amp; kotak aspirasi terbuka
          </p>
        </div>

        {activeTab === "POLL" && isOfficer ? (
          <button
            type="button"
            onClick={() => setIsCreatePollOpen(true)}
            className="h-10 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px] relative z-10"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Polling</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreateAspirationOpen(true)}
            className="h-10 px-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px] relative z-10"
          >
            <Plus className="h-4 w-4" />
            <span>Tulis Aspirasi</span>
          </button>
        )}
      </div>

      {/* Segmented Pill Switcher (Tab 1: Polling vs Tab 2: Aspirasi) */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container-low border border-edge shadow-xs relative z-10">
        <button
          type="button"
          onClick={() => setActiveTab("POLL")}
          className={`h-11 min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "POLL"
              ? "bg-card text-ink shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Vote className="h-4 w-4 text-emerald-600" />
          <span>Polling Organisasi</span>
          {activePollsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
              {activePollsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ASPIRASI")}
          className={`h-11 min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "ASPIRASI"
              ? "bg-card text-ink shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>Kotak Aspirasi</span>
          <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-ink-secondary text-[10px] font-bold">
            {aspirations.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DAFTAR POLLING */}
      {activeTab === "POLL" && (
        <section className="space-y-3 animate-in fade-in">
          {polls.length === 0 ? (
            <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                <Vote className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-ink">Belum Ada Polling Aktif</h3>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">
                Saat ini belum ada pemungutan suara atau polling kebijakan yang sedang dibuka.
              </p>
              {isOfficer && (
                <button
                  type="button"
                  onClick={() => setIsCreatePollOpen(true)}
                  className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px] active:scale-95"
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
              />
            ))
          )}
        </section>
      )}

      {/* TAB 2: DAFTAR ASPIRASI */}
      {activeTab === "ASPIRASI" && (
        <section className="space-y-3 animate-in fade-in">
          {/* Sub-Filter Pill Scope (Semua vs Publik vs Privat) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-edge">
            <button
              type="button"
              onClick={() => setScopeFilter("ALL")}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
                scopeFilter === "ALL"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Semua ({aspirations.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("PUBLIC")}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[38px] ${
                scopeFilter === "PUBLIC"
                  ? "bg-card text-blue-600 dark:text-blue-400 shadow-xs border border-edge"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Publik</span>
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("PRIVATE")}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[38px] ${
                scopeFilter === "PRIVATE"
                  ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-200 dark:border-indigo-900"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Lock className="h-3 w-3" />
              <span>Privat Admin</span>
            </button>
          </div>

          {/* Filter Bar Kategori & Status */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-1 bg-card border border-edge rounded-lg px-2 py-1.5 text-xs shrink-0">
              <Filter className="h-3 w-3 text-ink-muted" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-ink text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="IDE_KEGIATAN">💡 Ide Kegiatan</option>
                <option value="SARAN_PENGURUS">📢 Saran Pengurus</option>
                <option value="DISKUSI_UMUM">💬 Diskusi Bebas</option>
                <option value="BUG_SISTEM">🐞 Bug &amp; Sistem (Dev)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-card border border-edge rounded-lg px-2 py-1.5 text-xs shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-ink text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="OPEN">Belum Ditanggapi</option>
                <option value="RESPONDED">Telah Ditanggapi</option>
                <option value="RESOLVED">Selesai Ditangani</option>
              </select>
            </div>
          </div>

          {filteredAspirations.length === 0 ? (
            <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-ink">Kotak Aspirasi Masih Bersih</h3>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">
                Belum ada saran atau usulan yang sesuai dengan filter saat ini. Jadilah yang pertama menyampaikan gagasan!
              </p>
              <button
                type="button"
                onClick={() => setIsCreateAspirationOpen(true)}
                className="h-11 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px] active:scale-95"
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

      {/* Modal Dialog Form Buat Polling (Pengurus) */}
      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
      />
    </div>
  );
}
