# W2/W3 Mission RAG + Auto-Routing

Date: 2026-06-07
Branch: `feat/leclerc-scaffold`

## Implemented

- Added mission dossier scope config in `packages/core/src/mission-dossier.ts`.
- Added shared operator tool-router config in `packages/core/src/tool-router.ts`.
- Capture confirmation now tags ingested RAG docs with inferred `missionIds`.
- `/api/rag` accepts optional `missionId` on `query` and `search`.
- Server RAG post-filters retrieved hits by `meta.missionIds` / `meta.missionId` before answering.
- SPY console RAG Ask/Search/Geo gadgets now read from the selected mission scope.
- Home console auto-routing now uses `routeOperatorQuery()` instead of inline keyword checks:
  - mission dossier answer/search
  - wallet/card/link/analysis route intents
  - mission inference for Raven/Glasshouse/Medic prompts

## Gadget Smoke

Deterministic helper smoke:

```json
{
  "raven": ["raven"],
  "medic": ["medic"],
  "route": {
    "intent": "dossier.search",
    "missionId": "raven"
  }
}
```

Full RAG model smoke was not forced because it may require QVAC model availability/download. The route/build path is verified and remains QVAC-only.

## Verification

```sh
bun --filter @leclerc/core typecheck
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
cd packages/core && bun -e "import { inferMissionIdsForText, routeOperatorQuery } from './src/index.ts'; console.log(JSON.stringify({ raven: inferMissionIdsForText('Raven funding handler'), medic: inferMissionIdsForText('clinic wound triage'), route: routeOperatorQuery('search Raven funding handler') }, null, 2))"
```

Server-only dependency grep and forbidden-inference import grep both returned empty.
