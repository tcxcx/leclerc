import type { Locale } from "./intel";

export interface AnalystProgressStep {
  id: string;
  labelKey: string;
  fallbackLabel: string;
}

export interface AnalystReportLabels {
  analystDesk: string;
  generated: string;
  threat: string;
  records: string;
  bluf: string;
  findings: string;
  geo: string;
  recommendations: string;
  toolLog: string;
}

export interface AnalystRuntimeCopy {
  ragDefaultQuery: string;
  defaultFocus: string;
  medicSystemPrompt: string;
  synthSystemPrompt: string;
  sectionLabels: {
    focus: string;
    triage: string;
    patterns: string;
    medic: string;
    geo: string;
  };
  toolNotes: {
    recordsRanked: string;
    records: string;
    placesClustered: string;
    places: string;
    ragHits: string;
    ragFallback: string;
    medpsyCompleted: string;
    medpsyMissingModel: string;
    medpsyUnavailable: string;
    findingsSynthesized: string;
  };
}

export type AnalystToolName = "list_records" | "get_record" | "rag_search" | "extract_locations";

export interface AnalystToolDescriptor {
  name: AnalystToolName;
  description: string;
}

export interface AnalystStory {
  id: string;
  progressSteps: AnalystProgressStep[];
  reportLabels: Record<Locale, AnalystReportLabels>;
  runtimeCopy: Record<Locale, AnalystRuntimeCopy>;
  toolDescriptions: Record<AnalystToolName, string>;
  errors: {
    demoSeedFailedKey: string;
    briefFailedKey: string;
    ragFailedKey: string;
    emptySourceKey: string;
    inferenceFailedKey: string;
    vaultWriteFailedKey: string;
  };
}

export const DEFAULT_ANALYST_STORY: AnalystStory = {
  id: "field-analyst-desk",
  progressSteps: [
    {
      id: "triage",
      labelKey: "brief.progress.triage",
      fallbackLabel: "triage",
    },
    {
      id: "geo",
      labelKey: "brief.progress.geo",
      fallbackLabel: "geo",
    },
    {
      id: "pattern",
      labelKey: "brief.progress.pattern",
      fallbackLabel: "pattern",
    },
    {
      id: "synth",
      labelKey: "brief.progress.synth",
      fallbackLabel: "synth",
    },
  ],
  reportLabels: {
    en: {
      analystDesk: "Analyst desk",
      generated: "Generated",
      threat: "Threat",
      records: "Records",
      bluf: "Bottom line",
      findings: "Findings with sources",
      geo: "Geo",
      recommendations: "Recommendations",
      toolLog: "Agent/tool log",
    },
    es: {
      analystDesk: "Mesa de analisis",
      generated: "Generado",
      threat: "Amenaza",
      records: "Registros",
      bluf: "Conclusion",
      findings: "Hallazgos con fuentes",
      geo: "Geo",
      recommendations: "Recomendaciones",
      toolLog: "Registro de agentes/herramientas",
    },
  },
  runtimeCopy: {
    en: {
      ragDefaultQuery: "threats, recurring subjects, links",
      defaultFocus: "general overview",
      medicSystemPrompt:
        "You are a medical analyst (MedPsy). Using ONLY the records, evaluate health, injury, and triage status for the subject(s). Cite ids. If there is no medical content, answer 'no medical content'. /no_think",
      synthSystemPrompt:
        "You are the synthesizer for an intelligence analyst desk. Produce a one-page JSON brief. EVERY finding MUST cite the record ids supporting it in 'fuentes'. Do not invent; if evidence is thin, say so. Respond in English. /no_think",
      sectionLabels: {
        focus: "Focus",
        triage: "Triage",
        patterns: "Patterns/RAG",
        medic: "Medical analysis",
        geo: "Geo",
      },
      toolNotes: {
        recordsRanked: "records ranked",
        records: "records",
        placesClustered: "places clustered",
        places: "places",
        ragHits: "RAG hits",
        ragFallback: "RAG unavailable; used posted records",
        medpsyCompleted: "MedPsy path completed",
        medpsyMissingModel:
          "MedPsy medic mode requested but no MedPsy model is configured. Set LECLERC_MEDPSY_SRC to a MedPsy GGUF model source.",
        medpsyUnavailable: "MedPsy unavailable",
        findingsSynthesized: "findings synthesized",
      },
    },
    es: {
      ragDefaultQuery: "amenazas, sujetos recurrentes, vinculos",
      defaultFocus: "panorama general",
      medicSystemPrompt:
        "Eres analista medico (MedPsy). A partir SOLO de los registros, evalua estado de salud, heridas y triaje del/los sujeto(s). Cita ids. Si no hay contenido medico, responde 'sin contenido medico'. /no_think",
      synthSystemPrompt:
        "Eres el sintetizador de una mesa de analisis de inteligencia. Produce un informe de una pagina en JSON. CADA hallazgo DEBE citar los ids de los registros que lo respaldan en 'fuentes'. No inventes; si la evidencia es escasa, dilo. Responde en espanol. /no_think",
      sectionLabels: {
        focus: "Enfoque",
        triage: "Triaje",
        patterns: "Patrones/RAG",
        medic: "Analisis medico",
        geo: "Geo",
      },
      toolNotes: {
        recordsRanked: "registros priorizados",
        records: "registros",
        placesClustered: "lugares agrupados",
        places: "lugares",
        ragHits: "hits RAG",
        ragFallback: "RAG no disponible; se usaron los registros enviados",
        medpsyCompleted: "Ruta MedPsy completada",
        medpsyMissingModel:
          "Se pidio modo medico MedPsy pero no hay modelo MedPsy configurado. Configure LECLERC_MEDPSY_SRC con una fuente de modelo GGUF MedPsy.",
        medpsyUnavailable: "MedPsy no disponible",
        findingsSynthesized: "hallazgos sintetizados",
      },
    },
  },
  toolDescriptions: {
    list_records: "List dossier records, newest first, optionally filtered by threat level.",
    get_record: "Fetch one dossier record by id.",
    rag_search: "Semantic search across the dossier. Returns excerpts + record ids.",
    extract_locations: "Aggregate geo entities mentioned across records.",
  },
  errors: {
    demoSeedFailedKey: "brief.errors.demoSeedFailed",
    briefFailedKey: "brief.errors.briefFailed",
    ragFailedKey: "dossier.errors.ragFailed",
    emptySourceKey: "capture.errors.emptySource",
    inferenceFailedKey: "capture.errors.inferenceFailed",
    vaultWriteFailedKey: "capture.errors.vaultWriteFailed",
  },
};

export function analystReportLabels(
  locale: Locale,
  story: AnalystStory = DEFAULT_ANALYST_STORY,
): AnalystReportLabels {
  return story.reportLabels[locale];
}

export function analystRuntimeCopy(
  locale: Locale,
  story: AnalystStory = DEFAULT_ANALYST_STORY,
): AnalystRuntimeCopy {
  return story.runtimeCopy[locale];
}

export function analystToolDescription(
  name: AnalystToolName,
  story: AnalystStory = DEFAULT_ANALYST_STORY,
): string {
  return story.toolDescriptions[name];
}

export function analystToolDescriptors(story: AnalystStory = DEFAULT_ANALYST_STORY): AnalystToolDescriptor[] {
  return (Object.entries(story.toolDescriptions) as [AnalystToolName, string][]).map(([name, description]) => ({
    name,
    description,
  }));
}

export function countNote(count: number, label: string): string {
  return `${count} ${label}`;
}
