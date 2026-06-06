import {
  getModel,
  transcribeOnce,
  completeJSON,
  loadModel,
  WHISPER_BASE_Q8_0,
  QWEN3_4B_INST_Q4_K_M,
  QWEN3_1_7B_INST_Q4,
  LLAMA_3_2_1B_INST_Q4_0,
} from "@repo/qvacs";
import {
  EXTRACTION_JSON_SCHEMA,
  type FieldReport,
  type ReportExtraction,
  type ReportMetadata,
} from "./schema";

// Multilingual Whisper base — better in moderate ambient noise than tiny, and
// the Phase-1 language roadmap (Swahili/Arabic/French/…) is just a param swap.
// Default to Spanish to match the field deployment.
const ASR_LANGUAGE = process.env.QVAC_ASR_LANG ?? "es";
const ASR_KEY = `whisper-${ASR_LANGUAGE}`;

// LLM choice. Llama-3.2-1B is too weak here — it ignores the transcript and
// parrots prompt vocabulary (boilerplate that looks "hardcoded"). Qwen3 follows
// instructions far better and stays faithful. Default to Qwen3-1.7B (good
// balance, ~1.2GB); override with QVAC_LLM=qwen3-4b (best quality) or
// QVAC_LLM=llama-1b.
const LLM_MODELS = {
  "qwen3-4b": QWEN3_4B_INST_Q4_K_M,
  "qwen3-1.7b": QWEN3_1_7B_INST_Q4,
  "llama-1b": LLAMA_3_2_1B_INST_Q4_0,
} as const;
export type LlmKey = keyof typeof LLM_MODELS;
const DEFAULT_LLM = (process.env.QVAC_LLM ?? "qwen3-1.7b") as LlmKey;

// Resolve a per-request LLM choice (falls back to the env/default). All three
// are llama.cpp descriptors with the same modelConfig shape; the cast collapses
// the union so loadModel's engine narrowing resolves (ctx_size on the llm config).
function resolveLlm(choice?: string): {
  key: LlmKey;
  cacheKey: string;
  src: typeof QWEN3_4B_INST_Q4_K_M;
} {
  const key = (choice && choice in LLM_MODELS ? choice : DEFAULT_LLM) as LlmKey;
  const src = (LLM_MODELS[key] ?? QWEN3_1_7B_INST_Q4) as typeof QWEN3_4B_INST_Q4_K_M;
  return { key, cacheKey: `llm-${key}`, src };
}

