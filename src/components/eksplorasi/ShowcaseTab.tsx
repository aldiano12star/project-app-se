"use client";

import { useState } from "react";
import { Plus, Rocket } from "lucide-react";
import { Role } from "@prisma/client";
import { ProjectCard, ProjectCardData } from "./ProjectCard";

interface ShowcaseTabProps {
  projects: ProjectCardData[];
  searchQuery: string;
  onOpenCreateModal: () => void;
  onOpenDetailModal?: (project: ProjectCardData) => void;
  currentUser?: {
    id: string;
    role: Role;
  };
}

export function ShowcaseTab({
  projects,
  searchQuery,
  onOpenCreateModal,
  onOpenDetailModal,
  currentUser,
}: ShowcaseTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredProjects = projects.filter((project) => {
    // Normalisasi category match termasuk backward compatibility
    let matchesCategory = selectedCategory === "ALL";
    if (!matchesCategory) {
      if (selectedCategory === "PROGRAMMING") {
        matchesCategory = project.category === "PROGRAMMING" || project.category === "WEB";
      } else if (selectedCategory === "TECHNOPRENEUR") {
        matchesCategory = project.category === "TECHNOPRENEUR" || project.category === "IOT";
      } else if (selectedCategory === "DESAIN") {
        matchesCategory = project.category === "DESAIN" || project.category === "UI_UX";
      } else if (selectedCategory === "FOTOGRAFI") {
        matchesCategory = project.category === "FOTOGRAFI";
      } else if (selectedCategory === "SINEMATOGRAFI") {
        matchesCategory = project.category === "SINEMATOGRAFI";
      } else if (selectedCategory === "LAINNYA") {
        matchesCategory =
          project.category === "LAINNYA" ||
          project.category === "GAME" ||
          project.category === "OTHER";
      } else {
        matchesCategory = project.category === selectedCategory;
      }
    }

    const contributorsText = project.contributors
      ? project.contributors.map((c) => c.name).join(" ")
      : "";

    const matchesSearch =
      searchQuery.trim() === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contributorsText.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Horizontal Filter Chips (Edge-to-Edge Scroll on Mobile, Tanpa Prefix Angka) */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`tactile-btn min-h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedCategory === "ALL"
              ? "bg-primary text-white shadow-xs"
              : "bg-surface-container-low text-ink-muted hover:text-ink hairline-border"
          }`}
        >
          <span>Semua</span>
          <span className="font-mono-num text-[11px] opacity-80">
            ({projects.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("PROGRAMMING")}
          className={`tactile-btn min-h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "PROGRAMMING"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-surface-container-low text-ink-muted hover:text-ink hairline-border"
          }`}
        >
          Programming &amp; Web
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("TECHNOPRENEUR")}
          className={`tactile-btn min-h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "TECHNOPRENEUR"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-surface-container-low text-ink-muted hover:text-ink hairline-border"
          }`}
        >
          Technopreneur
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("DESAIN")}
          className={`tactile-btn min-h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "DESAIN"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-surface-container-low text-ink-muted hover:text-ink hairline-border"
          }`}
        >
          Desain Grafis &amp; UI/UX
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("FOTOGRAFI")}
          className={`tactile-btn min-h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "FOTOGRAFI"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-surface-container-low text-ink-muted hover:text-ink hairline-border"
          }`}
        >
          Fotografi
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("SINEMATOGRAFI")}
          className={`tactile-btn min-h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "SINEMATOGRAFI"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-surface-container-low text-ink-muted hover:text-ink hairline-border"
          }`}
        >
          Sinematografi
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("LAINNYA")}
          className={`tactile-btn min-h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "LAINNYA"
              ? "bg-slate-700 text-white shadow-xs"
              : "bg-surface-container-low text-ink-muted hover:text-ink hairline-border"
          }`}
        >
          Karya Lainnya
        </button>
      </div>

      {/* Projects Grid / List */}
      {filteredProjects.length === 0 ? (
        <div className="apple-card p-8 sm:p-10 text-center space-y-3.5 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl scale-150 pointer-events-none" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low hairline-border shadow-xs">
              <Rocket className="h-7 w-7 text-ink-muted/50 stroke-[1.5]" />
            </div>
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm sm:text-base font-bold text-ink tracking-tight font-display">
              Belum ada karya di kategori ini
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Jadilah yang pertama memamerkan ide, purwarupa, atau karya divisimu dan raih apresiasi XP!
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="tactile-btn h-11 min-h-11 px-4 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Submit Karya Pertama (+50 XP)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUser={currentUser}
              onOpenDetail={onOpenDetailModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
