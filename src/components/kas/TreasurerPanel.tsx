"use client";

import React, { useState, useTransition } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  Search,
  Check,
  X,
  Loader2,
  Send,
} from "lucide-react";
import { Role, Division, TransactionCategory } from "@prisma/client";
import {
  recordDeposit,
  createBulkBills,
  recordGlobalFinance,
} from "@/actions/kas";
import {
  InvoiceTrackerSection,
  TrackerInvoiceItem,
} from "@/components/kas/InvoiceTrackerSection";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { triggerMicroConfetti } from "@/lib/confetti";
import { haptic } from "@/lib/haptic";

export interface TreasurerMemberData {
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
  kasBalance: number;
}

interface TreasurerPanelProps {
  currentUserRole?: Role;
  allMembers: TreasurerMemberData[];
  invoices?: TrackerInvoiceItem[];
  realBalance: number;
  totalIncome?: number;
  totalExpense?: number;
}

export function TreasurerPanel({
  allMembers,
  invoices = [],
}: TreasurerPanelProps) {
  const [isPending, startTransition] = useTransition();

  // State Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isBulkBillModalOpen, setIsBulkBillModalOpen] = useState(false);
  const [isGlobalFinanceModalOpen, setIsGlobalFinanceModalOpen] = useState(false);

  // Global scroll lock saat modal apapun aktif
  useBodyScrollLock(
    isDepositModalOpen || isBulkBillModalOpen || isGlobalFinanceModalOpen
  );

  // Form State: Setoran Anggota
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositDesc, setDepositDesc] = useState<string>("");

  // Form State: Tagihan Serentak
  const [billTargetScope, setBillTargetScope] = useState<
    "ALL" | "GEN_20" | "GEN_21" | "CUSTOM"
  >("ALL");
  const [customSelectedUserIds, setCustomSelectedUserIds] = useState<string[]>([]);
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const [billCategory, setBillCategory] = useState<"TAGIHAN_RUTIN" | "TAGIHAN_INSIDENTAL">("TAGIHAN_RUTIN");
  const [billAmount, setBillAmount] = useState<string>("5000");
  const [billTitle, setBillTitle] = useState<string>("");

  // Form State: Finansial Bebas
  const [globalType, setGlobalType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [globalCategory, setGlobalCategory] = useState<TransactionCategory>(
    TransactionCategory.DANUS_SUKARELA
  );
  const [globalAmount, setGlobalAmount] = useState<string>("");
  const [globalDesc, setGlobalDesc] = useState<string>("");

  // Feedback Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Helper pencocokan generasi / angkatan
  const isGen20 = (m: TreasurerMemberData) => {
    const g = m.gen ?? m.generationNumber;
    if (g === 20) return true;
    const cg = (m.classGrade || "").toUpperCase().trim();
    const k = (m.kelas || "").toUpperCase().trim();
    return cg.includes("11") || k.includes("11") || cg === "XI" || k === "XI";
  };

  const isGen21 = (m: TreasurerMemberData) => {
    const g = m.gen ?? m.generationNumber;
    if (g === 21) return true;
    const cg = (m.classGrade || "").toUpperCase().trim();
    const k = (m.kelas || "").toUpperCase().trim();
    return cg.includes("10") || k.includes("10") || cg === "X" || k === "X";
  };

  // Helper pemformatan identitas Kelas & Generasi yang ringkas & hemat ruang
  const formatGradeGen = (m: TreasurerMemberData) => {
    if (m.role === Role.KOLABORATOR || (m.role as string) === "KOLABORATOR") {
      return "Kolaborator";
    }
    const genVal =
      m.gen ??
      m.generationNumber ??
      (m.classGrade === "KELAS_10"
        ? 21
        : m.classGrade === "KELAS_11"
        ? 20
        : m.classGrade === "KELAS_12"
        ? 19
        : null);

    if (genVal) return `Gen ${genVal}`;
    return "-";
  };

  // Filter Anggota untuk Target Custom di Modal Tagihan Massal
  const filteredCustomMembers = allMembers.filter((m) => {
    if (!customSearchQuery.trim()) return true;
    const q = customSearchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.classGrade || "").toLowerCase().includes(q) ||
      m.mainDivision.toLowerCase().includes(q)
    );
  });

  const DIVISIONS: Division[] = [
    Division.PROGRAMMING,
    Division.DESIGN,
    Division.PHOTOGRAPHY,
    Division.CINEMATOGRAPHY,
    Division.TECHNOPRENEURSHIP,
  ];

  const handleToggleSelectUser = (id: string) => {
    setCustomSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSelectAllCustom = () => {
    setCustomSelectedUserIds(allMembers.map((m) => m.id));
  };

  const handleDeselectAllCustom = () => {
    setCustomSelectedUserIds([]);
  };

  const handleSelectDivisionCustom = (div: Division) => {
    const divUserIds = allMembers
      .filter((m) => m.mainDivision === div)
      .map((m) => m.id);
    setCustomSelectedUserIds((prev) => {
      const merged = new Set([...prev, ...divUserIds]);
      return Array.from(merged);
    });
  };

  // Submit Handler: Setoran Kas
  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(depositAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification("error", "Nominal setoran harus lebih dari Rp 0.");
      return;
    }

    startTransition(async () => {
      const res = await recordDeposit(selectedUserId, amountNum, depositDesc);
      if (res.success) {
        triggerMicroConfetti();
        haptic.success();
        showNotification("success", res.message);
        setIsDepositModalOpen(false);
        setDepositAmount("");
        setDepositDesc("");
      } else {
        haptic.warning();
        showNotification("error", res.message);
      }
    });
  };

  // Submit Handler: Tagihan Serentak
  const handleSubmitBulkBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(billAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification("error", "Nominal tagihan harus lebih dari Rp 0.");
      return;
    }

    if (!billTitle.trim()) {
      showNotification("error", "Judul/keterangan tagihan wajib diisi.");
      return;
    }

    // Tentukan user target berdasarkan scope
    let targetUsers = allMembers;
    if (billTargetScope === "GEN_20") targetUsers = allMembers.filter(isGen20);
    else if (billTargetScope === "GEN_21") targetUsers = allMembers.filter(isGen21);
    else if (billTargetScope === "CUSTOM") {
      if (customSelectedUserIds.length === 0) {
        showNotification("error", "Pilih minimal satu anggota target tagihan.");
        return;
      }
      targetUsers = allMembers.filter((u) => customSelectedUserIds.includes(u.id));
    }

    // Proteksi Finansial: KOLABORATOR hanya membayar tagihan insidental, kecualikan dari tagihan rutin
    if (billCategory === "TAGIHAN_RUTIN") {
      targetUsers = targetUsers.filter(
        (u) => u.role !== Role.KOLABORATOR && (u.role as string) !== "KOLABORATOR"
      );
    }

    const userIds = targetUsers.map((u) => u.id);

    startTransition(async () => {
      const res = await createBulkBills(
        userIds,
        amountNum,
        billTitle,
        billCategory
      );
      if (res.success) {
        haptic.success();
        showNotification("success", res.message);
        setIsBulkBillModalOpen(false);
        setBillTitle("");
      } else {
        haptic.warning();
        showNotification("error", res.message);
      }
    });
  };

  // Submit Handler: Finansial Bebas
  const handleSubmitGlobalFinance = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(globalAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification("error", "Nominal harus lebih dari Rp 0.");
      return;
    }

    if (!globalDesc.trim()) {
      showNotification("error", "Keterangan transaksi wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await recordGlobalFinance(
        globalType,
        globalCategory,
        amountNum,
        globalDesc
      );
      if (res.success) {
        haptic.success();
        showNotification("success", res.message);
        setIsGlobalFinanceModalOpen(false);
        setGlobalAmount("");
        setGlobalDesc("");
      } else {
        haptic.warning();
        showNotification("error", res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* ── NOTIFICATION TOAST ─────────────────────────────────────────── */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:opacity-75 cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── 1. ACTION BAR BENDAHARA ────────────────────────────────────── */}
      <div className="card-solid bg-card p-5 rounded-2xl border border-edge space-y-4">
        <div>
          <h3 className="text-sm font-bold text-ink">
            Aksi Finansial Bendahara
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Kelola setoran tunai, penarikan tagihan massal, atau operasional bebas.
          </p>
        </div>

        <div className="space-y-3">
          {/* Top Row: Grid 2 Kolom (Equal Width) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tombol 1: Catat Setoran (Kiri) */}
            <button
              type="button"
              onClick={() => {
                setSelectedUserId(allMembers[0]?.id || "");
                setDepositAmount("5000");
                setDepositDesc("");
                setIsDepositModalOpen(true);
              }}
              className="h-11 min-h-11 w-full px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <ArrowDownLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">Catat Setoran</span>
            </button>

            {/* Tombol 2: Tarik Tagihan (Kanan) */}
            <button
              type="button"
              onClick={() => {
                setBillTitle("");
                setBillAmount("5000");
                setBillTargetScope("ALL");
                setCustomSelectedUserIds([]);
                setIsBulkBillModalOpen(true);
              }}
              className="h-11 min-h-11 w-full px-4 bg-rose-700 hover:bg-rose-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              <span className="truncate">Tarik Tagihan</span>
            </button>
          </div>

          {/* Bottom Row: Danus / Operasional Spanning Full Width */}
          <button
            type="button"
            onClick={() => {
              setGlobalAmount("");
              setGlobalDesc("");
              setIsGlobalFinanceModalOpen(true);
            }}
            className="w-full h-11 min-h-11 px-4 bg-surface-container-low hover:bg-surface-container text-ink border border-edge active:scale-[0.98] text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Danus / Operasional</span>
          </button>
        </div>
      </div>

      {/* ── MODAL 1: CATAT SETORAN ANGGOTA ─────────────────────────────── */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-ink">
                  Catat Setoran Kas Anggota
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Pilih Anggota
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatGradeGen(m)}) - Saldo:{" "}
                      {m.kasBalance < 0 ? "-" : "+"}Rp{" "}
                      {Math.abs(m.kasBalance).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Nominal Setoran Tunai (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 10000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-ink-muted mt-1">
                  Input harus bilangan positif. Saldo anggota akan bertambah otomatis.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Keterangan / Uraian (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Iuran kas bulan Oktober tunai"
                  value={depositDesc}
                  onChange={(e) => setDepositDesc(e.target.value)}
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-edge">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="h-11 min-h-11 px-4 text-xs font-semibold rounded-xl bg-surface-container-low hover:bg-surface-container text-ink transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 min-h-11 px-5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Simpan Setoran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: TARIK TAGIHAN SERENTAK ───────────────────────────── */}
      {isBulkBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-bold text-ink">
                  Tarik Tagihan Kas Serentak
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkBillModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBulkBill} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Sasaran Anggota
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillTargetScope("ALL")}
                    className={`h-10 min-h-10 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      billTargetScope === "ALL"
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-container-low text-ink border-edge hover:bg-surface-container"
                    }`}
                  >
                    Semua ({allMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillTargetScope("GEN_20")}
                    className={`h-10 min-h-10 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      billTargetScope === "GEN_20"
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-container-low text-ink border-edge hover:bg-surface-container"
                    }`}
                  >
                    Kelas 11 ({allMembers.filter(isGen20).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillTargetScope("GEN_21")}
                    className={`h-10 min-h-10 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      billTargetScope === "GEN_21"
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-container-low text-ink border-edge hover:bg-surface-container"
                    }`}
                  >
                    Kelas 10 ({allMembers.filter(isGen21).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillTargetScope("CUSTOM")}
                    className={`h-10 min-h-10 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      billTargetScope === "CUSTOM"
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-container-low text-ink border-edge hover:bg-surface-container"
                    }`}
                  >
                    Khusus ({customSelectedUserIds.length})
                  </button>
                </div>

                {/* MULTI-SELECT CHECKLIST JIKA CUSTOM */}
                {billTargetScope === "CUSTOM" && (
                  <div className="mt-2.5 space-y-2.5 p-3 rounded-xl bg-surface-container-low border border-edge">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-ink block">
                          Pilih Anggota Sasaran <span className="text-primary">*</span>
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {customSelectedUserIds.length} dari {allMembers.length} anggota terpilih
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={handleSelectAllCustom}
                          className="px-2 py-1 rounded-md bg-card text-ink hover:text-primary font-semibold border border-edge transition-colors cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllCustom}
                          className="px-2 py-1 rounded-md bg-card text-ink-muted hover:text-rose-600 font-semibold border border-edge transition-colors cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    {/* Filter Cepat per Divisi */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold text-ink-muted mr-1">Divisi:</span>
                      {DIVISIONS.map((div) => (
                        <button
                          key={div}
                          type="button"
                          onClick={() => handleSelectDivisionCustom(div)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-card border border-edge text-ink-muted hover:text-primary hover:border-primary transition-colors cursor-pointer"
                        >
                          +{div.slice(0, 4)}
                        </button>
                      ))}
                    </div>

                    {/* Filter Input Pencarian */}
                    <div className="relative">
                      <input
                        type="text"
                        value={customSearchQuery}
                        onChange={(e) => setCustomSearchQuery(e.target.value)}
                        placeholder="Saring nama, kelas, atau divisi..."
                        className="w-full h-8 pl-8 pr-2.5 bg-card text-ink border border-edge rounded-lg text-xs outline-hidden focus:border-primary"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Daftar Checklist Anggota */}
                    <div className="max-h-44 overflow-y-auto space-y-1 p-1 bg-card rounded-lg border border-edge">
                      {filteredCustomMembers.length === 0 ? (
                        <p className="text-[11px] text-ink-muted text-center py-3">
                          Tidak ada anggota yang cocok dengan pencarian.
                        </p>
                      ) : (
                        filteredCustomMembers.map((member) => {
                          const isSelected = customSelectedUserIds.includes(member.id);
                          return (
                            <label
                              key={member.id}
                              onClick={() => handleToggleSelectUser(member.id)}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-primary/10 border-primary/40"
                                  : "bg-surface-container-low/40 hover:bg-surface-container-low border-transparent"
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <span className="text-xs font-semibold text-ink block truncate">
                                  {member.name}
                                </span>
                                <span className="text-[10px] text-ink-muted block">
                                  {formatGradeGen(member)} • {member.mainDivision}
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-primary border-edge focus:ring-primary cursor-pointer shrink-0"
                              />
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Kategori Tagihan
                </label>
                <select
                  value={billCategory}
                  onChange={(e) =>
                    setBillCategory(
                      e.target.value as "TAGIHAN_RUTIN" | "TAGIHAN_INSIDENTAL"
                    )
                  }
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="TAGIHAN_RUTIN">
                    Tagihan Rutin Kas Organisasi
                  </option>
                  <option value="TAGIHAN_INSIDENTAL">
                    Tagihan Insidental / Urunan Khusus
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Nama / Uraian Tagihan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kas Rutin Periode November 2026"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  required
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Nominal Potongan per Anggota (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 5000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  required
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-ink-muted mt-1">
                  Saldo dompet anggota terpilih akan langsung terpotong secara serentak.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-edge">
                <button
                  type="button"
                  onClick={() => setIsBulkBillModalOpen(false)}
                  className="h-11 min-h-11 px-4 text-xs font-semibold rounded-xl bg-surface-container-low hover:bg-surface-container text-ink transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 min-h-11 px-5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Terbitkan Tagihan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: FINANSIAL BEBAS (DANUS / OPERASIONAL ACARA) ────────── */}
      {isGlobalFinanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-edge pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-ink">
                  Catat Keuangan Global Organisasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGlobalFinanceModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGlobalFinance} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalType("INCOME");
                      setGlobalCategory(TransactionCategory.DANUS_SUKARELA);
                    }}
                    className={`h-11 min-h-11 text-xs font-semibold rounded-xl border transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                      globalType === "INCOME"
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-surface-container-low text-ink border-edge hover:bg-surface-container"
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    <span>Pemasukan (Danus)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalType("EXPENSE");
                      setGlobalCategory(TransactionCategory.OPERASIONAL_ACARA);
                    }}
                    className={`h-11 min-h-11 text-xs font-semibold rounded-xl border transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                      globalType === "EXPENSE"
                        ? "bg-rose-700 text-white border-rose-700"
                        : "bg-surface-container-low text-ink border-edge hover:bg-surface-container"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Pengeluaran Acara</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Kategori Transaksi
                </label>
                <select
                  value={globalCategory}
                  onChange={(e) =>
                    setGlobalCategory(e.target.value as TransactionCategory)
                  }
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {globalType === "INCOME" ? (
                    <>
                      <option value={TransactionCategory.DANUS_SUKARELA}>
                        Dana Usaha / Pemasukan Sukarela
                      </option>
                      <option value={TransactionCategory.SETORAN_MEMBER}>
                        Pemasukan Kas Umum
                      </option>
                    </>
                  ) : (
                    <>
                      <option value={TransactionCategory.OPERASIONAL_ACARA}>
                        Biaya Operasional Acara / Rapat
                      </option>
                      <option value={TransactionCategory.TAGIHAN_INSIDENTAL}>
                        Pengeluaran Logistik / Kesekretariatan
                      </option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 150000"
                  value={globalAmount}
                  onChange={(e) => setGlobalAmount(e.target.value)}
                  required
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-ink-muted mt-1">
                  Transaksi ini mempengaruhi kas riil tanpa mengubah saldo dompet personal anggota.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Uraian / Deskripsi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Penjualan merchandise stiker expo"
                  value={globalDesc}
                  onChange={(e) => setGlobalDesc(e.target.value)}
                  required
                  className="w-full h-11 min-h-11 px-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-edge">
                <button
                  type="button"
                  onClick={() => setIsGlobalFinanceModalOpen(false)}
                  className="h-11 min-h-11 px-4 text-xs font-semibold rounded-xl bg-surface-container-low hover:bg-surface-container text-ink transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 min-h-11 px-5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Catat Finansial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