const SYSTEM_PROMPT = [
  "Convierte la transcripción de un mensaje de voz en un informe estructurado.",
  "Resume EXCLUSIVAMENTE lo que se dice en la transcripción. No agregues temas, cifras, lugares ni contexto que no aparezcan literalmente. No uses vocabulario que no esté en el texto.",
  "Si la transcripción es una prueba o no contiene información real, dilo así en el resumen (p. ej. \"Mensaje de prueba sin información operativa\").",
  "Campos:",
  "- resumen: 1-2 frases que reflejen fielmente SOLO lo dicho.",
  "- prioridad: ALTA solo si se menciona explícitamente una emergencia médica o de seguridad; MEDIA si se menciona un seguimiento necesario; en cualquier otro caso BAJA.",
  "- entidades.nombres: solo nombres propios de personas dichos literalmente; si no hay, deja [].",
  "- entidades.fechas: fechas mencionadas en el texto. Si se dicen de forma relativa (\"hoy\", \"mañana\", \"el martes\", \"el mes que viene\"), conviértelas a fecha absoluta usando la \"Fecha del registro\" indicada. Si no se menciona ninguna fecha, deja [].",
  "- accionesPendientes: solo tareas de seguimiento dichas literalmente; si no hay, deja [].",
  "Responde en español. /no_think",
].join("\n");

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Long Spanish date used to ground the LLM, e.g. "martes, 6 de junio de 2026". */
function fechaLarga(ms: number): string {
  const d = new Date(ms);
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function ensureAsr(): Promise<string> {
  return getModel(ASR_KEY, () =>
    loadModel({
      modelSrc: WHISPER_BASE_Q8_0,
      modelConfig: { language: ASR_LANGUAGE },
    }),
  );
}

function ensureLlm(choice?: string): Promise<string> {
  const { cacheKey, src } = resolveLlm(choice);
  return getModel(cacheKey, () =>
    loadModel({
      modelSrc: src,
      modelConfig: { ctx_size: 4096 },
    }),
  );
}

// Warmth tracking for the /api/health endpoint. The actual model cache lives in
// @repo/qvacs; this just records whether warm-up has completed so ops can poll.
type Warmth = "cold" | "warming" | "ready" | "error";
const g = globalThis as typeof globalThis & { __reportsWarmth?: { state: Warmth; error?: string } };
const warmth = (g.__reportsWarmth ??= { state: "cold" });

export function getWarmth(): { state: Warmth; error?: string } {
  return warmth;
}

/** Pre-load both models (idempotent). Fire-and-forget friendly. */
export async function warmModels(): Promise<void> {
  if (warmth.state === "ready" || warmth.state === "warming") return;
  warmth.state = "warming";
  try {
    await Promise.all([ensureAsr(), ensureLlm()]);
    warmth.state = "ready";
    delete warmth.error;
  } catch (err) {
    warmth.state = "error";
    warmth.error = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

export interface GenerateInput {
  audio: Buffer;
  metadata: ReportMetadata;
  /** Per-request LLM choice (dev). Falls back to the env/default. */
  llm?: string;
}

/**
 * Core product pipeline: audio → Whisper transcript → LLM structured
 * extraction → assembled FieldReport (state PENDIENTE, awaiting confirmation).
 * Returns null when the transcript is empty / non-linguistic.
 */
export async function generateFieldReport(
  input: GenerateInput,
): Promise<FieldReport | null> {
  const L = "[reports]";
  console.log(`${L} generateFieldReport: audio=${input.audio.length} bytes, lang=${ASR_LANGUAGE}`);

  console.log(`${L} loading/using ASR model (${ASR_KEY})…`);
  const asrModelId = await ensureAsr();
  console.log(`${L} ASR modelId=${asrModelId} — transcribing…`);
  const t0 = Date.now();
  const transcripcion = (await transcribeOnce(asrModelId, input.audio)).trim();
  console.log(`${L} transcript (${Date.now() - t0}ms): ${JSON.stringify(transcripcion)}`);

  if (!isMeaningful(transcripcion)) {
    console.warn(`${L} transcript not meaningful — returning null (422)`);
    return null;
  }
  warmth.state = "ready";

  console.log(`${L} loading/using LLM (${resolveLlm(input.llm).key}) — extracting structured report…`);
  const llmModelId = await ensureLlm(input.llm);
  // Ground the model in the capture date so relative dates resolve correctly.
  const fechaRegistro = fechaLarga(input.metadata.capturedAt);
  const userMsg = `Fecha del registro: ${fechaRegistro}.\n\nTranscripción:\n${transcripcion}`;
  console.log(`${L} fecha del registro: ${fechaRegistro}`);
  const t1 = Date.now();
  const extraction = await completeJSON<ReportExtraction>(
    llmModelId,
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    EXTRACTION_JSON_SCHEMA,
    "informe",
  );
  console.log(`${L} LLM extraction (${Date.now() - t1}ms):`, JSON.stringify(extraction));

  return {
    id: crypto.randomUUID(),
    transcripcion,
    resumen: extraction.resumen?.trim() || transcripcion,
    prioridad: extraction.prioridad ?? "MEDIA",
    entidades: {
      nombres: extraction.entidades?.nombres ?? [],
      fechas: extraction.entidades?.fechas ?? [],
    },
    accionesPendientes: extraction.accionesPendientes ?? [],
    metadatos: input.metadata,
    estado: "PENDIENTE",
    createdAt: Date.now(),
  };
}

const BLANK_PATTERNS = ["[no speech detected]", "[blank_audio]", "[silence]"];

function isMeaningful(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length === 0) return false;
  if (BLANK_PATTERNS.some((p) => t.includes(p))) return false;
  if (/^\[[^\]]+\]$/.test(t)) return false;
  return t.replace(/[^\p{L}\p{N}]/gu, "").length >= 2;
}
