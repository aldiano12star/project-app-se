import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AspirasiClientView } from "@/components/aspirasi/AspirasiClientView";
import { PollCardData } from "@/components/aspirasi/PollCard";
import { AspirationCardData } from "@/components/aspirasi/AspirationCard";
import {
  AspirationCategoryType,
  AspirationStatusType,
  AspirationScopeType,
} from "@/actions/aspirasi";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AspirasiPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetching data user terlebih dahulu
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
      isProfileCompleted: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  const isOperator = dbUser.role === Role.OPERATOR;

  // Filter keamanan:
  // Khusus 'OPERATOR' yang dapat membaca seluruh aspirasi privat/kode rahasia.
  // Admin, Bendahara, Member, Guest hanya dapat melihat aspirasi publik dan laporan privat miliknya sendiri.
  const aspirationWhereFilter = isOperator
    ? undefined
    : {
        OR: [
          { targetScope: "PUBLIC" },
          { targetScope: "PRIVATE_ADMIN", senderId: dbUser.id },
        ],
      };

  // Fetching data polls dan aspirations secara paralel
  const [dbPolls, dbAspirations] = await Promise.all([
    prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { id: "asc" },
        },
        votes: {
          where: { userId: dbUser.id },
          select: { optionId: true },
        },
      },
    }),
    prisma.aspiration.findMany({
      where: aspirationWhereFilter,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            classGrade: true,
          },
        },
      },
    }),
  ]);

  // Format data polls dengan serialisasi ISO string yang aman dari hydration mismatch
  const formattedPolls: PollCardData[] = dbPolls.map((poll) => {
    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + opt._count.votes,
      0
    );

    const userVotedOptionId = poll.votes[0]?.optionId || null;

    const options = poll.options.map((opt) => {
      const votesCount = opt._count.votes;
      const percentage =
        totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;

      return {
        id: opt.id,
        optionText: opt.optionText,
        votesCount,
        percentage,
      };
    });

    return {
      id: poll.id,
      question: poll.question,
      description: poll.description,
      isActive: poll.isActive,
      closesAt: poll.closesAt ? poll.closesAt.toISOString() : null,
      createdAt: poll.createdAt.toISOString(),
      createdById: poll.createdById,
      options,
      totalVotes,
      userVotedOptionId,
    };
  });

  const formattedAspirations: AspirationCardData[] = dbAspirations.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: (item.category as AspirationCategoryType) || "DISKUSI_UMUM",
    status: (item.status as AspirationStatusType) || "OPEN",
    targetScope: (item.targetScope as AspirationScopeType) || "PUBLIC",
    adminReply: item.adminReply,
    isAnonymous: item.isAnonymous,
    sender: item.sender,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <AppShell user={dbUser}>
      <AspirasiClientView
        currentUser={{
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
        }}
        polls={formattedPolls}
        aspirations={formattedAspirations}
      />
    </AppShell>
  );
}
