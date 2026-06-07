# CODEX OVERNIGHT BUILD — finish LeClerc end-to-end

> **Mission:** finish the entire LeClerc app, autonomously, in one overnight run.
> Work in a loop, commit per milestone, do not stop until the Definition of Done
> (bottom) is met or you hit a hard blocker. This file is your brief; the full
> spec is `docs/leclerc/00–13` + `IMPLEMENTATION_NOTES.md`.

## What LeClerc is
"Cleo for spies": a voice-first, local-first AI assistant. A sassy field handler
that also runs the operative's finances — entirely on QVAC, on-device. Finance-led
Cleo shell (Spend / Ask / Stash / Request), spy gadgets underneath (intel capture,
RAG recall, multi-agent brief, document intel, P2P dead-drop, private Lightning pay).
Dark "field-console" look, soft drifting gradient, serif display + mono-for-data.

## Ground rules (do not violate)
1. **All AI inference + RAG via `@qvac/sdk` only.** No OpenAI/Anthropic/Gemini/
   transformers/langchain/chroma/pinecone. Gate: `grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services` → empty.
2. **Verify every SDK call against the installed `.d.ts` and the bundled
   `node_modules/.bun/@qvac+sdk@*/.../dist/examples/**`** before wiring. The public
   docs are wrong in places; the installed types + examples are truth. (See how the
   existing code was derived in `IMPLEMENTATION_NOTES.md`.)
3. **Server-only discipline:** anything importing `@qvac/sdk`, `@tetherto/wdk-*`,
   `hyperswarm`, or `ws` runs in Node/Bare only — Route Handlers (`export const
   runtime = "nodejs"`) or `services/*`. Never in a Client Component or the browser bundle.
4. **Wallet = testnet** (`SPARK_NETWORK=TESTNET`). Never mainnet. Never commit a seed.
5. **Design:** dark theme tokens in `globals.css`; Fraunces serif for display +
   assistant answers; Inter body; JetBrains Mono for amounts/ids/coords; soft/tenue
   spy gradient (`AppBackground`); sassy-but-caring persona (`lib/agents/persona.ts`),
   Spanish-first, no markdown when spoken; sub-300ms GPU motion; `prefers-reduced-motion` honored.
6. **Commit frequently** on `feat/leclerc-scaffold` (or open sub-branches/PRs per
   milestone). After each milestone: `bunx tsc --noEmit` clean + a one-line log to
   `artifacts/`. Keep `docs/leclerc/IMPLEMENTATION_NOTES.md` current.

## Working method (the loop)
For each milestone below: read the relevant spec doc → verify SDK shapes against
`.d.ts`/examples → implement → `bunx tsc --noEmit` (in `apps/app`) → write/run a
smoke where inference/wallet/p2p is involved → fix → commit → capture an artifact
log → next. Use `bun install` after dependency changes. Run `bun run dev:qvac`
(station + app) and `bun run voice` (voice service) to exercise flows. Prefer the
existing patterns; reuse, don't reinvent. Benchmarks for P2P/Bare/encryption live
in `references/pearpass-*` (see doc 12).

## Already DONE (do not rebuild — extend/verify only)
- Spec docs 00–13; compliance (transformers.js removed; QVAC-only modes).
- `packages/qvacs`: embed/RAG/ocr/translate/tools wrappers — **embed+RAG runtime-proven** (`packages/qvacs/smoke.mjs`).
- `lib/qvac/server.ts`: real `loadModel({modelSrc,modelType,modelConfig})`, bundled embed model, tools-enabled LLM.
- `lib/rag/*` + `/api/rag` (ingest/query/search) — proven.
- `lib/agents/{tools,orchestrator}` + `/api/brief` (built; LLM path not yet smoke-run).
- `lib/p2p/{delegate,deaddrop}` + `/api/station` (built; not proven).
- `lib/wallet` (WDK Lightning+EVM) + `/api/wallet` (built; not proven).
- `lib/intel/{schema,crypto,store-client,assemble}` (encrypted dossier + wipe).
- i18n es/en (`proxy.ts`, `locales/*`, `messages/*`).
- **Cleo home** (`[locale]/page.tsx`): greeting, chat (text via `/api/chat`, voice via service), starter + live RAG chips, Spend/Ask/Stash/Request bar wired to finance insights.
- `lib/voice/{client,use-voice}` (mic→WS→playback→mic-gate); `components/{chat-bubble,chips,voice-button,action-bar,app-background,animated-background}`.
- `lib/agents/persona`, `lib/finance/{store-client,insights}` (encrypted tx + demo seed).
- **`services/voice`**: continuous-VAD ASR→LLM→TTS over WS — **chain smoke-proven** (`bun run voice:smoke`).
- Serif + mono typography; ported spy AnimatedBackground.
- Deep screens exist: `[locale]/{expediente,expediente/[id],analisis,billetera,enlace,ajustes}`.

## REMAINING — build all of this overnight

### M1 · Voice E2E in the browser
Run `bun run voice` + the app; drive the real loop in a browser. Confirm mic →
`transcript` → streamed `token` → `answer` → audio playback, with mic-gate (no
self-hearing). Fix frame format/size/timing in `lib/voice/client.ts` if the service
rejects audio. Add a visible listening/thinking/speaking state on the home. Use the
`/browse` capability or a manual run; capture a transcript to `artifacts/voice/`.

