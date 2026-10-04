"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Lock,
  Vote,
  Plus,
  Filter,
  Inbox,
  Sparkles,
  ShieldCheck,
  Search,
} from "lucide-react";
import { FeedbackType, IssueStatus, Role } from "@prisma/client";
import { FeedbackIssueCard, FeedbackIssueData } from "./FeedbackIssueCard";
import { CreateFeedbackModal } from "./CreateFeedbackModal";
import { PollCard, PollCardData } from "./PollCard";
import { CreatePollModal } from "./CreatePollModal";

interface AspirasiClientViewProps {
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
  publicIssues: FeedbackIssueData[];
  privateIssues: FeedbackIssueData[];
  polls: PollCardData[];
}

export function AspirasiClientView({
  currentUser,
  publicIssues,
  privateIssues,
  polls,
}: AspirasiClientViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"PUBLIC_ISSUES" | "PRIVATE_ASPIRATIONS" | "POLLS">(
    "PUBLIC_ISSUES"
  );

  // Status Filter for Issues: ALL, IN_PROGRESS, RESOLVED, PENDING
  const [statusFilter, setStatusFilter] = useState<"ALL" | IssueStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateFeedbackOpen, setIsCreateFeedbackOpen] = useState(false);
  const [feedbackDefaultType, setFeedbackDefaultType] = useState<FeedbackType>(
    FeedbackType.PUBLIC_ISSUE
  );
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isOperator =
    currentUser.role === Role.OPERATOR || currentUser.role === Role.ADMIN;
  const canCreate = currentUser.role !== Role.GUEST;

  const handleOpenCreateFeedback = (defaultType: FeedbackType) => {
    setFeedbackDefaultType(defaultType);
    setIsCreateFeedbackOpen(true);
  };

  // Filter Public Issues
  const filteredPublicIssues = publicIssues.filter((issue) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : issue.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === ""
        ? true
        : issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (issue.category &&
            issue.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  // Filter Private Issues
  const filteredPrivateIssues = privateIssues.filter((issue) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : issue.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === ""
        ? true
        : issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
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
    <div className="space-y-5">
      {/* Top Bar Header & Action Buttons */}
      <div className="flex items-center justify-between pt-1 relative z-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink">
            Kotak Suara Hibrida
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
            Papan isu sistem &amp; saluran aspirasi rahasia
          </p>
        </div>

        {canCreate && (
          <div>
            {activeTab === "PUBLIC_ISSUES" && (
              <button
                type="button"
                onClick={() => handleOpenCreateFeedback(FeedbackType.PUBLIC_ISSUE)}
                className="h-11 px-4 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>Laporkan Isu</span>
              </button>
            )}

            {activeTab === "PRIVATE_ASPIRATIONS" && (
              <button
                type="button"
                onClick={() => handleOpenCreateFeedback(FeedbackType.PRIVATE_ASPIRATION)}
                className="h-11 px-4 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>Kirim Aspirasi</span>
              </button>
            )}

            {activeTab === "POLLS" && (
              <button
                type="button"
                onClick={() => setIsCreatePollOpen(true)}
                className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Polling</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Tab Navigation (Tab 1: Papan Isu, Tab 2: Aspirasi Privat, Tab 3: Polling) */}
      <div className="grid grid-cols-3 p-1.5 rounded-2xl bg-surface-container-low border border-edge shadow-xs relative z-10">
        {/* Tab 1: Papan Isu Sistem */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("PUBLIC_ISSUES");
            setStatusFilter("ALL");
          }}
          className={`h-12 min-h-[48px] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "PUBLIC_ISSUES"
              ? "bg-card text-ink shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Globe className="h-4 w-4 text-sky-500 shrink-0" />
          <span className="truncate">Papan Isu</span>
          <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded-full bg-surface-container text-[11px] text-ink-secondary border border-edge font-mono">
            {publicIssues.length}
          </span>
        </button>

        {/* Tab 2: Aspirasi Privat */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("PRIVATE_ASPIRATIONS");
            setStatusFilter("ALL");
          }}
          className={`h-12 min-h-[48px] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "PRIVATE_ASPIRATIONS"
              ? "bg-card text-ink shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Lock className="h-4 w-4 text-purple-500 shrink-0" />
          <span className="truncate">
            {isOperator ? "Aspirasi Operator" : "Aspirasi Privat"}
          </span>
          <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold border border-purple-300 dark:border-purple-500/30 font-mono">
            {privateIssues.length}
          </span>
        </button>

        {/* Tab 3: Polling Organisasi */}
        <button
          type="button"
          onClick={() => setActiveTab("POLLS")}
          className={`h-12 min-h-[48px] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "POLLS"
              ? "bg-card text-ink shadow-xs border border-edge"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Vote className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="truncate">Polling</span>
          {activePollsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-300 dark:border-emerald-500/30 font-mono">
              {activePollsCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PAPAN ISU SISTEM (PUBLIC ISSUE TRACKER)            */}
      {/* ========================================================= */}
      {activeTab === "PUBLIC_ISSUES" && (
        <section className="space-y-4 animate-in fade-in">
          {/* Filter Status Buttons ("Semua", "Sedang Dikerjakan", "Selesai", "Ditinjau") */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-edge overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                  statusFilter === "ALL"
                    ? "bg-card text-ink shadow-xs border border-edge"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Semua ({publicIssues.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(IssueStatus.IN_PROGRESS)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                  statusFilter === IssueStatus.IN_PROGRESS
                    ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 shadow-xs border border-sky-300 dark:border-sky-500/30"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Sedang Ditangani
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(IssueStatus.RESOLVED)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                  statusFilter === IssueStatus.RESOLVED
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shadow-xs border border-emerald-300 dark:border-emerald-500/30"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Selesai
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(IssueStatus.PENDING)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                  statusFilter === IssueStatus.PENDING
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shadow-xs border border-amber-300 dark:border-amber-500/30"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Ditinjau
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari isu / ide fitur..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Daftar Kartu Isu Publik */}
          {filteredPublicIssues.length === 0 ? (
            <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
              <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center border border-sky-300 dark:border-sky-500/30">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink">
                Papan Isu Bersih
              </h3>
              <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
                Tidak ada laporan isu sistem atau usulan fitur pada filter ini. Laporkan kendala teknis atau ide inovasi aplikasi untuk meningkatkan kualitas sistem.
              </p>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateFeedback(FeedbackType.PUBLIC_ISSUE)}
                  className="h-11 px-5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Laporkan Isu Baru (+10 XP)</span>
                </button>
              )}
            </div>
          ) : (
            filteredPublicIssues.map((issue) => (
              <FeedbackIssueCard
                key={issue.id}
                issue={issue}
                currentUserRole={currentUser.role}
                currentUserId={currentUser.id}
              />
            ))
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ASPIRASI PRIVAT (PRIVATE OPERATOR CHANNEL)         */}
      {/* ========================================================= */}
      {activeTab === "PRIVATE_ASPIRATIONS" && (
        <section className="space-y-4 animate-in fade-in">
          {/* Banner Informasi Saluran Privat */}
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-purple-800 dark:text-purple-300 block">
                {isOperator
                  ? "Peti Saluran Rahasia Operator"
                  : "Saluran Aspirasi & Evaluasi Privat"}
              </span>
              <p className="text-purple-700 dark:text-purple-300/80 leading-relaxed text-[11px]">
                {isOperator
                  ? "Seluruh pesan di bawah ini bersifat rahasia dan hanya dapat diakses oleh akun dengan wewenang Operator Organisasi."
                  : "Pesan yang Anda kirimkan ke saluran ini bersifat rahasia dan hanya dibaca langsung oleh Operator Organisasi untuk evaluasi internal."}
              </p>
            </div>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-edge overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                statusFilter === "ALL"
                  ? "bg-card text-ink shadow-xs border border-edge"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Semua ({privateIssues.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(IssueStatus.IN_PROGRESS)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                statusFilter === IssueStatus.IN_PROGRESS
                  ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 shadow-xs border border-sky-300 dark:border-sky-500/30"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Sedang Ditangani
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(IssueStatus.RESOLVED)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                statusFilter === IssueStatus.RESOLVED
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shadow-xs border border-emerald-300 dark:border-emerald-500/30"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Selesai
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter(IssueStatus.PENDING)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                statusFilter === IssueStatus.PENDING
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shadow-xs border border-amber-300 dark:border-amber-500/30"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Ditinjau
            </button>
          </div>

          {/* Daftar Kartu Aspirasi Privat */}
          {filteredPrivateIssues.length === 0 ? (
            <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center border border-purple-300 dark:border-purple-500/30">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink">
                Kotak Aspirasi Masih Bersih
              </h3>
              <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
                {isOperator
                  ? "Belum ada aspirasi privat atau laporan evaluasi rahasia yang masuk dari anggota."
                  : "Anda belum mengirimkan pesan atau kritik evaluasi internal ke Operator."}
              </p>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateFeedback(FeedbackType.PRIVATE_ASPIRATION)}
                  className="h-11 px-5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tulis Aspirasi Privat (+10 XP)</span>
                </button>
              )}
            </div>
          ) : (
            filteredPrivateIssues.map((issue) => (
              <FeedbackIssueCard
                key={issue.id}
                issue={issue}
                currentUserRole={currentUser.role}
                currentUserId={currentUser.id}
              />
            ))
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 3: POLLING ORGANISASI (COMMUNITY POLLS)                */}
      {/* ========================================================= */}
      {activeTab === "POLLS" && (
        <section className="space-y-4 animate-in fade-in">
          {polls.length === 0 ? (
            <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-300 dark:border-emerald-500/30">
                <Vote className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-ink">
                Belum Ada Polling Aktif
              </h3>
              <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
                Saat ini belum ada pemungutan suara atau jajak pendapat kebijakan yang sedang dibuka.
              </p>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setIsCreatePollOpen(true)}
                  className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
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

      {/* Modal Dialog Form Buat Laporan / Aspirasi */}
      <CreateFeedbackModal
        isOpen={isCreateFeedbackOpen}
        onClose={() => setIsCreateFeedbackOpen(false)}
        defaultType={feedbackDefaultType}
      />

      {/* Modal Dialog Form Buat Polling */}
      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
      />
    </div>
  );
}
