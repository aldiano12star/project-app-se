"use client";

import React from "react";
import { X, Printer, FileSpreadsheet, Download } from "lucide-react";

export interface BudgetItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  totalPrice: number;
}

export interface PrintRABModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    description?: string | null;
    startDate: Date | string;
    endDate: Date | string;
  };
  budgetItems: BudgetItemData[];
}

export function PrintRABModal({
  isOpen,
  onClose,
  event,
  budgetItems,
}: PrintRABModalProps) {
  if (!isOpen) return null;

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  const formattedDate = isSameDay
    ? startDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : `${startDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })} - ${endDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Container Dialog */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-ink print:max-h-none print:overflow-visible print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Toolbar (Disembunyikan saat dicetak) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-edge bg-surface-container-low print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Pratinjau Lembar Cetak RAB Proposal Kesiswaan
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 min-h-[36px] px-3.5 bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Tutup pratinjau"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable A4 Sheet Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-surface-container-low/50 print:p-0 print:bg-white print:overflow-visible">
          {/* Formal Sheet Paper Container */}
          <div
            id="printable-rab-document"
            className="w-full max-w-2xl mx-auto bg-white text-black p-6 sm:p-10 rounded-xl shadow-lg border border-slate-300 print:shadow-none print:border-none print:p-0 print:max-w-none font-serif text-[12px] leading-normal"
          >
            {/* 1. KOP SURAT RESMI ORGANISASI & SEKOLAH */}
            <div className="text-center border-b-4 border-double border-black pb-3 mb-5">
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase font-sans text-slate-800">
                EKSTRAKURIKULER TEKNOLOGI INFORMASI &amp; MULTIMEDIA
              </h3>
              <h1 className="text-base sm:text-xl font-black tracking-widest uppercase font-sans text-black mt-0.5">
                SABA EXPLOIT (SE)
              </h1>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                Sekretariat: Lab Komputer IT &amp; Multimedia • SMA Negeri 1 Bantul
              </p>
              <p className="text-[10px] text-slate-500 font-sans">
                Jl. KH. Wahid Hasyim No. 58 Bantul, D.I. Yogyakarta 55711 • Website: saba-exploit.app
              </p>
            </div>

            {/* 2. JUDUL DOKUMEN & NOMOR */}
            <div className="text-center mb-5 font-sans">
              <h2 className="text-sm sm:text-base font-bold underline uppercase tracking-wide text-black">
                RANCANGAN ANGGARAN BIAYA (RAB) KEGIATAN
              </h2>
              <span className="text-[11px] text-slate-600 font-mono block mt-0.5">
                Nomor: RAB/SE-{event.id.slice(-6).toUpperCase()}/{new Date().getFullYear()}
              </span>
            </div>

            {/* 3. INFORMASI ACARA / KEGIATAN */}
            <div className="mb-4 bg-slate-50 border border-slate-300 p-3 rounded-md font-sans text-[11px] space-y-1">
              <div className="grid grid-cols-3 gap-1">
                <span className="font-bold text-slate-700">Nama Kegiatan</span>
                <span className="col-span-2 font-bold text-black">: {event.title}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-semibold text-slate-700">Waktu Pelaksanaan</span>
                <span className="col-span-2 text-slate-900">: {formattedDate}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-semibold text-slate-700">Tempat / Lokasi</span>
                <span className="col-span-2 text-slate-900">: Lab Komputer / Lingkungan Sekolah</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-semibold text-slate-700">Perihal</span>
                <span className="col-span-2 text-slate-900">: Pengajuan Dana Operasional Kegiatan</span>
              </div>
            </div>

            {/* 4. TABEL KALKULASI RESMI ANGGARAN BIAYA */}
            <div className="mb-6 font-sans">
              <table className="w-full border-collapse border border-black text-[11px]">
                <thead>
                  <tr className="bg-slate-200 text-black border-b border-black">
                    <th className="border border-black p-2 text-center w-8">No</th>
                    <th className="border border-black p-2 text-left">Uraian Kebutuhan</th>
                    <th className="border border-black p-2 text-center w-16">Vol/Qty</th>
                    <th className="border border-black p-2 text-center w-16">Satuan</th>
                    <th className="border border-black p-2 text-right w-24">Harga Satuan</th>
                    <th className="border border-black p-2 text-right w-28">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-black p-4 text-center text-slate-500 italic">
                        Belum ada rincian item anggaran yang dimasukkan.
                      </td>
                    </tr>
                  ) : (
                    budgetItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-slate-400">
                        <td className="border border-black p-1.5 text-center font-mono">{index + 1}</td>
                        <td className="border border-black p-1.5 font-medium">{item.name}</td>
                        <td className="border border-black p-1.5 text-center font-mono">{item.quantity}</td>
                        <td className="border border-black p-1.5 text-center">{item.unit}</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          Rp {item.estimatedPrice.toLocaleString("id-ID")}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-semibold">
                          Rp {item.totalPrice.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Baris Total Pengajuan */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-black text-xs">
                    <td colSpan={5} className="border border-black p-2 text-right uppercase tracking-wider">
                      TOTAL DANA YANG DIAJUKAN:
                    </td>
                    <td className="border border-black p-2 text-right font-mono text-black font-black">
                      Rp {totalBudget.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. 4 BLOK TANDA TANGAN RESMI (2 BARIS x 2 KOLOM) */}
            <div className="mt-8 pt-2 font-sans text-[11px] space-y-8 break-inside-avoid">
              <div className="text-right text-slate-700 text-[11px] mb-2">
                Bantul, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </div>

              {/* Baris Tanda Tangan 1: Pelaksana & Bendahara */}
              <div className="grid grid-cols-2 gap-8 text-center">
                <div className="space-y-16">
                  <p className="font-semibold text-slate-800">Dibuat Oleh,<br />Ketua Pelaksana Kegiatan</p>
                  <div>
                    <p className="font-bold underline text-black uppercase tracking-wide">
                      ( .................................................... )
                    </p>
                    <p className="text-[10px] text-slate-600">NISN. ........................................</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p className="font-semibold text-slate-800">Disusun Oleh,<br />Bendahara Kegiatan</p>
                  <div>
                    <p className="font-bold underline text-black uppercase tracking-wide">
                      ( .................................................... )
                    </p>
                    <p className="text-[10px] text-slate-600">NISN. ........................................</p>
                  </div>
                </div>
              </div>

              {/* Baris Tanda Tangan 2: Mengetahui Kesiswaan & Menyetujui Pembina */}
              <div className="grid grid-cols-2 gap-8 text-center pt-6 border-t border-slate-300">
                <div className="space-y-16">
                  <p className="font-semibold text-slate-800">Mengetahui,<br />Wakasek Urusan Kesiswaan</p>
                  <div>
                    <p className="font-bold underline text-black uppercase tracking-wide">
                      ( .................................................... )
                    </p>
                    <p className="text-[10px] text-slate-600">NIP. ........................................</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p className="font-semibold text-slate-800">Menyetujui,<br />Pembina Ekstrakurikuler IT</p>
                  <div>
                    <p className="font-bold underline text-black uppercase tracking-wide">
                      ( .................................................... )
                    </p>
                    <p className="text-[10px] text-slate-600">NIP. ........................................</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
