import {
  EXTRACTION_JSON_SCHEMA,
  type FieldReport,
  type ReportExtraction,
  type ReportMetadata,
} from "./schema";

export { EXTRACTION_JSON_SCHEMA };

export const ASR_LANGUAGE = process.env.NEXT_PUBLIC_QVAC_ASR_LANG ?? "es";

export const SYSTEM_PROMPT = [
  "Convierte la transcripción de un mensaje de voz en un informe estructurado.",
  "Resume EXCLUSIVAMENTE lo que se dice en la transcripción. No agregues temas, cifras, lugares ni contexto que no aparezcan literalmente. No uses vocabulario que no esté en el texto.",
  "Si la transcripción es una prueba o no contiene información real, dilo así en el resumen (p. ej. \"Mensaje de prueba sin información operativa\").",
  "Campos:",
  "- resumen: 1-2 frases que reflejen fielmente SOLO lo dicho.",
  "- prioridad: ALTA solo si se menciona explícitamente una emergencia médica o de seguridad; MEDIA si se menciona un seguimiento necesario; en cualquier otro caso BAJA.",
  "- entidades.nombres: solo nombres propios de personas dichos literalmente; si no hay, deja [].",
  "- entidades.fechas: fechas mencionadas. Si se dicen de forma relativa (\"hoy\", \"mañana\", \"el martes\"), conviértelas a fecha absoluta usando la \"Fecha del registro\". Si no se menciona ninguna, deja [].",
  "- accionesPendientes: solo tareas de seguimiento dichas literalmente; si no hay, deja [].",
  "Responde en español. /no_think",
].join("\n");

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Long Spanish date used to ground the LLM, e.g. "martes, 6 de junio de 2026". */
export function fechaLarga(ms: number): string {
  const d = new Date(ms);
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

const BLANK_PATTERNS = ["[no speech detected]", "[blank_audio]", "[silence]"];

export function isMeaningful(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length === 0) return false;
  if (BLANK_PATTERNS.some((p) => t.includes(p))) return false;
  if (/^\[[^\]]+\]$/.test(t)) return false;
  return t.replace(/[^\p{L}\p{N}]/gu, "").length >= 2;
}

/** Build the user prompt with date grounding. */
export function buildUserMessage(transcript: string, capturedAt: number): string {
  return `Fecha del registro: ${fechaLarga(capturedAt)}.\n\nTranscripción:\n${transcript}`;
}

/** Assemble the persisted FieldReport from the transcript + LLM extraction. */
export function buildReport(
  transcript: string,
  extraction: ReportExtraction,
  metadata: ReportMetadata,
): FieldReport {
  return {
    id: crypto.randomUUID(),
    transcripcion: transcript,
    resumen: extraction.resumen?.trim() || transcript,
    prioridad: extraction.prioridad ?? "MEDIA",
    entidades: {
      nombres: extraction.entidades?.nombres ?? [],
      fechas: extraction.entidades?.fechas ?? [],
    },
    accionesPendientes: extraction.accionesPendientes ?? [],
    metadatos: metadata,
    estado: "PENDIENTE",
    createdAt: Date.now(),
  };
}
