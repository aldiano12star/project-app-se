import React from "react";
import { Users2, TrendingUp } from "lucide-react";

export interface GenerationCompliance {
  name: string;
  grade: string;
  totalMembers: number;
  paidMembers: number;
  collectedAmount: number;
  percentage: number;
}

interface CashComplianceCardProps {
  gen20: GenerationCompliance;
  gen21: GenerationCompliance;
}

export function CashComplianceCard({
  gen20,
  gen21,
}: CashComplianceCardProps) {
  return (
    <div className="card-solid p-4 sm:p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-edge pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-200 dark:border-blue-900">
            <Users2 className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
            Kepatuhan Kas Angkatan
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
          <TrendingUp className="h-3 w-3" />
          Aktif
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Gen 20 (Kelas 11) */}
        <div className="bg-surface-container-low border border-edge rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink truncate">
              {gen20.name}
            </span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {gen20.percentage}%
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(gen20.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-ink-muted pt-0.5">
            <span>
              {gen20.paidMembers}/{gen20.totalMembers} Lunas
            </span>
            <span className="font-semibold text-ink-secondary">
              Rp {gen20.collectedAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Gen 21 (Kelas 10) */}
        <div className="bg-surface-container-low border border-edge rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink truncate">
              ★ {gen21.name}
            </span>
            <span className="text-xs font-black text-brand-primary">
              {gen21.percentage}%
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(gen21.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-ink-muted pt-0.5">
            <span>
              {gen21.paidMembers}/{gen21.totalMembers} Lunas
            </span>
            <span className="font-semibold text-ink-secondary">
              Rp {gen21.collectedAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
