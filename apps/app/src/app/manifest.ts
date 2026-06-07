import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LeClerc — Field Intelligence",
    short_name: "LeClerc",
    description:
      "Local-first field intelligence on QVAC: capture, recall, analyze, pay and dead-drop — offline.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0e14",
    theme_color: "#0a0e14",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
