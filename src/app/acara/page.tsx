import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AcaraClientView } from "@/components/acara/AcaraClientView";
import { EventDetailData } from "@/components/acara/EventDetailCard";

export const dynamic = "force-dynamic";

interface AcaraPageProps {
  searchParams?: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function AcaraPage({ searchParams }: AcaraPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialMonth = resolvedSearchParams?.month
    ? parseInt(resolvedSearchParams.month, 10) - 1
    : undefined;
  const initialYear = resolvedSearchParams?.year
    ? parseInt(resolvedSearchParams.year, 10)
    : undefined;

  // Fetching data user dan academicYear
  const [dbUser, currentAcademicYear] = await Promise.all([
    prisma.user.findUnique({
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
    }),
    prisma.academicYear.findFirst({
      where: { isCurrent: true },
    }),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  // Fallback jika belum ada tahun ajaran dengan isCurrent = true
  const activeAcademicYear =
    currentAcademicYear ||
    (await prisma.academicYear.findFirst({
      orderBy: { createdAt: "desc" },
    }));

  const academicYearId = activeAcademicYear?.id;

  // Query events & meeting dengan kueri yang aman
  const [dbEvents, latestMeeting] = 
  await Promise.all([
    prisma.event.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      orderBy: { startDate: "asc" },
      include: {
        sections: {
          include: {
            pj: {
              select: { id: true, name: true, classGrade: true, image: true },
            },
            members: {
              select: { id: true, name: true, classGrade: true, image: true },
            },
            tasks: {
              include: {
                assignee: {
                  select: { id: true, name: true },
                },
                verifiedBy: {
                  select: { id: true, name: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.meeting.findFirst({
      where: academicYearId ? { academicYearId } : undefined,
      orderBy: { date: "desc" },
      include: {
        readLogs: {
          where: { userId: dbUser.id },
        },
      },
    }),
  ]);

  // Format data events agar cocok dengan interface EventDetailData
  const events: EventDetailData[] = dbEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    startDate: ev.startDate,
    endDate: ev.endDate,
    driveUrl: ev.driveUrl,
    notulensiText: ev.notulensiText,
    sections: ev.sections.map((sec) => ({
      id: sec.id,
      name: sec.name,
      pjId: sec.pjId,
      pj: sec.pj,
      members: sec.members,
      tasks: sec.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        isSOP: task.isSOP,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        assignee: task.assignee,
        verifiedById: task.verifiedById,
        verifiedBy: task.verifiedBy,
        pointsAwarded: task.pointsAwarded,
      })),
    })),
  }));

  const formattedMeeting = latestMeeting
    ? {
        id: latestMeeting.id,
        title: latestMeeting.title,
        notes: latestMeeting.notes,
        date: latestMeeting.date,
        isRead: latestMeeting.readLogs.length > 0,
      }
    : null;

  return (
    <AppShell user={dbUser}>
      <AcaraClientView
        currentUser={{
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
        }}
        events={events}
        latestMeeting={formattedMeeting}
        initialMonth={initialMonth}
        initialYear={initialYear}
      />
    </AppShell>
  );
}
