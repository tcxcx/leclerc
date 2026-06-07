# 01 · Architecture

## 1. Runtime topology

```
┌─────────────────────────────┐         Hyperswarm DHT          ┌──────────────────────────────┐
│  MOBILE CLIENT (demo)       │   (encrypted, no central server)│  STATION = "safehouse"        │
│  Expo app OR phone PWA      │◄───────────────────────────────►│  Laptop ≤32GB, Node ≥22.17    │
│  • capture voice/photo/text │   delegate inference            │  • @qvac/sdk (server-only)    │
│  • UI, dossier view         │   dead-drop briefs              │  • completion/embed/rag*/ocr  │
│  • WDK wallet (Lightning)   │                                 │  • startQVACProvider (peer)   │
│  • thin QVAC OR delegate    │                                 │  • Next.js app on :7001       │
└─────────────────────────────┘                                 │  • qvac serve openai :11434   │
                                                                 └──────────────────────────────┘
```

Two ways the app reaches inference (mirrors the baseline's existing resolver in `apps/app/src/lib/qvac/client.ts`):

- **In-process (station, server-only):** Next.js Route Handlers / server actions call `@qvac/sdk` directly via `packages/qvacs`. Node runtime only — never Edge, never browser.
- **OpenAI-compatible HTTP (browser/mobile → station):** the client calls `qvac serve openai` on `:11434` (local) or a paired peer. Already implemented; keep it.
- **P2P delegate (mobile → station over DHT):** `completion({ delegate: { providerPublicKey } })`. See [05](./05-p2p.md).

> **Hard constraint.** `@qvac/sdk` is `server-only` (it imports native bindings / Bare). It must run in Node (the station) or Bare/Expo (on-device mobile), **never** in the Next.js browser bundle or a Vercel Edge function. `packages/qvacs/src/index.ts` already enforces this with `import "server-only"`. Keep that.

## 2. Monorepo layout (target)

Bun workspaces (`apps/*`, `packages/*`). Extend, don't restructure.

```
leclerc/
├─ apps/
│  ├─ app/                      # Next.js 16 station UI + server (existing; re-themed)
│  │  ├─ src/app/               # App Router. Add [locale] segment (see 07).
│  │  ├─ src/lib/
│  │  │  ├─ qvac/               # OpenAI-compat client (existing) — keep
│  │  │  ├─ inference/          # routing; REMOVE transformers.js path (see 02)
│  │  │  ├─ intel/              # NEW: dossier schema, store, assemble (re-themed reports/)
│  │  │  ├─ agents/             # NEW: orchestrator + tool registry (see 04)
│  │  │  ├─ p2p/                # NEW: delegation + dead-drop (see 05)
│  │  │  ├─ wallet/             # NEW: WDK wrapper (see 06)
│  │  │  └─ rag/                # NEW: QVAC RAG workspace helpers (see 03)
│  │  ├─ messages/              # NEW: en.json, es.json (see 07)
│  │  ├─ locales/               # NEW: client.ts, server.ts (see 07)
│  │  └─ proxy.ts               # NEW: i18n middleware (see 07)
│  └─ mobile/                   # NEW (stretch/demo): Expo capture client (see 05, 06)
├─ packages/
│  ├─ qvacs/                    # @repo/qvacs — @qvac/sdk wrapper (existing; extend, see 02)
│  ├─ intel-core/              # NEW (optional): shared schema/types between app + mobile
│  └─ wallet-core/             # NEW (optional): shared WDK helpers between app + mobile
├─ infra/qvac/                  # qvac.config.json, start scripts (existing; add MedPsy)
├─ scripts/                     # dev launchers (existing)
├─ artifacts/                   # NEW: captured logs, profiler exports, hardware proof
└─ docs/leclerc/                # this spec
```

Keep new server-only logic inside `apps/app/src/lib/**` for v1 speed; promote to `packages/*` only if the Expo `apps/mobile` client needs to share it (schemas/types and WDK helpers are the likely candidates).

## 3. Tech stack (pinned)

| Layer | Choice |
|---|---|
| Pkg mgr / monorepo | Bun 1.3.10 + Turborepo `^2.5.8` |
| Web | Next.js 16.2.7, React 19.2.4, Tailwind v4 |
| Local AI | `@qvac/sdk@^0.12.2`, `qvac serve openai` (`@qvac/cli`) |
| RAG | QVAC `rag*` (HyperDB workspaces) — see [03](./03-data-and-rag.md) |
| P2P | QVAC delegated inference (built-in Holepunch) + `hyperswarm` for messaging |
| Wallet | `@tetherto/wdk-core`, `@tetherto/wdk-wallet-evm`, `@tetherto/wdk-wallet-spark` (Lightning) |
| i18n | `next-international@^1.3.1` |
| Storage (web) | IndexedDB (existing `store-client.ts`) + encryption layer |
| Storage (mobile) | `@tetherto/wdk-react-native-secure-storage` for keys |
| Export | `docx@^9.5.1`, `@react-pdf/renderer@^4.3.0` (existing) |
| Mobile (stretch) | Expo (Bare runtime for `@qvac/sdk` + WDK) |

## 4. Environment variables (canonical list)

Station / web (`apps/app/.env.local`):

```bash
# QVAC OpenAI-compatible server (existing)
NEXT_PUBLIC_QVAC_LOCAL_URL=http://localhost:11434
NEXT_PUBLIC_QVAC_LOCAL_KEY=                       # optional bearer
NEXT_PUBLIC_QVAC_ASR_MODEL=whisper-base
NEXT_PUBLIC_QVAC_REMOTE_LLM=qwen3-1.7b
QVAC_PORT=11434

# QVAC P2P (see 05)
QVAC_HYPERSWARM_SEED=                             # 64-hex; controls station peer identity

# RAG
LECLERC_RAG_WORKSPACE=dossier                     # default workspace name

# Wallet (see 06) — NEVER commit a real seed
WDK_INDEXER_BASE_URL=https://wdk-api.tether.io
WDK_INDEXER_API_KEY=
EVM_RPC_URL=https://eth.drpc.org                  # or testnet
# SEED_PHRASE is supplied at runtime via secure prompt/secure-storage, not .env in prod

# i18n
# (no env needed; locales are static)
```

Mobile (`apps/mobile/.env` — Expo `EXPO_PUBLIC_*`):

```bash
EXPO_PUBLIC_STATION_PEER_PUBKEY=                  # station's QVAC provider public key
EXPO_PUBLIC_WDK_INDEXER_BASE_URL=https://wdk-api.tether.io
EXPO_PUBLIC_WDK_INDEXER_API_KEY=
```

## 5. Data-flow summary

```
voice/photo/text ─► QVAC transcribe/ocr ─► QVAC completion (extract, tool-calling)
       │                                              │
       ▼                                              ▼
   IntelRecord (encrypted) ──► IndexedDB        QVAC ragIngest (embed+store)
                                   │                  │
   "what do we know about X?" ─────┴──► QVAC ragSearch ─► QVAC completion (brief) ─► DOCX/PDF
                                                                   │
                                          Hyperswarm dead-drop ◄───┘     WDK Lightning pay ─► asset
```
