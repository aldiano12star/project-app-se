"use server";

import { prisma } from "@/lib/prisma";
import { assertAuthenticated, assertActiveMember, assertRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export type ShowcaseCategory =
  | "PROGRAMMING"
  | "TECHNOPRENEUR"
  | "DESAIN"
  | "FOTOGRAFI"
  | "SINEMATOGRAFI"
  | "LAINNYA";

export type WikiCategory =
  | "SURAT_LPJ"
  | "INFO_LOMBA"
  | "MODUL_PELATIHAN"
  | "PANDUAN_TEKNIS";

export interface SubmitShowcaseInput {
  title: string;
  description: string;
  category: ShowcaseCategory;
  demoUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  contributorIds?: string[];
}

export interface SubmitWikiInput {
  id?: string;
  title: string;
  category: WikiCategory;
  content: string;
}

export interface MemberOption {
  id: string;
  name: string;
  classGrade: string;
  image?: string | null;
}

/**
 * Helper untuk membuat slug ramah URL yang unik
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Mengambil daftar anggota terdaftar untuk form selektor kontributor tim
 */
export async function getAvailableMembers(): Promise<ActionResponse<MemberOption[]>> {
  try {
    await assertAuthenticated();
    const members = await prisma.user.findMany({
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
    });

    return {
      success: true,
      message: "Daftar anggota berhasil dimuat.",
      data: members,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memuat daftar anggota.",
      data: [],
    };
  }
}

/**
 * Alias untuk kompatibilitas nama fungsi query anggota
 */
export const getAllRegisteredUsers = getAvailableMembers;

/**
 * Menambahkan Proyek Karya Baru ke Showcase (+50 XP Pembuat & +50 XP Tiap Kontributor Tim)
 * Wewenang: Anggota aktif
 */
export async function submitShowcaseProject(
  input: SubmitShowcaseInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await assertActiveMember();

    if (!input.title || input.title.trim().length < 3) {
      return {
        success: false,
        message: "Judul karya proyek minimal 3 karakter.",
      };
    }

    if (!input.description || input.description.trim().length < 3) {
      return {
        success: false,
        message: "Deskripsi karya wajib diisi minimal 3 karakter.",
      };
    }

    // Filter contributorIds: maksimal 10 orang unik & bukan author sendiri
    const rawContributorIds = input.contributorIds || [];
    const uniqueContributorIds = Array.from(
      new Set(rawContributorIds.filter((id) => id && id !== user.id))
    ).slice(0, 10);

    const newProject = await prisma.showcaseProject.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category || "PROGRAMMING",
        demoUrl: input.demoUrl?.trim() || null,
        githubUrl: input.githubUrl?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        authorId: user.id,
        isApproved: true,
        contributors:
          uniqueContributorIds.length > 0
            ? {
                connect: uniqueContributorIds.map((id) => ({ id })),
              }
            : undefined,
      },
    });

    // Tambahkan reward +50 XP untuk author utama
    await prisma.user.update({
      where: { id: user.id },
      data: {
        monthlyPoints: { increment: 50 },
        totalPoints: { increment: 50 },
      },
    });

    // Tambahkan reward setara +50 XP untuk masing-masing kontributor tim (hingga 10 orang)
    if (uniqueContributorIds.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: { in: uniqueContributorIds },
        },
        data: {
          monthlyPoints: { increment: 50 },
          totalPoints: { increment: 50 },
        },
      });
    }

    revalidatePath("/eksplorasi");
    revalidatePath("/dashboard");
    revalidatePath("/pengaturan");

    return {
      success: true,
      message: `Karya berhasil dipublikasikan! (+50 XP untuk Anda${
        uniqueContributorIds.length > 0
          ? ` & +50 XP untuk ${uniqueContributorIds.length} anggota tim`
          : ""
      })`,
      data: { id: newProject.id },
    };
  } catch (error) {
    console.error("Gagal mempublikasikan karya:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Menghapus / Takedown Proyek Karya Showcase
 * Wewenang: Author karya ATAU Pengurus (ADMIN/OPERATOR)
 */
export async function deleteShowcaseProject(
  projectId: string
): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticated();

    const project = await prisma.showcaseProject.findUnique({
      where: { id: projectId },
      select: { id: true, authorId: true, title: true },
    });

    if (!project) {
      return {
        success: false,
        message: "Proyek karya tidak ditemukan atau telah dihapus.",
      };
    }

    const isAuthor = project.authorId === user.id;
    const isPrivileged = user.role === Role.ADMIN || user.role === Role.OPERATOR;

    if (!isAuthor && !isPrivileged) {
      return {
        success: false,
        message: "FORBIDDEN: Anda tidak memiliki izin untuk menghapus karya ini.",
      };
    }

    // Hapus relasi likes terlebih dahulu untuk menjaga integritas relasional
    await prisma.projectLike.deleteMany({
      where: { projectId },
    });

    // Hapus entri karya proyek
    await prisma.showcaseProject.delete({
      where: { id: projectId },
    });

    revalidatePath("/eksplorasi");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Karya "${project.title}" berhasil dihapus.`,
    };
  } catch (error) {
    console.error("Gagal menghapus karya proyek:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus karya proyek.",
    };
  }
}

/**
 * Menyukai / Batal Menyukai Proyek Karya
 * Wewenang: Anggota aktif
 */
export async function toggleLikeProject(
  projectId: string
): Promise<ActionResponse<{ isLiked: boolean; likesCount: number }>> {
  try {
    const user = await assertActiveMember();

    const existingLike = await prisma.projectLike.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      // Batal like
      await prisma.projectLike.delete({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
      });

      const updated = await prisma.showcaseProject.update({
        where: { id: projectId },
        data: {
          likesCount: { decrement: 1 },
        },
        select: { likesCount: true },
      });

      revalidatePath("/eksplorasi");

      return {
        success: true,
        message: "Batal menyukai karya.",
        data: { isLiked: false, likesCount: Math.max(0, updated.likesCount) },
      };
    } else {
      // Tambah like
      await prisma.projectLike.create({
        data: {
          projectId,
          userId: user.id,
        },
      });

      const updated = await prisma.showcaseProject.update({
        where: { id: projectId },
        data: {
          likesCount: { increment: 1 },
        },
        select: { likesCount: true },
      });

      revalidatePath("/eksplorasi");

      return {
        success: true,
        message: "Menyukai karya!",
        data: { isLiked: true, likesCount: updated.likesCount },
      };
    }
  } catch (error) {
    console.error("Gagal menyukai proyek:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Membuat atau Memperbarui Artikel Perpustakaan Digital (+15 XP)
 * Wewenang: Anggota aktif
 */
export async function submitWikiArticle(
  input: SubmitWikiInput
): Promise<ActionResponse<{ id: string; slug: string }>> {
  try {
    const user = await assertActiveMember();

    if (!input.title || input.title.trim().length < 3) {
      return {
        success: false,
        message: "Judul panduan/artikel minimal 3 karakter.",
      };
    }

    if (!input.content || input.content.trim().length < 5) {
      return {
        success: false,
        message: "Konten panduan/artikel tidak boleh kosong (minimal 5 karakter).",
      };
    }

    if (input.id) {
      // Update artikel yang ada
      const updated = await prisma.wikiArticle.update({
        where: { id: input.id },
        data: {
          title: input.title.trim(),
          category: input.category,
          content: input.content.trim(),
          lastUpdatedById: user.id,
        },
      });

      // Tambahkan reward kontribusi update +15 XP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          monthlyPoints: { increment: 15 },
          totalPoints: { increment: 15 },
        },
      });

      revalidatePath("/eksplorasi");
      revalidatePath("/dashboard");

      return {
        success: true,
        message: "Panduan berhasil diperbarui! (+15 XP)",
        data: { id: updated.id, slug: updated.slug },
      };
    } else {
      // Buat artikel baru
      let baseSlug = slugify(input.title);
      if (!baseSlug) baseSlug = "panduan-organisasi";
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (await prisma.wikiArticle.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const created = await prisma.wikiArticle.create({
        data: {
          title: input.title.trim(),
          slug: uniqueSlug,
          category: input.category,
          content: input.content.trim(),
          authorId: user.id,
          lastUpdatedById: user.id,
        },
      });

      // Tambahkan reward pembuatan artikel +15 XP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          monthlyPoints: { increment: 15 },
          totalPoints: { increment: 15 },
        },
      });

      revalidatePath("/eksplorasi");
      revalidatePath("/dashboard");

      return {
        success: true,
        message: "Panduan baru berhasil diterbitkan! (+15 XP)",
        data: { id: created.id, slug: created.slug },
      };
    }
  } catch (error) {
    console.error("Gagal menyimpan panduan perpustakaan:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Alias untuk kompatibilitas backward
 */
export const createOrUpdateWikiArticle = submitWikiArticle;

/**
 * Menghapus Artikel Perpustakaan Digital
 * Wewenang: Author artikel ATAU Pengurus (ADMIN/OPERATOR)
 */
export async function deleteWikiArticle(
  articleId: string
): Promise<ActionResponse> {
  try {
    const user = await assertAuthenticated();

    const article = await prisma.wikiArticle.findUnique({
      where: { id: articleId },
      select: { id: true, authorId: true, title: true },
    });

    if (!article) {
      return {
        success: false,
        message: "Artikel tidak ditemukan atau telah dihapus.",
      };
    }

    const isAuthor = article.authorId === user.id;
    const isPrivileged = user.role === Role.ADMIN || user.role === Role.OPERATOR;

    if (!isAuthor && !isPrivileged) {
      return {
        success: false,
        message: "FORBIDDEN: Anda tidak memiliki izin untuk menghapus artikel ini.",
      };
    }

    await prisma.wikiArticle.delete({
      where: { id: articleId },
    });

    revalidatePath("/eksplorasi");

    return {
      success: true,
      message: `Artikel "${article.title}" berhasil dihapus.`,
    };
  } catch (error) {
    console.error("Gagal menghapus artikel perpustakaan:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal menghapus artikel.",
    };
  }
}
