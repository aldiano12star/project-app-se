"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Search,
  Plus,
} from "lucide-react";
import { Role } from "@prisma/client";
import { ProjectCardData } from "./ProjectCard";
import { WikiArticleData } from "./WikiCard";
import { ShowcaseTab } from "./ShowcaseTab";
import { WikiTab } from "./WikiTab";
import { CreateProjectModal } from "./CreateProjectModal";
import { CreateWikiModal } from "./CreateWikiModal";
import { WikiDetailModal } from "./WikiDetailModal";
import { ProjectDetailModal } from "./ProjectDetailModal";
import { MemberOption } from "@/actions/eksplorasi";

interface EksplorasiClientViewProps {
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
  projects: ProjectCardData[];
  articles: WikiArticleData[];
  availableMembers?: MemberOption[];
}

export function EksplorasiClientView({
  currentUser,
  projects,
  articles,
  availableMembers,
}: EksplorasiClientViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"SHOWCASE" | "WIKI">("SHOWCASE");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateWikiOpen, setIsCreateWikiOpen] = useState(false);
  const [selectedWikiArticle, setSelectedWikiArticle] = useState<WikiArticleData | null>(null);
  const [isWikiDetailOpen, setIsWikiDetailOpen] = useState(false);
  const [editingWikiArticle, setEditingWikiArticle] = useState<WikiArticleData | null>(null);

  // Project Detail Modal state
  const [selectedProject, setSelectedProject] = useState<ProjectCardData | null>(null);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenProjectDetail = (project: ProjectCardData) => {
    setSelectedProject(project);
    setIsProjectDetailOpen(true);
  };

  const handleOpenWikiDetail = (article: WikiArticleData) => {
    setSelectedWikiArticle(article);
    setIsWikiDetailOpen(true);
  };

  const handleOpenEditWiki = (article: WikiArticleData) => {
    setEditingWikiArticle(article);
    setIsCreateWikiOpen(true);
  };

  if (!isMounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface-container-low rounded-lg w-1/2" />
        <div className="h-11 bg-surface-container-low rounded-xl w-full" />
        <div className="h-12 bg-surface-container-low rounded-xl w-full" />
        <div className="h-64 bg-surface-container-low rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Bar Header & Action Button (Bersih tanpa badge HUB) */}
      <div className="flex items-center justify-between pt-1 relative z-10">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-ink">
            Pusat Eksplorasi &amp; Karya
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Showcase karya 5 divisi &amp; Perpustakaan Digital Saba ExploIT
          </p>
        </div>

        {activeTab === "SHOWCASE" ? (
          <button
            type="button"
            onClick={() => setIsCreateProjectOpen(true)}
            className="h-11 px-4 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[44px] relative z-10"
          >
            <Plus className="h-4 w-4" />
            <span>Submit Karya</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingWikiArticle(null);
              setIsCreateWikiOpen(true);
            }}
            className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer min-h-[44px] relative z-10"
          >
            <Plus className="h-4 w-4" />
            <span>Tulis Panduan</span>
          </button>
        )}
      </div>

      {/* Universal Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder={
            activeTab === "SHOWCASE"
              ? "Cari karya proyek, divisi, teknologi, atau kontributor..."
              : "Cari modul pelatihan, format surat, atau panduan teknis..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 min-h-[44px] pl-10 pr-3.5 bg-card border border-edge rounded-xl text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs"
        />
      </div>

      {/* Segmented Control Pill Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-container-low border border-edge shadow-xs relative z-10">
        <button
          type="button"
          onClick={() => setActiveTab("SHOWCASE")}
          className={`h-11 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "SHOWCASE"
              ? "bg-primary text-white shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Showcase Karya</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "SHOWCASE"
                ? "bg-white/20 text-white"
                : "bg-surface-container text-ink-secondary"
            }`}
          >
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("WIKI")}
          className={`h-11 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            activeTab === "WIKI"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Perpustakaan Digital</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "WIKI"
                ? "bg-white/20 text-white"
                : "bg-surface-container text-ink-secondary"
            }`}
          >
            {articles.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SHOWCASE KARYA */}
      {activeTab === "SHOWCASE" && (
        <section className="animate-in fade-in">
          <ShowcaseTab
            projects={projects}
            searchQuery={searchQuery}
            onOpenCreateModal={() => setIsCreateProjectOpen(true)}
            onOpenDetailModal={handleOpenProjectDetail}
            currentUser={currentUser}
          />
        </section>
      )}

      {/* TAB 2: PERPUSTAKAAN DIGITAL */}
      {activeTab === "WIKI" && (
        <section className="animate-in fade-in">
          <WikiTab
            articles={articles}
            searchQuery={searchQuery}
            onOpenCreateModal={() => {
              setEditingWikiArticle(null);
              setIsCreateWikiOpen(true);
            }}
            onOpenDetailModal={handleOpenWikiDetail}
          />
        </section>
      )}

      {/* Modal Dialog Submit Proyek */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        currentUserId={currentUser.id}
        availableMembers={availableMembers}
      />

      {/* Modal Dialog Detail Karya Showcase */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={isProjectDetailOpen}
        onClose={() => {
          setIsProjectDetailOpen(false);
          setSelectedProject(null);
        }}
        currentUser={currentUser}
      />

      {/* Modal Dialog Tulis / Edit Wiki */}
      <CreateWikiModal
        isOpen={isCreateWikiOpen}
        onClose={() => {
          setIsCreateWikiOpen(false);
          setEditingWikiArticle(null);
        }}
        editArticle={editingWikiArticle}
      />

      {/* Modal Dialog Pembaca Artikel Wiki */}
      <WikiDetailModal
        isOpen={isWikiDetailOpen}
        onClose={() => {
          setIsWikiDetailOpen(false);
          setSelectedWikiArticle(null);
        }}
        article={selectedWikiArticle}
        onOpenEdit={handleOpenEditWiki}
        currentUser={currentUser}
      />
    </div>
  );
}
