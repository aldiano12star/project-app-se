import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan semua aset statis PWA dan berkas publik tanpa pencegatan / pengalihan 307
  const isPublicPwaFile =
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/logo.png" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/_next/") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|json)$/i.test(pathname);

  const isLoginPage = pathname === "/login";
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    isPublicPwaFile;

  // Jika aset publik atau berkas PWA, lanjutkan langsung dengan respon 200
  if (isPublicPwaFile) {
    return NextResponse.next();
  }

  // Ambil token sesi Auth.js (baik mode HTTP biasa maupun HTTPS terenkripsi)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Jika belum login dan mencoba masuk ke halaman terproteksi
  if (!sessionToken && !isLoginPage && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login dan mencoba membuka halaman login kembali
  if (sessionToken && isLoginPage) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|sw.js|icons|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|json)$).*)",
  ],
};