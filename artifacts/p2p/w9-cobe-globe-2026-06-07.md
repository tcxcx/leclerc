# W9 Cobe Global Operations Globe

Date: 2026-06-07
Branch: `feat/leclerc-scaffold`

## Implemented

- Verified Cobe current usage against:
  - official site `https://cobe.vercel.app`
  - Context7 `/shuding/cobe`
  - installed `apps/app/node_modules/cobe/dist/index.d.ts`
- Installed `cobe@2.0.1`.
- Added data-driven P2P operations network config in `packages/core/src/ops-network.ts`.
- Added `OperationsGlobe` client component:
  - uses `createGlobe(canvas, options)`
  - renders catalog markers and arcs
  - rotates with `globe.update({ phi })`
  - respects reduced motion by rendering without rotation
  - calls `globe.destroy()` and cancels animation on unmount
- Mounted the globe at the top of `/enlace` as the desktop/global operations view over the P2P network.

## Smoke

- Captured screenshot artifact:
  - `artifacts/p2p/w9-cobe-globe-enlace-2026-06-07.png`
- Visual check: nonblank WebGL globe, Ignyte glow, markers, arcs, and node list render correctly at a 390px mobile viewport.

## Verification

```sh
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
cd apps/app && bunx playwright install chromium
cd apps/app && bunx playwright screenshot --viewport-size=390,1200 \
  http://localhost:7001/en/enlace \
  ../../artifacts/p2p/w9-cobe-globe-enlace-2026-06-07.png
```

Server-only dependency grep and forbidden-inference import grep both returned empty.
