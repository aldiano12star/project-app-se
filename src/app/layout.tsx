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
  themeColor: "#0B0F19",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Saba ExploIT - Super App Organisasi",
  description: "Portal Ekosistem & Komunitas IT SMAN 1 Bantul",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SabaExploIT",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} dark h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col antialiased">
        <ServiceWorkerRegister />
        {children}
        <InstallPWAPrompt />
      </body>
    </html>
  );
}
