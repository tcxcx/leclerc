# LeClerc — Build Spec (for Codex)

> **What this is.** A complete, implementation-ready specification for **LeClerc**, a local-first field-intelligence agent built on the QVAC SDK for the Tether QVAC Hackathon. This `docs/leclerc/` set is the source of truth. Build from it top to bottom.

> **Codename.** *A clerk is a discreet keeper of records.* LeClerc is the operative's pocket handler: capture, analyze, recall, pay, and communicate — with **nothing ever touching a server you don't control.** Espionage's threat model *is* the local-first thesis: no cloud, no logs, air-gappable, deniable.

## How to read these docs (order matters)

| # | Doc | What it pins down |
|---|-----|-------------------|
| 00 | [overview-and-compliance.md](./00-overview-and-compliance.md) | Vision, threat model, hackathon mandatory-requirement mapping, track strategy |
| 01 | [architecture.md](./01-architecture.md) | Runtime topology (GP station + mobile via P2P), monorepo layout, tech stack, env vars |
| 02 | [qvac-integration.md](./02-qvac-integration.md) | Exact `@qvac/sdk` usage per capability — grounded signatures, model choices, server-only constraint |
| 03 | [data-and-rag.md](./03-data-and-rag.md) | Dossier / IntelRecord schema, QVAC RAG workspaces, encryption-at-rest, storage |
| 04 | [agents-and-tools.md](./04-agents-and-tools.md) | Multi-agent orchestration, tool registry, tool-calling via QVAC, the intel brief |
| 05 | [p2p.md](./05-p2p.md) | Delegated inference + Hyperswarm dead-drop messaging, pairing & keys |
| 06 | [wallet.md](./06-wallet.md) | Tether WDK wallet, Lightning private payments, EVM USDT, secure storage |
| 07 | [i18n.md](./07-i18n.md) | Locale middleware (next-international), EN/ES, re-theme via i18n |
| 08 | [ux-and-demo.md](./08-ux-and-demo.md) | Screens, flows, re-theme map, the judged demo script |
| 09 | [reuse-map.md](./09-reuse-map.md) | What to port from sibling repos, with exact paths |
| 10 | [build-plan.md](./10-build-plan.md) | 11-day phased milestones, acceptance criteria, dependency order, risk spikes |
| 11 | [codex-guide.md](./11-codex-guide.md) | Conventions, definition of done, compliance artifacts, how to work |
| 12 | [reference-apps.md](./12-reference-apps.md) | Vendored Tether PearPass apps (`references/`) — Bare-worklet/P2P/encryption benchmark, concern→file map |
| 13 | [cleo-plan.md](./13-cleo-plan.md) | **Product pivot (current direction):** Cleo-style voice-first home (continuous VAD), finance-led + spy-underneath, sassy voice / dark look |
| — | [DESIGN.md](./DESIGN.md) | **Design system** (`@google/design.md` format, adapted from Linear): tokens, serif/Inter/mono split, two scarce accents, the one soft spy gradient. Mirrored to `.stitch/DESIGN.md`. Synced with `globals.css`. |

## Non-negotiables (read before writing any code)

1. **All AI inference and RAG MUST go through the QVAC SDK.** This is a hard hackathon requirement. The existing `transformers.js` browser fallback (`apps/app/src/lib/inference/offline-engine.ts`) must be **removed or fenced off** from any judged path. See [02](./02-qvac-integration.md).
2. **No data leaves the device by default.** Capture, transcription, extraction, RAG, and dossier storage are all local. Network egress happens only for: (a) P2P delegation to a paired peer, (b) explicit wallet broadcast. See [00](./00-overview-and-compliance.md) threat model.
3. **Ship artifacts as you go.** Logs, demo video, hardware proof, reproducibility instructions are graded. See [11](./11-codex-guide.md).

## Source-of-truth versions (build against these)

| Thing | Version / value |
|---|---|
| Runtime | Bun 1.3.10 · Node ≥ 22.17 (QVAC requires) |
| Framework | Next.js 16.2.7 · React 19.2.4 · App Router |
| `@qvac/sdk` | `^0.12.2` |
| `@tetherto/wdk-core` + wallet modules | latest `@tetherto/*` |
| i18n | `next-international@^1.3.1` |
| QVAC CLI server | `qvac serve openai` on `:11434` (OpenAI-compatible) |

Repo: `tcxcx/leclerc` (private). Default branch `main`. Work on feature branches off `main`.
