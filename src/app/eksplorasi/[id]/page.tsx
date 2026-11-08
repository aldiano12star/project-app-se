import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { AppShell } from "@/components/layout/AppShell";
import { GuestLockedView } from "@/components/ui/GuestLockedView";
import { Role } from "@prisma/client";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Heart,
  User,
  Users,
  Sparkles,
  Code2,
  Briefcase,
  Palette,
  Camera,
  Film,
  Calendar,
} from "lucide-react";
import { ProjectDetailActions } from "./ProjectDetailActions";

export const dynamic = "force-dynamic";

interface ShowcaseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
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
};

function formatGrade(grade?: string | null) {
  if (!grade) return "";
  if (grade === "KELAS_10") return "Gen 21";
  if (grade === "KELAS_11") return "Gen 20";
  if (grade === "KELAS_12") return "Gen 19";
  return grade.replace("_", " ");
}

export default async function ShowcaseDetailPage({
  params,
}: ShowcaseDetailPageProps) {
  const current = await getCurrentDbUser();

  if (!current?.session?.user?.id || !current.dbUser) {
    redirect("/login");
  }

  const { session, dbUser } = current;

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  // Gatekeeper Akun GUEST
  if (dbUser.role === Role.GUEST) {
    return (
      <AppShell user={dbUser}>
        <div className="flex flex-col gap-4 pt-1">
          <GuestLockedView
            title="Akses Karya Terbatas"
            description="Informasi karya proyek dan repositori organisasi hanya dapat diakses oleh anggota resmi terverifikasi."
          />
        </div>
      </AppShell>
    );
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  const project = await prisma.showcaseProject.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          classGrade: true,
          image: true,
        },
      },
      contributors: {
        select: {
          id: true,
          name: true,
          classGrade: true,
          image: true,
        },
      },
      likes: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      _count: {
        select: { likes: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const categoryMeta =
    CATEGORY_META[project.category] || CATEGORY_META.LAINNYA;
  const CategoryIcon = categoryMeta.icon;

  const isLiked = project.likes.length > 0;
  const likesCount = project._count.likes;

  const isAuthor = dbUser.id === project.authorId;
  const isPrivileged =
    dbUser.role === Role.ADMIN || dbUser.role === Role.OPERATOR;
  const canEditOrDelete = isAuthor || isPrivileged;

  const formattedDate = new Date(project.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const projectData = {
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category,
    demoUrl: project.demoUrl,
    githubUrl: project.githubUrl,
    imageUrl: project.imageUrl,
    contributors: project.contributors,
    likesCount,
    isLiked,
    author: project.author,
    createdAt: project.createdAt.toISOString(),
  };

  return (
    <AppShell user={dbUser}>
      <div className="space-y-5 max-w-4xl mx-auto pb-12">
        {/* Navigasi Kembali */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/eksplorasi"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink text-xs font-bold border border-edge transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 text-primary" />
            <span>Kembali ke Pusat Eksplorasi</span>
          </Link>

          {canEditOrDelete && (
            <ProjectDetailActions
              project={projectData}
              currentUser={{ id: dbUser.id, role: dbUser.role }}
            />
          )}
        </div>

        {/* Kartu Utama Detail Karya */}
        <article className="card-solid bg-card border border-edge rounded-3xl overflow-hidden shadow-sm space-y-6">
          {/* Cover Banner 16:9 */}
          <div className="relative w-full aspect-video bg-surface-container-low overflow-hidden border-b border-edge flex items-center justify-center">
            {project.imageUrl ? (
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
                unoptimized={project.imageUrl.startsWith("data:")}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-[#0c1322] p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider font-mono">
                    Karya Terverifikasi
                  </span>
                </div>

                <div className="my-auto text-center flex flex-col items-center justify-center space-y-2">
                  <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center">
                    <CategoryIcon className="h-7 w-7" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-ink tracking-wide font-mono px-4 line-clamp-2">
                    {project.title}
                  </h2>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted">
                  <span>SABA EXPLOIT SHOWCASE</span>
                  <span className="text-emerald-400">AUTHENTIC REPO</span>
                </div>
              </div>
            )}
          </div>

          {/* Konten Detail */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Tag, Kategori & Waktu */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
                >
                  <CategoryIcon className="h-3.5 w-3.5" />
                  <span>{categoryMeta.label}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-ink-muted bg-surface-container-low border border-edge font-mono">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formattedDate}</span>
                </span>
              </div>
            </div>

            {/* Judul Karya */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight">
              {project.title}
            </h1>

            {/* Deskripsi Proyek */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Tentang Karya &amp; Dokumentasi
              </h3>
              <p className="text-sm sm:text-base text-ink-secondary leading-relaxed whitespace-pre-wrap bg-surface-container-low/50 p-4 sm:p-5 rounded-2xl border border-edge">
                {project.description}
              </p>
            </div>

            {/* Pembuat & Tim Kontributor */}
            <div className="space-y-3 pt-2 border-t border-edge">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-400" />
                <span>Tim Pengembang &amp; Kontributor</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Author Card */}
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-edge flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink text-sm truncate">
                          {project.author.name}
                        </span>
                        {project.author.classGrade && (
                          <span className="text-[10px] text-ink-muted shrink-0 font-mono">
                            ({formatGrade(project.author.classGrade)})
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-ink-muted">Ketua / Pembuat Karya</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 shrink-0 font-mono border border-amber-500/20">
                    +50 XP
                  </span>
                </div>

                {/* Contributors */}
                {project.contributors.map((contrib) => (
                  <div
                    key={contrib.id}
                    className="p-3.5 rounded-2xl bg-surface-container-low border border-edge flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-ink text-sm truncate">
                            {contrib.name}
                          </span>
                          {contrib.classGrade && (
                            <span className="text-[10px] text-ink-muted shrink-0 font-mono">
                              ({formatGrade(contrib.classGrade)})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-ink-muted">Kontributor Tim</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/15 shrink-0 font-mono border border-purple-500/30">
                      +50 XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons: Demo URL & Repository URL */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-edge">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 h-12 min-h-[48px] px-5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Kunjungi Demo Karya (Live URL)</span>
                </a>
              )}

              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto h-12 min-h-[48px] px-5 rounded-xl bg-surface-container-low hover:bg-surface-container text-ink border border-edge flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-semibold"
                >
                  <GitBranch className="h-4 w-4" />
                  <span>Lihat Kode di Repositori</span>
                </a>
              )}
            </div>
          </div>
        </article>
      </div>
    </AppShell>
  );
}
