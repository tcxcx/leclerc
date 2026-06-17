# LeClerc — Remote APIs (structured reference)

LeClerc is local-first. **All AI inference and RAG go through QVAC** — there is no
third-party model API and no external vector database in the judged path (CI grep
gate over `huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone`
returns no matches). The only network calls are to operator-controlled or
explicitly-chosen endpoints, all toggled by env vars in `apps/app/.env.example`.

## 1. QVAC station (the only AI API) — OpenAI-compatible HTTP

| Field | Value |
|---|---|
| Purpose | All inference reachable over HTTP: chat/completions, audio/transcriptions, models |
| Who runs it | The operative. Local `qvac serve`, or an operator-owned cloud box |
| Base URL (local) | `NEXT_PUBLIC_QVAC_LOCAL_URL` (default `http://localhost:11434`) |
| Base URL (proxy upstream) | `QVAC_BASE_URL` → operator's QVAC box (this demo: a Railway container) |
| Optional 2nd upstream | `QVAC_NGROK_URL` → an ngrok tunnel to an operator GPU box (tried after Railway) |
| Auth | `Bearer ${QVAC_API_KEY}` (injected server-side by the proxy; never in the browser bundle) |
| Endpoints | `GET /v1/models`, `POST /v1/chat/completions`, `POST /v1/audio/transcriptions` |
| Callers | Browser `lib/qvac/client.ts` → same-origin proxy `apps/app/src/app/api/qvac/[...path]/route.ts` → upstream |
| Native/local path | `@repo/qvacs` wraps `@qvac/sdk` directly (no HTTP): `completion`, `embed`, `rag*`, `ocr`, `translate`, `textToSpeech`, `transcribe`, profiler/logging |

**Resolution order (browser):** probe local `qvac serve` first (true offline); if
absent, fall back to the same-origin `/api/qvac` proxy, which forwards to
`QVAC_BASE_URL` then `QVAC_NGROK_URL`. No request leaves a box the operator
doesn't control.

## 2. Tether WDK wallet infrastructure (testnet only)

| Field | Value |
|---|---|
| Purpose | Self-custodial wallet balances + broadcast (Spark/Lightning, EVM USDT) |
| Indexer | `WDK_INDEXER_BASE_URL` (default `https://wdk-api.tether.io`), key `WDK_INDEXER_API_KEY` |
| EVM RPC | `EVM_RPC_URL`, `EVM_CHAIN_ID` (default `11155111` Sepolia), `USDT_ADDRESS` (testnet token) |
| Network guard | `SPARK_NETWORK=TESTNET` is enforced at runtime; seeds are runtime-only, never committed |
| Callers | `apps/app/src/app/api/wallet/route.ts` via `@tetherto/wdk*` (server/native, not browser) |

## 3. Circle / Rain agent cards (OPTIONAL — desk-v1 reuse, off by default)

| Field | Value |
|---|---|
| Purpose | Fund an agent card by sending USDC from the WDK wallet (testnet) |
| Vars | `CIRCLE_API_KEY`, `CIRCLE_ENTITY_SECRET`, `CIRCLE_WEBHOOK_SECRET`, `CIRCLE_BLOCKCHAIN`, `TREASURY_WALLET_*`, `USDC_ADDRESS`, `LECLERC_RAIN_USDC_DEPOSIT_ADDRESS` |
| Status | Optional feature; reports `configured=false` when unset. Not on the core intel path |
| Caller | `apps/app/src/app/api/rain-cards/route.ts` |

## 4. Fonts / static (Google Fonts)

`https://fonts.googleapis.com` + `https://fonts.gstatic.com` for the Fraunces /
Inter / JetBrains Mono / Material Symbols web fonts (UI only, no data sent).

## What is NOT used

- ❌ No third-party LLM/model API (OpenAI, Anthropic, Google, HF inference, etc.)
- ❌ No external/hosted vector database (Pinecone, Chroma, etc.) — RAG is QVAC
  HyperDB, local.
- ❌ No analytics/telemetry/tracking in the judged path.

## Storage (not a remote API, listed for completeness)

- **Models**: cached locally at `~/.qvac/models` (a few GB: Qwen3 0.6B–1.7B Q4,
  Whisper, EmbeddingGemma). On the cloud station, on the container volume.
- **Dossier**: encrypted at rest in the browser (IndexedDB); key derived from the
  passphrase, never stored. Panic-wipe clears it.

Every variable above is documented in `apps/app/.env.example`.
