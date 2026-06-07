import "server-only";

/**
 * Server-side QVAC model loading on the station (Node). Models load once via the
 * @repo/qvacs pool (getModel) and are reused across requests. The OpenAI-compat
 * HTTP server does NOT expose embeddings/RAG/ocr — those run here, in-process.
 *
 * Wired against @qvac/sdk@0.12.2 examples (dist/examples/quickstart.js,
 * rag/rag-hyperdb/pipeline.js, llamacpp-dynamic-tools.js):
 *   loadModel({ modelSrc: <CONSTANT>, modelType: "llm"|"embeddings", modelConfig })
 * The registry constants (QWEN3_*, EMBEDDINGGEMMA_*) are rich descriptor objects
 * passed directly as `modelSrc`. Returns the loaded modelId (string).
 */
import {
  getModel,
  loadModel,
  QWEN3_1_7B_INST_Q4,
  QWEN3_4B_INST_Q4_K_M,
  EMBEDDINGGEMMA_300M_Q8_0,
  WHISPER_BASE_Q8_0,
} from "@repo/qvacs";

type ModelType = "llm" | "embeddings" | "whisper";

interface LoadOpts {
  /** Enable native tool-calling (required before completion({tools})). */
  tools?: boolean;
}

function load(modelSrc: unknown, modelType: ModelType, opts: LoadOpts = {}): Promise<string> {
  return loadModel({
    modelSrc,
    modelType,
    ...(opts.tools ? { modelConfig: { tools: true } } : {}),
  } as unknown as Parameters<typeof loadModel>[0]) as Promise<string>;
}

export const RAG_WORKSPACE = process.env.LECLERC_RAG_WORKSPACE ?? "dossier";

/**
 * Reasoning LLM. Loaded with tools enabled so the analyst desk can use native
 * tool-calling. "alta" = Qwen3-4B, "media" = Qwen3-1.7B, "medico" = MedPsy.
 */
export function loadLLM(level: "media" | "alta" | "medico" = "media"): Promise<string> {
  if (level === "alta") {
    return getModel("llm-alta", () => load(QWEN3_4B_INST_Q4_K_M, "llm", { tools: true }));
  }
  if (level === "medico") {
    // MedPsy is not a bundled registry constant. Set LECLERC_MEDPSY_SRC to a
    // registry:// or file path for the MedPsy GGUF; falls back to Qwen3-4B.
    const src = process.env.LECLERC_MEDPSY_SRC;
    return getModel("llm-medico", () =>
      load(src ?? QWEN3_4B_INST_Q4_K_M, "llm", { tools: true }),
    );
  }
  return getModel("llm-media", () => load(QWEN3_1_7B_INST_Q4, "llm", { tools: true }));
}

export function loadWhisper(): Promise<string> {
  return getModel("whisper", () => load(WHISPER_BASE_Q8_0, "whisper"));
}

/** Embedding model for RAG (bundled EmbeddingGemma-300M by default). */
export function loadEmbed(): Promise<string> {
  // Override with a registry:// or file src via LECLERC_EMBED_SRC if desired.
  const src = process.env.LECLERC_EMBED_SRC;
  return getModel("embed", () => load(src ?? EMBEDDINGGEMMA_300M_Q8_0, "embeddings"));
}

/** OCR model (document intel). Set LECLERC_OCR_SRC to a QVAC OCR model. */
export function loadOcr(): Promise<string> {
  const src = process.env.LECLERC_OCR_SRC;
  if (!src) throw new Error("LECLERC_OCR_SRC not set (document-intel feature).");
  // TODO(codex): confirm OCR modelType once wired (not on P0 path).
  return getModel("ocr", () => load(src, "embeddings"));
}

/** Translate model. Set LECLERC_TRANSLATE_SRC to a QVAC NMT model. */
export function loadTranslate(): Promise<string> {
  const src = process.env.LECLERC_TRANSLATE_SRC;
  if (!src) throw new Error("LECLERC_TRANSLATE_SRC not set (translate feature).");
  // TODO(codex): confirm NMT modelType once wired (not on P0 path).
  return getModel("translate", () => load(src, "llm"));
}
