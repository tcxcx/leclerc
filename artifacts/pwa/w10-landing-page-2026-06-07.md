# W10 Landing Page

Date: 2026-06-07
Branch: `feat/leclerc-scaffold`

## Implemented

- Added data-driven landing actions and surface copy in `packages/core/src/landing.ts`.
- Added `/[locale]/landing` with:
  - brand-first `LeClerc` hero
  - full-bleed Cobe operations scene, not a decorative SVG/gradient
  - operation-room CTA into the console
  - PWA manifest/install CTA
  - Expo app CTA marked pending because no native binary artifact exists in the repo
  - next-section content visible below the hero on mobile
- Added `LandingOperationsScene`, a client-only Cobe canvas using the same P2P operations network catalog as W9.
- Added ES/EN i18n strings for landing actions and surface copy.

## Smoke

- Captured screenshot artifact:
  - `artifacts/pwa/w10-landing-page-2026-06-07.png`
- Visual check: hero renders with the globe background, text is readable, CTAs fit on 390px viewport, and Expo is not presented as a completed binary download.

## Verification

```sh
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
cd apps/app && bunx playwright screenshot --viewport-size=390,1200 \
  http://localhost:7001/en/landing \
  ../../artifacts/pwa/w10-landing-page-2026-06-07.png
```

Server-only dependency grep and forbidden-inference import grep both returned empty.

## Blocked

- Downloadable Expo app binary is not present. Current repo has the native scaffold under `apps/mobile`, but no EAS/local build artifact to expose safely as a download.
