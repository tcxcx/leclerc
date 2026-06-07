# M10 shared core and worklet scaffold

Date: 2026-06-07
Branch: feat/leclerc-scaffold

## Result

- Added `packages/core` as `@leclerc/core`.
- Added runtime-agnostic contracts and pure helpers for Intel, finance, agents,
  RAG/document intel, wallet, P2P, voice, surfaces, and RPC.
- Added `packages/worklet` as `@leclerc/worklet`.
- Added a Bare worklet host scaffold that exposes the `@leclerc/core` RPC
  boundary and reports `missing-adapter` until the native adapter is wired.

## QVAC / WDK verification

No new QVAC SDK or WDK calls were wired in this milestone. The worklet package
deliberately avoids importing `@qvac/sdk`, WDK, or Hyperswarm until the native
adapter is implemented and each call is rechecked against installed `.d.ts`
files plus `node_modules/.bun/@qvac+sdk*/dist/examples`.

## Commands

```sh
bun install
bun --filter @leclerc/core typecheck
bun --filter @leclerc/worklet typecheck
cd apps/app && bunx tsc --noEmit
cd packages/worklet && bun -e 'import { createLeclercWorkletHost } from "./src/index.ts"; import { buildRecord, emptyExtraction, summarizeSpend } from "@leclerc/core"; const now = Date.UTC(2026, 5, 7); const record = buildRecord("source", emptyExtraction(), { kind: "observacion", sector: null, capturedAt: now, durationMs: null, locale: "es" }, { id: "smoke", createdAt: now }); const host = createLeclercWorkletHost(); const summary = summarizeSpend([{ id: "tx1", ts: now, amount: 12.5, currency: "USDT", kind: "spend", category: "comms", merchant: "station" }], now); console.log(JSON.stringify({ recordId: record.id, threat: record.amenaza, weekSpend: summary.weekSpend, hostQvac: host.status({ SPARK_NETWORK: "TESTNET" }).qvac }));'
```

Smoke output:

```json
{"recordId":"smoke","threat":"RUTINARIO","weekSpend":12.5,"hostQvac":"missing-adapter"}
```

## Notes

This is an incremental extraction as allowed by `docs/leclerc/14-surfaces-and-shared-core.md`.
The PWA still owns the concrete route handlers and storage. Native shells can
now consume the shared contracts while the full native adapter is implemented.
