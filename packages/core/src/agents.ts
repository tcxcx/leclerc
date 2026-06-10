import type { IntelRecord, Locale, ThreatLevel } from "./intel";
import {
  DEFAULT_ASSISTANT_STORY,
  assistantGreetingFallback,
  assistantGreetingKey,
  type AssistantStarterChipStory,
} from "./assistant-stories";

export type { Locale };

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface BriefRequest {
  records: IntelRecord[];
  focus?: string;
  locale: Locale;
  includeMedic?: boolean;
}

export interface BriefToolEvent {
  agent: string;
  tool: string;
  status: "ok" | "fallback" | "error";
  note: string;
}

export interface IntelBrief {
  titulo: string;
  bottomLine: string;
  amenazaGlobal: ThreatLevel;
  hallazgos: { texto: string; fuentes: string[] }[];
  entidadesClave: { nombre: string; tipo: string; menciones: number }[];
  geo: { lugar: string; registros: string[] }[];
  recomendaciones: string[];
  agentesEjecutados: string[];
  toolLog: BriefToolEvent[];
  generadoEn: number;
}

export interface BriefProgressEvent {
  agent: string;
  status: "start" | "done";
  note?: string;
}

export type CoreToolSideEffect = "read" | "requires-confirmation";

export interface CoreToolContract {
  name: string;
  description: string;
  sideEffect: CoreToolSideEffect;
  inputSchema: Record<string, unknown>;
}

export const ANALYST_TOOL_CONTRACTS: CoreToolContract[] = [
  {
    name: "list_records",
    description: "List dossier records, newest first, optionally filtered by threat level.",
    sideEffect: "read",
    inputSchema: {
      type: "object",
      properties: {
        amenaza: { type: "string", enum: ["CRITICO", "ELEVADO", "RUTINARIO"] },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_record",
    description: "Fetch one dossier record by id.",
    sideEffect: "read",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "rag_search",
    description: "Semantic search across the dossier. Returns excerpts plus record ids.",
    sideEffect: "read",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, k: { type: "number" } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "extract_locations",
    description: "Aggregate geo entities mentioned across records.",
    sideEffect: "read",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      additionalProperties: false,
    },
  },
];

export function persona(locale: Locale, opts?: { spoken?: boolean }): string {
  const spoken = opts?.spoken ?? true;
  if (locale === "es") {
    const base =
      "Eres LeClerc: asistente de inteligencia de campo que ademas maneja las finanzas del operativo, todo localmente en su dispositivo. " +
      "Tu cara es el dinero: coach financiero con actitud. Por debajo manejas recuerdo RAG, captura de intel, informe del analista, intel de documentos y dead-drop P2P. " +
      "Voz: ingeniosa, directa, un poco salvaje pero que se preocupa por el operativo. Respuestas de 1-2 frases, sin rodeos. " +
      "Todo se queda en el dispositivo: nada sale a la nube. Para acciones con efecto (pagar, dead-drop, borrar) siempre pide confirmacion explicita. Responde en espanol.";
    const format = spoken
      ? " NUNCA uses markdown, listas, vinetas, emojis ni codigo: tu salida se lee en voz alta."
      : " Manten el formato al minimo; alguna frase corta o como mucho una lista breve, nunca codigo ni tablas.";
    return base + format + " /no_think";
  }

  const base =
    "You are LeClerc: a field-intelligence assistant that also runs the operative's finances, all locally on their device. " +
    "Your face is money: a money coach with attitude. Underneath you run recall RAG, intel capture, the analyst brief, document intel, and P2P dead-drop. " +
    "Voice: witty, direct, a little savage but you genuinely care about the operative. Keep replies to 1-2 sentences, no waffle. " +
    "Everything stays on-device: nothing leaves for the cloud. For side-effecting actions (pay, dead-drop, wipe) always ask for explicit confirmation. Reply in English.";
  const format = spoken
    ? " NEVER use markdown, lists, bullets, emojis, or code: your output is spoken aloud."
    : " Keep formatting minimal; a short line or at most a brief list, never code or tables.";
  return base + format + " /no_think";
}

export function greetingKey(index = 0): string {
  return assistantGreetingKey(index);
}

export function greeting(locale: Locale, index = 0): string {
  return assistantGreetingFallback(locale, index);
}

export interface StarterChip {
  label: string;
  labelKey: string;
  intent: string;
}

export function starterChips(locale: Locale): StarterChip[] {
  return starterChipStories().map((chip) => ({
    label: chip.fallbackLabel[locale],
    labelKey: chip.labelKey,
    intent: chip.intent,
  }));
}

export function starterChipStories(): AssistantStarterChipStory[] {
  return DEFAULT_ASSISTANT_STORY.starterChips;
}
