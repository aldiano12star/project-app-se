import React from "react";
import { CheckCircle2, AlertCircle, Calendar, Wallet } from "lucide-react";

export interface PeriodStatusItem {
  id: string;
  periodNumber: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  amount: number;
  isPaid: boolean;
}

interface PersonalDuesCardProps {
  userName: string;
  periods: PeriodStatusItem[];
}

export function PersonalDuesCard({ userName, periods }: PersonalDuesCardProps) {
  const totalPaid = periods
    .filter((p) => p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);

  const unpaidPeriods = periods.filter((p) => !p.isPaid);
  const totalArrears = unpaidPeriods.reduce((sum, p) => sum + p.amount, 0);
  const isFullyPaid = unpaidPeriods.length === 0 && periods.length > 0;

  return (
    <div className="card-solid p-4 sm:p-5 shadow-sm flex flex-col gap-3">
      {/* Header Status Personal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Status Iuran Kas Personal
            </h3>
            <span className="text-[11px] text-ink-muted">
              {userName.split(" ")[0]}
            </span>
          </div>
        </div>

        {isFullyPaid ? (
          <span className="inline-flex items-center gap-1 bg-success-subtle text-success px-2.5 py-1 rounded-full text-[10px] font-bold border border-success/20">
            <CheckCircle2 className="h-3 w-3" />
            Lunas Terpenuhi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-danger-subtle text-danger px-2.5 py-1 rounded-full text-[10px] font-bold border border-danger/20">
            <AlertCircle className="h-3 w-3" />
            Nunggak {unpaidPeriods.length} Periode
          </span>
        )}
      </div>

      {/* Rincian Ringkasan */}
      <div className="grid grid-cols-2 gap-3 bg-surface-container-low rounded-lg p-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-ink-secondary">
            Total Terbayar
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            Rp {totalPaid.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-ink-secondary">
            Tunggakan Kas
          </span>
          <span
            className={`text-sm font-black mt-0.5 tabular-nums ${
              totalArrears > 0
                ? "text-danger"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {totalArrears > 0
              ? `Rp ${totalArrears.toLocaleString("id-ID")}`
              : "Rp 0 (Bebas)"}
          </span>
        </div>
      </div>

      {/* Grid Matriks Periode */}
      {periods.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-ink-secondary">
            <span className="font-semibold flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Siklus Kas 2026/2027
            </span>
            <span className="text-[10px] text-ink-muted">
              Rp 5.000 / Periode
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {periods.map((period) => (
              <div
                key={period.id}
                className={`rounded-lg p-2 flex flex-col items-center justify-center text-center min-h-[58px] border transition-colors ${
                  period.isPaid
                    ? "bg-success-subtle text-success border-success/20"
                    : "bg-danger-subtle text-danger border-danger/20"
                }`}
              >
                <span className="text-xs font-bold leading-none">
                  P{String(period.periodNumber).padStart(2, "0")}
                </span>
                <span
                  className={`w-4 h-4 mt-1 rounded-full text-[9px] flex items-center justify-center font-black ${
                    period.isPaid
                      ? "bg-success text-white"
                      : "bg-danger text-white"
                  }`}
                >
                  {period.isPaid ? "L" : "N"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
