import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { AppShell } from "@/components/layout/AppShell";
import { EksplorasiClientView } from "@/components/eksplorasi/EksplorasiClientView";
import { ProjectCardData } from "@/components/eksplorasi/ProjectCard";
import { WikiArticleData } from "@/components/eksplorasi/WikiCard";
import { GuestLockedView } from "@/components/ui/GuestLockedView";
import { MemberOption } from "@/actions/eksplorasi";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function EksplorasiPage() {
  const current = await getCurrentDbUser();

  if (!current?.session?.user?.id || !current.dbUser) {
    redirect("/login");
  }

  const { session, dbUser } = current;

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  // Gatekeeper: Akun GUEST (Menunggu Verifikasi) tidak dapat melihat karya atau perpustakaan digital
  if (dbUser.role === Role.GUEST) {
    return (
      <AppShell user={dbUser}>
        <div className="flex flex-col gap-4 pt-1">
          <section>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Hub Eksplorasi &amp; Karya
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Etalase pameran portofolio dan repositori perpustakaan digital organisasi.
            </p>
          </section>

          <GuestLockedView
            title="Akses Eksplorasi Terbatas"
            description="Koleksi proyek karya divisi dan arsip perpustakaan digital organisasi hanya dapat diakses oleh anggota resmi terverifikasi."
          />
        </div>
      </AppShell>
    );
  }

  let formattedProjects: ProjectCardData[] = [];
  let formattedArticles: WikiArticleData[] = [];
  let availableMembers: MemberOption[] = [];

  try {
    const [dbProjects, dbArticles, dbMembers] = await Promise.all([
      prisma.showcaseProject.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
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
        },
      }),
      prisma.wikiArticle.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              classGrade: true,
            },
          },
          lastUpdatedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          classGrade: true,
          image: true,
        },
        orderBy: [
          { classGrade: "desc" },
          { name: "asc" },
        ],
      }),
    ]);

    availableMembers = dbMembers;

    // Format serialisasi data projects
    formattedProjects = dbProjects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      demoUrl: p.demoUrl,
      githubUrl: p.githubUrl,
      imageUrl: p.imageUrl,
      contributors: p.contributors.map((c) => ({
        id: c.id,
        name: c.name,
        classGrade: c.classGrade,
        image: c.image,
      })),
      likesCount: p.likesCount,
      isLiked: p.likes.length > 0,
      author: p.author,
      createdAt: p.createdAt.toISOString(),
    }));

    // Format serialisasi data wiki articles
    formattedArticles = dbArticles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      content: a.content,
      category: a.category,
      author: a.author,
      lastUpdatedBy: a.lastUpdatedBy,
      viewCount: a.viewCount,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Gagal memuat data eksplorasi:", err);
  }

  return (
    <AppShell user={dbUser}>
      <EksplorasiClientView
        currentUser={{
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
        }}
        projects={formattedProjects}
        articles={formattedArticles}
        availableMembers={availableMembers}
      />
    </AppShell>
  );
}
