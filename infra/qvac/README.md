# QVAC inference server (`qvac serve openai`)

This directory holds the deployment artifacts for the external, OpenAI-compatible
QVAC inference server. The PWA never imports `@qvac/sdk` in the Vercel bundle
(it needs a native `bare` binary that crashes on Vercel). Instead the browser
talks to inference at `/api/qvac` (a same-origin Vercel proxy that forwards to
this server on Railway) or directly to a local `qvac serve` during development.

## Models

`qvac.config.json` maps friendly aliases to QVAC model constants:

| Alias          | modelSrc                  | modelType |
| -------------- | ------------------------- | --------- |
| `whisper-base` | `WHISPER_BASE_Q8_0`       | whisper   |
| `qwen3-1.7b`   | `QWEN3_1_7B_INST_Q4`      | llm       |
| `qwen3-4b`     | `QWEN3_4B_INST_Q4_K_M`    | llm       |
| `llama-1b`     | `LLAMA_3_2_1B_INST_Q4_0`  | llm       |

OpenAI-compatible endpoints exposed:

- `POST /v1/audio/transcriptions` — multipart: `file`, `model`, `language`
- `POST /v1/chat/completions` — `model`, `messages`, `response_format`

## Local (operator device)

```sh
npm i -g @qvac/cli
qvac serve openai -c infra/qvac/qvac.config.json --cors -p 11434
```

Server runs at http://localhost:11434. The PWA auto-detects this local server
(via `NEXT_PUBLIC_QVAC_LOCAL_URL`, default `http://localhost:11434`).

> Models (~GB each) download on first use, so the first transcription/completion
> for a given model will be slow.

## Railway

1. Deploy this `Dockerfile` as a Railway service (point the service at this repo;
   set the Dockerfile path to `infra/qvac/Dockerfile`).
2. Set environment variable `QVAC_API_KEY` to a strong secret (the proxy sends
   it as `Authorization: Bearer <key>`).
3. Attach a **persistent volume** for the model cache so the ~GB model files are
   not re-downloaded on every deploy/restart.
4. Set the service **memory high** (several GB) — models are loaded into memory.
5. Copy the service's public URL (e.g. `https://xxx.up.railway.app`).

Railway injects `$PORT`; the container binds to it automatically.

## Vercel environment variables

Set these on the Vercel project so the `/api/qvac` proxy reaches Railway:

| Variable                     | Value                                   |
| ---------------------------- | --------------------------------------- |
| `QVAC_BASE_URL`              | the Railway public URL                  |
| `QVAC_API_KEY`               | same key as the Railway `QVAC_API_KEY`  |
| `NEXT_PUBLIC_QVAC_LOCAL_URL` | client default `http://localhost:11434` |

When `QVAC_BASE_URL` is unset, the proxy returns `503` with
`{ "error": "QVAC_BASE_URL not configured" }`.
