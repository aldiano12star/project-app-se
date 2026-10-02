import Image from "next/image";
import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="app-shell flex min-h-screen flex-col justify-center px-6 py-12">
      <div className="card-solid p-8 text-center shadow-none rounded-3xl border border-edge">
        {/* Brand Header with Squircle Logo */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-low border border-edge ring-4 ring-primary/10 shadow-xs p-2.5">
          <Image
            src="/logo.png"
            alt="Saba ExploIT Logo"
            width={64}
            height={64}
            priority
            className="object-contain h-full w-full"
          />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Saba ExploIT
        </h1>

        {/* Pill Badge */}
        <div className="mt-2 flex justify-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
            SMAN 1 Bantul • Musim 2026/2027
          </span>
        </div>

        <p className="mt-2.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
          Portal Kegiatan, Presensi &amp; Kolaborasi Anggota
        </p>

        {/* Login Action via Server Action */}
        <div className="mt-8">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="flex h-11 min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-edge bg-white px-4 text-neutral-900 font-semibold transition-all hover:bg-neutral-50 active:scale-[0.99] cursor-pointer shadow-xs"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
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
        </div>

        <p className="mt-6 text-xs text-ink-muted">
          Akses dibatasi khusus untuk anggota aktif dan pengurus resmi Saba ExploIT.
        </p>
      </div>
    </main>
  );
}