# 02 · QVAC Integration (the inference layer)

> Everything AI goes through `@qvac/sdk@^0.12.2`. This doc lists the exact API surface (verified against docs.qvac.tether.io, API v0.11.x) and how each LeClerc capability maps to it.

## 1. Two integration modes (both already partly exist)

### A. In-process, server-only (preferred on the station)
Use the existing wrapper `packages/qvacs` (`@repo/qvacs`). It does `import "server-only"` and exposes pooled helpers around `@qvac/sdk`. Call it from Next.js **Route Handlers** (`export const runtime = "nodejs"`) or server actions.

Existing wrapper surface (keep + extend):
```ts
// packages/qvacs/src/index.ts (existing)
export * from "@qvac/sdk";
getProvider(): ReturnType<typeof startQVACProvider>        // idempotent singleton
stopProvider(): Promise<void>
getModel(key, load: () => Promise<string>): Promise<string> // load-once per key → modelId
transcribeOnce(modelId, audioChunk: string|Buffer): Promise<string>
completeText(params): Promise<string>
completeJSON<T>(modelId, history: CompleteMessage[], schema, schemaName?): Promise<T>
```
**Extend it** with: `embedText`, `ragIngestDocs`, `ragQuery`, `ocrImage`, `translateText` (thin wrappers, signatures below).

### B. OpenAI-compatible HTTP (browser / mobile → station or peer)
Keep `apps/app/src/lib/qvac/client.ts` as-is. It probes `:11434/v1/models`, then calls `/v1/audio/transcriptions` and `/v1/chat/completions` with `json_schema`. Good for the browser UI and mobile. **Note:** the OpenAI-compat server does *not* expose embeddings/RAG — those run in-process (mode A) or via delegated SDK calls.

## 2. Capability → exact QVAC API

| LeClerc gadget | QVAC function | Signature (verified) |
|---|---|---|
| Load any model | `loadModel` | `loadModel({ modelSrc, onProgress? }) → Promise<string>&{requestId}` returns `modelId` |
| Unload | `unloadModel` | `unloadModel({ modelId }) → Promise<void>` |
| Voice capture | `transcribe` | `transcribe({ modelId, ... }) → Promise<string>` (or `{metadata:true}` → segments) |
| Streaming dictation | `transcribeStream` | `transcribeStream({ ..., emitVadEvents:true })` — VAD-segmented |
| Intel extraction / agents | `completion` | `completion(params) → { tokenStream, events, final }`. Supports **tool calling with Zod schemas** and structured output |
| Embeddings (RAG) | `embed` | `embed({ modelId, text }) → {embedding:number[]}` · `embed({ modelId, text:string[] }) → {embedding:number[][]}` |
| RAG ingest | `ragIngest` | chunk→embed→save pipeline w/ progress |
| RAG chunk only | `ragChunk` | document chunker |
| RAG save | `ragSaveEmbeddings` | save pre-embedded docs |
| RAG search | `ragSearch` | `ragSearch(params) → Promise<RagSearchResult[]>` |
| RAG maintain | `ragReindex` / `ragDeleteEmbeddings` / `ragListWorkspaces` / `ragCloseWorkspace` / `ragDeleteWorkspace` | workspace lifecycle |
| Document intel | `ocr` | `ocr(params) → { blocks: Promise<{bbox?,confidence?,text}[]>, blockStream, stats }` |
| Image triage | `classify` | `classify(params) → Promise<ClassificationResult[]>` (bundled MobileNetV3: food/report/other) |
| Field translation | `translate` | `translate(params) → { text, stats, tokenStream }` (NMT or LLM; lang detection) |
| Spoken briefing (opt) | `textToSpeech` / `textToSpeechStream` | PCM out; streaming duplex |
| P2P provider | `startQVACProvider` / `stopQVACProvider` | see [05](./05-p2p.md) |
| Health | `heartbeat` | `heartbeat({ delegate?:{providerPublicKey,...} })` |
| Mobile lifecycle | `suspend` / `resume` / `state` | pause/restore Hyperswarm+Corestore (battery) |
| Cancel a run | `cancel` | `cancel({ requestId })` or `{ modelId, kind? }` |
| Introspection (artifacts) | `getLoadedModelInfo` / `getModelInfo` | model type, backend device, delegated status |
| Logs/perf (artifacts) | `loggingStream`, `profiler.{enable,disable,exportJSON,exportTable,exportSummary}` | see [11](./11-codex-guide.md) |
| LoRA (stretch) | `finetune` | start/resume/stop/query |

