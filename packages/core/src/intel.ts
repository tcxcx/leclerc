import {
  DEFAULT_INTEL_EXTRACTION_STORY,
  intelDateLabels,
  intelEmptyExtraction,
  intelExtractionSystemPrompt,
  intelUserMessageLabels,
} from "./intel-stories";

export type Locale = "es" | "en";
export type ThreatLevel = "CRITICO" | "ELEVADO" | "RUTINARIO";
export type RecordKind = "observacion" | "contacto" | "documento" | "incidente";
export type RecordStatus = "BORRADOR" | "CONFIRMADO";

export interface IntelExtraction {
  resumen: string;
  amenaza: ThreatLevel;
  entidades: {
    personas: string[];
    organizaciones: string[];
    lugares: string[];
    fechas: string[];
  };
  accionesPendientes: string[];
  datos: {
    sujeto: { alias: string; descripcion: string; afiliacion: string };
    ubicacion: { lugar: string; coordenadas: string; contexto: string };
    evaluacion: { fiabilidad: string; corroboracion: string; riesgos: string[] };
    narrativa: string;
  };
}

export interface IntelAttachment {
  kind: "ocr" | "foto";
  text?: string;
  sha256?: string;
}

export interface IntelMetadata {
  kind: RecordKind | null;
  sector: string | null;
  capturedAt: number;
  durationMs: number | null;
  locale: Locale;
}

export interface IntelRecord extends IntelExtraction {
  id: string;
  transcripcion: string;
  adjuntos?: IntelAttachment[];
  metadatos: IntelMetadata;
  estado: RecordStatus;
  createdAt: number;
}

const strArray = { type: "array", items: { type: "string" } } as const;

export const EXTRACTION_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    resumen: { type: "string" },
    amenaza: { type: "string", enum: ["CRITICO", "ELEVADO", "RUTINARIO"] },
    entidades: {
      type: "object",
      properties: {
        personas: strArray,
        organizaciones: strArray,
        lugares: strArray,
        fechas: strArray,
      },
      required: ["personas", "organizaciones", "lugares", "fechas"],
      additionalProperties: false,
    },
    accionesPendientes: strArray,
    datos: {
      type: "object",
      properties: {
        sujeto: {
          type: "object",
          properties: {
            alias: { type: "string" },
            descripcion: { type: "string" },
            afiliacion: { type: "string" },
          },
          required: ["alias", "descripcion", "afiliacion"],
          additionalProperties: false,
        },
        ubicacion: {
          type: "object",
          properties: {
            lugar: { type: "string" },
            coordenadas: { type: "string" },
            contexto: { type: "string" },
          },
          required: ["lugar", "coordenadas", "contexto"],
          additionalProperties: false,
        },
        evaluacion: {
          type: "object",
          properties: {
            fiabilidad: { type: "string" },
            corroboracion: { type: "string" },
            riesgos: strArray,
          },
          required: ["fiabilidad", "corroboracion", "riesgos"],
          additionalProperties: false,
        },
        narrativa: { type: "string" },
      },
      required: ["sujeto", "ubicacion", "evaluacion", "narrativa"],
      additionalProperties: false,
    },
  },
  required: ["resumen", "amenaza", "entidades", "accionesPendientes", "datos"],
  additionalProperties: false,
};

export const SYSTEM_PROMPT = intelExtractionSystemPrompt();

export function emptyExtraction(): IntelExtraction {
  return intelEmptyExtraction();
}

export function mergeExtraction(extraction: Partial<IntelExtraction> | undefined): IntelExtraction {
  const base = emptyExtraction();
  if (!extraction) return base;
  return {
    resumen: extraction.resumen ?? base.resumen,
    amenaza: extraction.amenaza ?? base.amenaza,
    entidades: { ...base.entidades, ...extraction.entidades },
    accionesPendientes: extraction.accionesPendientes ?? base.accionesPendientes,
    datos: {
      sujeto: { ...base.datos.sujeto, ...extraction.datos?.sujeto },
      ubicacion: { ...base.datos.ubicacion, ...extraction.datos?.ubicacion },
      evaluacion: { ...base.datos.evaluacion, ...extraction.datos?.evaluacion },
      narrativa: extraction.datos?.narrativa ?? base.datos.narrativa,
    },
  };
}

export function longDate(ms: number): string {
  const date = new Date(ms);
  const labels = intelDateLabels();
  return `${labels.days[date.getDay()]}, ${date.getDate()} de ${labels.months[date.getMonth()]} de ${date.getFullYear()}`;
}

const BLANK_PATTERNS = ["[no speech detected]", "[blank_audio]", "[silence]"];

export function isMeaningfulText(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (normalized.length === 0) return false;
  if (BLANK_PATTERNS.some((pattern) => normalized.includes(pattern))) return false;
  if (/^\[[^\]]+\]$/.test(normalized)) return false;
  return normalized.replace(/[^\p{L}\p{N}]/gu, "").length >= 2;
}

export function buildExtractionUserMessage(source: string, capturedAt: number): string {
  const labels = intelUserMessageLabels();
  return `${labels.recordDate}: ${longDate(capturedAt)}.\n\n${labels.source}:\n${source}`;
}

export function recordToRagText(record: IntelRecord): string {
  return [
    record.resumen,
    record.datos.narrativa,
    record.datos.sujeto.alias,
    record.datos.sujeto.descripcion,
    record.datos.sujeto.afiliacion,
    record.datos.ubicacion.lugar,
    record.entidades.personas.join(", "),
    record.entidades.organizaciones.join(", "),
    record.entidades.lugares.join(", "),
    record.transcripcion,
    record.adjuntos?.map((attachment) => attachment.text).filter(Boolean).join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

export interface BuildRecordOptions {
  id?: string;
  createdAt?: number;
  idFactory?: () => string;
}

function fallbackId(): string {
  return `record_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildRecord(
  source: string,
  extraction: IntelExtraction,
  metadata: IntelMetadata,
  options: BuildRecordOptions = {},
): IntelRecord {
  const merged = mergeExtraction(extraction);
  return {
    id: options.id ?? options.idFactory?.() ?? fallbackId(),
    transcripcion: source,
    resumen: merged.resumen.trim() || source,
    amenaza: merged.amenaza,
    entidades: merged.entidades,
    accionesPendientes: merged.accionesPendientes,
    datos: merged.datos,
    metadatos: metadata,
    estado: DEFAULT_INTEL_EXTRACTION_STORY.draftStatus,
    createdAt: options.createdAt ?? Date.now(),
  };
}
