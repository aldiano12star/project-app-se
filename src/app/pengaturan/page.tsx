import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PengaturanClientView } from "@/components/pengaturan/PengaturanClientView";
import { UserProfileData } from "@/components/pengaturan/ProfileHeroCard";
import {
  KasSummaryData,
  AttendanceSummaryData,
} from "@/components/pengaturan/PersonalSummarySection";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ambil data profil lengkap, riwayat kas mandiri, dan riwayat presensi mandiri
  const [
    dbUser,
    kasPeriods,
    userKasPayments,
    attendedCount,
    totalMeetings,
  ] = await Promise.all([
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
        status: true,
        monthlyPoints: true,
        totalPoints: true,
        noWhatsapp: true,
        portfolioUrl: true,
        nisn: true,
        createdAt: true,
      },
    }),
    prisma.kasPeriod.findMany({
      orderBy: { periodNumber: "asc" },
      select: {
        id: true,
        name: true,
        amount: true,
        periodNumber: true,
      },
    }),
    prisma.kasPayment.findMany({
      where: { userId: session.user.id },
      select: {
        kasPeriodId: true,
        amountPaid: true,
      },
    }),
    prisma.attendance.count({
      where: {
        userId: session.user.id,
        status: "HADIR",
      },
    }),
    prisma.meeting.count(),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  // Hitung Status Tunggakan Kas Mandiri
  const paidPeriodIds = new Set(userKasPayments.map((p) => p.kasPeriodId));
  const unpaidPeriods = kasPeriods.filter((p) => !paidPeriodIds.has(p.id));
  const totalArrears = unpaidPeriods.reduce((sum, p) => sum + p.amount, 0);
  const isKasPaid = unpaidPeriods.length === 0;

  const kasSummary: KasSummaryData = {
    isPaid: isKasPaid,
    totalArrears,
    unpaidPeriodNames: unpaidPeriods.map((p) => p.name),
    paidPeriodCount: userKasPayments.length,
    totalPeriodCount: kasPeriods.length,
  };

  // Hitung Rekapitulasi Presensi Mandiri
  const effectiveTotalMeetings = Math.max(totalMeetings, attendedCount);
  const attendanceRate =
    effectiveTotalMeetings > 0
      ? Math.round((attendedCount / effectiveTotalMeetings) * 100)
      : 100;
  const isCompliant = attendanceRate >= 75;

  const attendanceSummary: AttendanceSummaryData = {
    attendedCount,
    totalMeetings: effectiveTotalMeetings,
    attendanceRate,
    isCompliant,
  };

  const serializedUser: UserProfileData = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image,
    role: dbUser.role,
    classGrade: dbUser.classGrade,
    mainDivision: dbUser.mainDivision,
    totalPoints: dbUser.totalPoints,
    monthlyPoints: dbUser.monthlyPoints,
    noWhatsapp: dbUser.noWhatsapp || "",
    portfolioUrl: dbUser.portfolioUrl || "",
    nisn: dbUser.nisn || "",
    createdAt: dbUser.createdAt.toISOString(),
  };

  return (
    <AppShell user={dbUser}>
      <PengaturanClientView
        user={serializedUser}
        kasSummary={kasSummary}
        attendanceSummary={attendanceSummary}
      />
    </AppShell>
  );
}
