"use client";

import React, { useState, useTransition } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  Search,
  Check,
  X,
  CreditCard,
  UserCheck,
  AlertCircle,
  Loader2,
  Users,
  Layers,
  Banknote,
  Send,
} from "lucide-react";
import { Role, Division, TransactionCategory } from "@prisma/client";
import {
  recordDeposit,
  createBulkBills,
  recordGlobalFinance,
} from "@/actions/kas";

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
  currentUserRole: Role;
  allMembers: TreasurerMemberData[];
  realBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export function TreasurerPanel({
  currentUserRole,
  allMembers,
  realBalance,
  totalIncome,
  totalExpense,
}: TreasurerPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<"ALL" | "GEN_20" | "GEN_21">("ALL");

  // State Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isBulkBillModalOpen, setIsBulkBillModalOpen] = useState(false);
  const [isGlobalFinanceModalOpen, setIsGlobalFinanceModalOpen] = useState(false);

  // Form State: Setoran Anggota
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositDesc, setDepositDesc] = useState<string>("");

  // Form State: Tagihan Serentak
  const [billTargetScope, setBillTargetScope] = useState<"ALL" | "GEN_20" | "GEN_21">("ALL");
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

  // Kalkulasi Statistik Finansial
  const totalArrears = allMembers
    .filter((m) => m.kasBalance < 0)
    .reduce((sum, m) => sum + Math.abs(m.kasBalance), 0);

  const totalPositiveBalance = allMembers
    .filter((m) => m.kasBalance > 0)
    .reduce((sum, m) => sum + m.kasBalance, 0);

  const delinquentCount = allMembers.filter((m) => m.kasBalance < 0).length;

  // Filter Anggota untuk Matriks
  const filteredMembers = allMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.classGrade || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mainDivision.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (gradeFilter === "GEN_20") return isGen20(m);
    if (gradeFilter === "GEN_21") return isGen21(m);
    return true;
  });

  // Aksi Cepat Setoran untuk User Tertentu
  const handleQuickDeposit = (user: TreasurerMemberData) => {
    setSelectedUserId(user.id);
    setDepositAmount(user.kasBalance < 0 ? String(Math.abs(user.kasBalance)) : "5000");
    setDepositDesc(`Setoran kas dari ${user.name}`);
    setIsDepositModalOpen(true);
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
        showNotification("success", res.message);
        setIsDepositModalOpen(false);
        setDepositAmount("");
        setDepositDesc("");
      } else {
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
    if (billTargetScope === "GEN_21") targetUsers = allMembers.filter(isGen21);

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
        showNotification("success", res.message);
        setIsBulkBillModalOpen(false);
        setBillTitle("");
      } else {
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
        showNotification("success", res.message);
        setIsGlobalFinanceModalOpen(false);
        setGlobalAmount("");
        setGlobalDesc("");
      } else {
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

      {/* ── 1. GLOBAL DASHBOARD STATS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Uang Kas Riil */}
        <div className="card-solid bg-card p-5 rounded-2xl border border-edge shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Total Uang Kas Riil
            </span>
            <Banknote className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="pt-1">
            <h3 className="text-2xl font-extrabold text-ink">
              Rp {realBalance.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Fisik Kas Organisasi (Income - Expense)
            </p>
          </div>
        </div>

        {/* Card 2: Total Tunggakan Anggota */}
        <div className="card-solid bg-card p-5 rounded-2xl border border-edge shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Total Tunggakan Anggota
            </span>
            <AlertCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="pt-1">
            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              - Rp {totalArrears.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Dari {delinquentCount} anggota bersaldo negatif
            </p>
          </div>
        </div>

        {/* Card 3: Total Saldo Mengendap */}
        <div className="card-solid bg-card p-5 rounded-2xl border border-edge shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Simpanan / Bayar di Muka
            </span>
            <Wallet className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="pt-1">
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              + Rp {totalPositiveBalance.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Saldo titipan anggota siap potong tagihan
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. ACTION BAR BENDAHARA ────────────────────────────────────── */}
      <div className="card-solid bg-card p-5 rounded-2xl border border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">
            Aksi Finansial Bendahara
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Kelola setoran tunai, penarikan tagihan massal, atau operasional bebas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol 1: Catat Setoran */}
          <button
            type="button"
            onClick={() => {
              setSelectedUserId(allMembers[0]?.id || "");
              setDepositAmount("5000");
              setDepositDesc("");
              setIsDepositModalOpen(true);
            }}
            className="h-11 min-h-11 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Catat Setoran</span>
          </button>

          {/* Tombol 2: Tarik Tagihan Serentak */}
          <button
            type="button"
            onClick={() => {
              setBillTitle("");
              setBillAmount("5000");
              setIsBulkBillModalOpen(true);
            }}
            className="h-11 min-h-11 px-4 bg-rose-700 hover:bg-rose-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Tarik Tagihan Serentak</span>
          </button>

          {/* Tombol 3: Catat Finansial Bebas */}
          <button
            type="button"
            onClick={() => {
              setGlobalAmount("");
              setGlobalDesc("");
              setIsGlobalFinanceModalOpen(true);
            }}
            className="h-11 min-h-11 px-3.5 bg-surface-container-low hover:bg-surface-container text-ink border border-edge active:scale-[0.98] text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>Danus / Operasional</span>
          </button>
        </div>
      </div>

      {/* ── 3. MEMBER WALLET MATRIX TABLE ──────────────────────────────── */}
      <div className="card-solid bg-card p-5 sm:p-6 rounded-2xl border border-edge space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-ink">
              Matriks Saldo Kas Anggota
            </h3>
            <p className="text-xs text-ink-muted">
              Monitoring langsung saldo dompet dan tunggakan per anggota aktif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, kelas, divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 min-h-10 pl-9 pr-3 text-xs bg-surface-container-low rounded-xl border border-edge text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-1 focus:ring-primary w-52 sm:w-60"
              />
            </div>

            {/* Filter Grade */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-edge text-xs">
              <button
                type="button"
                onClick={() => setGradeFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  gradeFilter === "ALL"
                    ? "bg-card text-ink shadow-xs border border-edge"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter("GEN_20")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  gradeFilter === "GEN_20"
                    ? "bg-card text-ink shadow-xs border border-edge"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Kelas 11
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter("GEN_21")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  gradeFilter === "GEN_21"
                    ? "bg-card text-ink shadow-xs border border-edge"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Kelas 10
              </button>
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto rounded-xl border border-edge/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-edge/80 text-ink-muted font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Nama Anggota</th>
                <th className="px-4 py-3">Kelas / Gen</th>
                <th className="px-4 py-3">Divisi</th>
                <th className="px-4 py-3 text-right">Saldo Kas</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge/60 bg-card">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-muted">
                    Tidak ditemukan anggota yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const isNeg = m.kasBalance < 0;
                  const absVal = Math.abs(m.kasBalance);

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-ink">
                        {m.name}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {m.classGrade || "-"}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {m.mainDivision}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span
                          className={
                            isNeg
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {isNeg ? "-" : "+"} Rp {absVal.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isNeg
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                          }`}
                        >
                          {isNeg ? "Nunggak" : "Aman"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleQuickDeposit(m)}
                          className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-ink border border-edge text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Catat Setoran untuk ${m.name}`}
                        >
                          <CreditCard className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Setoran</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                      {m.name} ({m.classGrade || "-"}) - Saldo:{" "}
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
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-xl p-5 sm:p-6 space-y-4">
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
                <div className="grid grid-cols-3 gap-2">
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
                </div>
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
