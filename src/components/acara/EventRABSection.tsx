"use client";

import React, { useState, useTransition } from "react";
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
import { PrintRABModal, BudgetItemData } from "./PrintRABModal";

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
      setErrorMessage("Nama barang/kebutuhan wajib diisi.");
      return;
    }

    if (isNaN(qtyNum) || qtyNum < 1) {
      setErrorMessage("Jumlah volume minimal 1.");
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage("Estimasi harga satuan tidak valid.");
      return;
    }

    startTransition(async () => {
      const res = await addBudgetItem(eventId, {
        name: name.trim(),
        quantity: qtyNum,
        unit: unit.trim() || "pcs",
        estimatedPrice: priceNum,
      });

      if (res.success) {
        setName("");
        setQuantity("1");
        setEstimatedPrice("");
        setUnit("pcs");
        setShowAddForm(false);
      } else {
        setErrorMessage(res.message);
      }
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm("Hapus item anggaran ini dari RAB?")) return;

    startTransition(async () => {
      const res = await deleteBudgetItem(itemId, eventId);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  return (
    <section className="card-solid p-4 sm:p-5 rounded-2xl bg-card border border-edge shadow-xs space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-edge">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">
              Rancangan Anggaran Biaya (RAB Acara)
            </h3>
            <p className="text-[11px] text-ink-muted">
              Estimasi belanja &amp; proposal pengajuan dana kesiswaan
            </p>
          </div>
        </div>

        {/* Action Buttons: Tambah Item (Admin) & Cetak Proposal */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOfficer && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-10 min-h-[40px] px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-edge text-ink text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>{showAddForm ? "Tutup Form" : "+ Tambah Item"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-10 min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>📄 Cetak Lembar RAB Proposal</span>
          </button>
        </div>
      </div>

      {/* Form Tambah Item Anggaran Baru (Khusus Pengurus) */}
      {showAddForm && isOfficer && (
        <form
          onSubmit={handleAddItem}
          className="p-4 rounded-xl bg-surface-container-low/60 border border-edge space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-1 border-b border-edge/60">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Input Item Anggaran Baru</span>
            </span>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-danger-subtle text-danger border border-danger/30 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-ink-muted">
                Nama Barang / Uraian Kebutuhan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Konsumsi Snack Pemateri (15 Box)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-edge bg-card text-ink text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-muted">
                Volume / Qty *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-edge bg-card text-ink text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-muted">
                Satuan Unit
              </label>
              <input
                type="text"
                placeholder="pcs, box, paket, orang"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-edge bg-card text-ink text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-ink-muted">
                Estimasi Harga Satuan (Rp) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="Contoh: 15000"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-edge bg-card text-ink text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-10 px-3 rounded-lg border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Simpan Item</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tabel Rincian Anggaran */}
      <div className="overflow-x-auto rounded-xl border border-edge bg-surface-container-low/30">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-edge bg-surface-container-low text-ink-muted font-mono text-[10px] uppercase">
              <th className="p-3 w-8 text-center">No</th>
              <th className="p-3">Uraian Kebutuhan</th>
              <th className="p-3 text-center w-16">Vol</th>
              <th className="p-3 text-center w-16">Satuan</th>
              <th className="p-3 text-right w-28">Harga Satuan</th>
              <th className="p-3 text-right w-32">Subtotal</th>
              {isOfficer && <th className="p-3 text-center w-12">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-edge/60 font-sans">
            {budgetItems.length === 0 ? (
              <tr>
                <td
                  colSpan={isOfficer ? 7 : 6}
                  className="p-6 text-center text-ink-muted italic text-xs"
                >
                  Belum ada rincian item anggaran yang dicatat untuk kegiatan ini.
                </td>
              </tr>
            ) : (
              budgetItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-surface-container-low/60 transition-colors"
                >
                  <td className="p-3 text-center font-mono text-ink-muted">
                    {index + 1}
                  </td>
                  <td className="p-3 font-semibold text-ink">{item.name}</td>
                  <td className="p-3 text-center font-mono text-ink">
                    {item.quantity}
                  </td>
                  <td className="p-3 text-center text-ink-secondary">
                    {item.unit}
                  </td>
                  <td className="p-3 text-right font-mono text-ink-secondary">
                    Rp {item.estimatedPrice.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-ink">
                    Rp {item.totalPrice.toLocaleString("id-ID")}
                  </td>
                  {isOfficer && (
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isPending}
                        className="h-7 w-7 rounded-lg text-ink-muted hover:text-danger hover:bg-danger-subtle inline-flex items-center justify-center transition-colors cursor-pointer"
                        title="Hapus item anggaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ringkasan Total Box */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/20 via-card to-amber-950/20 border border-edge flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-ink-muted font-mono tracking-wider">
            Total Estimasi Anggaran Pengajuan
          </span>
          <p className="text-[11px] text-ink-secondary">
            {budgetItems.length} item kebutuhan operasional
          </p>
        </div>
        <div className="text-right">
          <span className="text-base sm:text-lg font-black text-primary font-mono tracking-tight">
            Rp {totalBudget.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Modal Siap Cetak Dokumen Resmi Kesiswaan */}
      <PrintRABModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        event={event}
        budgetItems={budgetItems}
      />
    </section>
  );
}
