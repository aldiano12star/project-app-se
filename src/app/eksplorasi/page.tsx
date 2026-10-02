import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { EksplorasiClientView } from "@/components/eksplorasi/EksplorasiClientView";
import { ProjectCardData } from "@/components/eksplorasi/ProjectCard";
import { WikiArticleData } from "@/components/eksplorasi/WikiCard";
import { MemberOption } from "@/actions/eksplorasi";

export const dynamic = "force-dynamic";

export default async function EksplorasiPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ambil data user aktif
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      classGrade: true,
      mainDivision: true,
      monthlyPoints: true,
      totalPoints: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
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
