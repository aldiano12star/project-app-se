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
import { Role } from "@prisma/client";
import { getIndividualAttendanceStats } from "@/utils/analytics";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. Ambil data profil lengkap pengguna terlebih dahulu untuk evaluasi batasan privasi angkatan
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
      status: true,
      monthlyPoints: true,
      totalPoints: true,
      noWhatsapp: true,
      portfolioUrl: true,
      nisn: true,
      kasBalance: true,
      isProfileCompleted: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  const isOfficer = dbUser.role === Role.ADMIN || dbUser.role === Role.OPERATOR;

  // 2. Ambil analitik presensi mandiri dan daftar user untuk admin secara paralel
  const [individualStats, allUsersForAdmin] = await Promise.all([
    getIndividualAttendanceStats(session.user.id, dbUser.classGrade, dbUser.role),
    isOfficer
      ? prisma.user.findMany({
          orderBy: [{ role: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            classGrade: true,
            mainDivision: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const formattedManagedUsers = allUsersForAdmin.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  // Hitung Status Tunggakan Kas Mandiri berdasarkan Saldo Dompet Kas (Fintech-grade)
  const isKasPaid = dbUser.kasBalance >= 0;
  const totalArrears = isKasPaid ? 0 : Math.abs(dbUser.kasBalance);

  const kasSummary: KasSummaryData = {
    isPaid: isKasPaid,
    totalArrears,
    unpaidPeriodNames: isKasPaid ? [] : ["Tagihan Iuran Kas"],
    paidPeriodCount: isKasPaid ? 1 : 0,
    totalPeriodCount: 1,
  };

  // Rekapitulasi Presensi Mandiri berbasis Analytics Engine
  const attendanceSummary: AttendanceSummaryData = {
    attendedCount: individualStats.attended,
    totalMeetings: individualStats.eligible,
    attendanceRate: individualStats.percentage,
    isCompliant: individualStats.percentage >= 75,
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
        managedUsers={formattedManagedUsers}
      />
    </AppShell>
  );
}
