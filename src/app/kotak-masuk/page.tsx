import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/currentUser";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { MailboxClientView } from "@/components/notifications/MailboxClientView";

export const dynamic = "force-dynamic";

export default async function KotakMasukPage() {
  const current = await getCurrentDbUser();

  if (!current?.session?.user?.id || !current.dbUser) {
    redirect("/login");
  }

  const { dbUser } = current;

  if (!dbUser.isProfileCompleted) {
    redirect("/onboarding");
  }

  // Ambil data notifikasi personal pengguna
  const notifications = await prisma.notification.findMany({
    where: { userId: dbUser.id },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  return (
    <AppShell user={dbUser}>
      <MailboxClientView initialNotifications={notifications} />
    </AppShell>
  );
}
