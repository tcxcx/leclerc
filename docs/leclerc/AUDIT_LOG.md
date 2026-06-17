# LeClerc — Structured inference audit log

LeClerc captures a structured audit log for a demo inference run using QVAC's
native `profiler`, `loggingStream`, `getLoadedModelInfo`, and completion `stats`.
It records **model load** events and **per-call inference performance** (prompt,
tokens, TTFT, tokens/sec, backend device).

Regenerate any time: `bun run qvac:artifacts` (script: `scripts/qvac-artifacts.mjs`).

## Where it lives

| Artifact | Path | Captures |
|---|---|---|
| Run record | `artifacts/logs/m8-qvac-run-*.json` | model descriptor + per-call completion `stats` (TTFT, tokens/sec, prompt/generated tokens, backend) + streamed deltas |
| Logging stream | `artifacts/logs/m8-logging-stream-*.log` | QVAC `loggingStream` output for the run |
| Profiler (JSON) | `artifacts/profiler/m8-profiler-*.json` | RPC/handler timings incl. `loadModel.ttfb`, `loadModel.streamDuration` |
| Profiler (table/summary) | `artifacts/profiler/m8-profiler-*.txt`, `*.summary.txt` | human-readable aggregates |
| Loaded model info | `artifacts/hardware/m8-loaded-model-info-*.json` | model id, name, type, addon package, **loadedAt**, path |
| Hardware | `artifacts/hardware/m8-system-*.json` | CPU/GPU/RAM/OS of the capture machine |

## Demo run — captured values

Model **load** (`m8-loaded-model-info`):

```
name        QWEN3_600M_INST_Q4
modelType   llamacpp-completion
addon       @qvac/llm-llamacpp
loadedAt    2026-06-07T04:48:19.362Z
path        ~/.qvac/models/..._Qwen3-0.6B-Q4_0.gguf
```

Inference **call performance** (`m8-qvac-run.json` → `completion.final.stats`):

```
timeToFirstToken   28.085 ms
tokensPerSecond    246.80 tok/s
promptTokens       62
generatedTokens    24
backendDevice      gpu
```

Plus per-token `contentDelta` events (seq 0..23) and a `completionStats` event,
so prompt size, token counts, TTFT, and throughput are all reconstructable for the
run. Model-load timing is in the profiler (`loadModel.ttfb` = 302.8 ms,
`loadModel.streamDuration` = 422.9 ms).

## Hardware of this capture (local station)

Apple M4 Pro (14-core CPU, 20-core GPU, Metal 3), 48 GB RAM, macOS 15.7.1, Node
v23.11.0, Bun 1.3.10. `backendDevice: gpu` confirms GPU-offloaded inference. Full
device table in [HACKATHON_SUBMISSION.md → Reproducibility & hardware](./HACKATHON_SUBMISSION.md).

> Note: this audit run uses the QVAC SDK directly (the canonical inference path).
> The hosted link's `/api/qvac` proxy forwards to an OpenAI-compatible station and
> does not emit these native stats; run the SDK path locally to reproduce the log.
