import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import {
  UserManagementClientView,
  ManagedUser,
} from "@/components/operator/UserManagementClientView";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Akun & Role — Operator Saba ExploIT",
  description: "Aktivasi akun tamu, filter angkatan dinamis, dan manajemen role pengguna.",
};

export default async function OperatorUserManagementPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

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

  // Wewenang khusus Role OPERATOR & ADMIN
  const isOfficer = dbUser.role === Role.ADMIN || dbUser.role === Role.OPERATOR;
  if (!isOfficer) {
    redirect("/dashboard");
  }

  // Ambil data seluruh pengguna sistem
  const allUsers = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      classGrade: true,
      gen: true,
      generationNumber: true,
      mainDivision: true,
      status: true,
      noWhatsapp: true,
      asalTujuan: true,
      createdAt: true,
    },
  });

  const formattedUsers: ManagedUser[] = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    classGrade: u.classGrade,
    gen: u.gen,
    generationNumber: u.generationNumber,
    mainDivision: u.mainDivision,
    status: u.status,
    noWhatsapp: u.noWhatsapp,
    asalTujuan: u.asalTujuan,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <AppShell user={dbUser}>
      <UserManagementClientView
        currentUserRole={dbUser.role}
        users={formattedUsers}
      />
    </AppShell>
  );
}
