import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { EventDetailClientView } from "@/components/acara/EventDetailClientView";
import { EventDetailData } from "@/components/acara/EventDetailCard";
import { BudgetItemData } from "@/components/acara/PrintRABModal";

export const dynamic = "force-dynamic";

interface AcaraDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AcaraDetailPage({ params }: AcaraDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Fetching data user, detail event + seksi + budgetItems, dan seluruh anggota secara paralel
  const [dbUser, dbEvent, dbAllMembers] = await Promise.all([
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
      },
    }),
    prisma.event.findUnique({
      where: { id },
      include: {
        budgetItems: {
          orderBy: { createdAt: "asc" },
        },
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
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        classGrade: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  if (!dbEvent) {
    notFound();
  }

  // Ambil meeting notulensi terbaru yang terkait dengan academicYear atau event
  const latestMeeting = await prisma.meeting.findFirst({
    where: { academicYearId: dbEvent.academicYearId },
    orderBy: { createdAt: "desc" },
    include: {
      readLogs: {
        where: { userId: dbUser.id },
      },
    },
  });

  const formattedEvent: EventDetailData = {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    startDate: dbEvent.startDate,
    endDate: dbEvent.endDate,
    driveUrl: dbEvent.driveUrl,
    notulensiText: dbEvent.notulensiText,
    sections: dbEvent.sections.map((sec) => ({
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
  };

  const formattedBudgetItems: BudgetItemData[] = (dbEvent.budgetItems || []).map((b) => ({
    id: b.id,
    name: b.name,
    quantity: b.quantity,
    unit: b.unit,
    estimatedPrice: b.estimatedPrice,
    totalPrice: b.totalPrice,
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
      <EventDetailClientView
        currentUser={{
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
        }}
        event={formattedEvent}
        budgetItems={formattedBudgetItems}
        allMembers={dbAllMembers}
        latestMeeting={formattedMeeting}
      />
    </AppShell>
  );
}
