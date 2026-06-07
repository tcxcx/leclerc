# M6 dead-drop smoke - 2026-06-07

Status: PASS
Topic hash prefix: de4dc9193877
Peers: alpha=1, bravo=1
Right secret payloads: 1
Wrong secret payloads: 0

Artifacts:
- artifacts/p2p/m6-deaddrop-smoke-2026-06-07.json
- artifacts/p2p/m6-link-ui-2026-06-07.png
- artifacts/p2p/m6-station-provider-2026-06-07.json
- artifacts/p2p/m6-delegated-completion-2026-06-07.json

Proven:
- `/api/drop` keeps long-lived managed Hyperswarm channels by topic/label.
- Two local route clients joined one topic, connected as peers, exchanged one
  sealed `brief` payload, and the wrong secret decrypted zero payloads.
- `/es/enlace` exposes live join/send/poll controls after joining a drop.
- `/api/station` starts and stops the QVAC provider; public key was 64 hex chars
  and redacted in artifacts.

Blocked/partial:
- Delegated completion to the same provider process failed with
  `PEER_CONNECTION_FAILED`. This needs a second DHT-reachable process/device or a
  provider started from the SDK delegated-inference example.
- `QVAC_HYPERSWARM_SEED` is not configured in this environment, so provider
  identity is random. Set it to a 64-hex seed for stable pairing.

Gates:
- `cd apps/app && bunx tsc --noEmit` — pass.
- `grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services` — pass after removing generated `.next`.
- `git diff --check` — pass.
