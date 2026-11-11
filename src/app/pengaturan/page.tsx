import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PengaturanClientView } from "@/components/pengaturan/PengaturanClientView";
import { UserProfileData } from "@/components/pengaturan/ProfileHeroCard";
import {
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
      avatarUrl: true,
      githubUrl: true,
      instagramUrl: true,
      linkedinUrl: true,
      instansi: true,
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

  // 2. Ambil analitik presensi mandiri pengguna
  const individualStats = await getIndividualAttendanceStats(
    session.user.id,
    dbUser.classGrade,
    dbUser.role
  );

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
    avatarUrl: dbUser.avatarUrl || dbUser.image || "",
    githubUrl: dbUser.githubUrl || "",
    instagramUrl: dbUser.instagramUrl || "",
    linkedinUrl: dbUser.linkedinUrl || "",
    instansi: dbUser.instansi || "",
    createdAt: dbUser.createdAt.toISOString(),
  };

  return (
    <AppShell user={dbUser}>
      <PengaturanClientView
        user={serializedUser}
        attendanceSummary={attendanceSummary}
      />
    </AppShell>
  );
}
