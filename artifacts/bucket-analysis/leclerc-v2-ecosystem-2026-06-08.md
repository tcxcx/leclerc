# LeClerc bucket analysis v2: ecosystem completion target

Date: 2026-06-08
Branch: `feat/leclerc-scaffold`

This supersedes the first bucket analysis by adding the monorepo ecosystem
requirement: the PWA remains the runnable judged surface, while desktop and
mobile must become first-class versions sharing the same mission, alias, bounty,
wallet, QVAC, P2P, and design contracts.

Design-fetch note: `https://api.anthropic.com/v1/design/h/YjLdT50xpPVjdHjXM60kkQ?open_file=LeClerc.html`
returned 404 without auth, 404 with bearer auth, and 401 `unsupported
authentication method for HTTP endpoint` with `x-api-key` auth. No `LeClerc.html`
copy was found locally. Current implementation therefore used `docs/leclerc/DESIGN.md`
plus the explicit instruction to keep the current look and strengthen the
yellow/Ignyte accent.

## Bucket scorecard

| # | Bucket | Score | Evidence added in this pass |
|---|---|---:|---|
| HP1 | PWA judged surface | 86% | `/operaciones` route now gives the PWA the mission assigner, agent control center, story-backed defaults, notification feed, and Link-page notification sync. |
| B1 | QVAC-only inference + RAG | 86% | RAG, chat, document, capture, and QVAC proxy failures now return stable API codes; OCR/translate/MedPsy still env-gated. |
| B2 | Voice-first Cleo loop | 75% | Unchanged; real browser mic permission proof still missing. |
| B3 | Capture, encrypted dossier, wipe | 88% | Finance and intel demo seeds now come from a dedicated field-demo story fixture instead of store-inline scenario copy. |
| B4 | Analyst desk + brief export | 83% | Analyst progress, fallback copy, runtime prompt copy, tool-log notes, export labels, and tool descriptors now come from a shared analyst story; true QVAC tool-call loop still TODO. |
| B5 | Document OCR + translate | 65% | Unchanged; live model sources still missing. |
| B6 | P2P delegation + dead-drop | 81% | Ops console links missions to dead-drop intent; Link funding/drop notification payloads now persist into the ops notification feed; two-peer delegation proof still missing. |
| B7 | WDK wallet + network-token selector | 86% | Rain card and mission-funding configs now derive from shared catalogs; wallet/card/station failures, native selector state, and wallet-agent tool copy use stable network-token/story contracts. |
| B8 | Monorepo ecosystem: PWA + desktop + mobile | 76% | Shared ops-console, ops-network, mission-story, wallet selector, assistant-story, analyst-story, and wallet-tool-story contracts feed PWA, desktop/mobile scaffolds, cards, transfers, dossier routing, notifications, and SPY presets. Native adapters still missing. |
| B9 | Cleo visual identity/design system | 90% | Operations room uses stronger yellow/Ignyte bounty CTAs and state accents. Native design mirror still missing. |
| B10 | EN/ES localization | 98% | Operations story labels, notification copy, error/status states, console assistant copy, analyst/capture/dossier fallback copy, and analyst report/runtime copy are localized in EN/ES. |
| B11 | Repro, artifacts, compliance gates | 90% | Updated status notes now track field-demo fixture extraction, structured-error smoke coverage, story-owned descriptors, and notification-store bridge verification. |

## New 100% criteria for B8: monorepo ecosystem

- ✓ One shared operations model for aliases, bounties, assignments, and workspace
  invites: `packages/core/src/ops-console.ts`.
- ✓ Story-backed operations defaults instead of page-local hardcoding:
  `packages/core/src/ops-stories.ts`.
- ✓ Story-backed operations network topology for the globe and native-ready
  surface contract:
  `packages/core/src/ops-stories.ts` and `packages/core/src/ops-network.ts`.
- ✓ Shared mission-story catalog for mission IDs, dossier keywords, SPY presets,
  Rain card profile, and mission-funding metadata:
  `packages/transfer-core/src/mission-stories.ts`.
- ✓ Shared assignment, invite, and mission-funding notification helpers:
  `packages/core/src/ops-console.ts`.
- ✓ PWA route renders the operative control center and mission assigner:
  `apps/app/src/app/[locale]/operaciones/page.tsx`.
- ✓ PWA route renders a local notification feed and can merge
  `/api/mission-funding` events:
  `apps/app/src/app/[locale]/operaciones/page.tsx`.
- ✓ Link route mission funding and notification dead-drop payloads persist into
  the same operations notification feed:
  `apps/app/src/app/[locale]/enlace/page.tsx`,
  `apps/app/src/lib/ops/store-client.ts`, and
  `packages/core/src/ops-console.ts`.
