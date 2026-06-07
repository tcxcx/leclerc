# SemanticPay WDK EVM x402 Facilitator Reference

Upstream: `https://github.com/SemanticPay/wdk-wallet-evm-x402-facilitator`
Pinned HEAD checked 2026-06-07: `1a2fd19e410b35ba5374604bf3c874fac6352d4e`

## Pattern To Reuse

The upstream package wraps a `@tetherto/wdk-wallet-evm` `WalletAccountEvm` as an
x402 facilitator signer. The adapter exposes:

- `getAddresses()`
- `getCode({ address })`
- `readContract({ address, abi, functionName, args })`
- `verifyTypedData({ address, domain, types, primaryType, message, signature })`
- `writeContract({ address, abi, functionName, args })`
- `sendTransaction({ to, data })`
- `waitForTransactionReceipt({ hash })`

## LeClerc Integration Decision

- Keep x402/facilitator work in Node/Bare only, next to WDK execution.
- Do not import facilitator code into the browser bundle.
- Use the same adapter boundary for paid agent calls once the x402 package is
  added and a verified Arc Testnet settlement contract/venue exists.
- Current W6 wallet agent tools expose balances/send/swap-intent through
  `apps/app/src/lib/agents/wallet-tools.ts`.

## Current Blocker

`@tetherto/wdk-mcp-toolkit@0.0.0` installs but currently contains only a
`package.json` and no callable exports. LeClerc therefore registers wallet tools
directly with `@modelcontextprotocol/sdk` until the toolkit publishes usable code.
