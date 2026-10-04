import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AspirasiClientView } from "@/components/aspirasi/AspirasiClientView";
import { FeedbackIssueData } from "@/components/aspirasi/FeedbackIssueCard";
import { PollCardData } from "@/components/aspirasi/PollCard";
import { Role, FeedbackType } from "@prisma/client";

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

  const isOperator =
    dbUser.role === Role.OPERATOR || dbUser.role === Role.ADMIN;

  // Fetching data issues (public & private) dan polls secara paralel
  const [dbPublicIssues, dbPrivateIssues, dbPolls] = await Promise.all([
    prisma.feedbackIssue.findMany({
      where: { type: FeedbackType.PUBLIC_ISSUE },
      orderBy: [{ createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            classGrade: true,
          },
        },
        upvoters: {
          where: { id: dbUser.id },
          select: { id: true },
        },
        _count: {
          select: { upvoters: true },
        },
      },
    }),
    prisma.feedbackIssue.findMany({
      where: isOperator
        ? { type: FeedbackType.PRIVATE_ASPIRATION }
        : { type: FeedbackType.PRIVATE_ASPIRATION, userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            classGrade: true,
          },
        },
        upvoters: {
          where: { id: dbUser.id },
          select: { id: true },
        },
        _count: {
          select: { upvoters: true },
        },
      },
    }),
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
  ]);

  // Format data public issues dengan serialisasi ISO string
  const formattedPublicIssues: FeedbackIssueData[] = dbPublicIssues.map(
    (issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      isAnonymous: issue.isAnonymous,
      category: issue.category,
      userId: issue.userId,
      user: issue.user,
      upvotesCount: issue._count.upvoters,
      hasUpvoted: issue.upvoters.length > 0,
      operatorNotes: issue.operatorNotes,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
    })
  );

  // Format data private issues dengan serialisasi ISO string
  const formattedPrivateIssues: FeedbackIssueData[] = dbPrivateIssues.map(
    (issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      isAnonymous: issue.isAnonymous,
      category: issue.category,
      userId: issue.userId,
      user: issue.user,
      upvotesCount: issue._count.upvoters,
      hasUpvoted: issue.upvoters.length > 0,
      operatorNotes: issue.operatorNotes,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
    })
  );

  // Format data polls
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

  return (
    <AppShell user={dbUser}>
      <AspirasiClientView
        currentUser={{
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
        }}
        publicIssues={formattedPublicIssues}
        privateIssues={formattedPrivateIssues}
        polls={formattedPolls}
      />
    </AppShell>
  );
}
