import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { InstallPWAPrompt } from "@/components/pwa/InstallPWAPrompt";

/* Inter — font default Saba ExploIT (DESIGN.md).
   next/font self-hosting: nol request ke Google saat runtime, tanpa layout shift. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#090D16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Saba ExploIT - Super App Organisasi",
  description: "Aplikasi mobile-first resmi ekstrakurikuler IT Saba ExploIT",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ExploIT",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <ServiceWorkerRegister />
        {children}
        <InstallPWAPrompt />
      </body>
    </html>
  );
}
