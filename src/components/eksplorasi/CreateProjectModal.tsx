"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ExternalLink,
  GitBranch,
  Image as ImageIcon,
  Tag,
  AlertCircle,
  Users,
  Search,
  Plus,
  Loader2,
} from "lucide-react";
import {
  submitShowcaseProject,
  getAvailableMembers,
  ShowcaseCategory,
  MemberOption,
} from "@/actions/eksplorasi";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentUserId?: string;
  availableMembers?: MemberOption[];
}

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
  availableMembers: initialMembers,
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: ShowcaseCategory;
    demoUrl: string;
    githubUrl: string;
    imageUrl: string;
    contributorIds: string[];
  }>({
    title: "",
    description: "",
    category: "PROGRAMMING",
    demoUrl: "",
    githubUrl: "",
    imageUrl: "",
    contributorIds: [],
  });

  const [membersList, setMembersList] = useState<MemberOption[]>(
    initialMembers || []
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Filter members list: exclude current user and already selected members
  const selectableMembers = membersList.filter(
    (m) =>
      m.id !== currentUserId &&
      !formData.contributorIds.includes(m.id) &&
      (memberSearch.trim() === "" ||
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.classGrade.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const selectedMembers = membersList.filter((m) =>
    formData.contributorIds.includes(m.id)
  );

  const handleAddContributor = (id: string) => {
    if (formData.contributorIds.length >= 10) {
      setErrorMessage("Maksimal 10 kontributor tim per karya proyek.");
      return;
    }
    setErrorMessage(null);
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
      contributorIds: prev.contributorIds.filter((item) => item !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setErrorMessage("Judul karya proyek minimal 3 karakter.");
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 3) {
      setErrorMessage("Deskripsi karya wajib diisi minimal 3 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await submitShowcaseProject({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        demoUrl: formData.demoUrl?.trim() || undefined,
        githubUrl: formData.githubUrl?.trim() || undefined,
        imageUrl: formData.imageUrl?.trim() || undefined,
        contributorIds: formData.contributorIds,
      });

      if (res.success) {
        setFormData({
          title: "",
          description: "",
          category: "PROGRAMMING",
          demoUrl: "",
          githubUrl: "",
          imageUrl: "",
          contributorIds: [],
        });
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat menyimpan karya.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-container-low/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Submit Karya ke Showcase</h2>
              <p className="text-[11px] text-ink-muted">
                +50 XP untuk Anda &amp; +50 XP per anggota tim (hingga 10 orang)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Judul Proyek */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Judul Karya / Nama Proyek <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Portal Presensi IoT Saba ExploIT"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-11 min-h-[44px] px-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Pilihan Kategori Dropdown (6 Opsi Resmi) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span>Kategori Divisi / Bidang Karya <span className="text-primary">*</span></span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as ShowcaseCategory,
                })
              }
              className="w-full h-11 min-h-[44px] px-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer font-medium"
            >
              <option value="PROGRAMMING">💻 1. Programming &amp; Web</option>
              <option value="TECHNOPRENEUR">💼 2. Technopreneurship</option>
              <option value="DESAIN">🎨 3. Desain Grafis &amp; UI/UX</option>
              <option value="FOTOGRAFI">📷 4. Fotografi</option>
              <option value="SINEMATOGRAFI">🎬 5. Sinematografi</option>
              <option value="LAINNYA">✨ 6. Karya Kreatif Lainnya</option>
            </select>
          </div>

          {/* Deskripsi Proyek */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              Deskripsi &amp; Teknologi / Alat <span className="text-primary">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Jelaskan fitur karya, proses pembuatan, dan tools/teknologi yang digunakan..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Komponen Multi-Select Anggota (Kontributor Tim hingga 10 orang) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-500" />
                <span>Kontributor Tim ({formData.contributorIds.length}/10)</span>
              </label>
              <span className="text-[10px] text-purple-400 font-semibold font-mono">
                +50 XP per anggota
              </span>
            </div>

            {/* Selected Chips Badges */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-container-low/60 border border-edge">
                {selectedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium animate-in fade-in"
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

            {/* Member Search / Selector Dropdown */}
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
                    className="w-full h-11 min-h-[44px] pl-9 pr-8 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
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

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-card border border-edge shadow-xl z-20 divide-y divide-edge/40">
                    {selectableMembers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-ink-muted">
                        Tidak ada anggota yang cocok.
                      </div>
                    ) : (
                      selectableMembers.slice(0, 10).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleAddContributor(m.id)}
                          className="w-full px-3 py-2.5 text-left hover:bg-surface-container-low flex items-center justify-between transition-colors cursor-pointer text-xs group"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-ink block truncate group-hover:text-primary transition-colors">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-ink-muted font-mono">
                              {formatGrade(m.classGrade)}
                            </span>
                          </div>
                          <span className="h-7 px-2.5 rounded-lg bg-purple-500/15 text-purple-400 text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                            <Plus className="h-3 w-3" /> Tambah
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-ink-muted leading-tight">
              💡 Seluruh anggota tim dan kontributor terpilih akan otomatis mendapatkan apresiasi penuh +50 XP!
            </p>
          </div>

          {/* Tautan Demo & GitHub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                <span>Tautan Demo (Live URL)</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.demoUrl}
                onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                className="w-full h-11 min-h-[44px] px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5 text-ink" />
                <span>Tautan GitHub / Kode</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full h-11 min-h-[44px] px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>
          </div>

          {/* Tautan Banner / Gambar */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>Tautan Thumbnail Banner (Opsional)</span>
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... atau URL gambar"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full h-11 min-h-[44px] px-3 rounded-xl border border-edge bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 min-h-[44px] px-4 rounded-xl border border-edge text-xs font-semibold text-ink-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 min-h-[44px] px-5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mempublikasikan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Publikasikan Karya (+50 XP)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
