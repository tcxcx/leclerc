import type { IntelExtraction, RecordStatus } from "./intel";

export interface IntelDateLabels {
  months: readonly string[];
  days: readonly string[];
}

export interface IntelExtractionStory {
  id: string;
  systemPromptLines: readonly string[];
  userMessageLabels: {
    recordDate: string;
    source: string;
  };
  dateLabels: IntelDateLabels;
  defaultExtraction: IntelExtraction;
  draftStatus: RecordStatus;
}

export const DEFAULT_INTEL_EXTRACTION_STORY: IntelExtractionStory = {
  id: "faithful-field-intel-extraction",
  systemPromptLines: [
    "Convierte la fuente (transcripcion de voz o texto de un operativo de campo) en una ficha de inteligencia estructurada.",
    "Regla absoluta: extrae EXCLUSIVAMENTE lo que aparece en la fuente. No inventes datos, nombres, lugares, fechas ni evaluaciones. Si un campo no se menciona, deja \"\" (texto) o [] (lista).",
    "Si la fuente es una prueba o no contiene informacion operativa, dilo en el resumen y deja el resto vacio.",
    "Campos:",
    "- resumen: BLUF (bottom line up front) de 1-2 frases, fiel a la fuente.",
    "- amenaza: CRITICO solo ante amenaza explicita a la vida/seguridad; ELEVADO si requiere seguimiento; en otro caso RUTINARIO.",
    "- entidades.personas/organizaciones/lugares: nombres propios dichos literalmente; si no hay, [].",
    "- entidades.fechas: convierte fechas relativas a absolutas usando la \"Fecha del registro\".",
    "- accionesPendientes: taskings/seguimientos dichos literalmente.",
    "- datos.sujeto: alias, descripcion, afiliacion del sujeto principal.",
    "- datos.ubicacion: lugar, coordenadas (si se dicen), contexto.",
    "- datos.evaluacion: fiabilidad de la fuente, corroboracion, riesgos (lista).",
    "- datos.narrativa: matices cualitativos relevantes.",
    "Responde en el idioma de la fuente. /no_think",
  ],
  userMessageLabels: {
    recordDate: "Fecha del registro",
    source: "Fuente",
  },
  dateLabels: {
    months: [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ],
    days: ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"],
  },
  defaultExtraction: {
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
  },
  draftStatus: "BORRADOR",
};

export function intelExtractionSystemPrompt(
  story: IntelExtractionStory = DEFAULT_INTEL_EXTRACTION_STORY,
): string {
  return story.systemPromptLines.join("\n");
}

export function intelEmptyExtraction(story: IntelExtractionStory = DEFAULT_INTEL_EXTRACTION_STORY): IntelExtraction {
  const extraction = story.defaultExtraction;
  return {
    resumen: extraction.resumen,
    amenaza: extraction.amenaza,
    entidades: {
      personas: [...extraction.entidades.personas],
      organizaciones: [...extraction.entidades.organizaciones],
      lugares: [...extraction.entidades.lugares],
      fechas: [...extraction.entidades.fechas],
    },
    accionesPendientes: [...extraction.accionesPendientes],
    datos: {
      sujeto: { ...extraction.datos.sujeto },
      ubicacion: { ...extraction.datos.ubicacion },
      evaluacion: {
        fiabilidad: extraction.datos.evaluacion.fiabilidad,
        corroboracion: extraction.datos.evaluacion.corroboracion,
        riesgos: [...extraction.datos.evaluacion.riesgos],
      },
      narrativa: extraction.datos.narrativa,
    },
  };
}

export function intelUserMessageLabels(story: IntelExtractionStory = DEFAULT_INTEL_EXTRACTION_STORY) {
  return story.userMessageLabels;
}

export function intelDateLabels(story: IntelExtractionStory = DEFAULT_INTEL_EXTRACTION_STORY): IntelDateLabels {
  return story.dateLabels;
}
