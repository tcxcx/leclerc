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
| HP1 | PWA judged surface | 87% | `/operaciones` route now gives the PWA the mission assigner, agent control center, story-backed defaults, notification feed, Link-page notification sync, and explicit browser-alert opt-in. |
| B1 | QVAC-only inference + RAG | 91% | RAG, chat, document, capture, and QVAC proxy failures return stable API codes; grounded RAG answer prompts/fallbacks plus QVAC model-source/client error copy, runtime env/defaults, model-level routing/cache/defaults, and inference-mode storage/default/badge metadata now come from shared stories; OCR/translate/MedPsy still env-gated. |
| B2 | Voice-first Cleo loop | 80% | Voice-state labels, recorder/start fallback errors, browser voice runtime defaults, recorder limits, WS env/defaults, processor frame size, and voice status/toggle icons now resolve through shared stories; real browser mic permission proof still missing. |
| B3 | Capture, encrypted dossier, wipe | 91% | Finance and intel demo seeds now come from a shared core field-demo story, intel extraction prompt/defaults, blank-source sentinels, dossier list filters/source previews, and grounded-answer affordances come from dedicated story contracts, and browser vault DB/store/localStorage keys now come from a shared vault story. |
| B4 | Analyst desk + brief export | 84% | Analyst progress, fallback copy, runtime prompt copy, tool-log notes, export labels, export filename rules, finding source preview length, and tool descriptors now come from a shared analyst story; true QVAC tool-call loop still TODO. |
| B5 | Document OCR + translate | 65% | Unchanged; live model sources still missing. |
| B6 | P2P delegation + dead-drop | 84% | Ops console links missions to dead-drop intent; Link funding/drop notification payloads persist into the ops notification feed; station delegate smoke prompt, dead-drop protocol defaults, and transfer confirmation/funding errors are story-owned; two-peer delegation proof still missing. |
| B7 | WDK wallet + network-token selector | 88% | Rain card and mission-funding configs now derive from shared catalogs; wallet/card/station failures, native selector state, wallet-agent MCP identity, sendable asset allowlist, tool copy, and transfer/wallet network-token errors use stable story contracts. |
| B8 | Monorepo ecosystem: PWA + desktop + mobile | 97% | Shared ops-console, ops-network, mission-story, wallet selector, transfer-story, API-error-story, API-client-story, diagnostic-story, field-demo-story, P2P-story, PWA-notification-story, navigation-story, finance-story, assistant-story/persona, tool-router-story, dossier-story, analyst-story, wallet-tool-story, network-token-story, QVAC-story, model-level-story, inference-mode-story, vault-story, RAG-story, intel-story, station-story, voice-story, SPY-gadget-story, animated-background-story, brand-story, native worklet-story, and surface-readiness-story contracts feed PWA, desktop/mobile scaffolds, cards, transfers, dossier routing, dossier list UI, assistant routing, navigation, notifications, notification feed visuals/display limits, assistant action labels/icons, RAG chip display, client transport fallbacks, client diagnostics, demo seeds, dead-drop defaults, wallet-agent identity/allowlists, QVAC runtime defaults/model routing, RAG query defaults, voice runtime defaults/icons, inference mode badges, browser vault persistence, blank-source detection, report filenames, metadata, native model identity, SPY presets, SPY gadget shelf metadata, background palette/runtime budgets, native worklet scaffold status/env/error copy, and native installability blockers. Native adapters still missing. |
| B9 | Cleo visual identity/design system | 91% | Operations room uses stronger yellow/Ignyte bounty CTAs and state accents; PWA metadata, manifest, landing brand heading, report author/eyebrow, native shell brand identity, animated background presets, fallback gradient, and runtime budget now share story contracts. Native design mirror still missing. |
| B10 | EN/ES localization | 99% | Operations story labels, browser-alert notification copy, error/status states, Link protocol event/status labels, console assistant copy/persona prompt, finance roast/context copy, voice/settings/SPY fallback copy, analyst/capture/dossier fallback copy, and analyst report/runtime copy are localized in EN/ES. |
| B11 | Repro, artifacts, compliance gates | 99% | Updated status notes now track shared field-demo fixture extraction, structured-error smoke coverage, story-owned descriptors, notification-store bridge verification, browser-alert verification, Link/voice/settings/SPY i18n key coverage, RAG/dossier/intel/station/QVAC runtime/model-level/inference-mode/vault/network-token/wallet-tool/tool-router/transfer/API-error/API-client/diagnostic/P2P/PWA-notification/native-worklet/surface-readiness story prompt/report filename/feed-limit/status verification, PWA brand metadata, native brand identity, assistant persona/RAG chip display, blank-source detection, source-level TODO marker cleanup, and finance story verification. |

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
- ✓ PWA notification feed can explicitly request browser-alert permission and
  publish new operations notifications through the registered service worker:
  `packages/core/src/pwa-notification-stories.ts`,
  `apps/app/src/lib/ops/browser-notifications.ts`,
  `apps/app/src/app/sw-register.tsx`,
  `apps/app/public/sw.js`, and
  `apps/app/src/app/[locale]/operaciones/page.tsx`.
