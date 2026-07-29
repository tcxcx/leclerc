import type { IntelRecord, Locale, ThreatLevel } from "./intel";
import {
  DEFAULT_ASSISTANT_STORY,
  assistantGreetingFallback,
  assistantGreetingKey,
  assistantPersonaPrompt,
  type AssistantStarterChipStory,
} from "./assistant-stories";
import { analystToolDescription } from "./analyst-stories";

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
    description: analystToolDescription("list_records"),
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
    description: analystToolDescription("get_record"),
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
    description: analystToolDescription("rag_search"),
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
    description: analystToolDescription("extract_locations"),
    sideEffect: "read",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      additionalProperties: false,
    },
  },
];

export function persona(locale: Locale, opts?: { spoken?: boolean }): string {
  return assistantPersonaPrompt(locale, opts);
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
