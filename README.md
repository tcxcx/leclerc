# LeClerc

LeClerc is "Cleo for spies": a local-first, voice-first field handler that runs
intel capture, dossier recall, analyst briefs, dead drops, and testnet wallet
flows from the operative's machine. The PWA is the required shipping surface; the
desktop and mobile native shells are scaffolded in this repo and tracked in
`docs/leclerc/14-surfaces-and-shared-core.md`.

The hard rule is simple: all AI inference and RAG go through `@qvac/sdk`. No
third-party model API, browser inference fallback, or external vector database is
part of the judged path.

## What Works

- Cleo home: text chat, voice state, finance cards, live dossier recall chips.
- Voice service: microphone WebSocket loop with ASR -> LLM -> TTS through QVAC.
- Finance: local encrypted transactions, spend summary, savings goals, request
  flow into the wallet screen.
- Wallet: Tether WDK wired for testnet Spark/Lightning and EVM, with a checked-in
  smoke script that skips live payment unless a testnet invoice is supplied.
- Intel: capture, encrypted dossier storage, confirm -> QVAC RAG ingest, recall,
  document attach controls, and panic wipe.
- Analyst desk: multi-agent brief over seeded dossier records with cited findings
  and PDF/DOCX export.
- P2P: encrypted Hyperswarm dead drop proven between two clients; delegated
  completion is wired but needs a second DHT-reachable provider to prove.
- Operations: `/operaciones` provides the local mission assigner, operative alias
  control center, workspace invite codes, bounty display, and ops globe over the
  shared `@leclerc/core` ops-console model.
- MedPsy: medic mode is surfaced and blocked on `LECLERC_MEDPSY_SRC`.

See `SUBMISSION.md` and `artifacts/` for the current proof set.

## Requirements

- Bun 1.3.10 (`packageManager` is pinned)
- Node >= 22.17
- macOS, Linux, or Windows with a QVAC-supported backend. The current artifact run
  was captured on an Apple M4 Pro using the local SDK runtime.
- Enough disk for model cache. The app defaults to small Qwen/Whisper/EmbeddingGemma
  models suitable for a <=32 GiB laptop; optional OCR, translate, and MedPsy models
  require additional local model files or registry sources.

## Setup

```bash
bun install
cp apps/app/.env.example apps/app/.env.local
```

Fill only the optional env vars for the features you want to exercise:

- `LECLERC_OCR_SRC`: QVAC OCR model source for document intel.
- `LECLERC_TRANSLATE_SRC`: QVAC translation model source.
- `LECLERC_TRANSLATE_MODEL_TYPE`: `nmt` or `llm`, defaults to `nmt`.
- `LECLERC_MEDPSY_SRC`: MedPsy GGUF or registry source for Our Psy medic mode.
- `QVAC_HYPERSWARM_SEED`: 64-hex private seed for a stable station peer key.
- `LECLERC_TESTNET_LIGHTNING_INVOICE`: optional Spark/Lightning testnet invoice
  for the wallet smoke.

Never commit a seed phrase, `QVAC_HYPERSWARM_SEED`, API key, or funded invoice.

## Run

Use two terminals:

```bash
# Terminal 1: PWA + local QVAC station
bun run dev:qvac

# Terminal 2: voice WS service (Bun-only; plain node cannot load workspace TS exports)
bun run voice
```

Open `http://localhost:7001/es`.

Useful focused commands:

```bash
cd apps/app && bunx tsc --noEmit
bun run wallet:smoke
bun run qvac:artifacts
bun run voice:smoke
```

The M8 compliance gate is:

```bash
rm -rf apps/app/.next
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
```

It should return no matches.

## Reproducibility & hardware

**Run locally (fast, full feature set — recommended for judging):**

```bash
bun install
cp apps/app/.env.example apps/app/.env.local   # fill only the optional vars you want
bun run dev:qvac     # terminal 1 — PWA + local QVAC station → http://localhost:7001/es
bun run voice        # terminal 2 — voice WS service
```

Proofs / gates:

```bash
cd apps/app && bunx tsc --noEmit
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services   # QVAC-only → no matches
bun run qvac:artifacts     # regenerates the structured audit log (model load + TTFT/tokens-sec)
bun run wallet:smoke       # WDK testnet (skips live pay unless an invoice is set)
```

