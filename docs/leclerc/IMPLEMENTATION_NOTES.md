# LeClerc — Implementation Notes (Claude → Codex handoff)

Built spec-driven from `docs/leclerc/00–12`. This file is the handoff: what's done,
the decisions taken, the verified-vs-stubbed surface, and the prioritized
`TODO(codex)` list for the overnight debug pass.

## Status (as of this commit)
- ✅ `bunx tsc --noEmit` — **clean** (no errors outside node_modules).
- ✅ Dev server boots: `next dev` ready in ~300ms; `proxy.ts` runs; `/` → `/es`
  rewrite serves the console; `/es` 200; pages render.
- ⚠️ `next build` (prod) **SIGKILL/OOM in the build sandbox** — almost certainly
  environmental (native-dep bundling + memory cap), not a code error. **Codex:
  verify `bun run build` on real hardware** with `NODE_OPTIONS=--max-old-space-size=8192`.
  If a real failure surfaces, it'll most likely be a server-only module pulled
  into a client bundle — keep `@qvac/sdk` / `@tetherto/*` / `hyperswarm` behind
  Route Handlers only.
- ✅ **QVAC inference + RAG proven end-to-end** via `packages/qvacs/smoke.mjs`
  (`cd packages/qvacs && bun run smoke.mjs`): downloads EmbeddingGemma-300M,
  `embed` → `ragSaveEmbeddings` → `ragSearch` returns semantically-correct hits
  with stable record ids. The wired shapes (loadModel/embed/rag) are verified
  against real runtime, not just `.d.ts`.
- ⚠️ WDK wallet + P2P delegate/dead-drop runtime **not yet exercised** (next).
  LLM `completion` shape is the same `loadModel`/`completion` path the smoke +
  examples use (modelType:"llm"), so the brief path is high-confidence but not
  yet smoke-run with a full LLM download.

## Architecture decisions taken (deviations / clarifications from the spec)
1. **PWA first, then native Desktop + Mobile (UPDATED — see [14](./14-surfaces-and-shared-core.md)).**
   v1 ships the Cleo **PWA** (`apps/app`); the native **Desktop** (Pear+Electron)
   and **Mobile** (Expo+Bare) shells follow, reusing a shared `@leclerc/core` +
   a Bare worklet (PearPass blueprint), running QVAC on-device. Codex M10/M11.
   (Earlier this said "single PWA, no Expo"; the three-surface ambition is restored.)
2. **`[locale]` routing** with next-international `urlMappingStrategy: "rewrite"`
   (Next 16 `proxy.ts`, not `middleware.ts`). All pages live under
   `app/[locale]/`. Old NGO pages (grabar/registro/informe) removed.
