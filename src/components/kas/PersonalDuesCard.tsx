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
    <div className="card-solid p-6 shadow-sm flex flex-col gap-4">
      {/* Header Status Personal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
              Status Iuran Kas Personal
            </h3>
            <span className="text-xs text-slate-400 mt-0.5 block">
              {userName.split(" ")[0]}
            </span>
          </div>
        </div>

        {isFullyPaid ? (
          <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30">
            <CheckCircle2 className="h-4 w-4" />
            Lunas Terpenuhi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-rose-950/60 text-rose-400 px-3 py-1 rounded-full text-xs font-semibold border border-rose-500/30">
            <AlertCircle className="h-4 w-4" />
            Nunggak {unpaidPeriods.length} Periode
          </span>
        )}
      </div>

      {/* Rincian Ringkasan */}
      <div className="grid grid-cols-2 gap-4 bg-surface-container-low rounded-xl p-4 border border-edge/60">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-400">
            Total Terbayar
          </span>
          <span className="text-base font-bold text-emerald-400 mt-1 tabular-nums">
            Rp {totalPaid.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-400">
            Tunggakan Kas
          </span>
          <span
            className={`text-base font-bold mt-1 tabular-nums ${
              totalArrears > 0
                ? "text-rose-400"
                : "text-emerald-400"
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
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Siklus Kas 2026/2027
            </span>
            <span className="text-xs text-slate-400">
              Rp 5.000 / Periode
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {periods.map((period) => (
              <div
                key={period.id}
                className={`rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[64px] border transition-colors ${
                  period.isPaid
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-950/40 text-rose-300 border-rose-500/30"
                }`}
              >
                <span className="text-xs font-bold leading-none font-mono">
                  P{String(period.periodNumber).padStart(2, "0")}
                </span>
                <span
                  className={`w-5 h-5 mt-1.5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    period.isPaid
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white"
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