**Hosted (no install):** [`leclerc-intel.vercel.app`](https://leclerc-intel.vercel.app)
— UI + QVAC chat/transcribe/capture via the station proxy. The full server-side
feature set (RAG, multi-agent brief, wallet) runs on the Fly deployment
(`leclerc-app.fly.dev`), which executes the native `@qvac/sdk` in-process.

**Devices used in the demo:**

| Device / role | CPU | GPU | RAM | Storage | OS / runtime |
|---|---|---|---|---|---|
| **Station laptop** — primary inference, artifact capture, fast demo | Apple M4 Pro, 14-core (10P + 4E) | Apple M4 Pro, 20-core, Metal 3 | 48 GB unified | Internal NVMe SSD; model cache `~/.qvac/models` ≈ 4–6 GB | macOS 15.7.1 (Mac16,8), Node v23.11.0, Bun 1.3.10 — `backendDevice: gpu` |
| **Cloud QVAC station (Railway)** — powers the Vercel link's `/api/qvac` proxy | Linux x64 container, shared vCPU, CPU-only (software Vulkan / lavapipe) | none | ~8 GB container | Persistent volume; model cache (whisper-base, llama-1b, qwen3-1.7b) | `qvac serve` OpenAI-compatible; ≈ 3.4 tok/s |
| **Cloud app server (Fly.io)** — full app online, in-process `@qvac/sdk` | shared-cpu-4x (4 vCPU), CPU-only (software Vulkan) | none | 8 GB | 8 GB persistent volume `/data` (model cache), region `ord` | Debian bookworm, Node 22; runs RAG/brief/wallet server-side |
| **Demo client (PWA)** — phone used to record the video | _fill: handset chip_ | — | _fill_ | — | mobile browser, portrait ≤480px (installable PWA) |

Models (≤32 GiB target): Qwen3 0.6B–1.7B Q4 (LLM/agents), Whisper (ASR),
EmbeddingGemma 300M (RAG); optional OCR / translation / MedPsy. The reproducible
audit run uses Qwen3-0.6B-Q4. Fill the phone row with the exact handset you
record on (model, chip, RAM).

## Remote APIs

LeClerc is local-first: **all AI inference and RAG go through QVAC** — no
third-party model API and no external vector database in the judged path (the
compliance grep above returns no matches). Full structured reference:
[`docs/leclerc/REMOTE_APIS.md`](docs/leclerc/REMOTE_APIS.md). Every variable is
documented in `apps/app/.env.example`.

| Remote API | Purpose | Who runs it | Auth | Callers |
|---|---|---|---|---|
| **QVAC station** (OpenAI-compatible HTTP) | All HTTP inference: `/v1/chat/completions`, `/v1/audio/transcriptions`, `/v1/models` | The operator — local `qvac serve`, else `QVAC_BASE_URL` (Railway/Fly box), optional `QVAC_NGROK_URL` | `Bearer QVAC_API_KEY` (injected server-side; never in the browser bundle) | browser `lib/qvac/client.ts` → same-origin `/api/qvac` proxy |
| **QVAC native SDK** (in-process, no HTTP) | `completion`, `embed`, `rag*` (HyperDB), `ocr`, `translate`, `textToSpeech`, profiler/logging | In-process on the station / Fly app server | n/a (local) | `@repo/qvacs` → server Route Handlers |
| **Tether WDK** indexer + EVM RPC | Self-custodial wallet: balances + broadcast (Spark/Lightning, EVM USDT) | `WDK_INDEXER_BASE_URL` (`wdk-api.tether.io`), `EVM_RPC_URL` | optional key; `SPARK_NETWORK=TESTNET` enforced | `/api/wallet` |
| **Circle / Rain** (optional, off by default) | Fund an agent card with USDC (testnet) | Circle API | `CIRCLE_*` | `/api/rain-cards` |
| **Google Fonts** | UI web fonts (no data sent) | fonts.googleapis.com | none | root layout |

**Not used:** ❌ third-party LLM/model APIs (OpenAI, Anthropic, Google, HF) · ❌
external/hosted vector database · ❌ analytics or telemetry in the judged path.

## Repository

```text
apps/app/           Next.js 16 PWA, Route Handlers, Cleo UI
apps/desktop/       Pear + Electron shell scaffold
apps/mobile/        Expo + Bare shell scaffold
packages/core/      Runtime-agnostic LeClerc contracts and pure helpers
packages/qvacs/     Server-only QVAC SDK wrapper and RAG helpers
packages/worklet/   Bare worklet RPC scaffold for native surfaces
services/voice/     Continuous VAD voice WebSocket service
scripts/            Runtime smokes and artifact capture
docs/leclerc/       Product, architecture, design, and overnight build brief
artifacts/          Smoke logs, screenshots, profiler data, export proof
```

## Known limitations

MedPsy ("Our Psy" track) now runs by default: the analyst desk's medic agent
loads QVAC's MedGemma-4B (`MEDGEMMA_4B_IT_Q4_1`, override via `LECLERC_MEDPSY_SRC`).

Remaining, by design:

- **Document OCR + translate** are wired behind `/api/document` but gated on a
  QVAC OCR model source. QVAC's OCR moved to a multimodal projector
  (`MMPROJ_OCR_0_6B`); set `LECLERC_OCR_SRC` to enable. Translate reuses an LLM
  when `LECLERC_TRANSLATE_MODEL_TYPE=llm`, else needs `LECLERC_TRANSLATE_SRC`.
- **P2P delegated completion** needs a second DHT-reachable provider device; the
  encrypted dead-drop path is proven between two clients.
- **Desktop/mobile shells** (Pear+Electron, Expo+Bare) compile and share
  `@leclerc/core`, but the native QVAC/WDK/Hyperswarm adapter and native runtime
  deps are not vendored — these are native targets, not part of the web deploy.
