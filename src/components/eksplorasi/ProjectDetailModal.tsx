"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  ExternalLink,
  GitBranch,
  Heart,
  User,
  Users,
  Calendar,
  Trash2,
  Loader2,
  Sparkles,
  Share2,
  Tag,
  Code2,
  Briefcase,
  Palette,
  Camera,
  Film,
} from "lucide-react";
import { Role } from "@prisma/client";
import { ProjectCardData } from "./ProjectCard";
import { toggleLikeProject, deleteShowcaseProject } from "@/actions/eksplorasi";

interface ProjectDetailModalProps {
  project: ProjectCardData | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id: string;
    role: Role;
  };
}

const CATEGORY_META: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PROGRAMMING: {
    label: "Programming & Web",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
    icon: Code2,
  },
  TECHNOPRENEUR: {
    label: "Technopreneurship",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    icon: Briefcase,
  },
  DESAIN: {
    label: "Desain Grafis & UI/UX",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/30",
    icon: Palette,
  },
  FOTOGRAFI: {
    label: "Fotografi",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    icon: Camera,
  },
  SINEMATOGRAFI: {
    label: "Sinematografi",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
    icon: Film,
  },
  LAINNYA: {
    label: "Karya Kreatif Lainnya",
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    border: "border-slate-500/30",
    icon: Sparkles,
  },
  WEB: {
    label: "Programming & Web",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
    icon: Code2,
  },
  UI_UX: {
    label: "Desain Grafis & UI/UX",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/30",
    icon: Palette,
  },
  IOT: {
    label: "Technopreneurship",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    icon: Briefcase,
  },
  GAME: {
    label: "Karya Kreatif Lainnya",
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    border: "border-slate-500/30",
    icon: Sparkles,
  },
  OTHER: {
    label: "Karya Kreatif Lainnya",
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    border: "border-slate-500/30",
    icon: Sparkles,
  },
};

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export function ProjectDetailModal({
  project,
  isOpen,
  onClose,
  currentUser,
}: ProjectDetailModalProps) {
  const [isLiked, setIsLiked] = useState(Boolean(project?.isLiked));
  const [likesCount, setLikesCount] = useState(project?.likesCount ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  // Sync state when project opens
  React.useEffect(() => {
    if (project) {
      setIsLiked(Boolean(project.isLiked));
      setLikesCount(project.likesCount);
      setIsConfirmingDelete(false);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const categoryMeta =
    CATEGORY_META[project.category] || CATEGORY_META.LAINNYA;
  const CategoryIcon = categoryMeta.icon;

  const isAuthor = currentUser?.id === project.author.id;
  const isPrivileged =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.OPERATOR;
  const canDelete = isAuthor || isPrivileged;

  const formattedDate = new Date(project.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikesCount((prev) => (nextIsLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await toggleLikeProject(project.id);
      if (res.success && res.data) {
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.likesCount);
      }
    } catch {
      setIsLiked(!nextIsLiked);
      setLikesCount((prev) => (!nextIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await deleteShowcaseProject(project.id);
      if (!res.success) {
        alert(res.message);
      } else {
        onClose();
      }
      setIsConfirmingDelete(false);
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasContributors =
    Array.isArray(project.contributors) && project.contributors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090D16] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
            >
              <CategoryIcon className="h-3 w-3" />
              <span>{categoryMeta.label}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {formattedDate}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Judul Karya */}
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              {project.title}
            </h2>
          </div>

          {/* Pratinjau Gambar / Banner Besar */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md">
            {project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-[#0c1322] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="ml-1.5 text-[9px] font-mono text-slate-400">
                      saba-exploit.app/showcase/{project.id.slice(-6)}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase font-mono">
                    Showcase Karya
                  </span>
                </div>

                <div className="my-auto text-center flex flex-col items-center justify-center">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center mb-1.5 shadow-lg">
                    <CategoryIcon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-white font-mono px-4 line-clamp-1">
                    {project.title}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
                  <span>SABA EXPLOIT VERIFIED REPO</span>
                  <span className="text-emerald-400">AUTONOMOUS PROJECT</span>
                </div>
              </div>
            )}
          </div>

          {/* Tautan Eksternal Utama */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 h-11 min-h-[44px] px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>🌐 Buka Live Demo / Video / Hasil Karya</span>
              </a>
            )}

            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-11 min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all text-xs font-semibold cursor-pointer"
              >
                <GitBranch className="h-4 w-4 text-slate-300" />
                <span>💻 Lihat Source Code / Repo</span>
              </a>
            )}
          </div>

          {/* Deskripsi Lengkap Karya */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Deskripsi &amp; Rincian Karya
            </h3>
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans shadow-inner">
              {project.description}
            </div>
          </div>

          {/* Tim Pengembang & Kreator */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Tim Pengembang &amp; Kreator
            </h3>

            {/* Author Utama */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full ring-2 ring-primary/40 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
                  {project.author.image ? (
                    <img
                      src={project.author.image}
                      alt={project.author.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white font-mono">
                      {project.author.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs sm:text-sm truncate">
                      {project.author.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/20 border border-primary/40 text-primary">
                      Ketua Tim / Submitter
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatGrade(project.author.classGrade)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0">
                +50 XP
              </span>
            </div>

            {/* Seluruh Kontributor Tim */}
            {hasContributors && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                    <span>Anggota &amp; Kontributor Tim ({project.contributors?.length})</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">
                    +50 XP per orang
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {project.contributors?.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800"
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0 font-mono">
                        {c.image ? (
                          <img
                            src={c.image}
                            alt={c.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          c.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-200 block truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatGrade(c.classGrade)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between gap-2 flex-wrap">
          {/* Sisi Kiri: Tombol Like & Share & Delete */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLike}
              disabled={isLiking}
              className={`h-11 min-h-[44px] px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-90 border ${
                isLiked
                  ? "bg-rose-950/60 text-rose-400 border-rose-800/80"
                  : "bg-slate-800 text-slate-300 hover:text-rose-400 border-slate-700"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
              />
              <span className="font-mono tabular-nums">{likesCount} Suka</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="h-11 min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? "Disalin!" : "Bagikan"}</span>
            </button>

            {/* Tombol Takedown Hapus */}
            {canDelete && (
              <>
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1 bg-black/90 p-1 rounded-xl border border-red-500/40">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span>Hapus Karya</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isDeleting}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] hover:text-white cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="h-11 min-h-[44px] px-3 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/40 text-red-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Hapus Karya dari Showcase"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Sisi Kanan: Tombol Tutup */}
          <button
            type="button"
            onClick={onClose}
            className="h-11 min-h-[44px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