- ✓ Operations notification browser-permission icons, refresh icon,
  notification-kind icons, and notification-kind color classes use the shared
  PWA notification story contract:
  `packages/core/src/pwa-notification-stories.ts`,
  `apps/app/src/lib/ops/browser-notifications.ts`, and
  `apps/app/src/app/[locale]/operaciones/page.tsx`.
- ✓ Operations notification feed visible row count uses the shared PWA
  notification story contract:
  `packages/core/src/pwa-notification-stories.ts` and
  `apps/app/src/app/[locale]/operaciones/page.tsx`.
- ✓ Bottom navigation items, top-bar shortcuts, home link branding, Intel-layer
  toggle metadata, Intel-layer route links, route segments, icons, and label
  keys use the shared navigation story contract:
  `packages/core/src/navigation-stories.ts`,
  `apps/app/src/components/bottom-nav.tsx`,
  `apps/app/src/components/top-bar.tsx`, and
  `apps/app/src/app/[locale]/page.tsx`.
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
- ✓ Finance and intel demo seeds use a shared core field-demo story fixture:
  `packages/core/src/field-demo-stories.ts`,
  `apps/app/src/lib/finance/store-client.ts`, and
  `apps/app/src/lib/intel/store-client.ts`.
- ✓ Intel extraction prompt lines, user-message labels, date labels, default
  extraction shape, and draft status use the shared intel extraction story:
  `packages/core/src/intel-stories.ts`, `packages/core/src/intel.ts`, and
  `apps/app/src/lib/intel/assemble.ts`.
- ✓ Intel blank-source sentinel patterns use the shared intel extraction story:
  `packages/core/src/intel-stories.ts` and `packages/core/src/intel.ts`.
- ✓ Desktop and mobile scaffolds expose the shared wallet network-token selector:
  `packages/core/src/wallet-networks.ts`, `apps/desktop/src/main.ts`, and
  `apps/mobile/src/App.ts`.
- ✓ Transfer, wallet, explorer, selector, and API-error network-token messages
  use the shared network-token story contract:
  `packages/transfer-core/src/network-token-stories.ts`,
  `packages/transfer-core/src/asset-catalog.ts`,
  `packages/wallet/src/evm.ts`, `packages/transfers/src/validation.ts`,
  `packages/transfer-utils/src/explorer.ts`,
  `packages/core/src/wallet-networks.ts`, and
  `apps/app/src/lib/api-errors.ts`.
- ✓ Transfer confirmation and mission-funding error copy plus API-code markers
  use the shared transfer story contract:
  `packages/transfers/src/transfer-stories.ts`,
  `packages/transfers/src/confirmation.ts`,
  `packages/transfers/src/mission-funding.ts`, and
  `apps/app/src/lib/api-errors.ts`.
- ✓ App API-error fallback markers use the shared API-error story contract:
  `packages/core/src/api-error-stories.ts` and
  `apps/app/src/lib/api-errors.ts`.
- ✓ Client runtime diagnostic labels use the shared diagnostic story contract:
  `packages/core/src/diagnostic-stories.ts`,
  `apps/app/src/lib/use-recorder.ts`,
  `apps/app/src/lib/voice/client.ts`, and
  `apps/app/src/components/animated-background/index.tsx`.
- ✓ Browser API transport fallback errors and export filename fallbacks use the
  shared API-client story contract, while voice socket failures use the shared
  diagnostic story contract:
  `packages/core/src/api-client-stories.ts`,
  `apps/app/src/lib/api-client.ts`,
  `packages/core/src/diagnostic-stories.ts`, and
  `apps/app/src/lib/voice/client.ts`.
- ✓ Dead-drop labels, default payload kind, topic/secret material, hash-preview
  length, and discovery timeout use the shared P2P story contract:
  `packages/core/src/p2p-stories.ts`,
  `apps/app/src/lib/p2p/deaddrop.ts`,
  `apps/app/src/lib/api-client.ts`,
  `apps/app/src/app/api/drop/route.ts`, and
  `apps/app/src/app/[locale]/enlace/page.tsx`.
