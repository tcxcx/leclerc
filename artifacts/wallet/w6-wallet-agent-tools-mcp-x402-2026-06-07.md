# W6 Local AI Wallet Tools (MCP + x402 Reference)

Date: 2026-06-07
Branch: `feat/leclerc-scaffold`

## Implemented

- Installed:
  - `@tetherto/wdk-mcp-toolkit@0.0.0`
  - `@modelcontextprotocol/sdk@1.29.0`
- Added server-only wallet agent tools in `apps/app/src/lib/agents/wallet-tools.ts`:
  - `wallet_balances`
  - `wallet_send`
  - `wallet_swap`
- Added route handler:
  - `POST /api/agent/wallet-tools`
  - `action:list` returns the local tool registry.
  - `action:call` invokes a named wallet tool in the trusted station runtime.
- Added `createWalletMcpServer()` using installed `McpServer` from
  `@modelcontextprotocol/sdk/server/mcp.js`.
- Added x402 facilitator reference:
  - `references/wdk-wallet-evm-x402-facilitator.md`
  - Upstream pinned HEAD: `1a2fd19e410b35ba5374604bf3c874fac6352d4e`

## Important Blocker

`@tetherto/wdk-mcp-toolkit@0.0.0` currently installs as a package containing only
`package.json`; it has no callable JS or `.d.ts` exports. W6 therefore registers
LeClerc wallet tools directly with `@modelcontextprotocol/sdk` and documents this
as a package blocker.

## Smoke

```bash
bun --filter app dev
curl -s -X POST http://localhost:7001/api/agent/wallet-tools \
  -H 'Content-Type: application/json' \
  -d '{"action":"list"}'
```

Result:

```json
{
  "server": "leclerc-wallet",
  "connected": false,
  "tools": [
    { "name": "wallet_balances" },
    { "name": "wallet_send" },
    { "name": "wallet_swap" }
  ]
}
```

## Verification

```bash
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
grep -rE --exclude-dir=.next "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
```

Results:

- App typecheck: pass.
- App lint: pass.
- App production build: pass.
- Forbidden inference grep: empty (grep exit 1 expected).

## Partial / Remaining

- `wallet_send` is live-wired for Arc Testnet WDK EVM transfers, but no funded live
  transaction was broadcast in this pass.
- `wallet_swap` returns a blocked swap intent until a verified Arc Testnet swap venue
  is wired.
- x402 facilitator is documented but not installed/executed; the reference pattern is
  ready for a follow-up once the settlement venue is chosen.
