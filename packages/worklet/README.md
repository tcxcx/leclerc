# @leclerc/worklet

Bare worklet scaffold for native LeClerc surfaces.

The package defines the RPC boundary that desktop and mobile shells call. It
exports `createNativeWorkletAdapter()`, a typed adapter router that handles
safe scaffold station start/stop calls and returns explicit `not-configured`
errors for QVAC, WDK, and P2P methods until native handlers are supplied. It
does not import or call `@qvac/sdk`, WDK, or Hyperswarm yet. Those integrations
must be wired only after checking the installed `.d.ts` files and
`node_modules/.bun/@qvac+sdk*/dist/examples`, matching the overnight brief.

Expected native environment:

- `LECLERC_MEDPSY_SRC`: optional MedPsy GGUF model source.
- `LECLERC_QVAC_MODEL_SRC`: native QVAC LLM model source for on-device turns.
- `LECLERC_EMBED_SRC`: native QVAC embedding model source for RAG.
- `LECLERC_OCR_SRC`: optional OCR model source.
- `QVAC_HYPERSWARM_SEED`: optional deterministic swarm seed for native demos.
- `USDT_ADDRESS`, `EVM_CHAIN_ID`, `EVM_RPC_URL`: testnet EVM wallet settings.
- `SPARK_NETWORK=TESTNET`: Spark demo network.
