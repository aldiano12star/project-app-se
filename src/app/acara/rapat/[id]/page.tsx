import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import {
  RapatDetailClientView,
  RapatDetailData,
} from "@/components/acara/RapatDetailClientView";
import { GuestLockedView } from "@/components/ui/GuestLockedView";
import { isUserEligibleForAudience } from "@/utils/audience";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RapatDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RapatDetailPage({ params }: RapatDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Fetching data user dan data sesi rapat
  const [dbUser, dbMeeting] = await Promise.all([
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
    prisma.meeting.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        targetUsers: {
          select: { id: true },
        },
        readLogs: {
          where: { userId: session.user.id },
        },
        attendances: {
          orderBy: { checkedAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                classGrade: true,
                image: true,
                mainDivision: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  // Gatekeeper Akun GUEST
  if (dbUser.role === Role.GUEST) {
    return (
      <AppShell user={dbUser}>
        <div className="flex flex-col gap-4 pt-1">
          <section>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Detail Sesi Rapat
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Notulensi, presensi kehadiran, dan koordinasi agenda rapat organisasi.
            </p>
          </section>

          <GuestLockedView
            title="Akses Sesi Rapat Terbatas"
            description="Informasi notulensi rapat, daftar presensi kehadiran, dan materi pembahasan hanya dapat diakses oleh anggota resmi terverifikasi."
          />
        </div>
      </AppShell>
    );
  }

  if (!dbMeeting) {
    notFound();
  }

  // Validasi Hak Akses Sasaran Rapat (TargetAudience)
  const isEligible = isUserEligibleForAudience(
    dbMeeting.targetAudience,
    dbUser.role,
    dbUser.classGrade,
    dbUser.id,
    dbMeeting.targetUsers
  );

  if (!isEligible) {
    redirect("/acara");
  }

  const formattedMeeting: RapatDetailData = {
    id: dbMeeting.id,
    title: dbMeeting.title,
    date: dbMeeting.date,
    targetAudience: dbMeeting.targetAudience,
    notes: dbMeeting.notes,
    eventId: dbMeeting.eventId,
    event: dbMeeting.event,
    isRead: dbMeeting.readLogs.length > 0,
    attendances: dbMeeting.attendances.map((att) => ({
      id: att.id,
      checkedAt: att.checkedAt,
      user: att.user,
    })),
  };

  return (
    <AppShell user={dbUser}>
      <RapatDetailClientView
        currentUser={{
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
        }}
        meeting={formattedMeeting}
      />
    </AppShell>
  );
}
