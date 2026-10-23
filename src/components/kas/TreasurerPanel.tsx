"use client";

import React, { useState, useTransition } from "react";
import {
  Wallet,
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
  Minus,
  Plus,
} from "lucide-react";
import {
  generateWhatsAppLink,
  formatKasBroadcastMessage,
} from "@/utils/whatsappShare";
import {
  Role,
  Division,
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
} from "@prisma/client";
import {
  createCashTransaction,
  toggleDuesPayment,
  recordAdvancePayment,
  createBillingEvent,
  toggleUrunanPayment,
} from "@/actions/kas";

export interface MemberKasData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  classGrade: string | null;
  generationNumber?: number | null;
  gen?: number | null;
  kelas?: string | null;
  mainDivision: Division;
  payments: {
    kasPeriodId: string;
    amountPaid: number;
    paidAt: Date | string;
  }[];
}

/**
 * Helper pencocokan data angkatan Kelas 11 (Gen 20)
 * Memeriksa properti gen, generationNumber, kelas, atau classGrade
 */
export function isGen20(m: MemberKasData): boolean {
  const g = m.gen ?? m.generationNumber;
  if (g === 20) return true;
  const cg = (m.classGrade || "").toUpperCase().trim();
  const k = (m.kelas || "").toUpperCase().trim();
  return (
    cg === "KELAS_11" ||
    cg === "XI" ||
    cg === "11" ||
    cg.includes("11") ||
    k === "XI" ||
    k === "11" ||
    k.includes("11")
  );
}

/**
 * Helper pencocokan data angkatan Kelas 10 (Gen 21)
 * Memeriksa properti gen, generationNumber, kelas, atau classGrade
 */
export function isGen21(m: MemberKasData): boolean {
  const g = m.gen ?? m.generationNumber;
  if (g === 21) return true;
  const cg = (m.classGrade || "").toUpperCase().trim();
  const k = (m.kelas || "").toUpperCase().trim();
  return (
    cg === "KELAS_10" ||
    cg === "X" ||
    cg === "10" ||
    cg.includes("10") ||
    k === "X" ||
    k === "10" ||
    k.includes("10")
  );
}

export interface KasPeriodData {
  id: string;
  periodNumber: number;
  name: string;
  amount: number;
}

export interface ActiveUrunanEvent {
  id: string;
  title: string;
  amount: number;
  dueDate?: Date | string | null;
  targetUsers: { id: string }[];
  payments: {
    id: string;
    userId: string;
    amountPaid: number;
    paidAt: Date | string;
  }[];
}

interface TreasurerPanelProps {
  currentUserRole: Role;
  allMembers: MemberKasData[];
  periods: KasPeriodData[];
  activeUrunanEvents?: ActiveUrunanEvent[];
}

