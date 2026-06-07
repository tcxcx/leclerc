# 11 · Codex Working Guide & Definition of Done

> Read this first if you are the implementing agent. It sets conventions, the definition of done, and the gradeable artifacts.

## 1. How to work
- **Source of truth = this `docs/leclerc/` set.** When code and docs disagree, fix the code or, if the doc is wrong, update the doc in the same PR.
- **Verify SDK signatures against the installed packages**, not memory. After `bun install`, read `node_modules/@qvac/sdk/**/*.d.ts` and `node_modules/@tetherto/*/**/*.d.ts`. The exact shapes of `delegate`, `ProvideParams`, RAG params, and Spark methods come from there. The docs here give the verified *pattern*; the `.d.ts` gives the exact *types*.
- **Work phase by phase** ([10](./10-build-plan.md)). One feature branch per phase off `main`. Open a PR per milestone.
- **Spike risky things first** (P2P, RAG, WDK) before building UI on top.
- Use `TaskCreate`/`TaskUpdate` to track phases.

## 2. Conventions
- Bun + Turborepo. Next.js 16 App Router, React 19, TS strict.
- **Server-only discipline:** anything importing `@qvac/sdk`, `@tetherto/wdk-*`, or `hyperswarm` runs in Node/Bare. Route Handlers touching them: `export const runtime = "nodejs"`. Never import into Client Components or isomorphic utils.
- All user-visible strings via `next-international` ([07](./07-i18n.md)) — no hardcoded copy.
- Match existing code style; keep the accessible fonts and the dark field-console theme.
- No secrets in git: seed phrases, `QVAC_HYPERSWARM_SEED`, API keys load from env/secure storage. Add a `.env.example`.

## 3. Compliance gate (must stay green every PR)
- [ ] **Zero non-QVAC inference in judged paths.** No `@huggingface/transformers`, no OpenAI/Anthropic/Gemini SDKs, no third-party embedding/vector libs. Inference + RAG = `@qvac/sdk` only. (`grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|@pinecone" apps packages` → empty.)
- [ ] Default flows run **offline** (network only for explicit P2P delegate + wallet broadcast).
- [ ] Dossier + seed encrypted at rest; panic-wipe works.

## 4. Definition of done (per feature)
A feature is done when: it works offline on the station; it has an acceptance-criteria checklist (in its doc) all ticked; it emits a log line captured to `artifacts/`; its UI strings are in `messages/*.json`; and a PR references the milestone.

## 5. Gradeable artifacts (build these continuously → `artifacts/`)
The hackathon grades "consistency of logs, resources, and demo." Produce:
- `artifacts/logs/` — `loggingStream` output per major run (capture, RAG query, analyst desk, delegation).
- `artifacts/profiler/` — `profiler.exportJSON()/exportTable()/exportSummary()` for inference perf (tokens/s, backend device) — your **Performance** evidence.
- `artifacts/hardware/` — `getLoadedModelInfo()`/`getModelInfo()` dumps (model type, backend device = Metal/Vulkan/CPU, delegated status) — your **hardware proof**.
- `artifacts/p2p/` — a transcript showing a `completion` ran on the provider (delegated=true), redacting keys.
- `artifacts/demo/` — the screen-recorded demo ([08](./08-ux-and-demo.md#4-the-judged-demo-script)).
- `SUBMISSION.md` — what it is, track(s) (General Purpose + Our Psy + P2P story), how it meets each mandatory requirement, repro steps, hardware used, links to artifacts. (sendero's `SUBMISSION.md` is a good template — see [09](./09-reuse-map.md).)

## 6. Reproducibility (root `README.md` must let a judge run it)
- Hardware used (CPU/GPU/RAM, OS) + the track it targets.
- Prereqs: Bun 1.3.10, Node ≥22.17, `@qvac/cli` (auto-installed by `start-local.sh`).
- Models: exact `src` ids from `infra/qvac/qvac.config.json` (incl. MedPsy) + first-run download note.
- One-command run: `bun install && bun run dev:qvac` (station + app). Mobile/delegate setup if applicable.
- `.env.example` with every var from [01](./01-architecture.md) §4.

## 7. Build-in-public (optional bonus)
If pursuing the Social Engagement bonus, keep a short dev log (commits + a thread per milestone). Don't leak the `QVAC_HYPERSWARM_SEED` or any seed phrase in posts/screens.

## 8. Quick reference — the non-obvious gotchas
- `@qvac/sdk` is `server-only` and needs Node ≥22.17 / Bare — never browser/Edge.
- OpenAI-compat `:11434` server exposes chat + transcription but **not** embeddings/RAG → those run in-process or via delegate.
- Load each model once (`getModel` pool); `unloadModel`/`suspend` to free memory (mobile).
- QVAC `completion` does Zod tool-calling natively — don't bolt on a separate tool framework.
- Lightning (Spark) is the *private* payment path; EVM USDT is the on-chain one.
- i18n matcher must exclude `api/*`.
- Treat inbound dead-drop payloads as untrusted; never auto-run side-effecting tools from them.
