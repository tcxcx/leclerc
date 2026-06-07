# 10 · Build Plan (11 days → Early Bird June 17)

Today: **June 6**. Early-bird cutoff: **June 17**. Plan to a working submission by **June 16** (buffer day). Phases are dependency-ordered; the spine (capture→RAG) and the risk spike (P2P) come first.

## Dependency order (critical path)
```
P0 setup ─► P1 QVAC compliance ─► P2 capture+dossier ─► P3 RAG ─► P4 agents
   └► P-SPIKE P2P (parallel, day 1-2)                              └► P5 wallet
                                                                   └► P6 i18n+retheme
                                                                   └► P7 artifacts+demo
```

## Phase P0 — Setup & spikes (Day 1)
- [ ] Branch `feat/leclerc-scaffold` off `main`. Confirm `bun install`, `bun run dev:qvac` runs the baseline.
- [ ] Pin Node ≥22.17. Add `@tetherto/*`, `hyperswarm`, `b4a`, `compact-encoding`; read their installed `.d.ts`.
- [ ] **SPIKE A (P2P):** prove `startQVACProvider` on station + a second process delegates one `completion` over DHT. De-risks [05](./05-p2p.md).
- [ ] **SPIKE B (RAG):** prove `embed` + `ragIngest` + `ragSearch` round-trip on the station. De-risks [03](./03-data-and-rag.md).
- [ ] **SPIKE C (WDK):** generate seed, init EVM + Spark accounts, read a testnet balance. De-risks [06](./06-wallet.md).
> If a spike fails, escalate scope cuts the same day (see Fallbacks).

## Phase P1 — QVAC compliance (Day 1–2)
- [ ] Delete/fence `offline-engine.ts`; remove `@huggingface/transformers`. Re-map `Backend`/`mode` ([02](./02-qvac-integration.md) §5).
- [ ] Extend `packages/qvacs`: `embedText`, `ragIngestDocs`, `ragQuery`, `ocrImage`, `translateText`, `completeWithTools`.
- [ ] Add models to `infra/qvac/qvac.config.json`: embeddings, OCR, translate, MedPsy. Verify `qvac serve` loads them.

## Phase P2 — Capture + dossier (Day 2–4)
- [ ] Re-theme `reports/` → `intel/`: `IntelRecord`, `IntelExtraction`, `EXTRACTION_JSON_SCHEMA`, store (`leclerc-dossier`), `wipeAll`.
- [ ] Encryption-at-rest (AES-GCM, passphrase-derived) for records.
- [ ] Capture screen: transcribe (VAD) → grammar-constrained extraction → editable card → confirm.
- [ ] Dossier list + record view + DOCX/PDF export (re-themed).
**Milestone M1:** capture a record offline, see it in the dossier, export it. *(spine works)*

## Phase P3 — RAG (Day 4–5)
- [ ] Ingest on confirm; delete removes embeddings; `ragReindex` hook.
- [ ] Dossier search box → `ragQuery` → grounded `completion` answer with cited record ids.
**Milestone M2:** ask a question, get an offline grounded answer citing real records.

## Phase P4 — Analyst desk (Day 5–7)
- [ ] Tool registry + confirmation gate for side-effecting tools.
- [ ] Orchestrator + ≥3 agents (Triage/Dedup/Geo/Pattern) + synthesizer → `IntelBrief`.
- [ ] MedPsy medic agent path (Psy track).
- [ ] Brief export (DOCX/PDF) + optional TTS.
**Milestone M3:** one-page brief from ≥3 records, every finding cited, 3+ agents w/ tool calls in logs.

## Phase P5 — Wallet (Day 7–8)
- [ ] WDK wrapper; seed gen + encrypted storage; balances (USDT + sats).
- [ ] Lightning pay (testnet) + EVM USDT transfer, both behind confirm modal.
**Milestone M4:** Lightning payment settles on testnet from the app.

## Phase P6 — P2P productization (Day 8–9)
- [ ] Promote SPIKE A to `lib/p2p/`: stable station key (`QVAC_HYPERSWARM_SEED`), heartbeat-gated delegate, resolution policy + mode badge.
- [ ] Dead-drop: pairing (QR/topic), encrypted send/receive, import into dossier.
**Milestone M5:** phone delegates a brief to the station; brief dead-dropped to a second device.

## Phase P7 — i18n, re-theme, artifacts, demo (Day 9–11)
- [ ] i18n middleware + `[locale]`, `messages/{es,en}.json`, switcher; move all copy to messages (the re-theme).
- [ ] Artifacts pipeline: capture `loggingStream` + `profiler` exports + `getLoadedModelInfo` (hardware/backend proof) to `artifacts/`.
- [ ] Reproducibility: update root `README.md` (hardware, models, one-command run).
- [ ] Record the [demo video](./08-ux-and-demo.md#4-the-judged-demo-script). Write SUBMISSION.md.
**Milestone M6 (SHIP):** submission-ready by June 16.

## (Stretch, post-spine) — Mobile demo client
- [ ] Expo `apps/mobile`: capture + dossier view + delegate-to-station + WDK secure storage. Only if M1–M5 are solid.

## Fallbacks (cut in this order if behind)
1. Drop Expo mobile client → use the PWA on a phone for the mobile/P2P story.
2. Drop EVM USDT → Lightning-only wallet.
3. Drop dead-drop messaging → keep delegation only (still a P2P story).
4. Drop MedPsy agent → keep it a model *level* option (still Psy-track-eligible if used).
5. Reduce agents to Triage + Pattern (still "multi-agent + tools").
**Never cut:** QVAC-only compliance, capture→RAG spine, the offline demo.

## Tracking
Use `TaskCreate`/`TaskUpdate` per phase. Keep `artifacts/` growing from Day 1 (logs are graded, and prove progress).
