import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin the workspace root to the monorepo root so Next/Turbopack doesn't get
  // confused by stray lockfiles higher up the filesystem.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  // @repo/qvacs ships TypeScript source, so Next must transpile it.
  transpilePackages: ["@repo/qvacs"],
  // @qvac/sdk spawns a Bare/Node worker and pulls in native addons + bare-*
  // modules. It must never be bundled — keep it external so the route handler
  // loads it straight from node_modules and the worker files stay intact.
  serverExternalPackages: ["@qvac/sdk"],
};

export default nextConfig;
