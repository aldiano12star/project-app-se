"use client";

import React from "react";
import {
  Clock,
  Eye,
  Tag,
  FileText,
} from "lucide-react";
import { WikiCategory } from "@/actions/eksplorasi";

export interface WikiArticleData {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: WikiCategory | string;
  author: {
    id: string;
    name: string;
    classGrade?: string | null;
  };
  lastUpdatedBy?: {
    id: string;
    name: string;
  } | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WikiCardProps {
  article: WikiArticleData;
  onOpenDetail: (article: WikiArticleData) => void;
}

const WIKI_CATEGORY_META: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  SURAT_LPJ: {
    label: "📄 Format Surat & LPJ",
    bg: "bg-rose-500/15",
    text: "text-rose-500 dark:text-rose-400",
    border: "border-rose-500/30",
  },
  INFO_LOMBA: {
    label: "🏆 Tips & Info Lomba",
    bg: "bg-amber-500/15",
    text: "text-amber-500 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  MODUL_PELATIHAN: {
    label: "📚 Modul & Pelatihan",
    bg: "bg-indigo-500/15",
    text: "text-indigo-500 dark:text-indigo-400",
    border: "border-indigo-500/30",
  },
  PANDUAN_TEKNIS: {
    label: "🛠️ Panduan Teknis & Alat",
    bg: "bg-emerald-500/15",
    text: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  // Backward compatibility
  SOP_LAB: {
    label: "🛠️ Panduan Teknis & Alat",
    bg: "bg-emerald-500/15",
    text: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  TUTORIAL: {
    label: "📚 Modul & Pelatihan",
    bg: "bg-indigo-500/15",
    text: "text-indigo-500 dark:text-indigo-400",
    border: "border-indigo-500/30",
  },
  LPJ_SURAT: {
    label: "📄 Format Surat & LPJ",
    bg: "bg-rose-500/15",
    text: "text-rose-500 dark:text-rose-400",
    border: "border-rose-500/30",
  },
  TIPS_LOMBA: {
    label: "🏆 Tips & Info Lomba",
    bg: "bg-amber-500/15",
    text: "text-amber-500 dark:text-amber-400",
    border: "border-amber-500/30",
  },
};

export function WikiCard({ article, onOpenDetail }: WikiCardProps) {
  const categoryMeta =
    WIKI_CATEGORY_META[article.category] || WIKI_CATEGORY_META.PANDUAN_TEKNIS;

  return (
    <div
      onClick={() => onOpenDetail(article)}
      className="p-4 rounded-2xl bg-card border border-edge hover:border-emerald-500/50 shadow-sm transition-all space-y-2.5 cursor-pointer group active:scale-[0.99]"
    >
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
        >
          <span>{categoryMeta.label}</span>
        </span>

        <span className="text-[10px] font-mono text-ink-muted">
          Perpustakaan Digital
        </span>
      </div>

      {/* Title & Preview */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
          {article.title}
        </h3>
        <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
          {article.content.replace(/[#*`_]/g, "")}
        </p>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-1 border-t border-edge/60 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1 truncate max-w-[200px]">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {article.lastUpdatedBy
              ? `Diperbarui oleh ${article.lastUpdatedBy.name}`
              : `Ditulis oleh ${article.author.name}`}
          </span>
        </span>

        <span className="flex items-center gap-1 shrink-0 font-mono">
          <Eye className="h-3.5 w-3.5" />
          <span>{article.viewCount} pembaca</span>
        </span>
      </div>
    </div>
  );
}
