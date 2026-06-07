# LeClerc Submission

## Summary

LeClerc is a local-first field station: Cleo's finance-led assistant surface plus
an offline spy layer for voice capture, dossier RAG, analyst briefs, document
intel, encrypted P2P dead drops, and testnet wallet actions.

The judged PWA runs from one monorepo. Inference and RAG use `@qvac/sdk` only.
Sensitive records stay encrypted at rest in the browser vault; station routes run
on the operator's trusted localhost for QVAC, WDK, and Hyperswarm work.

## Tracks

| Track | Status | Evidence |
|---|---|---|
| General Purpose | Primary | Voice, finance, capture, RAG, brief, export, wallet, dead-drop all wired and smoke/artifact-backed. |
| Our Psy | Partial | Medic mode is surfaced and routed to `LECLERC_MEDPSY_SRC`; smoke documents the missing model source. |
| P2P story | Partial | Encrypted dead drop is proven; delegated completion is wired but needs a second DHT-reachable provider to prove. |

## Mandatory Requirements

| Requirement | LeClerc implementation |
|---|---|
| QVAC-only AI inference and RAG | `@qvac/sdk` for completion, transcribe, embed/RAG, OCR, translate, logging, profiling. No third-party model APIs or vector stores in judged paths. |
| Local-first/offline default | PWA talks to local station/SDK routes; records are encrypted in IndexedDB; network use is explicit P2P or wallet broadcast. |
| <=32 GiB laptop target | PWA path uses compact Qwen/Whisper/EmbeddingGemma models; M8 profiler proof uses `QWEN3_600M_INST_Q4` as the small reproducible run. |
| Wallet safety | Spark is enforced as `TESTNET`; seed phrases are runtime-only; live payment smoke is skipped unless a testnet invoice env var is supplied. |
| Artifacts | `artifacts/voice`, `wallet`, `finance`, `brief`, `intel`, `p2p`, `medpsy`, plus M8 `logs`, `profiler`, and `hardware`. |

## Repro

```bash
bun install
cp apps/app/.env.example apps/app/.env.local

# Terminal 1
bun run dev:qvac

# Terminal 2
bun run voice
```

Open `http://localhost:7001/es`.

Run gates:

```bash
cd apps/app && bunx tsc --noEmit
cd ../..
rm -rf apps/app/.next
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
bun run qvac:artifacts
```

Optional smokes:

```bash
bun run voice:smoke
bun run wallet:smoke
```

## Environment

Required for the default PWA:

- `NEXT_PUBLIC_QVAC_LOCAL_URL=http://localhost:11434`
- `NEXT_PUBLIC_VOICE_WS_URL=ws://localhost:7077`
- `SPARK_NETWORK=TESTNET`
- `LECLERC_ALLOW_NONQVAC=false`

Optional:

- `LECLERC_OCR_SRC` for document OCR.
- `LECLERC_TRANSLATE_SRC` and `LECLERC_TRANSLATE_MODEL_TYPE` for translation.
- `LECLERC_MEDPSY_SRC` for medic mode.
- `QVAC_HYPERSWARM_SEED` for a stable station peer key.
- `LECLERC_TESTNET_LIGHTNING_INVOICE` for live testnet Lightning payment smoke.

## Hardware Used For Artifacts

M8 artifacts were captured on macOS 15.7.1, Apple M4 Pro, 48 GiB RAM, Bun 1.3.10,
Node v23.11.0. The captured model run uses the smaller Qwen3 600M Q4 model to
stay representative for a <=32 GiB judging laptop.

## Artifact Index

- `artifacts/logs/2026-06-07-sdk-api-compliance.md`: installed `.d.ts` and example verification.
- `artifacts/voice/`: browser/voice service proof.
- `artifacts/wallet/`: WDK smoke and testnet guard proof.
- `artifacts/finance/`: Spend/Stash/Request UI proof.
- `artifacts/brief/`: analyst brief JSON/PDF/DOCX/UI proof.
- `artifacts/intel/`: capture -> RAG ingest/search and document-control proof.
- `artifacts/p2p/`: encrypted dead drop, station provider, delegated-completion blocker.
- `artifacts/medpsy/`: medic UI and missing-model-source proof.
- `artifacts/logs/m8-*`: QVAC run and logging stream capture.
- `artifacts/profiler/m8-*`: `profiler.exportJSON`, table, and summary.
- `artifacts/hardware/m8-*`: `getLoadedModelInfo` and system hardware capture.

## Known Gaps

- `LECLERC_OCR_SRC` is not set in this environment, so live OCR is wired but not
  runtime-proven.
- `LECLERC_TRANSLATE_SRC` is not set, so translation is wired but not runtime-proven.
- `LECLERC_MEDPSY_SRC` is not set, so the Our Psy path is partial.
- Delegated completion failed in self-provider mode with `PEER_CONNECTION_FAILED`;
  proving it needs a second DHT-reachable provider process/device.
- Desktop and mobile shells are M10/M11 stretch scaffolds: they compile, import
  `@leclerc/core` and `@leclerc/worklet`, and smoke to the expected
  `missing-adapter` state, but native runtime dependencies and the QVAC/WDK/
  Hyperswarm adapter are not vendored yet.
