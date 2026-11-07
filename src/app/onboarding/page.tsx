import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      fullName: true,
      email: true,
      image: true,
      isProfileCompleted: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Jika sudah melengkapi profil, langsung bawa ke dashboard
  if (dbUser.isProfileCompleted) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell flex min-h-screen flex-col items-center justify-center p-4">
      <OnboardingForm
        initialName={dbUser.fullName || dbUser.name || ""}
        userEmail={dbUser.email}
        userImage={dbUser.image}
      />
    </main>
  );
}