### Quickstart shape (verbatim from docs — the canonical call pattern)
```js
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel } from "@qvac/sdk";
const modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0, onProgress: p => console.log(p) });
const history = [{ role: "user", content: "..." }];
const result = completion({ modelId, history, stream: true });
for await (const token of result.tokenStream) process.stdout.write(token);
await unloadModel({ modelId });
```

## 3. Wrapper extensions to implement (`packages/qvacs`)

```ts
// RAG
export async function ragIngestDocs(workspace: string, docs: { id: string; text: string; meta?: object }[]): Promise<void>;
export async function ragQuery(workspace: string, query: string, k?: number): Promise<RagSearchResult[]>;
export async function embedText(modelId: string, text: string | string[]): Promise<number[] | number[][]>;

// Multimodal
export async function ocrImage(modelId: string, image: Buffer | string): Promise<{ text: string; blocks: {text:string; bbox?:number[]; confidence?:number}[] }>;
export async function translateText(modelId: string, text: string, opts?: { to?: string; from?: string }): Promise<string>;

// Tool-calling completion (agents) — returns final w/ toolCalls
export async function completeWithTools(modelId: string, history: CompleteMessage[], tools: ToolDef[]): Promise<CompletionFinal>;
```
Implement each as a thin pass-through to the SDK functions in §2. Pool model loads via the existing `getModel(key, load)` so each model loads once.

## 4. Model selection (and the MedPsy / Psy track)

Configure in `infra/qvac/qvac.config.json` (existing format). Recommended station set:

| Role | Model `src` | Notes |
|---|---|---|
| ASR | `WHISPER_BASE_Q8_0` | existing; `language` per locale |
| LLM (fast / mobile-delegated) | `QWEN3_1_7B_INST_Q4` | existing default "media" |
| LLM (high reasoning) | `QWEN3_4B_INST_Q4_K_M` | existing "alta" |
| **Psy track LLM** | **MedPsy-1.7B / MedPsy-4B (GGUF)** | add as a level; powers field-medic intel mode |
| Embeddings | a QVAC embedding model (`embed`-capable) | required for RAG; pick smallest that works |
| OCR | QVAC OCR model | for `ocr` |
| Translate | QVAC NMT model (Bergamot) or reuse LLM | for `translate` |

Extend `apps/app/src/lib/llm-level.ts` `LEVEL_MODEL` with a `medico` level → MedPsy. Surface it in the level switcher (see [08](./08-ux-and-demo.md)). Using MedPsy in a real intel/medic flow qualifies the project for the **Our Psy models** track (second prize pool) — frame the demo to show it.

## 5. Removing the non-compliant path (REQUIRED)

`apps/app/src/lib/inference/offline-engine.ts` uses `@huggingface/transformers` (transformers.js). That is **not** QVAC and would fail the mandatory requirement if it serves any judged inference.

Do this:
1. Delete `offline-engine.ts` and the `@huggingface/transformers` dependency, **or** fence it behind a `LECLERC_ALLOW_NONQVAC=false` flag that is off in all judged builds and never reachable in the demo.
2. Update `apps/app/src/lib/inference/index.ts` `Backend` type: drop `"browser"`. The two legitimate backends are **`local`** (in-process or `:11434` on the station) and **`delegate`** (peer over DHT). "Offline" on mobile = on-device QVAC via Bare (Expo) or delegate-to-station.
3. Update `apps/app/src/lib/inference/mode.ts`: replace `"online"|"offline"` with `"station" | "delegate" | "ondevice"` (ondevice = mobile Bare QVAC).

## 6. Runtime rules (do not violate)

- `@qvac/sdk` only in Node (≥22.17) or Bare/Expo. Mark every Route Handler that touches it `export const runtime = "nodejs"`.
- Never import `packages/qvacs` into a Client Component or shared isomorphic util — it will fail the build (`server-only`).
- Load models once (pool via `getModel`); unload on shutdown / `suspend` on mobile background.
- Capture `loggingStream` + `profiler` exports to `artifacts/` during the demo run (graded).
