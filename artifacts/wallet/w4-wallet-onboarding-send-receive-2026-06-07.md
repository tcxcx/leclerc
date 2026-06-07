# W4 Wallet Onboarding + Send / Receive / Transactions

Date: 2026-06-07
Branch: `feat/leclerc-scaffold`

## Implemented

- Replaced the wallet page with the required flow:
  - create wallet
  - claim operation handle
  - Face ID stub
  - recovery phrase display
  - ready wallet surface
- Added catalog-driven wallet views:
  - multi-asset balances
  - send form
  - review sheet
  - submitted state
  - receive handle/address panel with local QR-style code
  - transactions list
- Added server-side wallet actions:
  - `receive`
  - `transactions`
  - catalog-token `payEvm(seed, to, amount, assetId, chainId)`
- WDK imports remain server-only in `apps/app/src/lib/wallet/index.ts`.
- Sends are still guarded to Arc Testnet `5042002`; Arbitrum One remains read-only by catalog policy.
- Seed is generated and displayed only in the recovery UI; the smoke artifact records `seedPrinted:false`.

## Smoke / Verification

```bash
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
bun run wallet:smoke
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
rm -rf apps/app/.next
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
```

Results:

- Core typecheck: pass.
- App typecheck: pass.
- App lint: pass.
- Wallet smoke: pass, wrote `artifacts/wallet/wdk-smoke-2026-06-07T15-51-35-196Z.*`.
- App production build: pass.
- Forbidden inference grep: empty (grep exit 1 expected).

## Partial / Remaining

- Face ID is a local stub, per prompt allowance.
- QR is a local deterministic QR-style visual code, not a standards-compliant scanner QR package.
- Live EVM send requires funded Arc Testnet wallet and valid recipient; no live transfer was broadcast in this pass.
- Spark transaction history is wired through `getTransfers`; live rows require Spark testnet connectivity/activity.
