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
- ⚠️ Runtime against real QVAC/WDK is **not yet exercised** — that's the core of
  the overnight task. The code compiles against the installed `.d.ts`; the
  `TODO(codex)` markers flag where the call shapes still need runtime confirmation.

## Architecture decisions taken (deviations / clarifications from the spec)
1. **Single PWA, no Expo app.** Per the user: mobile-first PWA serving both
   desktop and mobile from `apps/app`. The Expo client in spec 01/05 is dropped
   for v1; the P2P/mobile story is the PWA on a phone + delegation. (`apps/mobile`
   not created.)
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
| RAG (ingest + grounded answer) | `apps/app/src/lib/rag/server.ts`, `api/rag/route.ts` | done; embed model env required |
| Multi-agent desk + tools | `apps/app/src/lib/agents/{tools,orchestrator}.ts`, `api/brief/route.ts` | done; deterministic orchestration + QVAC completions |
| P2P delegate + dead-drop | `apps/app/src/lib/p2p/{delegate,deaddrop}.ts`, `api/station/route.ts` | delegate option + swarm wiring need confirm |
| Wallet (WDK Lightning + EVM) | `apps/app/src/lib/wallet/index.ts`, `api/wallet/route.ts` | WDK method shapes need confirm |
| i18n (es/en) | `proxy.ts`, `locales/*`, `messages/*`, `lib/i18n/*` | done |
| PWA UI (8 screens + nav) | `apps/app/src/app/[locale]/**`, `components/**` | done; exports/TTS/QR are buttons-only stubs |

## Prioritized TODO(codex) — runtime verification (grep `TODO(codex)`)
**P0 — make inference actually run (verify against installed .d.ts):**
1. `lib/qvac/server.ts` — `loadModel` real descriptor per model (the docs'
   `{modelSrc}` is wrong; types want `{modelId, modelType, modelConfig}`). Set
   embed/OCR/translate/MedPsy model ids in `infra/qvac/qvac.config.json` + env.
2. `packages/qvacs/src/index.ts` — confirm `embed`, `ragIngest` (documents is
   `string|string[]`; **id/metadata association is currently lost** — use
   `ragSaveEmbeddings` with explicit ids or a metadata overload), `ragSearch`,
   `ocr`, `translate` (needs `{modelType,to,stream}`), and `completeWithTools`
   (tool param shape + how `toolCalls` surface on `CompletionFinal`).
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
