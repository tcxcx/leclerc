# Rain Funding Smoke

Created: 2026-06-07T21:02:40.570Z
Status: SKIPPED

## Card

- Card: raven-07-usdc-virtual
- Asset: USDC (6 decimals)
- Chain: Arc Testnet (5042002)
- Deposit configured: true
- Route reports configured: true
- Route check: route not reachable at http://localhost:7001: Unable to connect. Is the computer able to access the url?
- Amount: 25 USDC (25000000 atomic)

## Result

- Reason: LECLERC_SMOKE_SEED is absent

## Live Steps

- Set LECLERC_SMOKE_SEED in the runtime environment to the sender wallet seed; do not commit it.
- Fund that WDK sender wallet with Arc-testnet USDC on chainId 5042002.
- Keep LECLERC_RAIN_USDC_DEPOSIT_ADDRESS set to the Rain USDC deposit address in apps/app/.env.local.
- Run bun run rain:smoke from the repo root; the script refuses non-Arc-testnet writes.

## Verification

- @tetherto/wdk-wallet-evm d.ts: transfer({ token, recipient, amount }) accepts amount in base units.
- @tetherto/wdk-wallet-evm d.ts: getTokenBalance(tokenAddress) returns token balance in base units.
- LeClerc catalog: Arc Testnet chainId is 5042002.
- LeClerc catalog: USDC decimals are 6; default funding amount converts to 25000000 atomic units.
- Explorer URL shape: https://explorer.testnet.arc.network/tx/<tx-hash>
