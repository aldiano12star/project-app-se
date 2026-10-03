import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isProfileCompleted: true },
  });

  if (!dbUser?.isProfileCompleted) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
