import "server-only";

import {
  startQVACProvider,
  stopQVACProvider,
  transcribe,
  completion,
} from "@qvac/sdk";

// Re-export the full SDK surface so callers can reach anything via
// `@repo/qvacs` without taking a direct dependency on `@qvac/sdk`.
export * from "@qvac/sdk";

/**
 * QVAC is an on-device inference runtime: it spins up a worker (the
 * "provider"), into which models are loaded once and then reused. This wrapper
 * keeps a single provider and a model cache alive across requests so a
 * push-to-talk request doesn't pay startup/load cost every call.
 *
 * Server-only — the worker uses native addons and must run in the Node runtime.
 */

let providerPromise: ReturnType<typeof startQVACProvider> | null = null;
const models = new Map<string, Promise<string>>();

/** Start the QVAC provider once and reuse it (idempotent). */
export function getProvider() {
  providerPromise ??= startQVACProvider();
  return providerPromise;
}

/** Stop the provider and forget every cached model. */
export async function stopProvider(): Promise<void> {
  if (!providerPromise) return;
  await stopQVACProvider();
  providerPromise = null;
  models.clear();
}

/**
 * Load a model once per `key` and reuse the resulting modelId. The provider is
 * started first, then `load` runs (call `loadModel` inside it so its overloads
 * resolve at the call site), e.g.
 *
 * ```ts
 * const id = await getModel("whisper", () =>
 *   loadModel({ modelSrc: WHISPER_EN_BASE_Q8_0 }),
 * );
 * ```
 */
export function getModel(
  key: string,
  load: () => Promise<string>,
): Promise<string> {
  let pending = models.get(key);
  if (!pending) {
    // Local in-process inference loads models directly — startQVACProvider() is
    // only for P2P serving (see lib/p2p/delegate.ts), per the @qvac/sdk examples.
    pending = load().catch((err) => {
      models.delete(key);
      throw err;
    });
    models.set(key, pending);
  }
  return pending;
}

/** Transcribe a single audio buffer with an already-loaded transcription model. */
export function transcribeOnce(
  modelId: string,
  audioChunk: string | Buffer,
): Promise<string> {
  return transcribe({ modelId, audioChunk });
}

/** Run a completion and resolve to its aggregated text. */
export function completeText(
  params: Parameters<typeof completion>[0],
): Promise<string> {
  return completion(params).text;
}

export interface CompleteMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Run a completion constrained to a JSON Schema and resolve to the parsed
 * object. The model output is grammar-constrained (`responseFormat:
 * json_schema`), so even a small local model returns schema-valid JSON — the
 * reliable path for structured extraction. Throws if the output fails to parse.
 */
export async function completeJSON<T = unknown>(
  modelId: string,
  history: CompleteMessage[],
  schema: Record<string, unknown>,
  schemaName = "result",
): Promise<T> {
  const run = completion({
    modelId,
    history,
    stream: true,
    responseFormat: {
      type: "json_schema",
      json_schema: { name: schemaName, schema },
    },
  });
  const final = await run.final;
  const text = (final.contentText ?? "").trim();
  return JSON.parse(text) as T;
}

/* ────────────────────────────────────────────────────────────────────────
 * LeClerc extensions — embeddings, RAG, OCR, translate, tool-calling.
 * Wired against the installed @qvac/sdk@0.12.2 .d.ts + bundled examples
 * (dist/examples/**). See docs/leclerc/02-qvac-integration.md.
 *
 * Model loading (verified, examples/quickstart.js + rag/pipeline.js):
 *   loadModel({ modelSrc: <REGISTRY_CONSTANT>, modelType: "llm"|"embeddings", ... })
 * RAG segregated flow (examples/rag/rag-hyperdb/pipeline.js) — keeps stable ids:
 *   embed({modelId,text}) → ragSaveEmbeddings({workspace,documents:[{id,content,embedding,embeddingModelId}]})
 *   ragSearch({workspace,modelId,query,topK}) → [{id,content,score}]
 * ──────────────────────────────────────────────────────────────────────── */

import {
  embed,
  ragSaveEmbeddings,
  ragSearch,
  ocr,
  translate,
} from "@qvac/sdk";

