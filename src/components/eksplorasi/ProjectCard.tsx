"use client";

import React, { useState, useTransition } from "react";
import {
  ExternalLink,
  Code2,
  Heart,
  Sparkles,
  User,
  Palette,
  Camera,
  Film,
  Briefcase,
  GitBranch,
  Users,
  Trash2,
  Loader2,
} from "lucide-react";
import { Role } from "@prisma/client";
import {
  toggleLikeProject,
  deleteShowcaseProject,
  ShowcaseCategory,
} from "@/actions/eksplorasi";

export interface ContributorData {
  id: string;
  name: string;
  classGrade?: string | null;
  image?: string | null;
}

export interface ProjectCardData {
  id: string;
  title: string;
  description: string;
  category: ShowcaseCategory | string;
  demoUrl?: string | null;
  githubUrl?: string | null;
  imageUrl?: string | null;
  contributors?: ContributorData[];
  likesCount: number;
  isLiked?: boolean;
  author: {
    id: string;
    name: string;
    classGrade?: string | null;
    image?: string | null;
  };
  createdAt: string;
}

interface ProjectCardProps {
  project: ProjectCardData;
  currentUser?: {
    id: string;
    role: Role;
  };
  onOpenDetail?: (project: ProjectCardData) => void;
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
    text: "text-blue-500 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: Code2,
  },
  TECHNOPRENEUR: {
    label: "Technopreneurship",
    bg: "bg-emerald-500/15",
    text: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: Briefcase,
  },
  DESAIN: {
    label: "Desain Grafis & UI/UX",
    bg: "bg-purple-500/15",
    text: "text-purple-500 dark:text-purple-400",
    border: "border-purple-500/30",
    icon: Palette,
  },
  FOTOGRAFI: {
    label: "Fotografi",
    bg: "bg-amber-500/15",
    text: "text-amber-500 dark:text-amber-400",
    border: "border-amber-500/30",
    icon: Camera,
  },
  SINEMATOGRAFI: {
    label: "Sinematografi",
    bg: "bg-rose-500/15",
    text: "text-rose-500 dark:text-rose-400",
    border: "border-rose-500/30",
    icon: Film,
  },
  LAINNYA: {
    label: "Karya Kreatif Lainnya",
    bg: "bg-slate-500/15",
    text: "text-slate-500 dark:text-slate-400",
    border: "border-slate-500/30",
    icon: Sparkles,
  },
  WEB: {
    label: "Programming & Web",
    bg: "bg-blue-500/15",
    text: "text-blue-500 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: Code2,
  },
  UI_UX: {
    label: "Desain Grafis & UI/UX",
    bg: "bg-purple-500/15",
    text: "text-purple-500 dark:text-purple-400",
    border: "border-purple-500/30",
    icon: Palette,
  },
  IOT: {
    label: "Technopreneurship",
    bg: "bg-emerald-500/15",
    text: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: Briefcase,
  },
  GAME: {
    label: "Karya Kreatif Lainnya",
    bg: "bg-slate-500/15",
    text: "text-slate-500 dark:text-slate-400",
    border: "border-slate-500/30",
    icon: Sparkles,
  },
  OTHER: {
    label: "Karya Kreatif Lainnya",
    bg: "bg-slate-500/15",
    text: "text-slate-500 dark:text-slate-400",
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

export function ProjectCard({
  project,
  currentUser,
  onOpenDetail,
}: ProjectCardProps) {
  const [isLiked, setIsLiked] = useState(Boolean(project.isLiked));
  const [likesCount, setLikesCount] = useState(project.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const categoryMeta =
    CATEGORY_META[project.category] || CATEGORY_META.LAINNYA;
  const CategoryIcon = categoryMeta.icon;

  const isAuthor = currentUser?.id === project.author.id;
  const isPrivileged =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.OPERATOR;
  const canDelete = isAuthor || isPrivileged;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    startDeleteTransition(async () => {
      const res = await deleteShowcaseProject(project.id);
      if (!res.success) {
        alert(res.message);
      }
      setIsConfirmingDelete(false);
    });
  };

  const hasContributors =
    Array.isArray(project.contributors) && project.contributors.length > 0;

  return (
    <div
      onClick={() => onOpenDetail?.(project)}
      className="bg-card border border-edge rounded-2xl overflow-hidden shadow-sm hover:border-primary/60 transition-all space-y-3 relative cursor-pointer group active:scale-[0.99]"
    >
      {/* 16:9 Thumbnail Header */}
      <div className="relative w-full aspect-video bg-surface-container-low overflow-hidden border-b border-edge flex items-center justify-center">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-[#0c1322] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                <span className="ml-1.5 text-[9px] font-mono text-ink-muted">
                  saba-exploit.app/showcase
                </span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider font-mono">
                Karya Terverifikasi
              </span>
            </div>

            <div className="my-auto text-center flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center mb-1">
                <CategoryIcon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-ink tracking-wide font-mono line-clamp-1 px-4">
                {project.title}
              </span>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-ink-muted">
              <span>SABA EXPLOIT SHOWCASE</span>
              <span className="text-emerald-400">AUTHENTIC REPO</span>
            </div>
          </div>
        )}

        {/* Tombol Takedown / Hapus Karya Khusus Author / Admin / Operator */}
        {canDelete && (
          <div
            className="absolute top-2.5 right-2.5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1 bg-black/85 backdrop-blur-md p-1.5 rounded-xl border border-red-500/40 animate-in fade-in">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span>Hapus!</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] hover:text-white cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="h-8 w-8 rounded-full bg-black/60 hover:bg-red-950/80 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-md"
                title="Hapus / Takedown Karya"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Content Details */}
      <div className="p-4 pt-1 space-y-3">
        {/* Category Badge & Like Button */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
          >
            <CategoryIcon className="h-3 w-3" />
            <span>{categoryMeta.label}</span>
          </span>

          {/* Like Interactive Heart */}
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-90 border ${
              isLiked
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                : "bg-surface-container-low text-ink-muted hover:text-rose-500 border-edge"
            }`}
            title="Sukai karya ini"
          >
            <Heart
              className={`h-3.5 w-3.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
            />
            <span className="tabular-nums font-mono">{likesCount}</span>
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Author & Contributors Section */}
        <div className="space-y-2 pt-1 border-t border-edge/60 text-[11px]">
          {/* Author Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink truncate">
                    {project.author.name}
                  </span>
                  {project.author.classGrade && (
                    <span className="text-[10px] text-ink-muted shrink-0 font-mono">
                      ({formatGrade(project.author.classGrade)})
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-ink-muted block">Ketua Tim</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 shrink-0 font-mono border border-amber-500/20">
              +50 XP
            </span>
          </div>

          {/* Team Contributors Row */}
          {hasContributors && (
            <div className="flex items-start justify-between bg-surface-container-low/40 p-2.5 rounded-xl border border-edge/50">
              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                <Users className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-ink-secondary block">
                    Kontributor Tim ({project.contributors?.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.contributors?.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-edge text-[10px] text-ink font-medium"
                      >
                        <span>{c.name}</span>
                        {c.classGrade && (
                          <span className="text-[9px] text-ink-muted font-mono">
                            ({formatGrade(c.classGrade)})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-semibold text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 shrink-0 ml-1 font-mono">
                +50 XP/org
              </span>
            </div>
          )}
        </div>

        {/* Action Links Row (min-h-[44px]) */}
        <div
          className="flex items-center gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 min-h-[44px] px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Lihat Demo Karya</span>
            </a>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 min-h-[44px] px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink border border-edge flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-semibold"
              title="Buka Repositori GitHub"
            >
              <GitBranch className="h-4 w-4" />
              <span>Kode</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
