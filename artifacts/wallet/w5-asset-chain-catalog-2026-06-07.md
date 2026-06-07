# W5 Asset / Chain Catalog

Date: 2026-06-07
Branch: `feat/leclerc-scaffold`

## Implemented

- Added typed catalog in `packages/core/src/asset-catalog.ts`.
- Chains:
  - Arc Testnet `5042002`, writable testnet only.
  - Arbitrum One `42161`, read-only balances / explorer links only.
- Assets:
  - USDt, BTC, XAUt, USDC, EURC, MXNB, QCAD, AUDF, JPYC, cirBTC.
- Added data-driven helpers:
  - `listLeclercAssets()`
  - `listLeclercChains()`
  - `tokenAddress(assetId, chainId)`
  - `rpcUrlForChain(chain, env)`
  - `explorerTxUrl(chain, hash)`
  - `explorerAddressUrl(chain, address)`
  - `isWritableChain(chain)`
- Ported token and network icon assets into `apps/app/public`.
- Updated wallet server to use the catalog for Arc Testnet RPC/token lookup.
- Updated wallet screen to render balances and network policies from catalog data instead of hardcoded USDT/sats cards.

## Source References

- `../defi-web-app/packages/contracts/deployments/asset-registry/testnet.json`
- `../defi-web-app/apps/hyper-mcp/src/registry/contracts.json`
- `../defi-web-app/apps/web/components/chain-select/chain-pip.tsx`
- `../defi-web-app/apps/web/public/assets/stable-tokens/*`
- `../defi-web-app/apps/web/public/networks/{arc,arbitrum}.svg`
- Installed WDK types:
  - `@tetherto/wdk-wallet-evm/types/src/wallet-account-evm.d.ts`
  - `@tetherto/wdk-wallet-spark/types/src/wallet-account-spark.d.ts`

## Notes

- USDt, BTC, and XAUt are represented as Spark/Tether-native catalog assets because `../defi-web-app` does not publish Arc contract addresses for them.
- No component contains chain/token addresses; components read from `@leclerc/core`.
- Arbitrum One is intentionally `read-only`; send flows reject it via catalog write policy.

## Verification

```bash
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
```

Results:

- Core typecheck: pass.
- App typecheck: pass.
- App lint: pass.
- App production build: pass.
- Forbidden inference grep: empty (grep exit 1 expected).
