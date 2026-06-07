# @leclerc/worklet

Bare worklet scaffold for native LeClerc surfaces.

The package defines the RPC boundary that desktop and mobile shells call. It
does not import or call `@qvac/sdk`, WDK, or Hyperswarm yet. Those integrations
must be wired only after checking the installed `.d.ts` files and
`node_modules/.bun/@qvac+sdk*/dist/examples`, matching the overnight brief.

Expected native environment:

- `LECLERC_MEDPSY_SRC`: optional MedPsy GGUF model source.
- `LECLERC_OCR_SRC`: optional OCR model source.
- `QVAC_HYPERSWARM_SEED`: optional deterministic swarm seed for native demos.
- `USDT_ADDRESS`, `EVM_CHAIN_ID`, `EVM_RPC_URL`: testnet EVM wallet settings.
- `SPARK_NETWORK=TESTNET`: Spark demo network.
