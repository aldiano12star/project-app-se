"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Sparkles,
  ExternalLink,
  FolderArchive,
  Layers,
  Crown,
  Medal,
  Pencil,
  X,
  Loader2,
  Users,
} from "lucide-react";
import { ImagePickerField } from "@/components/ui/ImagePickerField";
import { updateHallOfFameGroupPhoto } from "@/actions/hallOfFame";

export interface HallOfFameEntryData {
  id: string;
  periodName: string;
  generationYear: number;
  totalMeetings: number;
  totalCashFlow: number;
  closingCashBalance: number;
  archivedAt: Date | string;

  // Foto Bersama Pengurus / Angkatan
  groupPhotoUrl?: string | null;

  // Champions
  rank1Name: string;
  rank1Division: string | null;
  rank1Points: number;
  rank1Avatar: string | null;
  rank1WorkCount: number;

  rank2Name: string;
  rank2Division: string | null;
  rank2Points: number;
  rank2Avatar: string | null;
  rank2WorkCount: number;

  rank3Name: string;
  rank3Division: string | null;
  rank3Points: number;
  rank3Avatar: string | null;
  rank3WorkCount: number;

  // Events
  event1Title: string | null;
  event1Description: string | null;
  event1Date: string | null;
  event1DriveUrl: string | null;

  event2Title: string | null;
  event2Description: string | null;
  event2Date: string | null;
  event2DriveUrl: string | null;

  event3Title: string | null;
  event3Description: string | null;
  event3Date: string | null;
  event3DriveUrl: string | null;

  // Works
  work1Title: string | null;
  work1Author: string | null;
  work1Division: string | null;
  work1Url: string | null;
  work1Thumbnail: string | null;

  work2Title: string | null;
  work2Author: string | null;
  work2Division: string | null;
  work2Url: string | null;
  work2Thumbnail: string | null;

  work3Title: string | null;
  work3Author: string | null;
  work3Division: string | null;
  work3Url: string | null;
  work3Thumbnail: string | null;
}

interface FilmstripFrameProps {
  entry: HallOfFameEntryData;
  index: number;
  isOperator?: boolean;
}

