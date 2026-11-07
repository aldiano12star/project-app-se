import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/currentUser";
import { AppShell } from "@/components/layout/AppShell";
import { AcaraClientView } from "@/components/acara/AcaraClientView";
import { EventDetailData, NestedMeetingData } from "@/components/acara/EventDetailCard";
import { GuestLockedView } from "@/components/ui/GuestLockedView";
import { buildAudienceFilter } from "@/utils/audience";
import { Role, AttendanceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface AcaraPageProps {
  searchParams?: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function AcaraPage({ searchParams }: AcaraPageProps) {
  const current = await getCurrentDbUser();

  if (!current?.session?.user?.id || !current.dbUser) {
    redirect("/login");
  }

  const { dbUser } = current;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialMonth = resolvedSearchParams?.month
    ? parseInt(resolvedSearchParams.month, 10) - 1
    : undefined;
  const initialYear = resolvedSearchParams?.year
    ? parseInt(resolvedSearchParams.year, 10)
    : undefined;

  const currentAcademicYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  });

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  // Gatekeeper: Akun GUEST (Menunggu Verifikasi) tidak dapat melihat kalender kegiatan
  if (dbUser.role === Role.GUEST) {
    return (
      <AppShell user={dbUser}>
        <div className="flex flex-col gap-4 pt-1">
          <section>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Modul Acara &amp; Kepanitiaan
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Pusat kalender agenda, timeline sirkuit terpadu, dan koordinasi kepanitiaan organisasi.
            </p>
          </section>

          <GuestLockedView
            title="Akses Kalender Acara Terbatas"
            description="Informasi kalender agenda, sesi rapat pleno, timeline sirkuit kegiatan, dan kepanitiaan hanya dapat diakses oleh anggota resmi terverifikasi."
          />
        </div>
      </AppShell>
    );
  }

  // Fallback jika belum ada tahun ajaran dengan isCurrent = true
  const activeAcademicYear =
    currentAcademicYear ||
    (await prisma.academicYear.findFirst({
      orderBy: { createdAt: "desc" },
    }));

  const academicYearId = activeAcademicYear?.id;

  // Filter Target Audience berdasarkan Role, ClassGrade, dan Custom Many-to-Many Users
  const audienceFilter = buildAudienceFilter(dbUser.role, dbUser.classGrade, dbUser.id);
  const isOfficer = dbUser.role === Role.ADMIN || dbUser.role === Role.OPERATOR;

  // Query events (dengan child meetings), independent meetings, dan seluruh anggota aktif
  const [dbEvents, dbIndependentMeetings, latestMeeting, allMembers] =
  await Promise.all([
    prisma.event.findMany({
      where: {
        ...(academicYearId ? { academicYearId } : {}),
        ...audienceFilter,
      },
      orderBy: { startDate: "asc" },
      include: {
        targetUsers: {
          select: { id: true },
        },
        meetings: {
          where: audienceFilter,
          orderBy: { date: "asc" },
          include: {
            targetUsers: {
              select: { id: true },
            },
            readLogs: {
              where: { userId: dbUser.id },
            },
            attendances: {
              where: { userId: dbUser.id },
            },
          },
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
    prisma.meeting.findMany({
      where: {
        ...(academicYearId ? { academicYearId } : {}),
        eventId: null,
        ...audienceFilter,
      },
      orderBy: { date: "desc" },
      include: {
        targetUsers: {
          select: { id: true },
        },
        readLogs: {
          where: { userId: dbUser.id },
        },
        attendances: {
          where: { userId: dbUser.id },
        },
      },
    }),
    prisma.meeting.findFirst({
      where: {
        ...(academicYearId ? { academicYearId } : {}),
        ...audienceFilter,
      },
      orderBy: { date: "desc" },
      include: {
        readLogs: {
          where: { userId: dbUser.id },
        },
      },
    }),
    isOfficer
      ? prisma.user.findMany({
          where: {
            status: "ACTIVE",
            role: {
              in: [
                Role.MEMBER,
                Role.KOLABORATOR,
                Role.BENDAHARA,
                Role.ADMIN,
                Role.OPERATOR,
              ],
            },
          },
          select: {
            id: true,
            name: true,
            role: true,
            classGrade: true,
            mainDivision: true,
          },
          orderBy: [{ role: "asc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  // Format data events (Mega-Cards) dengan nested children meetings
  const events: EventDetailData[] = dbEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    startDate: ev.startDate,
    endDate: ev.endDate,
    targetAudience: ev.targetAudience,
    targetUserIds: ev.targetUsers.map((u) => u.id),
    driveUrl: ev.driveUrl,
    notulensiText: ev.notulensiText,
    meetings: ev.meetings.map((m) => {
      const userAtt = m.attendances[0];
      const isPast = new Date(m.date).getTime() + 2 * 60 * 60 * 1000 < Date.now();
      const status = userAtt ? userAtt.status : isPast ? AttendanceStatus.ALPHA : null;
      return {
        id: m.id,
        title: m.title,
        date: m.date,
        targetAudience: m.targetAudience,
        targetUserIds: m.targetUsers.map((u) => u.id),
        notes: m.notes,
        eventId: m.eventId,
        isRead: m.readLogs.length > 0,
        isAttended: userAtt?.status === AttendanceStatus.HADIR,
        attendanceStatus: status,
      };
    }),
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

  // Format rapat mandiri (Independent Meetings)
  const independentMeetings: NestedMeetingData[] = dbIndependentMeetings.map((m) => {
    const userAtt = m.attendances[0];
    const isPast = new Date(m.date).getTime() + 2 * 60 * 60 * 1000 < Date.now();
    const status = userAtt ? userAtt.status : isPast ? AttendanceStatus.ALPHA : null;
    return {
      id: m.id,
      title: m.title,
      date: m.date,
      targetAudience: m.targetAudience,
      targetUserIds: m.targetUsers.map((u) => u.id),
      notes: m.notes,
      eventId: null,
      isRead: m.readLogs.length > 0,
      isAttended: userAtt?.status === AttendanceStatus.HADIR,
      attendanceStatus: status,
    };
  });

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
        independentMeetings={independentMeetings}
        allMembers={allMembers}
        latestMeeting={formattedMeeting}
        initialMonth={initialMonth}
        initialYear={initialYear}
      />
    </AppShell>
  );
}
