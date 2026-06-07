import "server-only";

/**
 * Server-side QVAC model loading on the station (Node). Models load once via the
 * @repo/qvacs pool (getModel) and are reused across requests. The OpenAI-compat
 * HTTP server does NOT expose embeddings/RAG/ocr — those run here, in-process.
 *
 * TODO(codex): confirm the exact exported model-src constant names in the
 * installed @qvac/sdk and the embedding/OCR/translate model ids you register in
 * infra/qvac/qvac.config.json. The names below match qvac.config.json + docs.
 */
import {
  getModel,
  loadModel,
  // model src constants (re-exported from @qvac/sdk):
  WHISPER_BASE_Q8_0,
  QWEN3_1_7B_INST_Q4,
  QWEN3_4B_INST_Q4_K_M,
} from "@repo/qvacs";

/**
 * loadModel's typed overloads expect per-engine descriptors (modelId/modelType/
 * modelConfig), not the docs-quickstart `{ modelSrc }`. The exact descriptor per
 * model is the source of truth in the installed @qvac/sdk .d.ts.
 * TODO(codex): replace `load(src)` with the correct descriptor for each model
 * (e.g. { modelType: "llm", modelSrc, modelConfig: { ctx_size, gpu_layers } }).
 */
function load(modelSrc: unknown): Promise<string> {
  return loadModel({ modelSrc } as unknown as Parameters<typeof loadModel>[0]);
}

export const RAG_WORKSPACE = process.env.LECLERC_RAG_WORKSPACE ?? "dossier";

/** Reasoning LLM (default media; alta when available). */
export function loadLLM(level: "media" | "alta" | "medico" = "media"): Promise<string> {
  if (level === "alta") {
    return getModel("llm-alta", () => load(QWEN3_4B_INST_Q4_K_M));
  }
  if (level === "medico") {
    // TODO(codex): load MedPsy GGUF model src here.
    return getModel("llm-medico", () => load(QWEN3_4B_INST_Q4_K_M));
  }
  return getModel("llm-media", () => load(QWEN3_1_7B_INST_Q4));
}

export function loadWhisper(): Promise<string> {
  return getModel("whisper", () => load(WHISPER_BASE_Q8_0));
}

/** Embedding model for RAG. */
export function loadEmbed(): Promise<string> {
  const src = process.env.LECLERC_EMBED_MODEL;
  if (!src) {
    throw new Error(
      "LECLERC_EMBED_MODEL not set. TODO(codex): register a QVAC embedding model and set the env.",
    );
  }
  return getModel("embed", () => load(src));
}

/** OCR model (document intel). TODO(codex): set the QVAC OCR model src. */
export function loadOcr(): Promise<string> {
  const src = process.env.LECLERC_OCR_MODEL;
  if (!src) throw new Error("LECLERC_OCR_MODEL not set. TODO(codex).");
  return getModel("ocr", () => load(src));
}

/** Translate model. TODO(codex): set the QVAC NMT model src (or reuse the LLM). */
export function loadTranslate(): Promise<string> {
  const src = process.env.LECLERC_TRANSLATE_MODEL;
  if (!src) throw new Error("LECLERC_TRANSLATE_MODEL not set. TODO(codex).");
  return getModel("translate", () => load(src));
}
