"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Wallet,
  Zap,
  Calendar,
  RefreshCcw,
  UserCheck,
  Database,
  Cloud,
  Bot,
  ExternalLink,
  Info,
} from "lucide-react";
import { Role } from "@prisma/client";

interface PanduanOrganisasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: Role | string;
}

interface AccordionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  categoryBadge?: string;
  content: React.ReactNode;
}

export function PanduanOrganisasiModal({
  isOpen,
  onClose,
  userRole,
}: PanduanOrganisasiModalProps) {
  const [activeTab, setActiveTab] = useState<"umum" | "operator">("umum");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    umum_1: true, // Buka item pertama secara default
  });

  if (!isOpen) return null;

  const toggleAccordion = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isOperator = userRole === Role.OPERATOR || userRole === "OPERATOR";

  const umumItems: AccordionItem[] = [
    {
      id: "umum_1",
      title: "📱 Presensi Kehadiran & Rapat Pleno",
      icon: <Smartphone className="w-4 h-4 text-emerald-500" />,
      content: (
        <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
          <p>
            Setiap ada kegiatan atau Rapat Pleno, Anda wajib melakukan presensi kehadiran digital untuk mencatat keaktifan dan mendapatkan poin XP (+10 XP).
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-edge/60 space-y-1.5 font-sans">
            <p className="font-semibold text-ink">Langkah Presensi:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Buka halaman <span className="font-mono text-primary font-semibold">Beranda / Dashboard</span> saat sesi rapat dimulai.</li>
              <li>Gunakan fitur <span className="font-mono text-primary font-semibold">Scan QR Code</span> atau masukkan Token Presensi dinamis yang dibagikan Operator.</li>
              <li>Status kehadiran otomatis tercatat sebagai <span className="font-semibold text-emerald-600 dark:text-emerald-400">HADIR</span> dan XP bertambah.</li>
            </ol>
          </div>
          <p className="text-[11px] italic">
            💡 Solusi Darurat: Jika kamera HP bermasalah atau gagal scan, segera hubungi Seksi Kesekretariatan atau Operator untuk presensi manual.
          </p>
        </div>
      ),
    },
    {
      id: "umum_2",
      title: "💰 Iuran Kas Organisasi & Tagihan Periode",
      icon: <Wallet className="w-4 h-4 text-amber-500" />,
      content: (
        <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
          <p>
            Iuran kas mingguan/periodik digunakan untuk mendukung operasional kegiatan, konsumsi acara, dan pemeliharaan infrastruktur organisasi.
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-edge/60 space-y-1.5">
            <p className="font-semibold text-ink">Mekanisme & Transparansi:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Setiap periode kas memiliki nominal standar (misal Rp5.000 per periode).</li>
              <li>Pembayaran disetorkan secara tunai langsung kepada Bendahara umum atau melalui konfirmasi pencatatan sistem.</li>
              <li>Cek status pembayaran Anda di menu <span className="font-mono text-primary font-semibold">Kas</span> untuk memastikan status Lunas atau Tunggakan tercatat akurat.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "umum_3",
      title: "⚡ Sistem Poin XP & Panggung Podium",
      icon: <Zap className="w-4 h-4 text-purple-500" />,
      content: (
        <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
          <p>
            Keaktifan anggota dihargai melalui sistem poin XP (Monthly Points & Total Annual Points) yang mereset setiap awal pergantian tahun kepengurusan.
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-edge/60 space-y-1.5">
            <p className="font-semibold text-ink">Cara Mendapatkan Poin:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Hadir tepat waktu dalam Rapat Pleno & Kegiatan Organisasi (+10 XP).</li>
              <li>Menyelesaikan penugasan divisi atau seksi acara dengan verifikasi PJ.</li>
              <li>Mengunggah karya, proyek kolaborasi, atau artikel Wiki ke Hub Eksplorasi.</li>
            </ul>
          </div>
          <p className="text-[11px]">
            🏆 Anggota dengan akumulasi XP tertinggi di akhir periode akan diabadikan di <span className="font-semibold text-ink">Hall of Fame</span> kepengurusan.
          </p>
        </div>
      ),
    },
    {
      id: "umum_4",
      title: "📅 Kalender Agenda & Notulensi Rapat",
      icon: <Calendar className="w-4 h-4 text-blue-500" />,
      content: (
        <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
          <p>
            Semua agenda kegiatan besar, batas waktu tugas, dan jadwal rapat pleno tercatat rapi di Kalender Organisasi.
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-edge/60 space-y-1.5">
            <p className="font-semibold text-ink">Notulensi Terintegrasi:</p>
            <p>
              Setiap selesai rapat, notulis atau pengurus akan mengunggah ringkasan keputusan rapat. Anggota wajib membaca dan memberikan log pembacaan notulensi sebagai bukti partisipasi informasi.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const operatorItems: AccordionItem[] = [
    {
      id: "op_1",
      title: "🔄 Prosedur Tutup Buku & Rollover Tahunan",
      icon: <RefreshCcw className="w-4 h-4 text-rose-500" />,
      categoryBadge: "Kritis",
      content: (
        <div className="space-y-2.5 text-xs text-ink-muted leading-relaxed">
          <p className="text-rose-600 dark:text-rose-400 font-medium">
            ⚠️ Aksi ini hanya dijalankan sekali setahun saat estafet kepengurusan baru dilantik.
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <p className="font-semibold text-ink">Langkah Eksekusi Rollover:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1 font-mono text-[11px]">
              <li>Buka <span className="font-bold">Pengaturan &rarr; Manajemen Sistem Operator</span>.</li>
              <li>Klik tombol <span className="font-bold text-rose-500">Ganti Periode Kepengurusan</span>.</li>
              <li>Baca peringatan konsekuensi secara teliti.</li>
              <li>Ketik frasa konfirmasi persis: <span className="text-amber-500 font-bold">TUTUP BUKU PERIODE</span>.</li>
              <li>Klik eksekusi untuk menjalankan transaksi atomik database.</li>
            </ol>
          </div>
          <p className="text-[11px]">
            Sistem secara otomatis akan: Menyimpan snapshot Top 3 Hall of Fame, menutup buku kas lama, membuka periode baru dengan saldo awal meneruskan sisa kas, menaikkan tingkat kelas seluruh anggota aktif (X&rarr;XI, XI&rarr;XII, XII&rarr;Alumni/Demisioner), dan mereset poin XP ke 0.
          </p>
        </div>
      ),
    },
    {
      id: "op_2",
      title: "🛡️ Verifikasi & Manajemen Pengguna Baru",
      icon: <UserCheck className="w-4 h-4 text-emerald-500" />,
      content: (
        <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
          <p>
            Setiap pendaftar baru yang masuk melalui halaman autentikasi awal berstatus sebagai <span className="font-mono font-semibold text-amber-500">GUEST</span>.
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-edge/60 space-y-1.5">
            <p className="font-semibold text-ink">Cara Promosi Hak Akses:</p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Buka menu manajemen pengguna khusus Operator.</li>
              <li>Periksa daftar akun GUEST yang mendaftar dengan email sekolah/pribadi valid.</li>
              <li>Ubah peran (role) dari <span className="font-mono text-xs">GUEST</span> menjadi <span className="font-mono text-xs font-bold text-primary">MEMBER</span> atau <span className="font-mono text-xs font-bold text-purple-500">BENDAHARA</span> sesuai SK kepengurusan.</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "op_3",
      title: "💾 Backup Data & Lampiran LPJ Resmi",
      icon: <Database className="w-4 h-4 text-blue-500" />,
      content: (
        <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
          <p>
            Operator bertanggung jawab menyediakan rekapitulasi data keuangan kas dan presensi untuk laporan pertanggungjawaban (LPJ) akhir tahun.
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-edge/60 space-y-1.5">
            <p className="font-semibold text-ink">Langkah Unduh Backup:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Gunakan fitur <span className="font-semibold text-ink">Backup & Ekspor Data</span> di panel pengaturan administratif.</li>
              <li>Unduh rekapitulasi transaksi kas format CSV/Excel serta rekap kehadiran rapat pleno.</li>
              <li>Lampirkan file fisik dan digital bertanda tangan ketua dan bendahara ke Pembina Ekstrakurikuler / Kesiswaan.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "op_4",
      title: "☁️ Brankas Akun Cloud & Infrastruktur Organisasi",
      icon: <Cloud className="w-4 h-4 text-indigo-500" />,
      content: (
        <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
          <p>
            Estafet kepengurusan bukan hanya pergantian pengurus fisik, tetapi juga pengalihan kendali aset digital organisasi secara aman.
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-edge/60 space-y-2">
            <p className="font-semibold text-ink">Aset Digital Wajib Serah Terima:</p>
            <ul className="list-disc list-inside space-y-1 pl-1 font-mono text-[11px]">
              <li><span className="font-bold text-ink">Email Organisasi Utama</span> (Google Workspace / Gmail Resmi)</li>
              <li><span className="font-bold text-ink">GitHub Organization / Repository</span> (Saba ExploIT Source Code)</li>
              <li><span className="font-bold text-ink">Vercel Deployment Dashboard</span> (Hosting & Environment Variables)</li>
              <li><span className="font-bold text-ink">Neon PostgreSQL Database</span> (Primary Production DB)</li>
            </ul>
            <p className="text-[11px] italic text-amber-600 dark:text-amber-400 font-sans mt-1">
              🔒 Selalu ubah kredensial sandi master dan simpan di password manager organisasi sebelum menyerahkan kepada Ketua / Operator terpilih berikutnya.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "op_5",
      title: "🤖 Panduan Perawatan AI & Kontak Darurat",
      icon: <Bot className="w-4 h-4 text-pink-500" />,
      content: (
        <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
          <p>
            Aplikasi Saba ExploIT dikembangkan dengan arsitektur modern Next.js dan dirawat menggunakan bantuan AI Agent (seperti Claude Code).
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-edge/60 space-y-2 font-mono text-[11px]">
            <p className="font-semibold text-ink font-sans">Mantra Wajib Maintenance:</p>
            <div className="p-2 rounded bg-card border border-edge text-primary">
              1. npx prisma db push<br />
              2. npx tsc --noEmit
            </div>
            <p className="text-danger font-bold font-sans">
              ❌ DILARANG KERAS menjalankan `npm run build` langsung di server produksi tanpa verifikasi dev build lokal.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] space-y-1">
            <p className="font-semibold text-ink">Slot Kontak Darurat Perintis:</p>
            <p className="text-ink-muted">
              Jika mengalami kendala sistem tingkat lanjut (database crash, token expired, migrasi server), hubungi Tim Developer Alumni / Pembina IT Ekstrakurikuler melalui kanal resmi organisasi.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentItems = activeTab === "umum" ? umumItems : operatorItems;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-card border border-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col text-ink max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge bg-surface-container-low/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-500 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-ink">
                Perpustakaan & Panduan Organisasi
              </h2>
              <p className="text-[11px] text-ink-muted">
                Saba ExploIT Knowledge Base & Standard Operating Procedure
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-muted hover:bg-surface-container hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role-Based Tabs */}
        <div className="flex items-center px-6 pt-3 pb-2 gap-2 border-b border-edge bg-surface-container-low/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("umum")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "umum"
                ? "bg-primary text-white shadow-xs"
                : "bg-surface text-ink-muted hover:text-ink border border-edge"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan Umum &amp; Anggota</span>
          </button>

          {isOperator && (
            <button
              type="button"
              onClick={() => setActiveTab("operator")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "operator"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-surface text-ink-muted hover:text-ink border border-edge"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Buku Saku Operator</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white uppercase font-mono">
                Operator
              </span>
            </button>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto space-y-3 max-h-[65vh] pr-2">
          {activeTab === "operator" && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2.5 mb-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                Panel eksklusif ini hanya dapat diakses oleh akun berhak akses <strong>OPERATOR</strong> untuk kelangsungan estafet organisasi.
              </span>
            </div>
          )}

          {currentItems.map((item) => {
            const isExpanded = !!expandedIds[item.id];
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-edge bg-surface overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container border border-edge flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      {item.categoryBadge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono uppercase bg-rose-500/10 border border-rose-500/30 text-rose-500">
                          {item.categoryBadge}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-ink-muted group-hover:text-ink transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-surface-container-low/40 border-t border-edge/60 animate-in fade-in">
                    {item.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-edge bg-surface-container-low/60 shrink-0 text-[11px] text-ink-muted">
          <span>Saba ExploIT Knowledge Base v1.3.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-container border border-edge text-ink font-semibold transition-all cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
