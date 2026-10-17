"use client";

import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Printer,
  Loader2,
  DollarSign,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Role } from "@prisma/client";
import { addBudgetItem, deleteBudgetItem } from "@/actions/acara";
import { BudgetItemData } from "./PrintRABModal";

const PrintRABModal = dynamic(
  () => import("./PrintRABModal").then((mod) => mod.PrintRABModal),
  { ssr: false }
);

interface EventRABSectionProps {
  eventId: string;
  event: {
    id: string;
    title: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
  };
  budgetItems: BudgetItemData[];
  currentUserRole: Role;
}

export function EventRABSection({
  eventId,
  event,
  budgetItems,
  currentUserRole,
}: EventRABSectionProps) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const isOfficer =
    currentUserRole === Role.ADMIN || currentUserRole === Role.OPERATOR;

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const qtyNum = parseInt(quantity, 10);
    const priceNum = parseFloat(estimatedPrice);

    if (!name.trim()) {
      setErrorMessage("Nama barang wajib diisi.");
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMessage("Jumlah quantity harus bernilai positif.");
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage("Harga estimasi tidak valid.");
      return;
    }

    startTransition(async () => {
      const res = await addBudgetItem(eventId, {
        name: name.trim(),
        quantity: qtyNum,
        unit,
        estimatedPrice: priceNum,
      });

      if (res.success) {
        setName("");
        setQuantity("1");
        setEstimatedPrice("");
        setShowAddForm(false);
      } else {
        setErrorMessage(res.message);
      }
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Hapus item RAB ini?")) return;
    const res = await deleteBudgetItem(eventId, itemId);
    if (!res.success) {
      alert(res.message);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section className="card-solid p-6 shadow-sm flex flex-col gap-5">
      {/* Header RAB */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <span>Rencana Anggaran Biaya (RAB)</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </h2>
            <p className="text-xs text-ink-muted">
              Estimasi kebutuhan finansial &amp; perlengkapan acara
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {budgetItems.length > 0 && (
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="h-11 min-h-[44px] px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-edge text-ink text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>Cetak / Ekspor RAB</span>
            </button>
          )}

          {isOfficer && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="h-11 min-h-[44px] px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item RAB</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Total Anggaran */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-edge">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold font-mono">
            Rp
          </div>
          <div>
            <span className="text-xs text-ink-muted block font-medium">Total Anggaran Ditetapkan</span>
            <span className="text-lg sm:text-xl font-black text-ink font-mono">
              {formatRupiah(totalBudget)}
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
          {budgetItems.length} Item Kebutuhan
        </span>
      </div>

      {/* Form Tambah Item RAB (Khusus Officer) */}
      {showAddForm && isOfficer && (
        <form
          onSubmit={handleAddItem}
          className="p-5 rounded-2xl bg-surface-container-low/80 border border-edge space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Tambah Kebutuhan Logistik / Konsumsi Baru
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-ink-muted hover:text-ink cursor-pointer"
            >
              Batal
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Nama Barang */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-ink">Nama Kebutuhan / Barang</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Konsumsi Pemateri & Plakat"
                className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink">Jumlah (Qty)</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
              />
            </div>

            {/* Unit / Satuan */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink">Satuan (Unit)</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-mono"
              >
                <option value="pcs">pcs</option>
                <option value="paket">paket</option>
                <option value="box">box</option>
                <option value="orang">orang</option>
                <option value="lembar">lembar</option>
                <option value="rim">rim</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-ink">Harga Estimasi Satuan (Rp)</label>
            <input
              type="number"
              min="0"
              required
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              placeholder="Contoh: 50000"
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-edge text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>

          <div className="pt-1 flex justify-end gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="h-11 min-h-[44px] px-6 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Item...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Simpan Item RAB</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tabel Daftar RAB */}
      {budgetItems.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-container-low/50 border border-edge text-center space-y-2">
          <p className="text-sm font-semibold text-ink">Belum ada rincian RAB yang dicatat.</p>
          <p className="text-xs text-ink-muted">
            Pengurus dapat menambahkan item anggaran untuk keperluan proposal atau LPJ acara.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-edge overflow-hidden bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-edge text-[11px] font-mono text-ink-muted uppercase">
                  <th className="px-4 py-3 font-semibold">No</th>
                  <th className="px-4 py-3 font-semibold">Nama Kebutuhan</th>
                  <th className="px-4 py-3 font-semibold text-center">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Harga Satuan</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Harga</th>
                  {isOfficer && <th className="px-4 py-3 font-semibold text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-edge text-xs">
                {budgetItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-ink-muted">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-center text-ink-secondary">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-ink-secondary">
                      {formatRupiah(item.estimatedPrice)}
                    </td>
                    <td className="px-4 py-3 font-mono text-right font-bold text-ink">
                      {formatRupiah(item.totalPrice)}
                    </td>
                    {isOfficer && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Hapus Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cetak & Ekspor RAB */}
      <PrintRABModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        event={event}
        budgetItems={budgetItems}
      />
    </section>
  );
}
