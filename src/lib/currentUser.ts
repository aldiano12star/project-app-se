import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const getCurrentDbUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

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
      kasBalance: true,
      isProfileCompleted: true,
    },
  });

  return { session, dbUser };
});
