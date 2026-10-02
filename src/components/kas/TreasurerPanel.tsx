"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldAlert,
  PlusCircle,
  Receipt,
  Search,
  Check,
  X,
  CreditCard,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Loader2,
  Share2,
} from "lucide-react";
import {
  generateWhatsAppLink,
  formatKasBroadcastMessage,
} from "@/utils/whatsappShare";
import {
  Role,
  ClassGrade,
  Division,
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
} from "@prisma/client";
import {
  createCashTransaction,
  toggleDuesPayment,
  recordAdvancePayment,
} from "@/actions/kas";

export interface MemberKasData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  classGrade: ClassGrade;
  mainDivision: Division;
  payments: {
    kasPeriodId: string;
    amountPaid: number;
    paidAt: Date | string;
  }[];
}

export interface KasPeriodData {
  id: string;
  periodNumber: number;
  name: string;
  amount: number;
}

interface TreasurerPanelProps {
  currentUserRole: Role;
  allMembers: MemberKasData[];
  periods: KasPeriodData[];
}

export function TreasurerPanel({
  currentUserRole,
  allMembers,
  periods,
}: TreasurerPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<
    "ALL" | "KELAS_10" | "KELAS_11" | "NUNGGAK"
  >("ALL");

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Form states for new transaction
  const [txType, setTxType] = useState<TransactionType>(TransactionType.INCOME);
  const [txAmount, setTxAmount] = useState<string>("");
  const [txDescription, setTxDescription] = useState<string>("");
  const [txIncomeCategory, setTxIncomeCategory] = useState<IncomeCategory>(
    IncomeCategory.KAS_RUTIN
  );
  const [txExpenseCategory, setTxExpenseCategory] = useState<ExpenseCategory>(
    ExpenseCategory.ACARA
  );
  const [txProofUrl, setTxProofUrl] = useState<string>("");

  // Form states for advance payment
  const [advanceUserId, setAdvanceUserId] = useState<string>(
    allMembers[0]?.id || ""
  );
  const [advancePeriodsCount, setAdvancePeriodsCount] = useState<number>(1);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Filter members
  const filteredMembers = allMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mainDivision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const paidPeriodIds = new Set(m.payments.map((p) => p.kasPeriodId));
    const isNunggak = periods.some((p) => !paidPeriodIds.has(p.id));

    if (filterClass === "ALL") return true;
    if (filterClass === "KELAS_10") return m.classGrade === ClassGrade.KELAS_10;
    if (filterClass === "KELAS_11") return m.classGrade === ClassGrade.KELAS_11;
    if (filterClass === "NUNGGAK") return isNunggak;

    return true;
  });

  const handleTogglePayment = (userId: string, periodId: string) => {
    startTransition(async () => {
      const res = await toggleDuesPayment(userId, periodId);
      if (res.success) {
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
      }
    });
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Nominal transaksi tidak valid.", "error");
      return;
    }

    startTransition(async () => {
      const res = await createCashTransaction({
        type: txType,
        amount: amountNum,
        description: txDescription,
        incomeCategory:
          txType === TransactionType.INCOME ? txIncomeCategory : undefined,
        expenseCategory:
          txType === TransactionType.EXPENSE ? txExpenseCategory : undefined,
        proofUrl: txProofUrl || undefined,
      });

      if (res.success) {
        showToast(res.message, "success");
        setIsTxModalOpen(false);
        setTxAmount("");
        setTxDescription("");
        setTxProofUrl("");
      } else {
        showToast(res.message, "error");
      }
    });
  };

  const handleRecordAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceUserId) {
      showToast("Pilih anggota terlebih dahulu.", "error");
      return;
    }

    const selectedMember = allMembers.find((m) => m.id === advanceUserId);
    if (!selectedMember) return;

    const paidPeriodIds = new Set(
      selectedMember.payments.map((p) => p.kasPeriodId)
    );
    // Cari periode yang belum lunas sebanyak advancePeriodsCount
    const unpaidPeriods = periods.filter((p) => !paidPeriodIds.has(p.id));
    const targetPeriodIds = unpaidPeriods
      .slice(0, advancePeriodsCount)
      .map((p) => p.id);

    if (targetPeriodIds.length === 0) {
      showToast("Semua periode kas untuk anggota ini sudah lunas!", "error");
      return;
    }

    startTransition(async () => {
      const res = await recordAdvancePayment(advanceUserId, targetPeriodIds);
      if (res.success) {
        showToast(res.message, "success");
        setIsAdvanceModalOpen(false);
      } else {
        showToast(res.message, "error");
      }
    });
  };

  const handleBroadcastKasWA = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const activePeriod = periods[periods.length - 1];
    const message = formatKasBroadcastMessage(
      {
        amountPerPeriod: activePeriod?.amount || 5000,
        periodName: activePeriod?.name || "Pekan Ini",
      },
      origin
    );

    const waLink = generateWhatsAppLink("", message);
    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="card-solid border-purple-300 dark:border-purple-900 bg-purple-50/10 dark:bg-purple-950/10 p-4 sm:p-5 shadow-sm flex flex-col gap-4">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 ${
            feedbackMsg.type === "success"
              ? "bg-ink text-surface"
              : "bg-danger text-white"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-white" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header Panel Bendahara */}
      <div className="flex items-center justify-between border-b border-edge pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Panel Pembukuan Bendahara
            </h3>
            <span className="text-[10px] text-ink-muted">
              Akses Pengurus: {currentUserRole}
            </span>
          </div>
        </div>
      </div>

      {/* Tombol Aksi Cepat Bendahara */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleBroadcastKasWA}
          className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Share2 className="h-4 w-4" />
          <span>📢 Broadcast Tagihan Kas Pekanan ke WA</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAdvanceModalOpen(true)}
          className="w-full min-h-[44px] bg-primary hover:bg-primary-hover active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <CreditCard className="h-4 w-4" />
          <span>+ Catat Pembayaran Kas (Advance Payment)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsTxModalOpen(true)}
          className="w-full min-h-[44px] bg-surface-container-low hover:bg-surface-container border border-edge text-ink rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Receipt className="h-4 w-4 text-primary" />
          <span>+ Catat Mutasi Kas (Pemasukan / Pengeluaran)</span>
        </button>
      </div>

      {/* Pencarian Anggota & Filter Tabs */}
      <div className="space-y-2 pt-1">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota atau divisi..."
            className="w-full min-h-[44px] pl-9 pr-4 bg-card text-ink placeholder-ink-muted rounded-lg text-xs border border-edge outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterClass("ALL")}
            className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterClass === "ALL"
                ? "bg-ink text-surface"
                : "bg-surface-container-low text-ink-secondary hover:text-ink border border-edge"
            }`}
          >
            Semua ({allMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterClass("KELAS_10")}
            className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterClass === "KELAS_10"
                ? "bg-primary text-white"
                : "bg-surface-container-low text-ink-secondary hover:text-ink border border-edge"
            }`}
          >
            ★ Kelas 10 (Gen 21)
          </button>
          <button
            type="button"
            onClick={() => setFilterClass("KELAS_11")}
            className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterClass === "KELAS_11"
                ? "bg-primary text-white"
                : "bg-surface-container-low text-ink-secondary hover:text-ink border border-edge"
            }`}
          >
            Kelas 11 (Gen 20)
          </button>
          <button
            type="button"
            onClick={() => setFilterClass("NUNGGAK")}
            className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterClass === "NUNGGAK"
                ? "bg-danger text-white"
                : "bg-surface-container-low text-ink-secondary hover:text-ink border border-edge"
            }`}
          >
            Tunggakan Saja
          </button>
        </div>
      </div>

      {/* Daftar Kartu Kas Anggota (Interactive Checklist Matrix) */}
      <div className="space-y-3 pt-1">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-6 text-xs text-ink-muted border border-dashed border-edge rounded-lg">
            Tidak ada anggota yang cocok dengan filter pencarian.
          </div>
        ) : (
          filteredMembers.map((member) => {
            const paidPeriodIds = new Set(
              member.payments.map((p) => p.kasPeriodId)
            );
            const unpaidPeriods = periods.filter(
              (p) => !paidPeriodIds.has(p.id)
            );
            const isFullyPaid = unpaidPeriods.length === 0;
            const arrearsAmount = unpaidPeriods.reduce(
              (sum, p) => sum + p.amount,
              0
            );

            return (
              <div
                key={member.id}
                className="rounded-xl border border-edge bg-card p-3.5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-xs font-bold text-ink border border-edge shrink-0">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-ink truncate leading-tight">
                        {member.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-ink-muted">
                        <span>{member.classGrade.replace("_", " ")}</span>
                        <span>•</span>
                        <span className="text-primary font-medium">
                          {member.mainDivision}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isFullyPaid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-subtle text-success text-[10px] font-bold shrink-0 border border-success/20">
                      <Check className="h-3 w-3" />
                      Lunas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-subtle text-danger text-[10px] font-bold shrink-0 border border-danger/20">
                      Nunggak Rp {arrearsAmount.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>

                {/* Grid Periode Interaktif Toggle */}
                {periods.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-semibold text-ink-muted block">
                      Klik periode untuk verifikasi pembayaran:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {periods.map((period) => {
                        const isPaid = paidPeriodIds.has(period.id);
                        return (
                          <button
                            key={period.id}
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleTogglePayment(member.id, period.id)
                            }
                            className={`min-h-[44px] rounded-lg p-1 flex flex-col items-center justify-center text-center border transition-all cursor-pointer ${
                              isPaid
                                ? "bg-success-subtle text-success border-success/30 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                                : "bg-danger-subtle text-danger border-danger/30 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
                            }`}
                            title={`Klik untuk ubah status P${period.periodNumber}`}
                          >
                            <span className="text-[10px] font-bold">
                              P{String(period.periodNumber).padStart(2, "0")}
                            </span>
                            <span
                              className={`w-3.5 h-3.5 mt-0.5 rounded-full text-[8px] flex items-center justify-center font-black ${
                                isPaid
                                  ? "bg-success text-white"
                                  : "bg-danger text-white"
                              }`}
                            >
                              {isPaid ? "L" : "N"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Catat Mutasi Kas Baru */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl p-4 shadow-xl border border-edge space-y-3">
            <div className="flex items-center justify-between border-b border-edge pb-2">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Catat Transaksi Kas
              </h4>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3 text-xs">
              {/* Jenis Transaksi */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType(TransactionType.INCOME)}
                  className={`min-h-[40px] rounded-lg font-bold border transition-colors ${
                    txType === TransactionType.INCOME
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-surface text-ink-secondary border-edge"
                  }`}
                >
                  Pemasukan (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType(TransactionType.EXPENSE)}
                  className={`min-h-[40px] rounded-lg font-bold border transition-colors ${
                    txType === TransactionType.EXPENSE
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-surface text-ink-secondary border-edge"
                  }`}
                >
                  Pengeluaran (-)
                </button>
              </div>

              {/* Kategori */}
              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Kategori
                </label>
                {txType === TransactionType.INCOME ? (
                  <select
                    value={txIncomeCategory}
                    onChange={(e) =>
                      setTxIncomeCategory(e.target.value as IncomeCategory)
                    }
                    className="w-full min-h-[44px] px-3 bg-surface text-ink border border-edge rounded-lg outline-none"
                  >
                    <option value={IncomeCategory.KAS_RUTIN}>Kas Rutin</option>
                    <option value={IncomeCategory.DANA_USAHA}>Dana Usaha</option>
                    <option value={IncomeCategory.DONASI}>Donasi</option>
                    <option value={IncomeCategory.SPONSOR}>Sponsor</option>
                    <option value={IncomeCategory.SALDO_AWAL}>Saldo Awal</option>
                  </select>
                ) : (
                  <select
                    value={txExpenseCategory}
                    onChange={(e) =>
                      setTxExpenseCategory(e.target.value as ExpenseCategory)
                    }
                    className="w-full min-h-[44px] px-3 bg-surface text-ink border border-edge rounded-lg outline-none"
                  >
                    <option value={ExpenseCategory.ACARA}>Acara / Kegiatan</option>
                    <option value={ExpenseCategory.KONSUMSI}>Konsumsi</option>
                    <option value={ExpenseCategory.LOGISTIK}>Logistik & Alat</option>
                    <option value={ExpenseCategory.KESEKRETARIATAN}>
                      Kesekretariatan
                    </option>
                    <option value={ExpenseCategory.LAINNYA}>Lainnya</option>
                  </select>
                )}
              </div>

              {/* Nominal */}
              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full min-h-[44px] px-3 bg-surface text-ink border border-edge rounded-lg outline-none focus:border-primary"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Deskripsi / Keterangan
                </label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Contoh: Pembelian snack rapat pleno"
                  className="w-full min-h-[44px] px-3 bg-surface text-ink border border-edge rounded-lg outline-none focus:border-primary"
                />
              </div>

              {/* Proof URL */}
              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Link Google Drive Nota (Opsional)
                </label>
                <input
                  type="url"
                  value={txProofUrl}
                  onChange={(e) => setTxProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full min-h-[44px] px-3 bg-surface text-ink border border-edge rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-edge">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="flex-1 min-h-[44px] rounded-lg bg-surface-container-low text-ink font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover text-white font-bold flex items-center justify-center gap-1"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Catat Advance Payment */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl p-4 shadow-xl border border-edge space-y-3">
            <div className="flex items-center justify-between border-b border-edge pb-2">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Advance Payment Kas
              </h4>
              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordAdvance} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Pilih Anggota
                </label>
                <select
                  value={advanceUserId}
                  onChange={(e) => setAdvanceUserId(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-surface text-ink border border-edge rounded-lg outline-none"
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.classGrade.replace("_", " ")} - {m.mainDivision})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Jumlah Periode Kas Di Muka
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 4, 8].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAdvancePeriodsCount(cnt)}
                      className={`min-h-[44px] rounded-lg font-bold border transition-colors ${
                        advancePeriodsCount === cnt
                          ? "bg-primary text-white border-primary"
                          : "bg-surface text-ink border-edge"
                      }`}
                    >
                      {cnt} Periode
                      <span className="block text-[9px] font-normal">
                        Rp {(cnt * 5000).toLocaleString("id-ID")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-edge">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="flex-1 min-h-[44px] rounded-lg bg-surface-container-low text-ink font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-lg bg-primary hover:bg-primary-hover text-white font-bold flex items-center justify-center gap-1"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Setor Kas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
