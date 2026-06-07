import {
  EXTRACTION_JSON_SCHEMA,
  type IntelExtraction,
  type IntelMetadata,
  type IntelRecord,
} from "./schema";

export { EXTRACTION_JSON_SCHEMA };

export const ASR_LANGUAGE = process.env.NEXT_PUBLIC_QVAC_ASR_LANG ?? "es";

/** System prompt for the extraction step. Faithful-to-source, no invention. */
export const SYSTEM_PROMPT = [
  "Convierte la fuente (transcripción de voz o texto de un operativo de campo) en una ficha de inteligencia estructurada.",
  "Regla absoluta: extrae EXCLUSIVAMENTE lo que aparece en la fuente. No inventes datos, nombres, lugares, fechas ni evaluaciones. Si un campo no se menciona, deja \"\" (texto) o [] (lista).",
  "Si la fuente es una prueba o no contiene información operativa, dilo en el resumen y deja el resto vacío.",
  "Campos:",
  "- resumen: BLUF (bottom line up front) de 1-2 frases, fiel a la fuente.",
  "- amenaza: CRITICO solo ante amenaza explícita a la vida/seguridad; ELEVADO si requiere seguimiento; en otro caso RUTINARIO.",
  "- entidades.personas/organizaciones/lugares: nombres propios dichos literalmente; si no hay, [].",
  "- entidades.fechas: convierte fechas relativas a absolutas usando la \"Fecha del registro\".",
  "- accionesPendientes: taskings/seguimientos dichos literalmente.",
  "- datos.sujeto: alias, descripcion, afiliacion del sujeto principal.",
  "- datos.ubicacion: lugar, coordenadas (si se dicen), contexto.",
  "- datos.evaluacion: fiabilidad de la fuente, corroboracion, riesgos (lista).",
  "- datos.narrativa: matices cualitativos relevantes.",
  "Responde en el idioma de la fuente. /no_think",
].join("\n");

export function emptyExtraction(): IntelExtraction {
  return {
    resumen: "",
    amenaza: "RUTINARIO",
    entidades: { personas: [], organizaciones: [], lugares: [], fechas: [] },
    accionesPendientes: [],
    datos: {
      sujeto: { alias: "", descripcion: "", afiliacion: "" },
      ubicacion: { lugar: "", coordenadas: "", contexto: "" },
      evaluacion: { fiabilidad: "", corroboracion: "", riesgos: [] },
      narrativa: "",
    },
  };
}

function mergeExtraction(e: Partial<IntelExtraction> | undefined): IntelExtraction {
  const base = emptyExtraction();
  if (!e) return base;
  return {
    resumen: e.resumen ?? base.resumen,
    amenaza: e.amenaza ?? base.amenaza,
    entidades: { ...base.entidades, ...e.entidades },
    accionesPendientes: e.accionesPendientes ?? base.accionesPendientes,
    datos: {
      sujeto: { ...base.datos.sujeto, ...e.datos?.sujeto },
      ubicacion: { ...base.datos.ubicacion, ...e.datos?.ubicacion },
      evaluacion: { ...base.datos.evaluacion, ...e.datos?.evaluacion },
      narrativa: e.datos?.narrativa ?? base.datos.narrativa,
    },
  };
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

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

export function buildUserMessage(source: string, capturedAt: number): string {
  return `Fecha del registro: ${fechaLarga(capturedAt)}.\n\nFuente:\n${source}`;
}

/** Flatten a record into one retrieval string for RAG ingest. */
export function ragText(r: IntelRecord): string {
  return [
    r.resumen,
    r.datos.narrativa,
    r.datos.sujeto.alias,
    r.datos.sujeto.descripcion,
    r.datos.sujeto.afiliacion,
    r.datos.ubicacion.lugar,
    r.entidades.personas.join(", "),
    r.entidades.organizaciones.join(", "),
    r.entidades.lugares.join(", "),
    r.transcripcion,
    r.adjuntos?.map((a) => a.text).filter(Boolean).join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Assemble the persisted IntelRecord from the source + LLM extraction. */
export function buildRecord(
  source: string,
  extraction: IntelExtraction,
  metadata: IntelMetadata,
): IntelRecord {
  const e = mergeExtraction(extraction);
  return {
    id: crypto.randomUUID(),
    transcripcion: source,
    resumen: e.resumen?.trim() || source,
    amenaza: e.amenaza,
    entidades: e.entidades,
    accionesPendientes: e.accionesPendientes,
    datos: e.datos,
    metadatos: metadata,
    estado: "BORRADOR",
    createdAt: Date.now(),
  };
}
