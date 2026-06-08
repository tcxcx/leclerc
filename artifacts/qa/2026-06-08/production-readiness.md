# LeClerc Production-Readiness QA

Date: 2026-06-08
Branch: `feat/leclerc-scaffold`
Runtime: production build, `bun --filter app start`, `http://localhost:7001`
Voice service: `ws://localhost:7077`

## Safety Notes

- `.env.local` key names were inspected only to confirm configured surfaces; no secret values were printed, logged, or committed.
- Wallet recovery phrase was never screenshotted or copied. The flow advanced through the acknowledgement button only.
- No live Rain funding seed was provided. `bun run rain:smoke` skipped live funding as expected.
- All money flows verified TESTNET-only proposal/review gates; no browser QA step clicked a final live send/confirm.

## Browser Coverage

Screenshots captured under `artifacts/qa/2026-06-08/`:

- `01-es-home.png` - Spanish ops page, Ignyte black/yellow/glass theme, favicon assets, no horizontal overflow.
- `02-es-spy-console.png` - triple-tap SPY console, 10 QVAC gadgets rendered.
- `03-es-mission-accept-deny.png` - data-driven mission accept/deny state changes.
- `04-es-voice-listening.png` - voice service path reached; browser mic permission denied by environment.
- `05-en-home.png` - English ops page before accessibility fix.
- `06-en-landing.png` - landing/PWA surface with animated canvas.
- `07-en-wallet-create.png` through `13-en-wallet-transactions.png` - wallet create, handle, biometric, recovery acknowledgement, ready balances, send review, receive, transactions.
- `14-en-rain-cards.png` - Rain card catalog and explicit funding affordance.
- `15-en-link-globe-funding.png` - Enlace mission funding and globe surface.
- `16-en-capture-initial.png` through `20-en-dossier-rag-answer.png` - capture, confirm, dossier listing, original RAG answer.
- `21-en-home-voice-aria-fixed.png` - English mic aria fixed to `Ask`.
- `22-en-dossier-rag-fixed.png` - RAG no longer emits `<think>` or Spanish fallback.
- `23-en-wallet-passive-spark-fixed.png` - passive wallet reads render unavailable Spark fields without retry storm.
- `24-en-dossier-rag-normalized.png` - RAG sourced English answer no longer appends fallback text.
- `25-en-wallet-final-refresh.png` - final rebuilt wallet refresh: assets render, no overflow.
- `26-en-chat-auto-tool.png` - in-chat query auto-renders `Tool: dossier RAG` with grounded JSON output.
- `27-en-spy-mission-gating.png` - Glasshouse mission gating enables only its 4 assigned gadgets and disables 6 locked gadgets/inputs.
- `28-en-mission-funding-guard.png` - Enlace requires a seed before funding and blocks live proposal while `LECLERC_MISSION_RAVEN_USDC_ADDRESS` is absent.

## Gates

Commands run after the final code changes:

```bash
cd apps/app && bunx tsc --noEmit
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
rg -n "server-only" apps/app/src/components 'apps/app/src/app/[locale]' --glob '*.tsx' --glob '*.ts'
bun run transfer:smoke
bun run vault:smoke
bun run wallet:smoke
bun run rain:smoke
```

Results:

- `bunx tsc --noEmit`: PASS.
- `bun --filter app lint`: PASS.
- Production build: PASS, 31 routes generated.
- Forbidden inference grep: PASS, empty output.
- Browser `server-only` grep: PASS, empty output.
- `transfer:smoke`: PASS, proposal persistence, single-use confirm, HMAC tamper rejection, Arbitrum read-only rejection.
- `vault:smoke`: PASS, locked device-key capture readback with sealed ciphertext.
- `wallet:smoke`: PASS, wrote `artifacts/wallet/wdk-smoke-2026-06-08T14-56-23-589Z.{json,md}`.
- `rain:smoke`: PASS/SKIPPED live funding because `LECLERC_SMOKE_SEED` is absent, wrote `artifacts/wallet/rain-funding-smoke-2026-06-08.{json,md}`.

## Residual QA Closed