- ✓ Link mission funding defaults are story-derived without pulling transfer
  execution code into the browser bundle:
  `apps/app/src/app/[locale]/enlace/page.tsx`.
- ✓ Link/dead-drop/funding route errors use stable API codes that the UI can
  translate:
  `apps/app/src/lib/api-errors.ts`.
- ✓ Wallet, Rain card, station, and wallet-agent route errors use stable API
  codes that the UI can translate:
  `apps/app/src/lib/api-errors.ts`.
- ✓ RAG, analyst brief, export, document intel, chat, capture, and QVAC proxy
  route errors use stable API codes that the UI can translate:
  `apps/app/src/lib/api-errors.ts`.
- ✓ PWA persists the ops console locally with the shared vault envelope:
  `apps/app/src/lib/ops/store-client.ts`.
- ✓ Hydrated desktop-width PWA proof:
  `artifacts/qa/2026-06-08/30-en-operations-console.png`.
- ✓ Hydrated desktop notification proof:
  `artifacts/qa/2026-06-08/31-en-operations-notifications.png`.
- ✓ Mobile-width PWA proof:
  `artifacts/qa/2026-06-08/32-mobile-operations-notifications.png`.
- ✓ Desktop scaffold imports the shared ops-console state:
  `apps/desktop/src/main.ts`.
- ✓ Mobile scaffold imports the shared ops-console state:
  `apps/mobile/src/App.ts`.
- ✓ Finance and intel demo seeds use a dedicated field-demo story fixture:
  `apps/app/src/lib/stories/field-demo-story.ts`.
- ✓ Desktop and mobile scaffolds expose the shared wallet network-token selector:
  `packages/core/src/wallet-networks.ts`, `apps/desktop/src/main.ts`, and
  `apps/mobile/src/App.ts`.
- ✓ Console greeting, starter chips, action labels, and tool labels use the
  shared assistant story contract plus EN/ES message keys:
  `packages/core/src/assistant-stories.ts` and
  `apps/app/src/app/[locale]/page.tsx`.
- ✓ Analyst progress, RAG fallback, capture fallback, and vault fallback copy use
  the shared analyst story contract plus EN/ES message keys:
  `packages/core/src/analyst-stories.ts`,
  `apps/app/src/app/[locale]/analisis/page.tsx`, and
  `apps/app/src/app/[locale]/capturar/page.tsx`.
- ✓ Analyst runtime prompts, tool-log notes, and PDF/DOCX export labels use the
  shared analyst story contract:
  `packages/core/src/analyst-stories.ts`,
  `apps/app/src/lib/agents/orchestrator.ts`, and
  `apps/app/src/lib/reports/export.tsx`.
- ✓ Analyst tool schema/core-contract descriptions use the shared analyst story
  contract:
  `packages/core/src/analyst-stories.ts`,
  `packages/core/src/agents.ts`, and
  `apps/app/src/lib/agents/tools.ts`.
- ✓ Wallet agent tool titles, tool descriptions, MCP descriptions, amount schema
  copy, and blocked swap reason use the shared wallet tool story:
  `packages/core/src/wallet-tool-stories.ts` and
  `apps/app/src/lib/agents/wallet-tools.ts`.
- ◐ Desktop does not yet vendor Electron/Pear or render a window.
- ◐ Mobile does not yet vendor Expo/React Native/Bare or render an installable app.
- ◐ Native worklet still reports `missing-adapter`, so QVAC/WDK/Hyperswarm are
  not on-device in desktop/mobile.
- ✗ Shared `@leclerc/ui` web/native component package is not implemented.
- ✓ Real PWA desktop and mobile-width screenshots exist for the operations room.
- ✗ Real native desktop/mobile screenshots or install artifacts are not present.

## Closure items to reach 100%

1. Port PearPass desktop shell: Electron/Pear runtime, renderer, bridge, and an
   operations window rendering the shared ops-console state.
2. Port PearPass mobile shell: Expo + Bare + `react-native-bare-kit` and a native
   operations screen rendering the same state.
3. Implement the native worklet adapter for QVAC, WDK, and Hyperswarm, verifying
   installed `.d.ts` and QVAC examples before each call.
4. Extract the Cleo components/tokens into `@leclerc/ui` and mirror them for RN.
5. Capture desktop and mobile artifacts: screenshots, typecheck/build logs, and
   native package proof (`.dmg`/app launch for desktop, `.ipa`/`.apk`/simulator
   install for mobile).
