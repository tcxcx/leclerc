# W7 Rain Agent Cards

Date: 2026-06-07
Branch: `feat/leclerc-scaffold`

## Implemented

- Investigated `../desk-v1` Rain card web/mobile patterns:
  - `apps/app/src/components/sheets/debit-card/rain-card-funding-dialog.tsx`
  - `apps/app/src/components/sheets/debit-card/card-sheet-content.tsx`
  - `apps/expo/services/card.service.ts`
  - `apps/expo/hooks/useCards.ts`
  - `packages/api-types/src/rain.ts`
- Added typed local Rain agent-card config in `packages/core/src/rain-cards.ts`.
- Copied Rain card visual assets from `../desk-v1` into local public assets:
  - `apps/app/public/assets/cards/bufi-card-bg-new.png`
  - `apps/app/public/icons/mastercard.svg`
- Added `POST /api/rain-cards`:
  - `action: "list"` returns data-driven card config and funding readiness.
  - `action: "fund"` resolves `LECLERC_RAIN_USDC_DEPOSIT_ADDRESS`, converts USDC decimal amount to base units, and calls the existing WDK Arc Testnet `paySableEvm` path.
- Replaced the static home card panel with `AgentCardsPanel`, opened by the W1 credit-card bottom-bar action.
- Kept browser components free of `@tetherto/*`, MCP, QVAC, `hyperswarm`, and `ws` imports.

## Smoke

- `POST /api/rain-cards {"action":"list"}` returned the `RAVEN-07` USDC virtual card and funding metadata.
- Funding was correctly reported as not configured because `LECLERC_RAIN_USDC_DEPOSIT_ADDRESS` is absent.
- Live funding is wired-only until a real Rain contract deposit address is provided in the environment.
- Browser screenshot smoke was attempted through the deferred Browser/Node REPL path, but the session exposed setup/reset tools without the Node execution tool; shell Playwright could report its version but its ephemeral package was not importable by a script. No dev dependency was added just for the screenshot.

## Verification

```sh
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
curl -sS -X POST http://localhost:7001/api/rain-cards \
  -H 'Content-Type: application/json' \
  -d '{"action":"list"}'
rg -n "from ['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)|require\\(['\"](@qvac/sdk|@tetherto/|hyperswarm|ws|@modelcontextprotocol/sdk)" \
  apps/app/src \
  --glob '!apps/app/src/app/api/**' \
  --glob '!apps/app/src/lib/wallet/**' \
  --glob '!apps/app/src/lib/agents/**' \
  --glob '!apps/app/src/lib/p2p/**' \
  --glob '!apps/app/src/lib/qvac/**'
rg -n "from ['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)|require\\(['\"](openai|@anthropic-ai|ollama|@xenova|@mlc-ai|ai|ai/react)" \
  apps/app/src packages/core/src \
  --glob '!**/.next/**' \
  --glob '!**/node_modules/**'
```

Both grep gates returned empty.