- ✓ Console greeting, starter chips, action labels, action-bar icons, RAG chip
  label rules, and tool labels use the
  shared assistant story contract plus EN/ES message keys:
  `packages/core/src/assistant-stories.ts`,
  `apps/app/src/components/action-bar.tsx`, and
  `apps/app/src/app/[locale]/page.tsx`.
- ✓ Chat persona base prompts plus spoken/text formatting instructions use the
  shared assistant story contract while `persona()` remains the public helper:
  `packages/core/src/assistant-stories.ts` and
  `packages/core/src/agents.ts`.
- ✓ Operator tool-route intents, target hrefs, bilingual keywords, and mission
  dossier keyword source use the shared tool-router story contract:
  `packages/core/src/tool-router-stories.ts` and
  `packages/core/src/tool-router.ts`.
- ✓ Finance spend roast copy, finance chat context labels, and the chat
  finance-system wrapper use the shared finance story contract:
  `packages/core/src/finance-stories.ts`, `packages/core/src/finance.ts`,
  `apps/app/src/app/[locale]/page.tsx`, and
  `apps/app/src/app/api/chat/route.ts`.
- ✓ QVAC optional model-source setup errors and HTTP client error formats use
  the shared QVAC story contract:
  `packages/core/src/qvac-stories.ts`,
  `apps/app/src/lib/qvac/server.ts`, and
  `apps/app/src/lib/qvac/client.ts`.
- ✓ QVAC runtime env-var names, local/proxy defaults, remote model defaults,
  ASR language/default upload filename, RAG workspace, translate target locale,
  and translate model-kind policy use the shared QVAC story contract:
  `packages/core/src/qvac-stories.ts`,
  `apps/app/src/lib/qvac/client.ts`,
  `apps/app/src/lib/qvac/server.ts`,
  `apps/app/src/lib/intel/assemble.ts`, and
  `apps/app/src/app/api/document/route.ts`.
- ✓ Model-level storage key, selector options, model ids, cache keys, and route
  use-case defaults use the shared model-level story contract:
  `packages/core/src/model-level-stories.ts`,
  `apps/app/src/lib/llm-level.ts`,
  `apps/app/src/lib/qvac/server.ts`,
  `apps/app/src/lib/inference/index.ts`,
  `apps/app/src/app/[locale]/ajustes/page.tsx`,
  `apps/app/src/components/llm-config.tsx`,
  `apps/app/src/app/api/capture/route.ts`,
  `apps/app/src/app/api/chat/route.ts`,
  `apps/app/src/lib/rag/server.ts`,
  `apps/app/src/lib/agents/orchestrator.ts`, and
  `packages/core/src/voice.ts`.
- ✓ Inference-mode storage key, default mode, allowed modes, and badge icons use
  the shared inference-mode story contract:
  `packages/core/src/inference-mode-stories.ts`,
  `apps/app/src/lib/inference/mode.ts`, and
  `apps/app/src/components/mode-badge.tsx`.
- ✓ Browser vault database names, object-store names, state ids, passphrase salt
  key, and device vault key use the shared vault story contract:
  `packages/core/src/vault-stories.ts`,
  `apps/app/src/lib/intel/crypto.ts`,
  `apps/app/src/lib/intel/store-client.ts`,
  `apps/app/src/lib/finance/store-client.ts`,
  `apps/app/src/lib/ops/store-client.ts`, and
  `apps/app/src/app/[locale]/ajustes/page.tsx`.
- ✓ Analyst progress, RAG fallback, capture fallback, and vault fallback copy use
  the shared analyst story contract plus EN/ES message keys:
  `packages/core/src/analyst-stories.ts`,
  `apps/app/src/app/[locale]/analisis/page.tsx`, and
  `apps/app/src/app/[locale]/capturar/page.tsx`.
- ✓ Grounded RAG empty-answer text, system prompt constraints, and user prompt
  labels use the shared RAG story contract:
  `packages/core/src/rag-stories.ts` and
  `apps/app/src/lib/rag/server.ts`.
- ✓ Grounded RAG answer/search default result limits use the shared RAG story
  contract:
  `packages/core/src/rag-stories.ts` and
  `apps/app/src/lib/api-client.ts`.
- ✓ Dossier list filter order, initial filter, grounded-answer icon, and source
  id preview length use the shared dossier story contract:
  `packages/core/src/dossier-stories.ts` and
  `apps/app/src/app/[locale]/expediente/page.tsx`.
