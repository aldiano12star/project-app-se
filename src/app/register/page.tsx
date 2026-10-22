import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell flex min-h-screen flex-col justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto mb-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Masuk</span>
        </Link>
      </div>
      <RegisterForm />
    </main>
  );
}
