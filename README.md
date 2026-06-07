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

## Current Partials

- Live document OCR requires `LECLERC_OCR_SRC`.
- Translate requires `LECLERC_TRANSLATE_SRC`.
- MedPsy requires `LECLERC_MEDPSY_SRC`.
- P2P delegated completion needs a second DHT-reachable provider process/device;
  the encrypted dead-drop path is proven.
- Desktop and mobile shells compile as scaffolds and share `@leclerc/core`, but
  the native QVAC/WDK/Hyperswarm adapter plus Electron/Pear and Expo/Bare
  runtime dependencies are not vendored yet.