3. **Station = trusted compute.** RAG, agents, wallet, and P2P run in Node Route
   Handlers (`runtime="nodejs"`). The browser holds the AES-GCM vault key and
   **decrypts records, then POSTs plaintext to the station's own localhost Route
   Handlers**. This is consistent with the threat model (the station is the
   operative's own machine); encryption-at-rest protects the browser IndexedDB on
   a seized device, not the localhost hop. Documented so Codex doesn't "fix" it.
4. **Compliance:** `@huggingface/transformers` + `offline-engine.ts` **removed**.
   Inference modes are now `station | delegate | ondevice` (all QVAC). Grep gate:
   `grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages` → empty.

## What's implemented
| Area | Files | State |
|---|---|---|
| QVAC wrapper (embed/rag/ocr/translate/tools) | `packages/qvacs/src/index.ts` | compiles; call shapes need runtime confirm |
| Inference routing (QVAC-only) | `apps/app/src/lib/inference/{index,mode}.ts` | done |
| Intel data model + AES-GCM at rest + wipe | `apps/app/src/lib/intel/{schema,crypto,store-client,assemble}.ts` | done |
| Server QVAC model loader | `apps/app/src/lib/qvac/server.ts` | `loadModel` descriptor needs real shape |
| RAG (ingest + grounded answer) | `apps/app/src/lib/rag/server.ts`, `api/rag/route.ts` | ✅ done + smoke-proven; bundled embed model, no env needed |
| Multi-agent desk + tools | `apps/app/src/lib/agents/{tools,orchestrator}.ts`, `api/brief/route.ts` | done; deterministic orchestration + QVAC completions |
| P2P delegate + dead-drop | `apps/app/src/lib/p2p/{delegate,deaddrop}.ts`, `api/station/route.ts` | delegate option + swarm wiring need confirm |
| Wallet (WDK Lightning + EVM) | `apps/app/src/lib/wallet/index.ts`, `api/wallet/route.ts` | WDK method shapes need confirm |
| i18n (es/en) | `proxy.ts`, `locales/*`, `messages/*`, `lib/i18n/*` | done |
| PWA UI (8 screens + nav) | `apps/app/src/app/[locale]/**`, `components/**` | done; exports/TTS/QR are buttons-only stubs |

## Prioritized TODO(codex) — runtime verification (grep `TODO(codex)`)
**P0 — make inference actually run — ✅ DONE (verified against runtime, not just .d.ts):**
1. ✅ `lib/qvac/server.ts` — `loadModel({modelSrc:<registry constant>, modelType:"llm"|"embeddings", modelConfig:{tools:true}})`.
   Embed defaults to bundled `EMBEDDINGGEMMA_300M_Q8_0` (no env). `getModel` no
   longer calls `startQVACProvider` (local inference loads directly).
2. ✅ `packages/qvacs/src/index.ts` — `embed`, segregated-flow RAG
   (`embed`→`ragSaveEmbeddings({id,content,embedding,embeddingModelId})`→`ragSearch({topK})→{id,content,score}`,
   stable record ids preserved), `completeWithTools` returns `{text,toolCalls}`.
   Proven by `packages/qvacs/smoke.mjs` (semantically-correct retrieval).
   Remaining: `ocr`/`translate` shapes still TODO (not on the core path).
**P0.1 — remaining inference to smoke-run:** full-LLM `completion`/`completeJSON`
   for the brief (same loadModel pattern, modelType:"llm" — high confidence), and
   the `:11434` capture path (transcribe + chatJSON) with `bun run qvac` up.
**P1 — P2P:**
3. `lib/p2p/delegate.ts` — confirm `startQVACProvider` ProvideParams + the
   `completion({ delegate })` option shape. Wire `QVAC_HYPERSWARM_SEED` for a
   stable station key.
4. `lib/p2p/deaddrop.ts` — productionize the hyperswarm worker (long-lived, not a
   per-request Route Handler). Benchmark: `references/pearpass-mobile/src/hooks/useQRScanner.js`.
**P2 — wallet:**
5. `lib/wallet/index.ts` — confirm `WalletManagerEvm.transfer` field names
   (`to` vs `recipient`) + amount units, Spark `payLightningInvoice`/balance, and
   network enum. Wire the seed to the unlocked vault (not component state in
   `billetera/page.tsx`).
**P3 — agents/UX:**
6. `lib/agents/orchestrator.ts` — once tool-calling is confirmed, let agents drive
   their own tool calls (currently deterministic pre-seeded tool results).
7. UI stubs to finish: PDF/DOCX export (reuse `lib/reports/export/*`), TTS
   readout (`textToSpeech`), QR pairing + real dead-drop send/receive,
   document-intel capture (OCR attach), streaming agent progress.

## How to run
```bash
bun install
# Terminal 1 — QVAC station (laptop): registers whisper/qwen + embed/ocr/translate/MedPsy
bun run qvac           # infra/qvac/start-local.sh → qvac serve openai :11434
# Terminal 2 — app
bun --filter app dev   # or: cd apps/app && bunx next dev --port 7001
# Open http://localhost:7001  (redirects to /es)
```
Env: copy `apps/app/.env.example` → `apps/app/.env.local` and fill
`LECLERC_EMBED_MODEL` (+ OCR/translate/MedPsy ids), `EVM_RPC_URL`,
`QVAC_HYPERSWARM_SEED`. Never commit a real seed.

## Compliance checklist (must stay green)
- [x] No non-QVAC inference libs in the tree.
- [x] Inference modes are QVAC-only (`station|delegate|ondevice`).
- [x] Dossier + seed encrypted at rest (AES-GCM); `wipeAll()` + `lock()` panic path.
- [ ] (Codex) End-to-end offline run captured to `artifacts/` (logs, profiler,
      `getLoadedModelInfo` backend proof) — see `docs/leclerc/11`.

## STATUS 2026-06-07 overnight run

Branch: `feat/leclerc-scaffold`

Latest milestone commits:

- `7edfc28 feat(core): scaffold shared runtime contracts`
- `9f62bc4 feat(native): scaffold desktop and mobile surfaces`

### Milestones

| Milestone | Status | Smoke-proven | Wired-only / blocker |
|---|---|---|---|
| M1 Voice E2E browser | DONE | Voice service smoke + browser listening state captured in `artifacts/voice/`. | Real mic permission still depends on the judge machine/browser. |
| M2 Wallet runtime | PARTIAL | WDK shapes verified, seed/balances/testnet guard smoke captured in `artifacts/wallet/`. | Live Lightning payment needs `LECLERC_TESTNET_LIGHTNING_INVOICE`; Spark remains forced to `TESTNET`. |
| M3 Finance flows | DONE | Spend/Stash/Request screenshots and log in `artifacts/finance/`. | None for the local demo path. |
| M4 Analyst desk brief | DONE | Brief JSON, PDF, DOCX, and UI screenshot captured in `artifacts/brief/`. | Full autonomous QVAC tool-call loop remains a TODO; deterministic analyst sequencing is used. |
| M5 Intel capture + RAG | PARTIAL | Capture -> `IntelRecord` -> RAG ingest/search proof in `artifacts/intel/`. | Live OCR/translate needs `LECLERC_OCR_SRC` and `LECLERC_TRANSLATE_SRC`. |
| M6 P2P delegation + dead-drop | PARTIAL | Encrypted dead-drop smoke, station provider artifact, and link UI in `artifacts/p2p/`. | Delegated completion needs a second DHT-reachable provider; self-provider failed with `PEER_CONNECTION_FAILED`. |
| M7 MedPsy medic mode | PARTIAL | Medic UI and fallback smoke captured in `artifacts/medpsy/`. | Set `LECLERC_MEDPSY_SRC` to a MedPsy GGUF/registry source to prove the model run. |
| M8 Compliance/artifacts/submission | DONE | QVAC logging stream, profiler export, `getLoadedModelInfo`, hardware redaction, `README.md`, and `SUBMISSION.md` captured. | Demo video artifact was not created in this run. |
| M9 PWA quality | DONE | `NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build`, lint, typecheck, browser smoke, mobile/desktop screenshots, EN route, panic wipe, and wallet prefill proof in `artifacts/pwa/`. | Root `turbo build/lint` was unstable in the local shell; package-level gates pass. |
| M10 Shared core + desktop | PARTIAL | `@leclerc/core` and `@leclerc/worklet` compile; worklet smoke reports the expected `missing-adapter`; artifact in `artifacts/surfaces/m10-shared-core-2026-06-07.md`. | Native QVAC/WDK/Hyperswarm adapter is not wired; no new SDK calls were made without type/example verification. |
| M11 Mobile | PARTIAL | `@leclerc/mobile` compiles; `bundle:ios`/`bundle:android` placeholder gates pass; mobile smoke imports core/worklet and reports `missing-adapter`; artifact in `artifacts/surfaces/m11-native-scaffolds-2026-06-07.md`. | Expo, React Native, `react-native-bare-kit`, `bare-pack`, secure-storage, and native adapter are not vendored. |

### Final verification on current HEAD

Commands run after M11:

```bash
bun --filter app typecheck
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
rm -rf apps/app/.next
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
bun --filter @leclerc/core typecheck
bun --filter @leclerc/worklet typecheck
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
```

Results: all typecheck/lint/build commands exited 0. The forbidden-library grep
returned no matches (exit 1 from `grep`, expected for an empty result set).

### Remaining TODO(codex)

- `apps/app/src/lib/llm-level.ts`: set the exact MedPsy model id once
  `LECLERC_MEDPSY_SRC` is provided.
- `apps/app/src/types/shims.d.ts`: replace local shims when upstream publishes
  first-party types.
- `apps/app/src/lib/agents/orchestrator.ts`: replace deterministic pre-seeded
  tool results with a fully verified QVAC `completeWithTools` loop.
- `apps/app/src/lib/p2p/deaddrop.ts`: move from Route Handler lifetime to a
  long-lived worker/Bare service.
- `apps/app/src/app/[locale]/billetera/page.tsx`: bind wallet seed to the
  unlocked vault instead of component state.
- `apps/app/src/app/api/wallet/route.ts`: move WDK execution into the native Bare
  worklet for the no-egress desktop/mobile path.
- Native adapter TODO: wire QVAC, WDK, Hyperswarm, and voice inside
  `@leclerc/worklet` only after rechecking installed `.d.ts` files and
  `node_modules/.bun/@qvac+sdk*/dist/examples`.

### Repro commands

```bash
bun install
cp apps/app/.env.example apps/app/.env.local

# Terminal 1
bun run dev:qvac

# Terminal 2
bun run voice

# Browser
open http://localhost:7001/es
```

Focused proof commands:

```bash
bun run voice:smoke
bun run wallet:smoke
bun run qvac:artifacts
bun --filter app typecheck
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
bun --filter @leclerc/core typecheck
bun --filter @leclerc/worklet typecheck
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
```

Optional env vars for currently blocked live paths:

```bash
LECLERC_TESTNET_LIGHTNING_INVOICE=...
LECLERC_OCR_SRC=...
LECLERC_TRANSLATE_SRC=...
LECLERC_MEDPSY_SRC=...
QVAC_HYPERSWARM_SEED=...
SPARK_NETWORK=TESTNET
```

## STATUS 2026-06-07 W1-W3 follow-up pass

Branch: `feat/leclerc-scaffold`

Artifact: `artifacts/pwa/w1-w3-glass-spy-console-2026-06-07.md`

### Milestone / workstream delta

| Area | Status | Smoke-proven | Wired-only / blocker |
|---|---|---|---|
| W1 Glass home shell | DONE | `/es` SSR smoke shows glass top bar, credit-card first action, center glass mic, and send/receive glass balls. | Visual screenshot was not captured because Playwright is not installed and the Browser plugin did not expose a direct browser-control namespace. |
| W2 SPY console | PARTIAL | Triple-tap mic opens a data-driven 10-gadget console; typecheck/build prove it stays client-safe and calls existing API helpers only. | Live ASR remains through the voice button/service; full gadget smoke requires station models and seeded dossier. |
| W3 Missions | PARTIAL | Three data-driven missions render with accept/deny, mission selector, gadget unlocks, and per-gadget prefills. | Mission-scoped RAG persistence and AI tool auto-routing are only lightly wired; inline auto-invoke currently detects dossier/RAG-looking questions and renders a tool result. |
| Design refs | BLOCKED | `DESIGN.md` implemented for this pass. | All three Anthropic design URLs from `15-midnight-goals.md` returned HTTP 404 with 10-byte bodies on 2026-06-07. |
| Rain / defi reuse | PARTIAL | Follow-up reference paths identified in sibling repos. | Rain card code and defi asset/chain configs were not fully ported in this pass. |

### Commands run in this pass

```bash
bun --filter app typecheck
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services || true
bun --filter app dev
curl -I http://localhost:7001/es
curl -s http://localhost:7001/es | head -40
rm -rf apps/app/.next
```

Results: typecheck, lint, and production build exited 0. The forbidden-library grep
returned no matches. The dev SSR smoke returned HTTP 200 for `/es`.

### Remaining TODO(codex) from this pass

- Replace the wired SPY `brief` empty-record call with mission-scoped dossier records.
- Port the Rain card flow from `../desk-v1` into typed local card config and WDK funding handlers.
- Port token/chain/explorer config from `../defi-web-app` into a local typed asset catalog.
- Add an installed browser/screenshot smoke path so glass/SPY interactions are visually captured after frontend changes.

## STATUS 2026-06-07 pass 2 W5-W10 + W2/W3 completion

Branch: `feat/leclerc-scaffold`

Pushed commits:

- `75660dd feat(wallet): add typed asset chain catalog`
- `52ce01d feat(wallet): add onboarding and send receive flows`
- `f1bdc41 feat(wallet): expose agent mcp tools`
- `9f6f082 feat(cards): add rain agent card funding`
- `f834062 feat(ops): bridge mission funding notifications`
- `001c07f feat(p2p): add cobe operations globe`
- `0010633 feat(pwa): add operations landing page`
- `daa0997 feat(rag): scope dossier tools by mission`

### Workstream delta

| Item | Status | Smoke-proven | Wired-only / blocker |
|---|---|---|---|
| W5 Asset/chain catalog | DONE | Core/app typecheck, lint/build, forbidden greps. Catalog drives wallet balances and token sends. | None for catalog. |
| W4 Wallet onboarding + send/receive/tx | PARTIAL | WDK smoke, onboarding UI, receive details, tx list, catalog balances, and testnet send path compile/build. | Face ID is a stub; QR is visual-only; live funded EVM transfer needs a funded Arc Testnet wallet. |
| W6 Local-AI wallet tools/MCP | PARTIAL | `/api/agent/wallet-tools {"action":"list"}` returns balances/send/swap tools; build/grep gates pass. | `@tetherto/wdk-mcp-toolkit@0.0.0` has no JS/d.ts exports, so tools are registered through `@modelcontextprotocol/sdk` directly; swap remains blocked until a verified venue is wired. |
| W7 Rain agent cards | PARTIAL | `/api/rain-cards {"action":"list"}` returns data-driven RAVEN-07 USDC card and funding readiness. UI opens from the W1 credit-card action. | Live Rain funding requires `LECLERC_RAIN_USDC_DEPOSIT_ADDRESS`; no real Rain deposit address was present. |
| W8 Operator-to-agent funding bridge | PARTIAL | `/api/mission-funding` list/fund/events smoke proves blocked funding notification reaches the local event log; notification payload kind is supported by dead-drop. | Live mission funding requires `LECLERC_MISSION_RAVEN_USDC_ADDRESS`; separate-device dead-drop delivery still needs a two-peer smoke. |
| W9 Cobe globe | DONE | `cobe@2.0.1` installed; `/en/enlace` screenshot captured at `artifacts/p2p/w9-cobe-globe-enlace-2026-06-07.png`. | None for web globe. |
| W10 Landing page | PARTIAL | `/en/landing` screenshot captured at `artifacts/pwa/w10-landing-page-2026-06-07.png`; operation-room and PWA actions render. | Downloadable Expo binary is blocked; repo has `apps/mobile` scaffold but no build artifact. |
| W2/W3 remaining partials | PARTIAL | Deterministic helper smoke proves mission inference and auto-router; build/grep gates pass. | Full QVAC RAG gadget smoke was not forced because it can require model availability/download. |
| Anthropic design URLs | BLOCKED | Not retried in this pass per instruction. | Prior pass recorded all three URLs as HTTP 404. |

### Artifacts added

- `artifacts/wallet/w5-asset-chain-catalog-2026-06-07.md`
- `artifacts/wallet/w4-wallet-onboarding-send-receive-2026-06-07.md`
- `artifacts/wallet/w6-wallet-agent-tools-mcp-x402-2026-06-07.md`
- `artifacts/wallet/w7-rain-agent-cards-2026-06-07.md`
- `artifacts/wallet/w8-mission-funding-notification-bridge-2026-06-07.md`
- `artifacts/p2p/w9-cobe-globe-2026-06-07.md`
- `artifacts/p2p/w9-cobe-globe-enlace-2026-06-07.png`
- `artifacts/pwa/w10-landing-page-2026-06-07.md`
- `artifacts/pwa/w10-landing-page-2026-06-07.png`
- `artifacts/rag/w2-w3-mission-rag-router-smoke-2026-06-07.md`

### Exact verification commands used

Repeated after each item as applicable:

```bash
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
rm -rf apps/app/.next
rg -n "from ['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)|require\\(['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)" apps/app/src --glob '!apps/app/src/app/api/**' --glob '!apps/app/src/lib/wallet/**' --glob '!apps/app/src/lib/agents/**' --glob '!apps/app/src/lib/p2p/**' --glob '!apps/app/src/lib/qvac/**'
rg -n "from ['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)|require\\(['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)" apps/app/src packages/core/src --glob '!**/.next/**' --glob '!**/node_modules/**'
```

Focused smokes:

```bash
bun run wallet:smoke
curl -sS -X POST http://localhost:7001/api/agent/wallet-tools -H 'Content-Type: application/json' -d '{"action":"list"}'
curl -sS -X POST http://localhost:7001/api/rain-cards -H 'Content-Type: application/json' -d '{"action":"list"}'
curl -sS -X POST http://localhost:7001/api/mission-funding -H 'Content-Type: application/json' -d '{"action":"list"}'
curl -sS -X POST http://localhost:7001/api/mission-funding -H 'Content-Type: application/json' -d '{"action":"fund","missionId":"raven","amount":"25.00"}'
curl -sS -X POST http://localhost:7001/api/mission-funding -H 'Content-Type: application/json' -d '{"action":"events"}'
cd apps/app && bunx playwright install chromium
cd apps/app && bunx playwright screenshot --viewport-size=390,1200 http://localhost:7001/en/enlace ../../artifacts/p2p/w9-cobe-globe-enlace-2026-06-07.png
cd apps/app && bunx playwright screenshot --viewport-size=390,1200 http://localhost:7001/en/landing ../../artifacts/pwa/w10-landing-page-2026-06-07.png
cd packages/core && bun -e "import { inferMissionIdsForText, routeOperatorQuery } from './src/index.ts'; console.log(JSON.stringify({ raven: inferMissionIdsForText('Raven funding handler'), medic: inferMissionIdsForText('clinic wound triage'), route: routeOperatorQuery('search Raven funding handler') }, null, 2))"
```

### Remaining TODO(codex)

- Configure live testnet envs for the wired-only wallet/card/funding paths:
  `LECLERC_RAIN_USDC_DEPOSIT_ADDRESS`, `LECLERC_MISSION_RAVEN_USDC_ADDRESS`,
  funded Arc Testnet wallet seed supplied only at runtime.
- Replace wallet seed component-state demos with encrypted vault-backed unlock
  flow and/or native secure storage.
- Run a real two-device/two-process dead-drop notification bridge smoke.
- Produce an Expo build artifact before enabling the landing page Expo download.
- Keep replacing deterministic agent orchestration with verified QVAC tool-call
  loops as SDK examples/types settle.

## STATUS 2026-06-07 pass 3 W7 live Rain funding smoke

Branch: `feat/leclerc-scaffold`

### Workstream delta

| Item | Status | Smoke-proven | Wired-only / blocker |
|---|---|---|---|
| W7 Rain agent cards | PARTIAL | `/api/rain-cards {"action":"list"}` now reports `configured: true` for `raven-07-usdc-virtual` with `LECLERC_RAIN_USDC_DEPOSIT_ADDRESS` loaded from `apps/app/.env.local`. Added `bun run rain:smoke`, which resolves the typed Arc-testnet USDC catalog entry, verifies WDK EVM `.d.ts` transfer/balance shapes, writes JSON/MD artifacts, and refuses non-Arc-testnet writes. | Live transfer was SKIPPED because `LECLERC_SMOKE_SEED` was absent. No seed was printed or committed, no tx was fabricated, and no mainnet path was exercised. |
| W10 Expo artifact requirement | DONE | `apps/mobile/README.md` now states that the landing page must not expose the Expo app as a completed download until a real signed `.ipa`, `.apk`, or `.aab` exists. | Current `bundle:ios`/`bundle:android` scripts remain scaffold TypeScript gates only. |
| Two-device dead-drop notification smoke | NOT ATTEMPTED | Existing W8 local event-log proof remains the latest artifact. | No narrow existing two-process smoke script was present; still needs a real separate peer/device run. |

### Artifacts added

- `artifacts/wallet/rain-funding-smoke-2026-06-07.md`
- `artifacts/wallet/rain-funding-smoke-2026-06-07.json`

### Rain smoke result

`bun run rain:smoke` result: `SKIPPED`.

Reason: `LECLERC_SMOKE_SEED` is absent.

Live steps recorded in the artifact:

```bash
export LECLERC_SMOKE_SEED=... # runtime only; never commit
# fund that WDK sender wallet with Arc-testnet USDC on chainId 5042002
bun run rain:smoke
```

The smoke uses the typed card default funding amount `25.00` USDC, converts it
with the catalog's 6 USDC decimals to `25000000` atomic units, and would submit
through the same WDK EVM transfer implementation used by `paySableEvm`.

### Verification commands

```bash
bun run rain:smoke
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
rg -n "from ['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)|require\(['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)" apps/app/src --glob '!apps/app/src/app/api/**' --glob '!apps/app/src/lib/wallet/**' --glob '!apps/app/src/lib/agents/**' --glob '!apps/app/src/lib/p2p/**' --glob '!apps/app/src/lib/qvac/**'
rg -n "from ['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)|require\(['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)" apps/app/src packages/core/src --glob '!**/.next/**' --glob '!**/node_modules/**'
bun --filter app dev
curl -sS -X POST http://localhost:7001/api/rain-cards -H 'Content-Type: application/json' -d '{"action":"list"}'
```

Results: typecheck/lint exited 0. Both grep commands returned no matches. The
live route returned `configured: true` for the Rain card funding target. The dev
server was stopped after the route/smoke check.

## STATUS 2026-06-07 pass 4 FIX review findings

Branch: `feat/leclerc-scaffold`

### Findings

| # | Status | Commit | Verification |
|---|---|---|---|
| 1. Server-side transfer confirmation + agent auth | FIXED | `a90cb8f` | `wallet_send` now calls `proposeTransfer()` only; `/api/wallet`, `/api/mission-funding`, and `/api/rain-cards` expose propose then confirm paths through `confirmTransfer()`. `/api/agent/wallet-tools` requires `LECLERC_AGENT_WALLET_TOOLS_TOKEN`. `cd apps/app && bunx tsc --noEmit`, `bun --filter app lint`, and final build passed. |
| 2. Unsafe `decimalToAtomic()` in wallet agent | FIXED | `a90cb8f` | Removed the agent-local parser; `proposeTransfer()` uses `@leclerc/core` `parseAtomicAmount()`. Amount parser smoke passed for valid, precision-clamped, zero, and malformed amounts. |
| 3. `/api/wallet` amount/address validation | FIXED | `a90cb8f`, `aa6040f` | Added `parseAtomicAmount()` and `assertHexAddress()` in `@leclerc/core`; `/api/wallet` parses human decimals server-side and validates recipient addresses before proposal. The wallet UI display helper now delegates to the same core parser. |
| 4. Mission-scoped RAG metadata | FIXED | `b3e8e3a` | `@repo/qvacs` persists workspace metadata sidecars and restores `meta` onto `ragQuery()` hits; app RAG search/answer and agent `ragSearchTool` apply `missionMatchesMeta()`. `cd packages/qvacs && bun run smoke.mjs` passed, including two-doc mission metadata filter assertion. |
| 5. USDT balance + dead ternary | FIXED | `a90cb8f` | Removed the dead ternary; top-level `usdt` now reflects Spark token balance via `LECLERC_SPARK_USDT_TOKEN_ADDRESS` when configured, otherwise an honest `unavailable`, not fake `unconfigured`. App typecheck/lint passed. |
| 6. Plaintext IndexedDB writes | FIXED | `ff05e5b` | Added centralized `lib/vault/envelope-client.ts`; intel and finance stores now reject locked writes and only keep legacy plaintext read fallback. App typecheck/lint passed. |
| 7. Dead-drop state and zero-peer send | FIXED | `ced7120` | Drop registry moved to `globalThis`, join wait widened to 5s, and `sendDrop()` returns `status: "pending"` with zero peers instead of silent success. App typecheck/lint passed. |
| 8. Non-functional EVM `chainId` | FIXED | `a90cb8f` | `evmAccount()` now resolves chain/RPC by requested `chainId`, enforces writable testnet policy explicitly, and unsupported/read-only chains fail clearly instead of defaulting to Arbitrum. App typecheck/lint passed. |
| 9. Lightning fee NaN guard | FIXED | `a90cb8f` | Replaced module-level `Number(...)` with `maxLightningFeeSats()` that falls back to 50 on NaN/non-positive values. App typecheck/lint passed. |
| 10. Divergent voice persona | FIXED | `c061dbd` | `packages/core/src/agents.ts` is the single persona source; app persona re-exports it, voice server and voice smoke import it, and the shared side-effect confirmation clause is present. Voice import smoke passed. |

### Final verification

```bash
cd apps/app && bunx tsc --noEmit
bun --filter @leclerc/core typecheck
bun --filter app lint
bunx tsc -p packages/qvacs/tsconfig.json --noEmit
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps/app/src packages services --exclude-dir=.next || true
rg "server-only" apps/app/src/components 'apps/app/src/app/[locale]' --glob '*.tsx' --glob '*.ts'
cd packages/qvacs && bun run smoke.mjs
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
```

Results: all typecheck/lint/build commands exited 0. The forbidden-inference
grep returned no source matches. The browser-surface `server-only` grep returned
no matches (exit 1 expected). The QVAC smoke loaded cached EmbeddingGemma,
completed embed/RAG round-trip, and passed the mission metadata filter check.

## STATUS 2026-06-07 pass 5 regression fixes

Branch: `feat/leclerc-scaffold`

### Findings

| # | Status | Commit | Verification |
|---|---|---|---|
| 1. Transfer confirmation store + HMAC | FIXED | `4deccd5` | Pending transfer registry and boot key moved to `globalThis`; confirm validates HMAC, TTL, and single-use delete before executing. `bun run transfer:smoke` passed across fresh module imports with no live send, verified tamper rejection and single-use behavior. |
| 2. Vault locked default breaks capture/finance writes | FIXED | `b4f1fcf` | Vault now auto-initializes a persisted random device key for encrypted local writes/reads; passphrase unlock remains optional. Capture, analysis seed, home finance seed, and savings-goal writes now surface errors. `bun run vault:smoke` passed: locked write persisted ciphertext only and read back. |
| 3. Rain card + mission funding auto-confirm | FIXED | `724c2d2` | `rainCards.fund()` and `missionFunding.fund()` now return proposals only; explicit `confirm()` helpers and UI confirm buttons are required before `confirmTransfer()` runs. Grep found no remaining auto-chain `.then(confirm)` pattern. |
| 4. Atomic amount truncation/display mismatch | FIXED | `f810f46` | `parseAtomicAmount()` now rejects excess fractional precision and formats `decimal` from the exact atomic value. Focused parser smoke passed for valid, zero-decimal, smallest-unit, and over-precision cases. |
| 5. Plaintext vault read path while locked | FIXED | `b4f1fcf` | `fromVaultEnvelope()` requires a vault key before returning legacy plaintext fallback; sealed reads use device/passphrase key routing. Covered by `bun run vault:smoke`. |
| 6. RAG metadata cwd sidecar | FIXED | `8853757` | QVACS metadata sidecar now defaults to repo-root `.leclerc-rag-meta/` or an absolute workspace/meta env path, not `process.cwd()`. `bunx tsc -p packages/qvacs/tsconfig.json --noEmit` passed. |
| 7. Read-only chain proposals | FIXED | `4deccd5` | `proposeTransfer()` rejects non-writable chains before showing a confirmable proposal. `bun run transfer:smoke` verified Arbitrum One proposal rejection. |
| 8. Voice service plain Node failure | FIXED | `9dab51d` | Voice server/smoke now guard for Bun before dynamic imports and README documents Bun-only startup. `node services/voice/server.mjs` exits with the intended Bun-only error. |
| 9. Finance/intel envelope clear-field drift | FIXED | `b4f1fcf` | Finance envelopes now use shared `createdAt` clear index metadata with compatibility for legacy `ts` rows; DB version bumped to add the index when stores already exist. App typecheck/lint passed. |

### Final verification

```bash
bun run transfer:smoke
bun run vault:smoke
cd apps/app && bunx tsc --noEmit
bun --filter @leclerc/core typecheck
bun --filter app lint
bunx tsc -p packages/qvacs/tsconfig.json --noEmit
rg -n "from ['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)|require\(['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)" apps/app/src --glob '!apps/app/src/app/api/**' --glob '!apps/app/src/lib/wallet/**' --glob '!apps/app/src/lib/agents/**' --glob '!apps/app/src/lib/p2p/**' --glob '!apps/app/src/lib/qvac/**'
rg -n "from ['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)|require\(['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)" apps/app/src packages/core/src --glob '!**/.next/**' --glob '!**/node_modules/**'
rg -n "server-only" apps/app/src/components 'apps/app/src/app/[locale]' --glob '*.tsx' --glob '*.ts'
node services/voice/server.mjs
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
```

Results: transfer and vault smokes exited 0 and wrote artifacts under
`artifacts/wallet/` and `artifacts/vault/`. App typecheck, core typecheck,
app lint, QVACS typecheck, and final app build exited 0. Both forbidden import
greps and the browser-surface `server-only` grep returned no matches (exit 1
expected). Plain Node voice startup exited 1 with the intended Bun-only error
before importing `@leclerc/core`.

## STATUS 2026-06-07 pass 6 money/transfer package family

Branch: `feat/leclerc-scaffold`

Pushed commit:

- `fd4d7fc feat(transfers): add package family`

### Package layout

| Package | Status | Owns |
|---|---|---|
| `@leclerc/transfer-core` | DONE | Single chain/asset catalog, Arc Testnet `5042002`, Arbitrum read-only metadata, token addresses, RPC URL resolution, chain lookup, writable-testnet guard. |
| `@leclerc/transfer-utils` | DONE | Single decimal to atomic converter (`smallestUnit`/`toAtomic`), `fromAtomic`, currency display, transaction state/type/category enums, explorer URL builders. |
| `@leclerc/wallet` | DONE | WDK EVM/Spark account creation, seed generation, multi-asset balances, receive details, Spark transactions, Lightning TESTNET payment, EVM catalog-token transfer execution. |
| `@leclerc/transfers` | DONE | Proposal/confirmation primitive, HMAC MAC, global cross-import registry, TTL, single-use delete, testnet-only validation at propose time, execution wrapper, transaction record shape, mission-funding config/propose/confirm. |
| `@leclerc/cards` | DONE | Rain agent card catalog, Rain funding target resolution, Rain funding propose/confirm via `@leclerc/transfers`. |
| `@leclerc/transfer-icons` | SKIPPED | Existing catalog icon paths remain data-driven; no new icon package was needed for this pass. |
| `@leclerc/transfer-fiat` | SKIPPED | Fiat ramps/ACH/FX remain out of scope; package family leaves room for it. |

### App thinning / ownership guarantees

- `@leclerc/core` no longer owns money logic. It keeps compatibility subpath re-exports for old imports, but the root export intentionally does not export money packages so WDK/Spark cannot enter client bundles through unrelated core helpers.
- Route handlers now import package APIs directly:
  `/api/wallet` -> `@leclerc/wallet` + `@leclerc/transfers`;
  `/api/rain-cards` -> `@leclerc/cards`;
  `/api/mission-funding` -> `@leclerc/transfers`;
  `/api/agent/wallet-tools` -> `@leclerc/wallet`, `@leclerc/transfers`, `@leclerc/transfer-core`.
- App wallet lib files are server-only compatibility adapters that re-export package APIs.
- Components import catalog/display helpers from `@leclerc/transfer-core` and `@leclerc/transfer-utils`; the wallet page local atomic parser/formatter was removed.
- Smoke scripts now target the new packages directly.

Single sources of truth:

- ONE chain/asset catalog: `packages/transfer-core/src/asset-catalog.ts`.
- ONE decimal/atomic converter: `packages/transfer-utils/src/smallest-unit.ts`.
- ONE propose -> confirm primitive: `packages/transfers/src/confirmation.ts`.
- ONE explorer URL builder: `packages/transfer-utils/src/explorer.ts`.
- ONE balances function: `packages/wallet/src/index.ts`.

### Verification

```bash
bun install
bun --filter @leclerc/transfer-core typecheck
bun --filter @leclerc/transfer-utils typecheck
bun --filter @leclerc/wallet typecheck
bun --filter @leclerc/transfers typecheck
bun --filter @leclerc/cards typecheck
bun --filter @leclerc/core typecheck
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
cd apps/app && bunx tsc --noEmit
bun --filter @leclerc/worklet typecheck
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
bun run transfer:smoke
bun run vault:smoke
bun run rain:smoke
bun run wallet:smoke
bun --filter app lint
rg -n "from ['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)|require\(['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)" apps/app/src --glob '!apps/app/src/app/api/**' --glob '!apps/app/src/lib/wallet/**' --glob '!apps/app/src/lib/agents/**' --glob '!apps/app/src/lib/p2p/**' --glob '!apps/app/src/lib/qvac/**'
rg -n "from ['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)|require\(['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)" apps/app/src packages services --glob '!**/.next/**' --glob '!**/node_modules/**'
rg -n "server-only" apps/app/src/components 'apps/app/src/app/[locale]' --glob '*.tsx' --glob '*.ts'
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
rm -rf apps/app/.next
```

Results: all typecheck, lint, smoke, and production build commands exited 0.
The forbidden import greps and browser-surface `server-only` grep returned no
matches. `bun run transfer:smoke` passed against `@leclerc/transfers`, including
cross-import proposal persistence, HMAC tamper rejection, single-use confirm,
and Arbitrum read-only rejection. `bun run rain:smoke` remained SKIPPED for live
funding because `LECLERC_SMOKE_SEED` is absent; no seed was printed or committed.

The first production build in this pass correctly failed when the `@leclerc/core`
root re-export pulled `@leclerc/cards -> @leclerc/transfers -> @leclerc/wallet`
into a client bundle. The final commit fixes that by removing money package
exports from the `@leclerc/core` root while preserving explicit package/subpath
imports.

## STATUS 2026-06-08 production-readiness QA

Branch: `feat/leclerc-scaffold`

Artifact report:

- `artifacts/qa/2026-06-08/production-readiness.md`
- `artifacts/qa/2026-06-08/01-es-home.png` through `25-en-wallet-final-refresh.png`

### Browser QA result

Production runtime was rebuilt with:

```bash
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
bun --filter app start
```

The built app ran at `http://localhost:7001`; the voice service ran at
`ws://localhost:7077`.

Verified in the in-app browser:

- Spanish and English ops surfaces render the Ignyte black/yellow/glass theme
  with favicon/logo assets and no mobile horizontal overflow.
- Triple-tap SPY console renders all 10 gadgets: Transcribir, Extraer, Chat,
  RAG Pregunta, RAG Busca, Informe Intel, Geo Extrae, Razonamiento, Billetera,
  Estación.
- Three data-driven missions render; accept/deny state changes are captured.
- Wallet onboarding reaches ready state without exposing the recovery phrase in
  artifacts; multi-asset balances render; send uses review before confirm;
  receive and transactions render.
- Rain cards render and funding remains propose/confirm gated.
- Enlace mission funding/globe renders.
- Capture -> confirm -> dossier -> RAG query works against local QVAC.
- In-chat auto-invocation renders `Tool: dossier RAG` inline with grounded JSON
  output; SPY mission gating was rechecked on Glasshouse and locked gadgets plus
  their inputs are disabled.
- Enlace mission funding now requires a seed before propose; with current env it
  blocks safely because `LECLERC_MISSION_RAVEN_USDC_ADDRESS` is absent, so no
  confirm button is exposed.
- `/api/agent/wallet-tools` was exercised with an ephemeral dummy QA token:
  unauthorized calls returned 401, list returned `wallet_balances`,
  `wallet_send`, and `wallet_swap`, `wallet_send` returned
  `requires_confirmation` with purpose `agent-wallet` and no hash, and swap
  remained blocked. Real `LECLERC_AGENT_WALLET_TOOLS_TOKEN` is absent from
  `.env.local`; token/seed were not printed.

### Fixes landed in this pass

- RAG answers now strip `<think>` blocks, receive locale from the client/API, and
  normalize trailing fallback text so sourced English answers do not leak
  Spanish or appended fallback copy.
- English voice-button ARIA is localized through `ActionBar`/`VoiceButton`.
- Passive wallet Spark reads are gated by `LECLERC_ENABLE_LIVE_SPARK_READS=1`
  (or the existing smoke switch), preventing background Spark auth retry storms
  when live Spark auth is not available. Explicit Lightning payment remains live
  and TESTNET guarded.
- Remaining Arc testnet chain literals in wallet/card/mission-funding surfaces
  now flow through `ARC_TESTNET_CHAIN_ID`.
- `apps/app/.env.example` documents `LECLERC_ENABLE_LIVE_SPARK_READS`.

### Gates

Commands run after the final code changes:

```bash
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
rg -n "server-only" apps/app/src/components 'apps/app/src/app/[locale]' --glob '*.tsx' --glob '*.ts'
bun run transfer:smoke
bun run vault:smoke
bun run wallet:smoke
bun run rain:smoke
```

Results: typecheck, lint, production build, transfer smoke, vault smoke, and
wallet smoke exited 0. The forbidden inference grep and browser-surface
`server-only` grep returned no matches. Rain smoke exited 0 and correctly
SKIPPED live funding because `LECLERC_SMOKE_SEED` is absent; no seed was printed
or committed.

### Residual blockers

- Browser microphone capture still depends on the browser permission prompt; the
  in-app browser returned `NotAllowedError: Permission denied` after the voice
  service had booted successfully.
- Computer Use cannot operate the Codex app (`com.openai.codex`) and the Browser
  runtime exposes no microphone permission capability, so this QA environment
  cannot grant the missing mic permission from automation.
- Live Rain funding is intentionally untested without `LECLERC_SMOKE_SEED`.
- Live mission funding remains blocked until `LECLERC_MISSION_RAVEN_USDC_ADDRESS`
  is configured.
- Real protected wallet-agent calls require `LECLERC_AGENT_WALLET_TOOLS_TOKEN`;
  the route check used an ephemeral dummy QA token only.
- Live passive Spark reads require `LECLERC_ENABLE_LIVE_SPARK_READS=1` and a
  working TESTNET Spark auth environment.

## STATUS 2026-06-08 bucket-analysis v2 operations ecosystem

Branch: `feat/leclerc-scaffold`

### What changed

- Added a shared operations-console model in `@leclerc/core` for operative aliases,
  mission bounties, workspace invites, assignment, invite creation, and counters.
- Added a PWA operations room at `/[locale]/operaciones` with a mission assigner,
  agent control center, workspace invite creation, bounty display, operations
  globe, and stronger Ignyte/yellow action accents.
- Added encrypted local IndexedDB persistence for the operations room through the
  existing vault envelope path.
- Exposed the same `opsConsole.state` and counters from the desktop and mobile
  scaffold models so native surfaces share the same ecosystem contract.
- Added the updated bucket-analysis artifact:
  `artifacts/bucket-analysis/leclerc-v2-ecosystem-2026-06-08.md`.

### Design fetch result

The requested `LeClerc.html` design URL returned 404 without auth, 404 with bearer
auth, and 401 `unsupported authentication method for HTTP endpoint` with API-key
auth. No local `LeClerc.html` copy was found. The implemented design delta is
therefore based on `DESIGN.md` plus the explicit instruction to preserve the
current look while using yellow/Ignyte more strongly.

### Verification

```bash
bun --filter @leclerc/core typecheck
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
cd apps/app && bunx tsc --noEmit
cd ../..
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
cd packages/core && bun -e 'import { defaultOpsConsoleState, assignMission, createWorkspaceInvite, opsConsoleCounts } from "./src/index.ts"; const s=defaultOpsConsoleState(1); const a=assignMission(s,"mission-medic","alias-medic",2); const i=createWorkspaceInvite(a,{missionId:"mission-raven",targetAlias:"NIGHT-31"},3); console.log(JSON.stringify({counts:opsConsoleCounts(i), medic:i.missions.find(m=>m.id==="mission-medic")?.assignedAliasIds, invite:i.invites[0]?.inviteCode}))'
```

Results: all commands exited 0. Production build generated
`/[locale]/operaciones` for both `en` and `es`. The core ops smoke returned one
new invite and the medic mission assignment. Headless Chrome rendered the
hydrated desktop operations room to
`artifacts/qa/2026-06-08/30-en-operations-console.png`. A mobile-width Chrome
headless capture exited nonzero before writing a screenshot, so mobile visual
proof remains outstanding.

The remaining bucket-analysis blockers are native runtime/rendering, native
worklet adapter, live OCR/translate/MedPsy model sources, two-peer P2P proof,
real browser mic permission proof, mobile-width ops screenshot, and a demo video
artifact.

## STATUS 2026-06-08 ops stories + notifications

Branch: `feat/leclerc-scaffold`

### What changed

- Extracted the operations demo codenames, workspace, invite prefix, aliases,
  missions, and invite defaults into the dedicated story fixture
  `packages/core/src/ops-stories.ts`.
- Upgraded `@leclerc/core` ops state with `storyId`, localized story label keys,
  invite placeholder/prefix fields, notification storage, legacy state
  normalization, and helpers for assignment, invite, and mission-funding
  notifications.
- Wired the PWA operations room to show a notification feed. Assignment and
  invite actions write notifications immediately; the refresh control merges
  `/api/mission-funding` events into the same local encrypted ops store.
- Removed raw page fallback strings for ops load/assign/invite failures and added
  EN/ES notification/status copy.
- Captured updated QA artifacts:
  `artifacts/qa/2026-06-08/31-en-operations-notifications.png` and
  `artifacts/qa/2026-06-08/32-mobile-operations-notifications.png`.

### Verification

```bash
bun --filter @leclerc/core typecheck
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
cd apps/app && bunx tsc --noEmit
cd ../..
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
cd packages/core && bun -e 'import { defaultOpsConsoleState, assignMission, createWorkspaceInvite, mergeOpsNotifications, opsNotificationFromMissionFunding, opsConsoleCounts } from "./src/index.ts"; const s=defaultOpsConsoleState(1); const a=assignMission(s,"mission-medic","alias-medic",2); const i=createWorkspaceInvite(a,{missionId:"mission-raven",targetAlias:s.inviteAliasPlaceholder},3); const f=mergeOpsNotifications(i,[opsNotificationFromMissionFunding({id:"fund-raven-1",missionId:"raven",assetId:"usdc",chainId:"arc-testnet",amount:"25.00",status:"blocked",reason:"missing env",createdAt:new Date(4).toISOString()}, i)],4); console.log(JSON.stringify({counts:opsConsoleCounts(f), notifications:f.notifications.map(n=>n.kind), invite:i.invites[0]?.inviteCode, placeholder:s.inviteAliasPlaceholder}))'
```

Results: all typecheck/lint/build commands exited 0. The core smoke returned
`{"counts":{"aliases":5,"missions":3,"openMissions":1,"activeMissions":2,"pendingInvites":2},"notifications":["funding","invite","assignment"],"invite":"LC-NIGHT-31-3","placeholder":"NIGHT-31"}`.
Browser QA on `http://localhost:7001/en/operaciones` returned 200, no console
errors, and a visible `Bounty assigned` notification after clicking Assign.

### Residual blockers

- Native runtime/rendering and native worklet adapter are still missing.
- Live OCR/translate/MedPsy model sources are still env-gated.
- Two-peer P2P proof, real browser mic permission proof, native install
  artifacts, and demo video artifact remain outstanding.

## STATUS 2026-06-09 mission-story catalog

Branch: `feat/leclerc-scaffold`

### What changed

- Added a shared mission-story catalog in
  `packages/transfer-core/src/mission-stories.ts` for mission IDs, title/brief
  keys, dossier keywords, SPY mission presets, Rain card profile, and mission
  funding metadata.
- Rewired dossier mission inference, operator tool routing, SPY mission presets,
  Rain card configs, and mission-funding configs to derive from the shared story
  catalog instead of repeating Raven/Glasshouse/Medic data in each surface.
- Removed the Link page's runtime import from `@leclerc/transfers` so the client
  bundle does not pull WDK/Spark native dependencies; it now reads the default
  funding mission from `@leclerc/transfer-core`.
- Verified `/api/mission-funding {"action":"list"}` returns the story-derived
  Raven funding config, and refreshed wallet artifacts:
  `artifacts/wallet/transfer-confirmation-smoke-2026-06-09.json`,
  `artifacts/wallet/rain-funding-smoke-2026-06-09.json`, and
  `artifacts/wallet/rain-funding-smoke-2026-06-09.md`.

### Verification

```bash
bun --filter @leclerc/transfer-core typecheck
bun --filter @leclerc/transfers typecheck
bun --filter @leclerc/cards typecheck
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
cd ../..
bun --filter app lint
bun run transfer:smoke
bun run rain:smoke
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
curl -sS -X POST http://localhost:7001/api/mission-funding -H 'Content-Type: application/json' -d '{"action":"list"}'
```

Results: package typechecks, app typecheck, lint, transfer smoke, and production
build exited 0. Rain smoke exited 0 with `SKIPPED` because
`LECLERC_SMOKE_SEED` is absent; no seed was printed. With the production server
running, the Rain smoke route check reported `configured: true` from
`http://localhost:7001/api/rain-cards`. The mission-funding list route returned
the story-derived Raven USDC Arc Testnet config.

### Residual blockers

- Live Rain funding still requires `LECLERC_SMOKE_SEED` and a funded Arc-testnet
  sender wallet.
- Native runtime/rendering, native worklet adapter, live OCR/translate/MedPsy
  model sources, two-peer P2P proof, real mic permission proof, native install
  artifacts, and demo video artifact remain outstanding.

## STATUS 2026-06-09 ops network story + Link copy

Branch: `feat/leclerc-scaffold`

### What changed

- Moved operations network node/arc geography into
  `packages/core/src/ops-stories.ts` so aliases, missions, invites, and globe
  network topology now live in the same dedicated operations story fixture.
- Kept the public `listOpsNetworkNodes()` / `listOpsNetworkArcs()` API stable in
  `packages/core/src/ops-network.ts`, with optional story injection for future
  alternate user stories.
- Localized remaining Link page placeholders, dead-drop test title, and fallback
  status strings in EN/ES instead of keeping inline English in the route.

### Verification

```bash
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
cd ../..
bun --filter app lint
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
cd packages/core && bun -e 'import { DEFAULT_OPS_CONSOLE_STORY, listOpsNetworkNodes, listOpsNetworkArcs } from "./src/index.ts"; console.log(JSON.stringify({story:DEFAULT_OPS_CONSOLE_STORY.id,nodes:listOpsNetworkNodes().map(n=>n.id),arcs:listOpsNetworkArcs().map(a=>a.id)}))'
cd ../..
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
```

Results: all commands exited 0. The ops network smoke returned the
`continental-desk` story with five nodes and four arcs, proving the globe data is
now story-derived while the PWA build still prerenders `/[locale]/enlace` and
`/[locale]/operaciones`.

### Residual blockers

- Finance and intel demo seed rows still contain inline scenario copy and should
  move behind dedicated story/catalog fixtures next.
- Native runtime/rendering, native worklet adapter, live OCR/translate/MedPsy
  model sources, two-peer P2P proof, real mic permission proof, native install
  artifacts, and demo video artifact remain outstanding.

## STATUS 2026-06-09 field demo story fixtures

Branch: `feat/leclerc-scaffold`

### What changed

- Added `apps/app/src/lib/stories/field-demo-story.ts` for local field-demo
  scenario data used by the finance dashboard and analyst dossier seed path.
- Rewired `apps/app/src/lib/finance/store-client.ts` so the encrypted finance
  store owns persistence only; it now imports story rows from the field-demo
  fixture.
- Rewired `apps/app/src/lib/intel/store-client.ts` so the encrypted dossier
  store owns persistence only; it now imports story records from the same
  field-demo fixture.

### Verification

```bash
cd apps/app && bunx tsc --noEmit
cd ../..
bun --filter app lint
cd apps/app && bun -e 'import { financeDemoRows, intelDemoRecords } from "./src/lib/stories/field-demo-story.ts"; const now=Date.UTC(2026,5,9); console.log(JSON.stringify({finance:financeDemoRows("en").length,intel:intelDemoRecords("en",now).map(r=>r.id),localized:financeDemoRows("es")[0]?.merchant}))'
cd ../..
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
```

Results: app typecheck, lint, story smoke, and production build exited 0. The
story smoke returned 12 finance rows and the three expected intel record IDs:
`demo-rio-001`, `demo-clinica-002`, and `demo-boveda-003`.

### Residual blockers

- API fallback strings still contain minimal English server errors in a few route
  handlers; these should be normalized into route-level error codes/messages.
- Native runtime/rendering, native worklet adapter, live OCR/translate/MedPsy
  model sources, two-peer P2P proof, real mic permission proof, native install
  artifacts, and demo video artifact remain outstanding.

## STATUS 2026-06-09 Link API error codes

Branch: `feat/leclerc-scaffold`

### What changed

- Added `apps/app/src/lib/api-errors.ts` with stable API error codes and HTTP
  status mapping.
- Updated the API client to preserve `code` and `status` through
  `ApiClientError`.
- Converted `/api/drop` and `/api/mission-funding` error responses to structured
  `{ error, code }` bodies for the Link/dead-drop/funding notification path.
- Updated `apps/app/src/app/[locale]/enlace/page.tsx` to translate API error
  codes through `apiErrors.*` instead of showing raw route exception text.

### Verification

```bash
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
cd apps/app && bunx tsc --noEmit
curl -sS -i -X POST http://localhost:7001/api/drop -H 'Content-Type: application/json' -d '{"action":"join","passphrase":""}'
curl -sS -i -X POST http://localhost:7001/api/drop -H 'Content-Type: application/json' -d '{"action":"send","dropId":"missing","secret":"s","kind":"brief","value":{}}'
curl -sS -i -X POST http://localhost:7001/api/mission-funding -H 'Content-Type: application/json' -d '{"action":"confirm","confirmId":""}'
curl -sS -i -X POST http://localhost:7001/api/mission-funding -H 'Content-Type: application/json' -d '{"action":"events"}'
```

Results: lint, production build, and app typecheck exited 0. The API smoke
returned `drop_passphrase_required` with 400, `drop_not_joined` with 404,
`confirm_id_required` with 400, and mission-funding events with 200.

### Residual blockers

- Other API route handlers still use raw fallback strings and should be migrated
  to the same error-code utility.
- Native runtime/rendering, native worklet adapter, live OCR/translate/MedPsy
  model sources, two-peer P2P proof, real mic permission proof, native install
  artifacts, and demo video artifact remain outstanding.

## STATUS 2026-06-09 wallet/card/station API error codes

Branch: `feat/leclerc-scaffold`

### What changed

- Extended `apps/app/src/lib/api-errors.ts` with wallet, Rain card, station,
  wallet-agent, network, asset, and transfer-confirmation error codes.
- Converted `/api/wallet`, `/api/rain-cards`, `/api/station`, and
  `/api/agent/wallet-tools` to return structured `{ error, code }` responses
  through the shared API error helper.
- Added EN/ES `apiErrors.*` strings for the new codes so UI surfaces can
  translate route failures without showing raw server text.

### Verification

```bash
cd apps/app && bunx tsc --noEmit
cd ../..
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
curl -sS -i -X POST http://localhost:7001/api/wallet -H 'Content-Type: application/json' -d '{"action":"wat"}'
curl -sS -i -X POST http://localhost:7001/api/rain-cards -H 'Content-Type: application/json' -d '{"action":"fund","seed":"","cardId":"missing","amount":"25"}'
curl -sS -i -X POST http://localhost:7001/api/rain-cards -H 'Content-Type: application/json' -d '{"action":"confirm","confirmId":""}'
curl -sS -i -X POST http://localhost:7001/api/station -H 'Content-Type: application/json' -d '{"action":"wat"}'
curl -sS -i -X POST http://localhost:7001/api/agent/wallet-tools -H 'Content-Type: application/json' -d '{"action":"list"}'
curl -sS -i -X POST http://localhost:7001/api/rain-cards -H 'Content-Type: application/json' -d '{"action":"list"}'
```

Results: app typecheck, lint, production build, and route smokes exited 0. The
API smokes returned `unknown_action`, `wallet_seed_required`,
`confirm_id_required`, `unknown_action`, `agent_wallet_token_required`, and a
200 Rain card list response respectively.

### Residual blockers

- `/api/rag` still has a small raw `unknown action` fallback and should be
  migrated to `apps/app/src/lib/api-errors.ts` next.
- Native runtime/rendering, native worklet adapter, live OCR/translate/MedPsy
  model sources, two-peer P2P proof, real mic permission proof, native install
  artifacts, and demo video artifact remain outstanding.
