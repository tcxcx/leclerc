import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin the workspace root to the monorepo root so Next/Turbopack doesn't get
  // confused by stray lockfiles higher up the filesystem.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  // NOTE: the browser bundle no longer imports @qvac/sdk. Browser inference
  // talks to QVAC's HTTP station endpoint, while SDK calls stay in Node/Bare.
  // That keeps the PWA deployable while native surfaces use the Bare runtime.
};

export default nextConfig;
