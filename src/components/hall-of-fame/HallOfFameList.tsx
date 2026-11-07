"use client";

import React, { useState } from "react";
import { FilmstripFrame, HallOfFameEntryData } from "./FilmstripFrame";
import { getHallOfFameEntries } from "@/actions/hallOfFame";
import { Loader2, Sparkles, Trophy, ChevronDown } from "lucide-react";

interface HallOfFameListProps {
  initialEntries: HallOfFameEntryData[];
  initialHasMore: boolean;
  totalCount: number;
  isOperator?: boolean;
}

export function HallOfFameList({
  initialEntries,
  initialHasMore,
  totalCount,
  isOperator,
}: HallOfFameListProps) {
  const [entries, setEntries] = useState<HallOfFameEntryData[]>(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const res = await getHallOfFameEntries(nextPage, 5);
    if (res.success && res.entries) {
      setEntries((prev) => [...prev, ...res.entries]);
      setHasMore(res.hasMore);
      setPage(nextPage);
    }
    setIsLoadingMore(false);
  };

  if (entries.length === 0) {
    return (
      <div className="card-solid p-8 sm:p-12 rounded-3xl bg-[#18181B] border border-[#27272A] text-center space-y-4 max-w-lg mx-auto shadow-2xl animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-3xl">
          ⏳
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-[#F4F4F5]">
            Lorong Waktu Menanti Sejarah Baru
          </h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Belum ada periode kepengurusan yang ditutup. Lembaran pita film Hall of Fame ini akan terisi otomatis saat Operator mengeksekusi <strong>&ldquo;Ganti Periode &amp; Kurasi Hall of Fame&rdquo;</strong> di akhir masa bakti.
          </p>
        </div>

        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Siap Mengabadikan Generasi 20 &amp; Seterusnya</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* List of Filmstrip Frames */}
      <div className="space-y-8">
        {entries.map((entry, idx) => (
          <FilmstripFrame
            key={entry.id}
            entry={entry}
            index={idx}
            isOperator={isOperator}
          />
        ))}
      </div>

      {/* Lazy-Load / Pagination Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={handleLoadMore}
            className="h-11 px-6 rounded-2xl bg-[#18181B] hover:bg-[#202024] active:scale-95 text-[#F4F4F5] border border-[#27272A] text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Memutar Pita Film Lama...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-primary" />
                <span>Buka Generasi Sebelumnya</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