- In-chat auto-invocation: query `Raven funding Kestrel dossier` rendered the assistant auto-invocation copy plus `Tool: dossier RAG` and grounded JSON output with no `<think>` tags. Evidence: `26-en-chat-auto-tool.png`.
- Mission gating: triple-tap opened SPY console; selecting Glasshouse enabled Extract, Intel Brief, Geo Extract, and Station while disabling Transcribe, Chat, RAG Ask, RAG Search, Reasoning, and Wallet. Locked gadget inputs were disabled. Evidence: `27-en-spy-mission-gating.png`; the visible voice permission banner is the separate browser mic permission blocker noted below.
- Mission funding: empty seed keeps `Fund mission` disabled; a dummy non-secret seed with the current env returns a blocked notification because `LECLERC_MISSION_RAVEN_USDC_ADDRESS` is not configured. No confirm button appears in the blocked state. Evidence: `28-en-mission-funding-guard.png`.

## Defects Fixed

### RAG Thought/Fallback Leak

- Surface: English dossier query.
- Repro: capture a record, open `/en/expediente`, ask `Raven funding Kestrel`.
- Expected: grounded English answer with source signal, no model scratchpad, no Spanish fallback.
- Actual: answer included `<think>` tags and Spanish fallback text; after the first fix the model could still append English fallback after a sourced answer.
- Severity: major.
- Fix: `apps/app/src/lib/rag/server.ts` now strips `<think>` blocks, localizes the prompt/fallback by locale, and removes a trailing fallback sentence from otherwise substantive grounded answers. API/client now pass locale.
- Evidence: `22-en-dossier-rag-fixed.png`, `24-en-dossier-rag-normalized.png`.

### English Voice Button ARIA

- Surface: English ops page bottom voice control.
- Repro: open `/en`, inspect the central mic button.
- Expected: accessible name is English.
- Actual: button retained Spanish `Hablar`.
- Severity: minor/accessibility.
- Fix: `VoiceButton` accepts state-specific `ariaLabels`; `ActionBar` passes localized labels from the page.
- Evidence: `21-en-home-voice-aria-fixed.png`.

### Passive Spark Retry Storm

- Surface: wallet balances/receive/transactions.
- Repro: create wallet and open wallet surfaces without live Spark auth/read env.
- Expected: passive UI reads render Spark fields as unavailable unless live Spark reads are explicitly enabled.
- Actual: passive screens instantiated Spark and produced localhost auth retry failures after UI refresh.
- Severity: major.
- Fix: `@leclerc/wallet` adds `LECLERC_ENABLE_LIVE_SPARK_READS=1` gating for passive Spark address/balance/transaction reads. Explicit `payLightning` remains live and TESTNET guarded.
- Evidence: `23-en-wallet-passive-spark-fixed.png`, `25-en-wallet-final-refresh.png`, rebuilt app logs showed QVAC model activity only and no Spark retry/auth storm after wallet refresh.

### Arc Chain Literal Cleanup

- Surface: wallet/card/mission funding code paths.
- Repro: inspect wallet route, wallet UI, agent wallet tools, cards, transfers.
- Expected: chain IDs flow through `ARC_TESTNET_CHAIN_ID`.
- Actual: several surfaces still used the literal `5042002`.
- Severity: minor/maintainability.
- Fix: those paths now import and use `ARC_TESTNET_CHAIN_ID`.
- Evidence: app typecheck/lint/build and transfer/Rain smokes.

### Mission Funding Empty-Seed Guard

- Surface: Enlace mission funding bridge.
- Repro: open `/en/enlace` with the default mission amount and no wallet seed.
- Expected: funding cannot be proposed until a seed and amount are present.
- Actual: the button was enabled with only mission and amount; a configured target would have reached the server and failed with `wallet seed required`.
- Severity: minor/safety.
- Fix: `fundMission()` returns early without seed/amount, and the `Fund mission` button is disabled until both are present.
- Evidence: `28-en-mission-funding-guard.png`.

## Residual Notes

- Browser mic ended at `NotAllowedError: Permission denied`; this is an in-app browser permission/environment blocker, not a voice service boot failure. Voice service models loaded and listened on `ws://localhost:7077`.
- Live Rain funding remains intentionally unexecuted without `LECLERC_SMOKE_SEED`.
- Live mission funding remains intentionally blocked until `LECLERC_MISSION_RAVEN_USDC_ADDRESS` is configured.
- Spark passive reads are disabled by default; set `LECLERC_ENABLE_LIVE_SPARK_READS=1` only when live TESTNET Spark auth is available.
