import Image from "next/image";
import { signIn } from "@/auth";
import { AlertTriangle, MessageCircle } from "lucide-react";

interface LoginPageProps {
  searchParams?: Promise<{
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorType = resolvedSearchParams?.error;

  const adminWa = process.env.NEXT_PUBLIC_ADMIN_WA || "6281234567890";
  const helpMessage = encodeURIComponent(
    "Halo Pengurus SE-Core, saya butuh bantuan terkait akses login ke aplikasi."
  );
  const waHelpUrl = `https://wa.me/${adminWa}?text=${helpMessage}`;

  return (
    <main className="app-shell flex min-h-screen flex-col justify-center px-4 sm:px-6 py-8 relative">
      <div className="glass-surface-subtle dark:bg-[#1C1C1F]/90 rounded-3xl p-7 sm:p-9 text-center border hairline-border shadow-xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header with Squircle Logo */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container/80 dark:bg-white/5 border border-edge/60 dark:border-white/10 shadow-sm p-3 relative z-10">
          <Image
            src="/logo.png"
            alt="Logo SE-Core"
            width={64}
            height={64}
            priority
            className="object-contain h-full w-full drop-shadow-sm"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-display relative z-10">
          SE-Core
        </h1>

        {/* Pill Badge */}
        <div className="mt-2.5 flex justify-center relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-semibold text-primary font-mono tracking-wider uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            SMAN 1 Bantul • Musim 2025/2026
          </span>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-ink-muted leading-relaxed relative z-10 font-body">
          Portal Kegiatan, Presensi &amp; Kolaborasi Anggota
        </p>

        {/* Alert Error Konfigurasi / Login */}
        {errorType && (
          <div className="mt-4 p-3.5 rounded-2xl bg-danger-subtle/50 dark:bg-danger-subtle/20 border border-danger/25 text-xs text-danger flex items-center gap-2.5 text-left relative z-10">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            <span className="leading-relaxed">
              {errorType === "Configuration"
                ? "Konfigurasi OAuth Google atau Secret belum lengkap di Environment Variables."
                : errorType === "AccessDenied"
                ? "Akses login ditolak. Pastikan kamu menggunakan email aktif yang terdaftar."
                : `Terjadi kendala autentikasi (${errorType}).`}
            </span>
          </div>
        )}

        {/* Login Action via Server Action (Google OAuth Only) */}
        <div className="mt-6 space-y-3.5 relative z-10">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white text-zinc-900 border border-zinc-200/90 hover:bg-zinc-50 active:scale-[0.98] font-semibold text-sm shadow-xs transition-all duration-150 tactile-btn cursor-pointer"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Akun Google</span>
            </button>
          </form>

          {/* Helper Text Resmi Single-Sign-On */}
          <p className="text-xs text-ink-muted leading-relaxed">
            Gunakan akun Google kamu untuk masuk atau mendaftar secara otomatis.
          </p>

          {/* Login Assistance Button (Mitigasi Lupa Akses) */}
          <div className="pt-1.5">
            <a
              href={waHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border hairline-border bg-surface-container-low/70 hover:bg-surface-container text-xs font-semibold text-ink-secondary hover:text-ink transition-all active:scale-[0.98] cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Butuh Bantuan Akses? Hubungi Pengurus</span>
            </a>
          </div>
        </div>

        <p className="mt-6 pt-4 border-t hairline-border text-xs text-ink-muted leading-relaxed">
          Akses dibatasi khusus untuk anggota aktif dan pengurus resmi Saba ExploIT.
        </p>
      </div>
    </main>
  );
}