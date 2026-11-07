"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ExternalLink,
  GitBranch,
  Tag,
  AlertCircle,
  Users,
  Search,
  Loader2,
  Pencil,
} from "lucide-react";
import {
  updateShowcaseProject,
  getAvailableMembers,
  ShowcaseCategory,
  MemberOption,
} from "@/actions/eksplorasi";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { ImagePickerField } from "@/components/ui/ImagePickerField";
import { ProjectCardData } from "./ProjectCard";

interface EditProjectModalProps {
  isOpen: boolean;
  project: ProjectCardData;
  onClose: () => void;
  onSuccess?: () => void;
  availableMembers?: MemberOption[];
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export function EditProjectModal({
  isOpen,
  project,
  onClose,
  onSuccess,
  availableMembers: initialMembers,
}: EditProjectModalProps) {
  useBodyScrollLock(isOpen);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: ShowcaseCategory;
    demoUrl: string;
    githubUrl: string;
    imageUrl: string;
    contributorIds: string[];
  }>({
    title: project.title,
    description: project.description,
    category: (project.category as ShowcaseCategory) || "PROGRAMMING",
    demoUrl: project.demoUrl || "",
    githubUrl: project.githubUrl || "",
    imageUrl: project.imageUrl || "",
    contributorIds: project.contributors?.map((c) => c.id) || [],
  });

  const [membersList, setMembersList] = useState<MemberOption[]>(
    initialMembers || []
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync data ketika modal dibuka atau project berganti
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: project.title,
        description: project.description,
        category: (project.category as ShowcaseCategory) || "PROGRAMMING",
        demoUrl: project.demoUrl || "",
        githubUrl: project.githubUrl || "",
        imageUrl: project.imageUrl || "",
        contributorIds: project.contributors?.map((c) => c.id) || [],
      });
      setErrorMessage(null);
    }
  }, [isOpen, project]);

  useEffect(() => {
    if (initialMembers && initialMembers.length > 0) {
      setMembersList(initialMembers);
    } else if (isOpen) {
      getAvailableMembers().then((res) => {
        if (res.success && res.data) {
          setMembersList(res.data);
        }
      });
    }
  }, [isOpen, initialMembers]);

  if (!isOpen) return null;

  // Filter selectable members: bukan author karya dan belum dipilih
  const selectableMembers = membersList.filter(
    (m) =>
      m.id !== project.author.id &&
      !formData.contributorIds.includes(m.id) &&
      (memberSearch.trim() === "" ||
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.classGrade &&
          m.classGrade.toLowerCase().includes(memberSearch.toLowerCase())))
  );

  const selectedMembers = membersList.filter((m) =>
    formData.contributorIds.includes(m.id)
  );

  const handleAddContributor = (id: string) => {
    if (formData.contributorIds.length >= 10) return;
    setFormData((prev) => ({
      ...prev,
      contributorIds: [...prev.contributorIds, id],
    }));
    setMemberSearch("");
    setIsDropdownOpen(false);
  };

  const handleRemoveContributor = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      contributorIds: prev.contributorIds.filter((mId) => mId !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await updateShowcaseProject({
        id: project.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        demoUrl: formData.demoUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
        imageUrl: formData.imageUrl || undefined,
        contributorIds: formData.contributorIds,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Gagal mengedit karya:", err);
      setErrorMessage(
        err.message || "Terjadi kesalahan internal saat memperbarui karya."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] bg-surface-container-high rounded-2xl border border-edge shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-edge flex items-center justify-between shrink-0 bg-surface-container-low">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Pencil className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Edit Karya</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Judul Proyek */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink block">
              Judul <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Portal Presensi IoT Saba ExploIT"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-11 min-h-11 px-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Kategori Divisi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span>
                Divisi <span className="text-primary">*</span>
              </span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as ShowcaseCategory,
                })
              }
              className="w-full h-11 min-h-11 px-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer font-medium"
            >
              <option value="PROGRAMMING">Programming &amp; Web Development</option>
              <option value="TECHNOPRENEUR">Technopreneur &amp; Bisnis Digital</option>
              <option value="DESAIN">UI/UX &amp; Desain Grafis</option>
              <option value="FOTOGRAFI">Fotografi &amp; Jurnalistik Visual</option>
              <option value="SINEMATOGRAFI">Sinematografi &amp; Video Editing</option>
              <option value="LAINNYA">Lainnya / Eksperimen Bebas</option>
            </select>
          </div>

          {/* Deskripsi Karya */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink block">
              Deskripsi <span className="text-primary">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan tujuan karya, fitur utama, dan teknologi yang digunakan..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Kontributor Tim */}
          <div className="space-y-2 pt-1 border-t border-edge">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                <span>Kontributor Tim ({selectedMembers.length}/10)</span>
              </label>
              <span className="text-[10px] text-purple-400 font-semibold font-mono">
                +50 XP untuk anggota baru
              </span>
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-container-low/60 border border-edge">
                {selectedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium"
                  >
                    <span>{member.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({formatGrade(member.classGrade)})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveContributor(member.id)}
                      className="h-4 w-4 rounded-full hover:bg-purple-500/30 inline-flex items-center justify-center cursor-pointer transition-colors ml-0.5"
                      title="Hapus kontributor"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {formData.contributorIds.length < 10 && (
              <div className="relative">
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama teman untuk ditambahkan ke tim..."
                    value={memberSearch}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className="w-full h-11 min-h-11 pl-9 pr-8 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  {memberSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearch("");
                        setIsDropdownOpen(false);
                      }}
                      className="absolute right-2 text-xs text-ink-muted hover:text-ink p-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {isDropdownOpen && selectableMembers.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-edge bg-surface-container-high shadow-xl p-1 space-y-0.5">
                    {selectableMembers.slice(0, 8).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleAddContributor(m.id)}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-surface-container flex items-center justify-between text-xs transition-colors cursor-pointer group"
                      >
                        <span className="font-medium text-ink group-hover:text-primary transition-colors">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-ink-muted font-mono">
                          {formatGrade(m.classGrade)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tautan Demo & GitHub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                <span>Demo URL</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.demoUrl}
                onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5 text-ink" />
                <span>Repository</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={formData.githubUrl}
                onChange={(e) =>
                  setFormData({ ...formData, githubUrl: e.target.value })
                }
                className="w-full h-11 min-h-11 px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>
          </div>

          {/* Banner / Foto Karya */}
          <ImagePickerField
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            label="Banner"
            aspectRatio="video"
            helperText="Unggah foto cover karya dari perangkat (WebP) atau gunakan tautan Google Drive."
          />

          {/* Tombol Simpan */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-edge text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50 min-h-11"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
