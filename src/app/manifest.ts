import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Saba ExploIT - Super App Organisasi",
    short_name: "ExploIT",
    description: "Aplikasi mobile-first resmi ekstrakurikuler IT Saba ExploIT",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090D16",
    theme_color: "#090D16",
    categories: ["education", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