### M2 · Wallet runtime (testnet)
Write `services/voice`-style or a `scripts/wallet-smoke.mjs`: generate seed, EVM +
Spark accounts, read balances, pay a Lightning **testnet** invoice (verify Spark
network support; if regtest/local needed, document it). Verify `lib/wallet` arg
shapes against `@tetherto/wdk-*` `.d.ts` (transfer field names, `payLightningInvoice`,
balances units). Wire `[locale]/billetera` to real balances + the confirm modal.
Capture proof to `artifacts/wallet/`.

### M3 · Finance flows (the Cleo face)
Make Spend / Stash / Request real: Spend → a breakdown view/cards over the local tx
store (`lib/finance/*`), with the sassy summary; Stash → a save-goal flow; Request →
wallet request/pay (Lightning). Keep it gorgeous and minimal (Cleo). All local; LLM
narrates with attitude via `/api/chat` + `financeContext`.

### M4 · Analyst desk brief
Wire `[locale]/analisis` to `/api/brief`; run with seeded intel records; render the
`IntelBrief` (BLUF, findings w/ cited record ids, geo, recommendations). Rebuild
PDF/DOCX export against `IntelBrief`/`IntelRecord` (the old `lib/reports/export` was
removed; author a fresh renderer). Optional TTS readout via the voice service /
`textToSpeech`. Smoke the full multi-agent run (LLM download). Capture to `artifacts/brief/`.

### M5 · Intel layer reachable + capture loop
From the home, long-press "Ask" (or a shield in the top bar) opens the Intel layer:
dossier, capture, brief, dead-drop. Verify capture end-to-end: voice/text → QVAC
extraction → `IntelRecord` → confirm → RAG ingest (`/api/rag` ingest) → recall works.
Add document intel: `lib/qvac/server` `loadOcr`/`loadTranslate` (set model srcs),
wire a "add document" photo → `ocr` (+ `translate` for foreign) → attachment + ingest.

### M6 · P2P delegation + dead-drop
Productionize `lib/p2p/deaddrop` (long-lived worker/service, not a per-request
handler — see `references/pearpass-mobile/src/{worklet,hooks/useQRScanner.js}`).
Wire `/api/station` start with a stable `QVAC_HYPERSWARM_SEED`; verify
`completion({delegate})` shape; QR pairing UI in `[locale]/enlace`. Prove: one
instance delegates a completion to another, and a brief/record dead-drops between two
app instances (encrypted). Capture to `artifacts/p2p/` (redact keys).

### M7 · MedPsy medic mode (Our Psy track)
Set `LECLERC_MEDPSY_SRC` to a MedPsy GGUF; wire the medic agent path in the
orchestrator and a "medic" model level; surface a health-intel mode in the UI. Prove
it runs on a medical-content record.

### M8 · Compliance, artifacts, submission
- Compliance grep gate green (see rule 1).
- Capture `loggingStream` + `profiler.export*` + `getLoadedModelInfo` (backend device
  = Metal/Vulkan/CPU) to `artifacts/{logs,profiler,hardware}/` during a real run.
- `SUBMISSION.md`: what it is, tracks (General Purpose + Our Psy + P2P story), how each
  mandatory requirement is met, repro steps, hardware used, artifact links.
- Root `README.md`: reproducibility — hardware, prereqs (Bun 1.3.10, Node ≥22.17),
  models (incl. MedPsy), one-command run (`bun install && bun run dev:qvac` + `bun run voice`),
  `.env.example` complete. Record the demo per `docs/leclerc/08` → `artifacts/demo/`.

### M9 · Quality pass
Prod `next build` passes on real hardware (`NODE_OPTIONS=--max-old-space-size=8192`).
Lint clean. Mobile-first responsive (≤480px), es/en parity, empty/error/loading states
everywhere, WCAG AA contrast, panic-wipe verified. No hardcoded UI strings (all via i18n).

## Definition of Done (the whole app)
A judge can, on a ≤32GB laptop:
1. `bun install && bun run dev:qvac` and `bun run voice`, open the PWA.
2. With network off after model cache: **talk to LeClerc and get spoken answers** (voice loop).
3. See a **sassy finance roast** over local data (Spend), and type-chat with the persona.
4. **Capture intel** by voice, then **recall it** via RAG; run a **multi-agent brief** with cited sources; export it.
5. **Photograph a document** → on-device OCR/translate into the dossier.
6. **Pay an asset over Lightning (testnet)** behind a confirm modal.
7. **Delegate** a job to a paired peer and **dead-drop** a brief P2P.
8. **Panic-wipe** clears everything.
All inference + RAG via QVAC, offline by default. `artifacts/` proves it; `SUBMISSION.md`
+ `README.md` make it reproducible. `bunx tsc --noEmit` and `next build` pass.

## End-of-run report (always produce)
Append a STATUS block to `IMPLEMENTATION_NOTES.md`: per-milestone DONE/PARTIAL/BLOCKED,
what was smoke-proven vs wired-only, every `TODO(codex)` left, and exact repro/run
commands. Commit and push. If blocked on a model download or a missing model src,
document the env var to set and continue with the next milestone — never stall the loop.
