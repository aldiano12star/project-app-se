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
      {/* 4 Kartu Kategori Utama (Grid 2x2 Responsif) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Category 1: Format Surat & LPJ */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === "SURAT_LPJ" ? "ALL" : "SURAT_LPJ")
          }
          className={`min-h-[72px] rounded-2xl p-3.5 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98] border ${
            selectedCategory === "SURAT_LPJ"
              ? "bg-rose-950/40 border-rose-500 shadow-sm"
              : "bg-card hover:bg-surface-container-low border-edge"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-ink truncate">1. Format Surat &amp; LPJ</h4>
              <span className="text-[10px] font-mono text-rose-400 font-bold">
                {categoryCounts.SURAT_LPJ}
              </span>
            </div>
            <p className="text-[10px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
              Template proposal, surat &amp; laporan
            </p>
          </div>
        </button>

        {/* Category 2: Tips & Info Lomba */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === "INFO_LOMBA" ? "ALL" : "INFO_LOMBA")
          }
          className={`min-h-[72px] rounded-2xl p-3.5 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98] border ${
            selectedCategory === "INFO_LOMBA"
              ? "bg-amber-950/40 border-amber-500 shadow-sm"
              : "bg-card hover:bg-surface-container-low border-edge"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-ink truncate">2. Tips &amp; Info Lomba</h4>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                {categoryCounts.INFO_LOMBA}
              </span>
            </div>
            <p className="text-[10px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
              Arsip kompetisi, silabus &amp; panduan juara
            </p>
          </div>
        </button>

        {/* Category 3: Modul & Materi Pelatihan */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === "MODUL_PELATIHAN" ? "ALL" : "MODUL_PELATIHAN")
          }
          className={`min-h-[72px] rounded-2xl p-3.5 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98] border ${
            selectedCategory === "MODUL_PELATIHAN"
              ? "bg-indigo-950/40 border-indigo-500 shadow-sm"
              : "bg-card hover:bg-surface-container-low border-edge"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-ink truncate">3. Modul Pelatihan</h4>
              <span className="text-[10px] font-mono text-indigo-400 font-bold">
                {categoryCounts.MODUL_PELATIHAN}
              </span>
            </div>
            <p className="text-[10px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
              Materi belajar internal 5 divisi
            </p>
          </div>
        </button>

        {/* Category 4: Panduan Teknis & Alat */}
        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === "PANDUAN_TEKNIS" ? "ALL" : "PANDUAN_TEKNIS")
          }
          className={`min-h-[72px] rounded-2xl p-3.5 flex items-center gap-3 transition-all cursor-pointer text-left active:scale-[0.98] border ${
            selectedCategory === "PANDUAN_TEKNIS"
              ? "bg-emerald-950/40 border-emerald-500 shadow-sm"
              : "bg-card hover:bg-surface-container-low border-edge"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-ink truncate">4. Panduan Teknis &amp; Alat</h4>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {categoryCounts.PANDUAN_TEKNIS}
              </span>
            </div>
            <p className="text-[10px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
              Petunjuk lab, proyektor &amp; alat kerja
            </p>
          </div>
        </button>
      </div>

      {/* Header List Artikel */}
      <div className="flex items-center justify-between pt-1 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono">
          {selectedCategory === "ALL" ? "Semua Koleksi Perpustakaan Digital" : `Kategori: ${selectedCategory}`} ({filteredArticles.length})
        </h3>
        {selectedCategory !== "ALL" && (
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
          <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-ink">Belum Ada Koleksi di Kategori Ini</h3>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            Tulis modul pelatihan, format surat, atau panduan teknis baru untuk berbagi ilmu dan dapatkan +15 XP!
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Tulis Panduan Pertama (+15 XP)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <WikiCard
              key={article.id}
              article={article}
              onOpenDetail={onOpenDetailModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