export function FilmstripFrame({ entry, index, isOperator }: FilmstripFrameProps) {
  const [currentGroupPhoto, setCurrentGroupPhoto] = useState(entry.groupPhotoUrl || null);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState(entry.groupPhotoUrl || "");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSavePhoto = async () => {
    setIsSavingPhoto(true);
    setSaveMessage(null);
    try {
      const res = await updateHallOfFameGroupPhoto(entry.id, newPhotoUrl);
      if (res.success) {
        setCurrentGroupPhoto(newPhotoUrl.trim() || null);
        setIsEditingPhoto(false);
      } else {
        setSaveMessage(res.message);
      }
    } catch (err: any) {
      setSaveMessage(err.message || "Gagal menyimpan foto.");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const events = [
    { title: entry.event1Title, desc: entry.event1Description, date: entry.event1Date, url: entry.event1DriveUrl },
    { title: entry.event2Title, desc: entry.event2Description, date: entry.event2Date, url: entry.event2DriveUrl },
    { title: entry.event3Title, desc: entry.event3Description, date: entry.event3Date, url: entry.event3DriveUrl },
  ].filter((e) => Boolean(e.title));

  const works = [
    { title: entry.work1Title, author: entry.work1Author, div: entry.work1Division, url: entry.work1Url, thumb: entry.work1Thumbnail },
    { title: entry.work2Title, author: entry.work2Author, div: entry.work2Division, url: entry.work2Url, thumb: entry.work2Thumbnail },
    { title: entry.work3Title, author: entry.work3Author, div: entry.work3Division, url: entry.work3Url, thumb: entry.work3Thumbnail },
  ].filter((w) => Boolean(w.title));

  const champions = [
    {
      rank: 1,
      name: entry.rank1Name,
      division: entry.rank1Division,
      points: entry.rank1Points,
      avatar: entry.rank1Avatar,
      works: entry.rank1WorkCount,
      borderGlow: "border-amber-500/50 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.12)]",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      icon: <Crown className="w-4 h-4 text-amber-400" />,
      label: "Juara 1",
    },
    {
      rank: 2,
      name: entry.rank2Name,
      division: entry.rank2Division,
      points: entry.rank2Points,
      avatar: entry.rank2Avatar,
      works: entry.rank2WorkCount,
      borderGlow: "border-slate-400/40 hover:border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.08)]",
      badgeColor: "bg-slate-400/20 text-slate-300 border-slate-400/40",
      icon: <Medal className="w-4 h-4 text-slate-300" />,
      label: "Juara 2",
    },
    {
      rank: 3,
      name: entry.rank3Name,
      division: entry.rank3Division,
      points: entry.rank3Points,
      avatar: entry.rank3Avatar,
      works: entry.rank3WorkCount,
      borderGlow: "border-amber-700/40 hover:border-amber-600 shadow-[0_0_20px_rgba(180,83,9,0.08)]",
      badgeColor: "bg-amber-700/20 text-amber-500 border-amber-700/40",
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
      label: "Juara 3",
    },
  ];

  const cleanPeriodName = entry.periodName.replace(/\s*\(Gen\s*\d+\)/i, "").trim();

  return (
    <div
      className="relative rounded-3xl bg-[#18181B] border border-[#27272A] overflow-hidden shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* ── TOP FILMSTRIP SPROCKETS (LUBANG PITA FILM) ── */}
      <div className="bg-[#121214] px-4 py-2 border-b border-[#27272A] flex items-center justify-between overflow-x-hidden select-none">
        <div className="flex items-center gap-3 w-full justify-around opacity-40">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-2 rounded-[3px] bg-[#27272A] border border-[#3F3F46] shrink-0"
            />
          ))}
        </div>
      </div>

      {/* ── 35MM FILMSTRIP BODY WITH LATERAL PERFORATIONS ── */}
      <div className="flex">
        {/* Left Sprocket Column */}
        <div className="hidden sm:flex flex-col justify-around py-6 px-1.5 bg-[#121214] border-r border-[#27272A] select-none opacity-40 shrink-0">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-3.5 rounded-[2px] bg-[#27272A] border border-[#3F3F46] my-1"
            />
          ))}
        </div>

        {/* ── FRAME CONTENT ── */}
        <div className="p-5 sm:p-7 space-y-6 flex-1 min-w-0">
          {/* Frame Title & Period Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-5">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 shrink-0">
                  FRAME #{String(entry.generationYear).padStart(2, "0")}
                </span>
                <span className="text-xs text-[#71717A] font-mono truncate">
                  Arsip: {new Date(entry.archivedAt).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#F4F4F5] tracking-tight truncate">
                {cleanPeriodName}
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center bg-[#121214] p-1.5 rounded-2xl border border-[#27272A] text-xs font-mono shrink-0">
              <div className="px-3 py-1 text-center">
                <span className="text-[10px] text-[#71717A] block font-sans">Rapat</span>
                <strong className="text-[#F4F4F5]">{entry.totalMeetings} Sesi</strong>
              </div>
              <div className="w-[1px] h-6 bg-[#27272A]" />
              <div className="px-3 py-1 text-center">
                <span className="text-[10px] text-[#71717A] block font-sans">Kas Akhir</span>
                <strong className="text-emerald-400">
                  Rp {entry.closingCashBalance.toLocaleString("id-ID")}
                </strong>
              </div>
            </div>
          </div>

          {/* ── 0. HERO BANNER: FOTO KENANGAN PENGURUS ── */}
          {currentGroupPhoto ? (
            <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] rounded-2xl overflow-hidden border border-[#27272A] bg-[#121214] shadow-xl group">
              <Image
                src={currentGroupPhoto}
                alt={`Foto Kenangan Pengurus ${cleanPeriodName}`}
                fill
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-cover transition-transform duration-500 group-hover:scale-102"
                unoptimized={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 right-4 sm:right-6 flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    FOTO KENANGAN PENGURUS
                  </span>
                  <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight mt-1 truncate">
                    {cleanPeriodName}
                  </h4>
                </div>

                {isOperator && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewPhotoUrl(currentGroupPhoto || "");
                      setIsEditingPhoto(true);
                    }}
                    className="h-8 px-3 rounded-full bg-black/70 hover:bg-black/90 text-slate-200 hover:text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-md active:scale-95 shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ganti Foto</span>
                  </button>
                )}
              </div>
            </div>
          ) : isOperator ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setNewPhotoUrl("");
                setIsEditingPhoto(true);
              }}
              className="border-2 border-dashed border-[#27272A] hover:border-amber-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#121214]/60 hover:bg-[#121214] flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F4F4F5]">
                  Tambahkan Foto Kenangan Pengurus
                </p>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Sentuh di sini untuk mengunggah foto dokumentasi kepengurusan periode ini
                </p>
              </div>
            </div>
          ) : null}

          {/* ── 1. THE CHAMPIONS (TOP 3 ANGGOTA) ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#A1A1AA]">
                Panggung Kehormatan (Top 3 Champions)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {champions.map((champ) => (
                <div
                  key={champ.rank}
                  className={`group relative p-3.5 sm:p-4 rounded-2xl bg-[#121214] border ${champ.borderGlow} transition-all duration-300 ease-out flex flex-col justify-between space-y-3 overflow-hidden min-w-0 w-full`}
                >
                  {/* Ambient glow highlight on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-[#202024] border border-[#2C2C30] overflow-hidden shrink-0 flex items-center justify-center font-bold text-base text-[#F4F4F5] shadow-xs">
                        {champ.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={champ.avatar}
                            alt={champ.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{champ.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs sm:text-sm font-bold text-[#F4F4F5] truncate group-hover:text-primary transition-colors">
                          {champ.name}
                        </h5>
                        <span className="text-[10px] text-[#A1A1AA] block truncate">
                          {champ.division || "Anggota"}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${champ.badgeColor}`}>
                      {champ.icon}
                      <span>{champ.label}</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-xs font-mono text-[#A1A1AA]">
                    <span className="flex items-center gap-1">
                      <strong className="text-primary font-bold">{champ.points.toLocaleString()}</strong> XP
                    </span>
                    <span className="text-[10px] font-sans text-[#71717A] truncate">
                      {champ.works} Karya Terarsip
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. SEKSI TIM: ACARA TERBAIK & KARYA UNGGULAN ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* Top Events */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#A1A1AA]">
                  3 Acara &amp; Proker Berkesan
                </h4>
              </div>

              <div className="space-y-2.5">
                {events.map((evt, i) => (
                  <Link
                    key={i}
                    href={evt.url || "/acara"}
                    className="p-3.5 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-primary/50 transition-all flex items-start justify-between gap-3 group cursor-pointer block"
                  >
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded-md shrink-0">
                          #{i + 1}
                        </span>
                        <h5 className="text-xs sm:text-sm font-bold text-[#F4F4F5] truncate group-hover:text-primary transition-colors">
                          {evt.title}
                        </h5>
                      </div>
                      {evt.desc && (
                        <p className="text-[11px] text-[#A1A1AA] line-clamp-1 leading-relaxed">
                          {evt.desc}
                        </p>
                      )}
                      {evt.date && (
                        <span className="text-[10px] text-[#71717A] font-mono block">
                          📅 {evt.date}
                        </span>
                      )}
                    </div>

                    <div className="p-2 rounded-xl bg-[#202024] group-hover:bg-primary group-hover:text-white text-[#71717A] border border-[#2C2C30] transition-all shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Works */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#A1A1AA]">
                  3 Karya &amp; Showcase Mahakarya
                </h4>
              </div>

              <div className="space-y-2.5">
                {works.map((wk, i) => (
                  <Link
                    key={i}
                    href={wk.url || `/eksplorasi?q=${encodeURIComponent(wk.title || "")}`}
                    className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] hover:border-purple-500/50 transition-all flex items-center gap-3 group cursor-pointer block"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#202024] border border-[#2C2C30] overflow-hidden shrink-0 flex items-center justify-center">
                      {wk.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={wk.thumb}
                          alt={wk.title || "Karya"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base">🎨</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h5 className="text-xs sm:text-sm font-bold text-[#F4F4F5] truncate group-hover:text-purple-400 transition-colors">
                        {wk.title}
                      </h5>
                      <p className="text-[11px] text-[#A1A1AA] truncate">
                        Karya: <strong>{wk.author}</strong> {wk.div ? `• ${wk.div}` : ""}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-[#202024] group-hover:bg-purple-600 group-hover:text-white text-[#71717A] border border-[#2C2C30] transition-all shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sprocket Column */}
        <div className="hidden sm:flex flex-col justify-around py-6 px-1.5 bg-[#121214] border-l border-[#27272A] select-none opacity-40 shrink-0">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-3.5 rounded-[2px] bg-[#27272A] border border-[#3F3F46] my-1"
            />
          ))}
        </div>
      </div>

      {/* ── BOTTOM FILMSTRIP SPROCKETS (LUBANG PITA FILM) ── */}
      <div className="bg-[#121214] px-4 py-2 border-t border-[#27272A] flex items-center justify-between overflow-x-hidden select-none">
        <div className="flex items-center gap-3 w-full justify-around opacity-40">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-2 rounded-[3px] bg-[#27272A] border border-[#3F3F46] shrink-0"
            />
          ))}
        </div>
      </div>

      {/* ── MODAL UBAH FOTO BERSAMA PENGURUS ── */}
      {isEditingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => {
            if (!isSavingPhoto) setIsEditingPhoto(false);
          }}
        >
          <div
            className="w-full max-w-lg bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-[#F4F4F5]">
                  Foto Kenangan Bersama Pengurus ({entry.periodName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPhoto(false)}
                disabled={isSavingPhoto}
                className="text-[#71717A] hover:text-[#F4F4F5] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <ImagePickerField
                value={newPhotoUrl}
                onChange={(url) => setNewPhotoUrl(url)}
                label="Pilih / Tempel Foto Angkatan"
                aspectRatio="banner"
                helperText="Mendukung unggah foto dari perangkat atau tautan Google Drive."
              />

              {saveMessage && (
                <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {saveMessage}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272A]">
              <button
                type="button"
                onClick={() => setIsEditingPhoto(false)}
                disabled={isSavingPhoto}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={isSavingPhoto}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Foto...</span>
                  </>
                ) : (
                  <span>Simpan Foto</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
