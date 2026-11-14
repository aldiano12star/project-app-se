"use client";

import React from "react";
import {
  Clock,
  Eye,
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
  onOpenDetail?: (article: WikiArticleData) => void;
  onClick?: () => void;
}

const WIKI_CATEGORY_META: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  SURAT_LPJ: {
    label: "Format Surat & LPJ",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
  },
  INFO_LOMBA: {
    label: "Tips & Info Lomba",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  MODUL_PELATIHAN: {
    label: "Modul Pelatihan",
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/20",
  },
  PANDUAN_TEKNIS: {
    label: "Panduan Teknis & Alat",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  // Backward compatibility
  SOP_LAB: {
    label: "Panduan Teknis & Alat",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  TUTORIAL: {
    label: "Modul Pelatihan",
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/20",
  },
  LPJ_SURAT: {
    label: "Format Surat & LPJ",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
  },
  TIPS_LOMBA: {
    label: "Tips & Info Lomba",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
};

export function WikiCard({ article, onOpenDetail, onClick }: WikiCardProps) {
  const categoryMeta =
    WIKI_CATEGORY_META[article.category] || WIKI_CATEGORY_META.PANDUAN_TEKNIS;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onOpenDetail) {
      onOpenDetail(article);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="apple-card p-4 hover:border-emerald-500/40 transition-all space-y-2.5 cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
    >
      <div className="space-y-2">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
          >
            <span>{categoryMeta.label}</span>
          </span>

          <span className="text-xs text-ink-muted">
            Perpustakaan Digital
          </span>
        </div>

        {/* Title & Preview */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">
            {article.content.replace(/[#*`_]/g, "")}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-2 border-t hairline-border text-xs sm:text-sm text-ink-muted">
        <span className="flex items-center gap-1 truncate max-w-[200px]">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {article.lastUpdatedBy
              ? `Diperbarui ${article.lastUpdatedBy.name}`
              : `Ditulis ${article.author.name}`}
          </span>
        </span>

        <span className="flex items-center gap-1 shrink-0 font-mono-num">
          <Eye className="h-3 w-3" />
          <span>{article.viewCount} pembaca</span>
        </span>
      </div>
    </div>
  );
}