/** Generate an embedding for one or many texts with a loaded embedding model. */
export async function embedText(
  modelId: string,
  text: string,
): Promise<number[]>;
export async function embedText(
  modelId: string,
  text: string[],
): Promise<number[][]>;
export async function embedText(
  modelId: string,
  text: string | string[],
): Promise<number[] | number[][]> {
  const res = await embed({ modelId, text } as Parameters<typeof embed>[0]);
  return (res as { embedding: number[] | number[][] }).embedding;
}

export interface RagDoc {
  id: string;
  text: string;
  meta?: Record<string, unknown>;
}

/**
 * Ingest documents into a QVAC RAG workspace via the segregated flow: embed each
 * document's text, then ragSaveEmbeddings with the caller's explicit ids so
 * search results map back to dossier record ids. One embedding per record
 * (records are short); chunk first with ragChunk if you need passage-level recall.
 */
export async function ragIngestDocs(
  workspace: string,
  embeddingModelId: string,
  docs: RagDoc[],
): Promise<void> {
  if (docs.length === 0) return;
  const { embedding } = (await embed({
    modelId: embeddingModelId,
    text: docs.map((d) => d.text),
  } as Parameters<typeof embed>[0])) as { embedding: number[][] };

  await ragSaveEmbeddings({
    workspace,
    documents: docs.map((d, i) => ({
      id: d.id,
      content: d.text,
      embedding: embedding[i],
      embeddingModelId,
    })),
  } as unknown as Parameters<typeof ragSaveEmbeddings>[0]);
}

export interface RagHit {
  id: string;
  text: string;
  score?: number;
  meta?: Record<string, unknown>;
}

/** Semantic search across a workspace (top-k). Returns excerpts with record ids. */
export async function ragQuery(
  workspace: string,
  embeddingModelId: string,
  query: string,
  k = 6,
): Promise<RagHit[]> {
  const results = (await ragSearch({
    workspace,
    modelId: embeddingModelId,
    query,
    topK: k,
  } as Parameters<typeof ragSearch>[0])) as Array<{
    id?: string;
    content?: string;
    score?: number;
  }>;
  return results.map((r) => ({
    id: r.id ?? "",
    text: r.content ?? "",
    score: r.score,
  }));
}

/** Run OCR on an image buffer/base64 with a loaded OCR model. */
export async function ocrImage(
  modelId: string,
  image: Buffer | string,
): Promise<{ text: string; blocks: { text: string; bbox?: number[]; confidence?: number }[] }> {
  const run = ocr({ modelId, image } as Parameters<typeof ocr>[0]);
  const blocks = await run.blocks;
  return {
    text: blocks.map((b) => b.text).join("\n"),
    blocks: blocks as { text: string; bbox?: number[]; confidence?: number }[],
  };
}

/** Translate text with a loaded NMT/LLM translation model. */
export async function translateText(
  modelId: string,
  text: string,
  opts: { to?: string; from?: string } = {},
): Promise<string> {
  // TODO(codex): confirm TranslateParams (modelType "nmt"|"llm", to/from) once
  // a translate model is wired — not on the P0 capture→RAG→brief path.
  const res = translate({
    modelId,
    text,
    to: opts.to,
    from: opts.from,
  } as unknown as Parameters<typeof translate>[0]);
  return (await (res as { text: Promise<string> | string }).text) ?? "";
}

export interface QvacToolDef {
  name: string;
  description: string;
  /** Zod schema — @qvac/sdk completion supports Zod/JSON tool schemas natively. */
  schema: unknown;
}

export interface ToolCallResult {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Run a tool-calling completion. Returns the model's text + any tool calls it
 * wants to make (examples/llamacpp-dynamic-tools.js: `await result.toolCalls`).
 * NOTE: the model must be loaded with `modelConfig: { tools: true }` (see
 * lib/qvac/server.ts loadLLM).
 */
export async function completeWithTools(
  modelId: string,
  history: CompleteMessage[],
  tools: QvacToolDef[],
): Promise<{ text: string; toolCalls: ToolCallResult[] }> {
  const run = completion({
    modelId,
    history,
    stream: true,
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.schema,
    })),
  } as Parameters<typeof completion>[0]);
  const toolCalls = ((await (run as { toolCalls?: Promise<unknown[]> }).toolCalls) ?? []) as ToolCallResult[];
  const final = await run.final;
  return { text: (final.contentText ?? "").trim(), toolCalls };
}
