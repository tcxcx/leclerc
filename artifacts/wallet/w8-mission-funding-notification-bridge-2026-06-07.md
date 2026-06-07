# W8 Operator-to-Agent Funding Bridge

Date: 2026-06-07
Branch: `feat/leclerc-scaffold`

## Implemented

- Added data-driven mission funding config in `packages/core/src/mission-funding.ts`.
- Extended P2P dead-drop payloads with `kind: "notification"` so agent-facing events can share the existing encrypted event surface.
- Added `POST /api/mission-funding`:
  - `action: "list"` returns mission funding configs.
  - `action: "fund"` resolves the mission funding target env, submits a WDK Arc Testnet USDC transfer when configured, records a mission funding notification, and optionally sends that notification through a joined dead-drop.
  - `action: "events"` returns the local agent notification log.
- Added an operator funding panel to `/enlace`:
  - mission selector
  - session wallet phrase input
  - amount input
  - fund mission action
  - agent notification poll/log
- The route never logs or persists wallet seeds and does not include funding target addresses in notifications.

## Smoke

Local env does not define `LECLERC_MISSION_RAVEN_USDC_ADDRESS`, so live funding correctly blocks and emits a blocked notification:

```json
{
  "missionId": "raven",
  "assetId": "usdc",
  "chainId": 5042002,
  "amount": "25.00",
  "status": "blocked",
  "reason": "LECLERC_MISSION_RAVEN_USDC_ADDRESS is not configured"
}
```

The local agent notification log returned the event via `action: "events"`.

## Verification

```sh
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
curl -sS -X POST http://localhost:7001/api/mission-funding \
  -H 'Content-Type: application/json' \
  -d '{"action":"list"}'
curl -sS -X POST http://localhost:7001/api/mission-funding \
  -H 'Content-Type: application/json' \
  -d '{"action":"fund","missionId":"raven","amount":"25.00"}'
curl -sS -X POST http://localhost:7001/api/mission-funding \
  -H 'Content-Type: application/json' \
  -d '{"action":"events"}'
```

Server-only dependency grep and forbidden-inference import grep both returned empty.

## Remaining

- Configure a real testnet mission funding target with `LECLERC_MISSION_RAVEN_USDC_ADDRESS`.
- Run a two-process/two-device dead-drop smoke to prove notification delivery to a separate agent app peer, not only the local event log.
