"use client";

import React, { useState } from "react";
import {
  FileText,
  Trophy,
  GraduationCap,
  Wrench,
  BookOpen,
  Plus,
} from "lucide-react";
import { WikiCard, WikiArticleData } from "./WikiCard";

interface WikiTabProps {
  articles: WikiArticleData[];
  searchQuery: string;
  onOpenCreateModal: () => void;
  onOpenDetailModal: (article: WikiArticleData) => void;
}

export function formatWikiCategory(category: string): string {
  switch (category) {
    case "SURAT_LPJ":
    case "LPJ_SURAT":
      return "Format Surat & LPJ";
    case "INFO_LOMBA":
    case "TIPS_LOMBA":
      return "Tips & Info Lomba";
    case "MODUL_PELATIHAN":
    case "TUTORIAL":
      return "Modul Pelatihan";
    case "PANDUAN_TEKNIS":
    case "SOP_LAB":
      return "Panduan Teknis & Alat";
    default:
      return category.replace(/_/g, " ");
  }
}

export function WikiTab({
  articles,
  searchQuery,
  onOpenCreateModal,
  onOpenDetailModal,
}: WikiTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categoryCounts = {
    SURAT_LPJ: articles.filter((a) => a.category === "SURAT_LPJ" || a.category === "LPJ_SURAT").length,
    INFO_LOMBA: articles.filter((a) => a.category === "INFO_LOMBA" || a.category === "TIPS_LOMBA").length,
    MODUL_PELATIHAN: articles.filter((a) => a.category === "MODUL_PELATIHAN" || a.category === "TUTORIAL").length,
    PANDUAN_TEKNIS: articles.filter((a) => a.category === "PANDUAN_TEKNIS" || a.category === "SOP_LAB").length,
  };

  const filteredArticles = articles.filter((article) => {
    let matchesCategory = selectedCategory === "ALL";
    if (!matchesCategory) {
      if (selectedCategory === "SURAT_LPJ") {
        matchesCategory = article.category === "SURAT_LPJ" || article.category === "LPJ_SURAT";
      } else if (selectedCategory === "INFO_LOMBA") {
        matchesCategory = article.category === "INFO_LOMBA" || article.category === "TIPS_LOMBA";
      } else if (selectedCategory === "MODUL_PELATIHAN") {
        matchesCategory = article.category === "MODUL_PELATIHAN" || article.category === "TUTORIAL";
      } else if (selectedCategory === "PANDUAN_TEKNIS") {
        matchesCategory = article.category === "PANDUAN_TEKNIS" || article.category === "SOP_LAB";
      } else {
        matchesCategory = article.category === selectedCategory;
      }
    }

    const matchesSearch =
      searchQuery.trim() === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.author.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* 4 Kartu Kategori Utama (Grid Adaptif: 1 col mobile, 2 col tablet, 4 col desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Category 1: Format Surat & LPJ */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === "SURAT_LPJ" ? "ALL" : "SURAT_LPJ")
          }
          className={`tactile-btn min-h-[72px] rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer text-left border ${
            selectedCategory === "SURAT_LPJ"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500/80 shadow-sm"
              : "bg-card hover:bg-surface-container-low hairline-border"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-ink truncate">Format Surat &amp; LPJ</h4>
              <p className="text-xs text-ink-muted leading-tight mt-0.5 line-clamp-1">
                Template proposal, surat &amp; laporan
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-surface-container-high hairline-border text-xs sm:text-sm font-semibold text-ink-secondary shrink-0 font-mono-num">
            {categoryCounts.SURAT_LPJ}
          </div>
        </button>

        {/* Category 2: Tips & Info Lomba */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === "INFO_LOMBA" ? "ALL" : "INFO_LOMBA")
          }
          className={`tactile-btn min-h-[72px] rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer text-left border ${
            selectedCategory === "INFO_LOMBA"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500/80 shadow-sm"
              : "bg-card hover:bg-surface-container-low hairline-border"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Trophy className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-ink truncate">Tips &amp; Info Lomba</h4>
              <p className="text-xs text-ink-muted leading-tight mt-0.5 line-clamp-1">
                Arsip kompetisi &amp; panduan juara
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-surface-container-high hairline-border text-xs sm:text-sm font-semibold text-ink-secondary shrink-0 font-mono-num">
            {categoryCounts.INFO_LOMBA}
          </div>
        </button>

        {/* Category 3: Modul & Materi Pelatihan */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === "MODUL_PELATIHAN" ? "ALL" : "MODUL_PELATIHAN")
          }
          className={`tactile-btn min-h-[72px] rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer text-left border ${
            selectedCategory === "MODUL_PELATIHAN"
              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/80 shadow-sm"
              : "bg-card hover:bg-surface-container-low hairline-border"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <GraduationCap className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-ink truncate">Modul Pelatihan</h4>
              <p className="text-xs text-ink-muted leading-tight mt-0.5 line-clamp-1">
                Materi belajar internal 5 divisi
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-surface-container-high hairline-border text-xs sm:text-sm font-semibold text-ink-secondary shrink-0 font-mono-num">
            {categoryCounts.MODUL_PELATIHAN}
          </div>
        </button>

        {/* Category 4: Panduan Teknis & Alat */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === "PANDUAN_TEKNIS" ? "ALL" : "PANDUAN_TEKNIS")
          }
          className={`tactile-btn min-h-[72px] rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer text-left border ${
            selectedCategory === "PANDUAN_TEKNIS"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/80 shadow-sm"
              : "bg-card hover:bg-surface-container-low hairline-border"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Wrench className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-ink truncate">Panduan Teknis &amp; Alat</h4>
              <p className="text-xs text-ink-muted leading-tight mt-0.5 line-clamp-1">
                Petunjuk lab, proyektor &amp; alat kerja
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-surface-container-high hairline-border text-xs sm:text-sm font-semibold text-ink-secondary shrink-0 font-mono-num">
            {categoryCounts.PANDUAN_TEKNIS}
          </div>
        </button>
      </div>

      {/* Header List Artikel (Bersih & Humanis, Tanpa Raw Enum SNAKE_CASE) */}
      <div className="flex items-center justify-between pt-1 px-1">
        <h3 className="text-xs font-semibold text-ink-muted">
          <span>
            {selectedCategory === "ALL"
              ? "Semua Koleksi Perpustakaan Digital"
              : `Kategori: ${formatWikiCategory(selectedCategory)}`}
          </span>
          <span className="ml-1.5 font-mono-num font-bold text-ink">
            ({filteredArticles.length})
          </span>
        </h3>
        {selectedCategory !== "ALL" && (
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className="tactile-btn text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <div className="apple-card p-8 text-center space-y-3">
          <BookOpen className="h-8 w-8 text-ink-muted mx-auto" />
          <h3 className="text-sm font-bold text-ink">Belum Ada Koleksi di Kategori Ini</h3>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            Tulis modul pelatihan, format surat, atau panduan teknis baru untuk berbagi ilmu dan dapatkan +15 XP!
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="tactile-btn h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Tulis Panduan Pertama (+15 XP)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredArticles.map((article) => (
            <WikiCard
              key={article.id}
              article={article}
              onClick={() => onOpenDetailModal(article)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
