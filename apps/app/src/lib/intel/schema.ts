/**
 * LeClerc dossier domain model. An operative dictates/photographs a field
 * observation; QVAC transcribes/OCRs it on-device and an LLM extracts a
 * structured intel card. The verbatim source is always preserved in
 * `transcripcion` — extraction organises, it must never invent.
 *
 * Re-themed from the original field-report baseline. Enum *values* are stable
 * (stored in data); their *labels* are translated via i18n (see docs/leclerc/07).
 */

export type ThreatLevel = "CRITICO" | "ELEVADO" | "RUTINARIO";
export type RecordKind = "observacion" | "contacto" | "documento" | "incidente";
export type Status = "BORRADOR" | "CONFIRMADO";

/** The portion the LLM produces from the source (grammar-constrained). */
export interface IntelExtraction {
  /** Executive summary — faithful to the source only. */
  resumen: string;
  /** Threat triage. CRITICO only when an explicit threat to life/safety is stated. */
  amenaza: ThreatLevel;
  entidades: {
    personas: string[];
    organizaciones: string[];
    lugares: string[];
    fechas: string[];
  };
  /** Pending taskings / follow-ups stated in the source. */
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
  /** OCR/translated text extracted on-device (QVAC). */
  text?: string;
  /** Content hash for integrity; the image bytes themselves are not retained. */
  sha256?: string;
}

export interface IntelMetadata {
  kind: RecordKind | null;
  sector: string | null;
  /** When captured on-device (epoch ms). */
  capturedAt: number;
  durationMs: number | null;
  locale: "es" | "en";
}

export interface IntelRecord extends IntelExtraction {
  id: string;
  /** Verbatim source (audio→text or typed). */
  transcripcion: string;
  adjuntos?: IntelAttachment[];
  metadatos: IntelMetadata;
  estado: Status;
  createdAt: number;
}

const strArray = { type: "array", items: { type: "string" } } as const;

/** JSON Schema for grammar-constrained extraction (QVAC json_schema). */
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
