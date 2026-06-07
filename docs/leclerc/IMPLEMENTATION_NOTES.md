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
