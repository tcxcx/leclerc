import {
  getModel,
  transcribeOnce,
  completeJSON,
  loadModel,
  WHISPER_BASE_Q8_0,
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
const LLM_KEY = "llm";

const SYSTEM_PROMPT = [
  "Eres un asistente de informes para operaciones humanitarias de campo.",
  "Un oficial de campo dicta una actividad (distribución de suministros, control de salud, etc.).",
  "A partir de la transcripción, extrae un informe estructurado.",
  "REGLA CRÍTICA: usa ÚNICAMENTE información explícita en la transcripción. NO inventes, NO infieras, NO enumeres ni completes listas. Si un dato no se menciona, deja la lista vacía.",
  "- resumen: una o dos frases concisas que reflejen fielmente lo dicho. No agregues detalles nuevos.",
  "- prioridad: ALTA SOLO si se menciona explícitamente una emergencia médica o un riesgo de seguridad. MEDIA si se menciona un seguimiento necesario no urgente. BAJA para entregas o actividades rutinarias. Ante la duda, usa BAJA.",
  "- entidades.nombres: SOLO nombres propios de personas explícitamente dichos (p. ej. \"María García\"). NO incluyas cantidades ni grupos genéricos como \"12 familias\". Si no hay nombres propios, deja la lista vacía [].",
  "- entidades.fechas: SOLO fechas explícitas (p. ej. \"15 de marzo\", \"el martes\"). NO inventes secuencias. Si no hay, deja la lista vacía [].",
  "- accionesPendientes: SOLO tareas de seguimiento pendientes mencionadas explícitamente. Si no se menciona ninguna, deja la lista vacía [].",
].join("\n");

function ensureAsr(): Promise<string> {
  return getModel(ASR_KEY, () =>
    loadModel({
      modelSrc: WHISPER_BASE_Q8_0,
      modelConfig: { language: ASR_LANGUAGE },
    }),
  );
}

function ensureLlm(): Promise<string> {
  return getModel(LLM_KEY, () =>
    loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
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

  console.log(`${L} loading/using LLM (${LLM_KEY}) — extracting structured report…`);
  const llmModelId = await ensureLlm();
  const t1 = Date.now();
  const extraction = await completeJSON<ReportExtraction>(
    llmModelId,
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcripcion },
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
