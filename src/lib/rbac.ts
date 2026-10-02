import { auth } from "@/auth";
import { Role, MemberStatus } from "@prisma/client";

export async function assertAuthenticated() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED: Sesi Anda tidak valid atau telah kedaluwarsa.");
  }
  return session.user;
}

export async function assertRole(allowedRoles: Role[]) {
  const user = await assertAuthenticated();
  // Bypass Otomatis untuk OPERATOR (Developer God-Mode)
  if (user.role === Role.OPERATOR) return user;

  if (!allowedRoles.includes(user.role as Role)) {
    throw new Error("FORBIDDEN: Anda tidak memiliki izin untuk aksi ini.");
  }
  return user;
}

export async function assertActiveMember() {
  const user = await assertAuthenticated();
  if (user.role === Role.OPERATOR) return user;

  if (user.status !== MemberStatus.ACTIVE) {
    throw new Error("FORBIDDEN: Akun demisioner/alumni hanya memiliki hak baca.");
  }
  return user;
}
