"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Pencil, Trash2, Loader2, Share2, Check } from "lucide-react";
import { Role } from "@prisma/client";
import { toggleLikeProject, deleteShowcaseProject } from "@/actions/eksplorasi";
import { EditProjectModal } from "@/components/eksplorasi/EditProjectModal";
import { ProjectCardData } from "@/components/eksplorasi/ProjectCard";

interface ProjectDetailActionsProps {
  project: ProjectCardData;
  currentUser?: {
    id: string;
    role: Role;
  };
}

export function ProjectDetailActions({
  project,
  currentUser,
}: ProjectDetailActionsProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(Boolean(project.isLiked));
  const [likesCount, setLikesCount] = useState(project.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isCopied, setIsCopied] = useState(false);

  const isAuthor = currentUser?.id === project.author.id;
  const isPrivileged =
    currentUser?.role === Role.ADMIN || currentUser?.role === Role.OPERATOR;
  const canEditOrDelete = isAuthor || isPrivileged;

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
        setIsConfirmingDelete(false);
      } else {
        router.push("/eksplorasi");
      }
    });
  };

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Tombol Share */}
      <button
        type="button"
        onClick={handleShare}
        className="h-10 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink-secondary hover:text-ink border border-edge text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        title="Salin tautan karya"
      >
        {isCopied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-500">Tersalin!</span>
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5" />
            <span>Bagikan</span>
          </>
        )}
      </button>

      {/* Tombol Like */}
      <button
        type="button"
        onClick={handleLike}
        disabled={isLiking}
        className={`h-10 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
          isLiked
            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
            : "bg-surface-container-low text-ink-muted hover:text-rose-500 border-edge"
        }`}
        title="Sukai karya ini"
      >
        <Heart
          className={`h-4 w-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`}
        />
        <span className="font-mono">{likesCount}</span>
      </button>

      {/* Tombol Edit & Hapus */}
      {canEditOrDelete && (
        <>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="h-10 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>

          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl border border-red-500/30 animate-in fade-in">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                className="h-8 px-2 rounded-lg text-ink-muted hover:text-ink text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="h-10 px-3 rounded-xl bg-surface-container-low hover:bg-red-50 dark:hover:bg-red-950/40 text-ink-muted hover:text-red-600 border border-edge hover:border-red-300 dark:hover:border-red-900 transition-colors cursor-pointer"
              title="Hapus karya"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <EditProjectModal
            isOpen={isEditing}
            project={project}
            onClose={() => setIsEditing(false)}
            onSuccess={() => {
              setIsEditing(false);
              router.refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
