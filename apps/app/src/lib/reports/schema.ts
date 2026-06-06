/**
 * Domain model for a field report (informe de campo).
 *
 * A field operator dictates an activity (aid distribution, health check, etc.);
 * QVAC transcribes it on-device and the LLM extracts a structured summary. The
 * operator's verbatim words are always preserved in `transcripcion` — the
 * extraction only organises, it must not replace the source of truth.
 */

export type Prioridad = "ALTA" | "MEDIA" | "BAJA";
export type Estado = "PENDIENTE" | "CONFIRMADO";

/** The portion the LLM produces from the transcript (grammar-constrained). */
export interface ReportExtraction {
  /** Consolidated key points (suministros entregados, estado de salud, …). */
  resumen: string;
  /** Visual triage class — ALTA for urgent medical/safety findings. */
  prioridad: Prioridad;
  /** Extracted entities for quick reference / follow-up. */
  entidades: {
    nombres: string[];
    fechas: string[];
  };
  /** Pending actions (seguimientos médicos, renovaciones, …). */
  accionesPendientes: string[];
}

/** Auto-captured context for the report (provided by the device/frontend). */
export interface ReportMetadata {
  sector: string | null;
  unidad: string | null;
  /** When the audio was captured on-device (epoch ms). */
  capturedAt: number;
  /** Recording length in ms, when derivable. */
  durationMs: number | null;
}

export interface FieldReport extends ReportExtraction {
  id: string;
  /** Verbatim transcript — full text available on demand for verification. */
  transcripcion: string;
  metadatos: ReportMetadata;
  estado: Estado;
  /** When the report record was created on the server (epoch ms). */
  createdAt: number;
}

/**
 * JSON Schema passed to `completeJSON`. The grammar forces exactly these keys
 * and constrains `prioridad` to the enum, so the small model can't drift.
 */
export const EXTRACTION_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    resumen: { type: "string" },
    prioridad: { type: "string", enum: ["ALTA", "MEDIA", "BAJA"] },
    entidades: {
      type: "object",
      properties: {
        nombres: { type: "array", items: { type: "string" } },
        fechas: { type: "array", items: { type: "string" } },
      },
      required: ["nombres", "fechas"],
      additionalProperties: false,
    },
    accionesPendientes: { type: "array", items: { type: "string" } },
  },
  required: ["resumen", "prioridad", "entidades", "accionesPendientes"],
  additionalProperties: false,
};