export function TreasurerPanel({
  currentUserRole,
  allMembers,
  periods,
  activeUrunanEvents = [],
}: TreasurerPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<
    "ALL" | "KELAS_10" | "KELAS_11" | "NUNGGAK"
  >("ALL");

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Form states for new billing (Kas Rutin / Urunan Insidental)
  const [billingType, setBillingType] = useState<"KAS_RUTIN" | "URUNAN">(
    "KAS_RUTIN"
  );
  const [billingTitle, setBillingTitle] = useState("");
  const [billingAmount, setBillingAmount] = useState("");
  const [billingDescription, setBillingDescription] = useState("");
  const [billingDueDate, setBillingDueDate] = useState("");
  const [selectedBillingMemberIds, setSelectedBillingMemberIds] = useState<
    string[]
  >([]);
  const [billingMemberSearch, setBillingMemberSearch] = useState("");

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

  // Filter members dengan logika angkatan / kelas yang tahan banting
  const filteredMembers = allMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mainDivision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const paidPeriodIds = new Set(m.payments.map((p) => p.kasPeriodId));
    const isKasNunggak = periods.some((p) => !paidPeriodIds.has(p.id));

    const targetedUrunans = activeUrunanEvents.filter((event) =>
      event.targetUsers.some((u) => u.id === m.id)
    );
    const isUrunanNunggak = targetedUrunans.some(
      (event) => !event.payments.some((p) => p.userId === m.id)
    );
    const isNunggak = isKasNunggak || isUrunanNunggak;

    if (filterClass === "ALL") return true;
    if (filterClass === "KELAS_10") return isGen21(m);
    if (filterClass === "KELAS_11") return isGen20(m);
    if (filterClass === "NUNGGAK") return isNunggak;

    return true;
  });

  const handleToggleSelectMember = (id: string) => {
    setSelectedBillingMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllMembers = () => {
    setSelectedBillingMemberIds(allMembers.map((m) => m.id));
  };

  const handleDeselectAllMembers = () => {
    setSelectedBillingMemberIds([]);
  };

  const handleCreateBilling = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(billingAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Nominal tagihan harus lebih dari Rp 0.", "error");
      return;
    }

    if (!billingTitle.trim()) {
      showToast("Judul tagihan wajib diisi.", "error");
      return;
    }

    if (billingType === "URUNAN" && selectedBillingMemberIds.length === 0) {
      showToast(
        "Pilih minimal 1 anggota untuk tagihan urunan insidental.",
        "error"
      );
      return;
    }

    startTransition(async () => {
      const res = await createBillingEvent({
        title: billingTitle.trim(),
        description: billingDescription.trim() || undefined,
        type: billingType,
        amount: amountNum,
        dueDate: billingDueDate || undefined,
        targetUserIds:
          billingType === "URUNAN" ? selectedBillingMemberIds : undefined,
      });

      if (res.success) {
        showToast(res.message, "success");
        setIsBillingModalOpen(false);
        setBillingTitle("");
        setBillingAmount("");
        setBillingDescription("");
        setBillingDueDate("");
        setSelectedBillingMemberIds([]);
      } else {
        showToast(res.message, "error");
      }
    });
  };

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

  const handleToggleUrunan = (userId: string, eventId: string) => {
    startTransition(async () => {
      const res = await toggleUrunanPayment(userId, eventId);
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
        <div className="flex items-center gap-2.5">
          <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
          onClick={() => setIsBillingModalOpen(true)}
          className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Tagihan</span>
        </button>

        <button
          type="button"
          onClick={handleBroadcastKasWA}
          className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Share2 className="h-4 w-4" />
          <span>Broadcast Tagihan via WA</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAdvanceModalOpen(true)}
          className="w-full min-h-[44px] bg-primary hover:bg-primary-hover active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <CreditCard className="h-4 w-4" />
          <span>Catat Setoran Kas &amp; Urunan</span>
        </button>

        <button
          type="button"
          onClick={() => setIsTxModalOpen(true)}
          className="w-full min-h-[44px] bg-surface-container-low hover:bg-surface-container border border-edge text-ink rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Receipt className="h-4 w-4 text-primary" />
          <span>Catat Mutasi Kas</span>
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
            ★ Kelas 10 (Gen 21) ({allMembers.filter(isGen21).length})
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
            Kelas 11 (Gen 20) ({allMembers.filter(isGen20).length})
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
            const unpaidKasArrears = unpaidPeriods.reduce(
              (sum, p) => sum + p.amount,
              0
            );

            // Filter urunan aktif yang menargetkan anggota ini
            const targetedUrunans = activeUrunanEvents.filter((event) =>
              event.targetUsers.some((u) => u.id === member.id)
            );
            const unpaidUrunans = targetedUrunans.filter(
              (event) => !event.payments.some((p) => p.userId === member.id)
            );
            const unpaidUrunanArrears = unpaidUrunans.reduce(
              (sum, u) => sum + u.amount,
              0
            );

            const totalArrears = unpaidKasArrears + unpaidUrunanArrears;
            const isFullyPaid =
              unpaidPeriods.length === 0 && unpaidUrunans.length === 0;

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
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 truncate w-full flex-row whitespace-nowrap">
                        <span>
                          {isGen21(member)
                            ? "Gen 21 (Kelas 10)"
                            : isGen20(member)
                            ? "Gen 20 (Kelas 11)"
                            : (member.classGrade || "").replace("_", " ")}
                        </span>
                        <span>•</span>
                        <span className="text-primary font-medium">
                          {member.mainDivision}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isFullyPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-bold shrink-0">
                      <Check className="h-3 w-3" />
                      Lunas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 text-[10px] font-bold shrink-0">
                      Nunggak Rp {totalArrears.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>

                {/* Grid Periode Interaktif Toggle (Kas Rutin & Urunan) */}
                {(periods.length > 0 || targetedUrunans.length > 0) && (
                  <div
                    className={`space-y-2 pt-1 ${
                      targetedUrunans.length > 0
                        ? "sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0"
                        : ""
                    }`}
                  >
                    {/* Grid Periode Kas Rutin */}
                    {periods.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-ink-muted block">
                          Iuran Kas Rutin:
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

                    {/* Grid Tagihan Urunan Insidental */}
                    {targetedUrunans.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-ink-muted block">
                          Tagihan Urunan:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {targetedUrunans.map((urunan, uIdx) => {
                            const isPaid = urunan.payments.some(
                              (p) => p.userId === member.id
                            );
                            const urunanCode = `U${String(uIdx + 1).padStart(2, "0")}`;
                            return (
                              <button
                                key={urunan.id}
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleToggleUrunan(member.id, urunan.id)
                                }
                                className={`min-h-[44px] rounded-lg p-1 flex flex-col items-center justify-center text-center border transition-all cursor-pointer ${
                                  isPaid
                                    ? "bg-success-subtle text-success border-success/30 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                                    : "bg-danger-subtle text-danger border-danger/30 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300"
                                }`}
                                title={`${urunan.title} (Rp ${urunan.amount.toLocaleString("id-ID")}) - Klik untuk ubah status`}
                              >
                                <span className="text-[10px] font-bold">
                                  {urunanCode}
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
                      {m.name} ({(m.classGrade || "").replace("_", " ")} - {m.mainDivision})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1.5">
                  Jumlah Periode Kas Di Muka
                </label>
                <div className="flex items-center justify-between gap-3 p-2 bg-surface-container-low rounded-xl border border-edge">
                  <button
                    type="button"
                    onClick={() =>
                      setAdvancePeriodsCount((prev) => Math.max(1, prev - 1))
                    }
                    disabled={advancePeriodsCount <= 1}
                    className="h-10 w-10 min-h-[40px] rounded-lg bg-surface border border-edge flex items-center justify-center text-ink hover:bg-surface-container active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    aria-label="Kurangi Periode"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-ink leading-tight">
                      {advancePeriodsCount} Periode
                    </span>
                    <span className="text-[10px] text-ink-muted">
                      ({advancePeriodsCount} pekan)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAdvancePeriodsCount((prev) => prev + 1)}
                    className="h-10 w-10 min-h-[40px] rounded-lg bg-surface border border-edge flex items-center justify-center text-ink hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
                    aria-label="Tambah Periode"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 text-center text-xs font-semibold text-primary">
                  Total: Rp {(advancePeriodsCount * 5000).toLocaleString("id-ID")}
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

      {/* Modal 3: Buat Tagihan Baru (Kas Rutin & Urunan Insidental) */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl p-5 shadow-2xl border border-edge space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-edge pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/50">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink uppercase tracking-wider">
                    Buat Tagihan Baru
                  </h4>
                  <p className="text-[11px] text-ink-muted">
                    Sistem tagihan kas rutin global atau urunan insidental
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBillingModalOpen(false)}
                className="text-ink-muted hover:text-ink cursor-pointer p-1 rounded-lg hover:bg-surface-container"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateBilling}
              className="space-y-3.5 text-xs overflow-y-auto flex-1 pr-1"
            >
              {/* Pilihan Tipe Tagihan: KAS_RUTIN vs URUNAN */}
              <div>
                <label className="text-[11px] font-bold text-ink block mb-1.5">
                  Tipe Tagihan <span className="text-primary">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingType("KAS_RUTIN")}
                    className={`min-h-[44px] rounded-xl font-bold border transition-all p-3 flex items-center justify-center gap-1.5 cursor-pointer ${
                      billingType === "KAS_RUTIN"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30"
                        : "bg-surface-container-low text-ink-muted border-edge hover:text-ink"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      💰 Kas Rutin
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingType("URUNAN")}
                    className={`min-h-[44px] rounded-xl font-bold border transition-all p-3 flex items-center justify-center gap-1.5 cursor-pointer ${
                      billingType === "URUNAN"
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-500 shadow-xs ring-1 ring-purple-500/30"
                        : "bg-surface-container-low text-ink-muted border-edge hover:text-ink"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      🎯 Urunan
                    </span>
                  </button>
                </div>
              </div>

              {/* Judul Tagihan */}
              <div>
                <label className="text-[11px] font-bold text-ink block mb-1">
                  Nama Tagihan / Event <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={billingTitle}
                  onChange={(e) => setBillingTitle(e.target.value)}
                  placeholder={
                    billingType === "KAS_RUTIN"
                      ? "Contoh: Kas Rutin Pekan Ke-4 September"
                      : "Contoh: Urunan Sewa Bus Kunjungan Industri"
                  }
                  className="w-full min-h-[42px] px-3 bg-surface text-ink border border-edge rounded-xl outline-none focus:border-primary text-xs"
                />
              </div>

              {/* Nominal & Tenggat Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-ink block mb-1">
                    Nominal per Anggota (Rp) <span className="text-primary">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(e.target.value)}
                    placeholder="Contoh: 10000"
                    className="w-full min-h-[42px] px-3 bg-surface text-ink border border-edge rounded-xl outline-none focus:border-primary text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink block mb-1">
                    Tenggat Waktu (Opsional)
                  </label>
                  <input
                    type="date"
                    value={billingDueDate}
                    onChange={(e) => setBillingDueDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 bg-surface text-ink border border-edge rounded-xl outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-[11px] font-bold text-ink block mb-1">
                  Keterangan / Rincian Tagihan
                </label>
                <textarea
                  rows={2}
                  value={billingDescription}
                  onChange={(e) => setBillingDescription(e.target.value)}
                  placeholder="Deskripsi singkat tujuan penarikan dana atau rincian biaya..."
                  className="w-full p-2.5 bg-surface text-ink border border-edge rounded-xl outline-none focus:border-primary text-xs resize-none"
                />
              </div>

              {/* ========================================================= */}
              {/* FITUR MULTI-SELECT ANGGOTA (HANYA MUNCUL JIKA TIPE URUNAN) */}
              {/* ========================================================= */}
              {billingType === "URUNAN" && (
                <div className="space-y-2 pt-1 border-t border-edge">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-ink block">
                        Pilih Anggota Penanggung Urunan <span className="text-primary">*</span>
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        {selectedBillingMemberIds.length} dari {allMembers.length} anggota terpilih
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={handleSelectAllMembers}
                        className="px-2 py-1 rounded-md bg-surface-container text-ink hover:text-primary font-semibold transition-colors cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllMembers}
                        className="px-2 py-1 rounded-md bg-surface-container text-ink-muted hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  {/* Filter Pencarian Cepat Anggota Urunan */}
                  <input
                    type="text"
                    value={billingMemberSearch}
                    onChange={(e) => setBillingMemberSearch(e.target.value)}
                    placeholder="Saring nama atau divisi anggota..."
                    className="w-full h-8 px-2.5 bg-surface text-ink border border-edge rounded-lg text-[11px] outline-none focus:border-primary"
                  />

                  {/* Daftar Checklist Anggota */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-surface-container-low rounded-xl border border-edge">
                    {allMembers
                      .filter(
                        (m) =>
                          m.name
                            .toLowerCase()
                            .includes(billingMemberSearch.toLowerCase()) ||
                          m.mainDivision
                            .toLowerCase()
                            .includes(billingMemberSearch.toLowerCase())
                      )
                      .map((member) => {
                        const isSelected = selectedBillingMemberIds.includes(
                          member.id
                        );
                        return (
                          <label
                            key={member.id}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-card border-purple-500/50 shadow-xs"
                                : "bg-surface border-edge/60 hover:bg-card"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleToggleSelectMember(member.id)
                                }
                                className="h-4 w-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-ink block truncate leading-tight">
                                  {member.name}
                                </span>
                                <span className="text-[10px] text-ink-muted block truncate">
                                  {isGen21(member)
                                    ? "Gen 21 (Kelas 10)"
                                    : isGen20(member)
                                    ? "Gen 20 (Kelas 11)"
                                    : (member.classGrade || "").replace("_", " ")}{" "}
                                  • {member.mainDivision}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0">
                                Ditagih
                              </span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Action Buttons Submit & Batal */}
              <div className="flex gap-2 pt-3 border-t border-edge shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="flex-1 min-h-[44px] rounded-xl bg-surface-container-low text-ink font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menerbitkan...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      <span>Terbitkan Tagihan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