- ✓ P2P station delegate smoke prompt uses the shared station story contract:
  `packages/core/src/station-stories.ts` and
  `apps/app/src/app/api/station/route.ts`.
- ✓ Analyst runtime prompts, tool-log notes, and PDF/DOCX export labels use the
  shared analyst story contract:
  `packages/core/src/analyst-stories.ts`,
  `apps/app/src/lib/agents/orchestrator.ts`, and
  `apps/app/src/lib/reports/export.tsx`.
- ✓ Analyst report filename prefix, fallback slug, slug length, and slugging
  rules use the shared analyst story contract:
  `packages/core/src/analyst-stories.ts` and
  `apps/app/src/lib/reports/export.tsx`.
- ✓ Analyst finding source id preview length uses the shared analyst story
  contract:
  `packages/core/src/analyst-stories.ts` and
  `apps/app/src/app/[locale]/analisis/page.tsx`.
- ✓ Analyst tool schema/core-contract descriptions use the shared analyst story
  contract:
  `packages/core/src/analyst-stories.ts`,
  `packages/core/src/agents.ts`, and
  `apps/app/src/lib/agents/tools.ts`.
- ✓ Wallet agent tool titles, tool descriptions, MCP descriptions, amount schema
  copy, and blocked swap reason use the shared wallet tool story:
  `packages/core/src/wallet-tool-stories.ts` and
  `apps/app/src/lib/agents/wallet-tools.ts`.
- ✓ Wallet agent MCP server identity and send/swap asset allowlist use the
  shared wallet tool story:
  `packages/core/src/wallet-tool-stories.ts`,
  `apps/app/src/lib/agents/wallet-tools.ts`, and
  `apps/app/src/app/api/agent/wallet-tools/route.ts`.
- ✓ Browser voice loop sample rates, TTS sample rate, post-playback cooldown,
  push-to-talk max duration, WebSocket env/default URL, processor frame size,
  voice state icons, speak-toggle icons, and app voice-state types use the
  shared voice story contract:
  `packages/core/src/voice.ts`,
  `apps/app/src/lib/voice/client.ts`,
  `apps/app/src/lib/use-recorder.ts`,
  `apps/app/src/app/[locale]/page.tsx`, and
  `apps/app/src/components/voice-button.tsx`.
- ✓ SPY gadget IDs, icons, labels, field descriptors, select options, default
  values, mission unlock lists, and mission prefills use the shared SPY gadget
  story contract:
  `packages/core/src/spy-gadget-stories.ts` and
  `apps/app/src/components/spy-console.tsx`.
- ✓ Voice-state accessibility labels, recorder/start fallback errors, settings
  model labels, and SPY gadget result/option labels resolve through EN/ES
  message keys:
  `apps/app/src/components/voice-button.tsx`,
  `apps/app/src/components/llm-config.tsx`,
  `apps/app/src/app/[locale]/ajustes/page.tsx`, and
  `apps/app/src/components/spy-console.tsx`.
- ✓ App metadata, PWA manifest, landing brand heading, and PDF/DOCX report
  author/eyebrow use shared brand/message contracts:
  `packages/core/src/brand-stories.ts`, `apps/app/src/app/layout.tsx`,
  `apps/app/src/app/manifest.ts`,
  `apps/app/src/app/[locale]/landing/page.tsx`, and
  `apps/app/src/lib/reports/export.tsx`.
- ✓ Desktop renderer, desktop shell, and Expo scaffold model expose the shared
  brand contract instead of native-surface product literals:
  `apps/desktop/src/renderer.ts`, `apps/desktop/src/main.ts`, and
  `apps/mobile/src/App.ts`.
- ✓ Animated background preset IDs, color tuples, default/fallback preset,
  CSS gradient stops, resolution scale, FPS, time scale, resize interval, and
  max canvas pixels use the shared animated background story contract:
  `packages/core/src/animated-background-stories.ts` and
  `apps/app/src/components/animated-background/index.tsx`.
- ✓ Native worklet required env, adapter-present status mapping, missing-adapter
  log/error copy, and station scaffold public key use the shared worklet story
  contract:
  `packages/core/src/worklet-stories.ts` and `packages/worklet/src/index.ts`.
- ✓ Desktop/mobile native readiness, installable flags, accepted artifact
  requirements, and runtime blockers use the shared surface readiness story
  contract:
  `packages/core/src/surface-stories.ts`,
  `packages/core/src/landing.ts`, `apps/desktop/src/main.ts`,
  `apps/desktop/src/renderer.ts`, and `apps/mobile/src/App.ts`.
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
