# M8 Compliance Gate

Captured: 2026-06-07

## SDK/API Verification

- `profiler` verified against `packages/qvacs/node_modules/@qvac/sdk/dist/profiling/index.d.ts`
- `loggingStream({ id })` verified against `dist/client/api/logging-stream.d.ts`
- `getLoadedModelInfo({ modelId })` verified against `dist/client/api/get-loaded-model-info.d.ts`
- Completion/load flow verified against:
  - `dist/client/api/completion-stream.d.ts`
  - `dist/client/api/load-model.d.ts`
  - `dist/examples/profiling/basic.js`
  - `dist/examples/logging-streaming.js`

## Runtime Artifact Capture

Command:

```bash
bun run qvac:artifacts
```

Result: PASS

Files:

- `artifacts/logs/m8-qvac-run-2026-06-07T04-48-17-353Z.json`
- `artifacts/logs/m8-logging-stream-2026-06-07T04-48-17-353Z.log`
- `artifacts/profiler/m8-profiler-2026-06-07T04-48-17-353Z.json`
- `artifacts/profiler/m8-profiler-2026-06-07T04-48-17-353Z.txt`
- `artifacts/profiler/m8-profiler-2026-06-07T04-48-17-353Z.summary.txt`
- `artifacts/hardware/m8-loaded-model-info-2026-06-07T04-48-17-353Z.json`
- `artifacts/hardware/m8-system-2026-06-07T04-48-17-353Z.json`

Proof points:

- `getLoadedModelInfo.modelType`: `llamacpp-completion`
- `getLoadedModelInfo.addonPackage`: `@qvac/llm-llamacpp`
- `completion.final.stats.backendDevice`: `gpu`
- `completion.final.stats.tokensPerSecond`: ~247 tok/s on cached Qwen3 600M Q4

## Gates

```bash
cd apps/app && bunx tsc --noEmit
```

Result: PASS

```bash
rm -rf apps/app/.next
grep -rE "huggingface|openai|anthropic|@google/gen|langchain|chromadb|pinecone" apps packages services
```

Result: PASS, no matches.

```bash
git diff --check
```

Result: PASS
