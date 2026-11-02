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
import { Role, TargetAudience } from "@prisma/client";

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
                role: true,
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

  // Ambil daftar seluruh anggota yang berhak hadir berdasarkan targetAudience rapat
  let eligibleWhere: Record<string, unknown> = {
    status: "ACTIVE",
    role: { not: Role.GUEST },
  };

  if (dbMeeting.targetAudience === TargetAudience.CUSTOM) {
    eligibleWhere = {
      id: { in: dbMeeting.targetUsers.map((u) => u.id) },
    };
  } else if (dbMeeting.targetAudience === TargetAudience.GEN_20) {
    eligibleWhere = {
      status: "ACTIVE",
      role: { not: Role.GUEST },
      OR: [
        { gen: 20 },
        { generationNumber: 20 },
        { classGrade: "KELAS_11" },
        { kelas: { contains: "11" } },
        { kelas: "XI" },
      ],
    };
  } else if (dbMeeting.targetAudience === TargetAudience.GEN_21) {
    eligibleWhere = {
      status: "ACTIVE",
      role: { not: Role.GUEST },
      OR: [
        { gen: 21 },
        { generationNumber: 21 },
        { classGrade: "KELAS_10" },
        { kelas: { contains: "10" } },
        { kelas: "X" },
      ],
    };
  } else {
    // ALL: Seluruh anggota aktif selain GUEST dan KOLABORATOR
    eligibleWhere = {
      status: "ACTIVE",
      role: { notIn: [Role.GUEST, Role.KOLABORATOR] },
    };
  }

  const eligibleUsers = await prisma.user.findMany({
    where: eligibleWhere,
    select: {
      id: true,
      name: true,
      classGrade: true,
      kelas: true,
      gen: true,
      generationNumber: true,
      image: true,
      mainDivision: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  // Petakan record presensi yang sudah tercatat
  const attendanceMap = new Map(
    dbMeeting.attendances.map((a) => [a.userId, a])
  );

  // Gabungkan seluruh anggota yang berhak dan peserta ad-hoc
  const allTableMembers = [
    ...eligibleUsers.map((user) => {
      const att = attendanceMap.get(user.id);
      return {
        id: att?.id || `unrecorded-${user.id}`,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          classGrade: user.classGrade,
          kelas: user.kelas,
          gen: user.gen ?? user.generationNumber,
          image: user.image,
          mainDivision: user.mainDivision,
          role: user.role,
        },
        status: att?.status || null,
        checkedAt: att?.checkedAt || null,
        isManual: att?.isManual || false,
      };
    }),
    ...dbMeeting.attendances
      .filter((a) => !eligibleUsers.some((u) => u.id === a.userId))
      .map((att) => ({
        id: att.id,
        userId: att.userId,
        user: {
          id: att.user.id,
          name: att.user.name,
          classGrade: att.user.classGrade,
          kelas: null,
          gen: null,
          image: att.user.image,
          mainDivision: att.user.mainDivision,
          role: att.user.role || Role.MEMBER,
        },
        status: att.status,
        checkedAt: att.checkedAt,
        isManual: att.isManual,
      })),
  ];

  const formattedMeeting: RapatDetailData = {
    id: dbMeeting.id,
    title: dbMeeting.title,
    date: dbMeeting.date,
    targetAudience: dbMeeting.targetAudience,
    notes: dbMeeting.notes,
    eventId: dbMeeting.eventId,
    event: dbMeeting.event,
    isRead: dbMeeting.readLogs.length > 0,
    attendances: allTableMembers,
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
