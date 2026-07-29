import type { MetadataRoute } from "next";
import { brandAppMetadata } from "@leclerc/core/brand-stories";

export default function manifest(): MetadataRoute.Manifest {
  const brand = brandAppMetadata();

  return {
    name: brand.manifestName,
    short_name: brand.manifestShortName,
    description: brand.manifestDescription,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: brand.themeColor,
    theme_color: brand.themeColor,
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
