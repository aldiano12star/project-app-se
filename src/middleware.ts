import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Ambil token sesi Auth.js (baik mode HTTP biasa maupun HTTPS terenkripsi)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isPublicPage = pathname === "/" || pathname.startsWith("/api/auth");

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};