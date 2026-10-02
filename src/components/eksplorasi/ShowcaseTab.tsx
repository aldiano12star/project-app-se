"use client";

import React, { useState } from "react";
import { Plus, FolderKanban } from "lucide-react";
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
      {/* Horizontal Filter Chips (6 Kategori Divisi + Semua) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "ALL"
              ? "bg-primary text-white shadow-xs border border-primary"
              : "bg-card text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          Semua ({projects.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("PROGRAMMING")}
          className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "PROGRAMMING"
              ? "bg-blue-600 text-white shadow-xs border border-blue-600"
              : "bg-card text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          💻 1. Programming &amp; Web
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("TECHNOPRENEUR")}
          className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "TECHNOPRENEUR"
              ? "bg-emerald-600 text-white shadow-xs border border-emerald-600"
              : "bg-card text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          💼 2. Technopreneur
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("DESAIN")}
          className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "DESAIN"
              ? "bg-purple-600 text-white shadow-xs border border-purple-600"
              : "bg-card text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          🎨 3. Desain Grafis &amp; UI/UX
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("FOTOGRAFI")}
          className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "FOTOGRAFI"
              ? "bg-amber-600 text-white shadow-xs border border-amber-600"
              : "bg-card text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          📷 4. Fotografi
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("SINEMATOGRAFI")}
          className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "SINEMATOGRAFI"
              ? "bg-rose-600 text-white shadow-xs border border-rose-600"
              : "bg-card text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          🎬 5. Sinematografi
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("LAINNYA")}
          className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "LAINNYA"
              ? "bg-slate-700 text-white shadow-xs border border-slate-700"
              : "bg-card text-ink-secondary hover:text-ink border border-edge"
          }`}
        >
          ✨ 6. Karya Lainnya
        </button>
      </div>

      {/* Projects Grid / List */}
      {filteredProjects.length === 0 ? (
        <div className="card-solid bg-card p-8 text-center space-y-3 rounded-2xl border border-edge">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-ink">Belum Ada Karya di Kategori Ini</h3>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            Jadilah yang pertama memamerkan karya proyek dari divisimu dan raih apresiasi XP tim!
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="h-11 px-4 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Submit Karya Pertama (+50 XP)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
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
