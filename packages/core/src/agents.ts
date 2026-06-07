import type { IntelRecord, Locale, ThreatLevel } from "./intel";

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
      "Todo se queda en el dispositivo: nada sale a la nube. Para acciones con efecto siempre pide confirmacion explicita. Responde en espanol.";
    const format = spoken
      ? " NUNCA uses markdown, listas, vinetas, emojis ni codigo: tu salida se lee en voz alta."
      : " Manten el formato al minimo; alguna frase corta o como mucho una lista breve, nunca codigo ni tablas.";
    return base + format + " /no_think";
  }

  const base =
    "You are LeClerc: a field-intelligence assistant that also runs the operative's finances, all locally on their device. " +
    "Your face is money: a money coach with attitude. Underneath you run recall RAG, intel capture, the analyst brief, document intel, and P2P dead-drop. " +
    "Voice: witty, direct, a little savage but you genuinely care about the operative. Keep replies to 1-2 sentences, no waffle. " +
    "Everything stays on-device: nothing leaves for the cloud. For side-effecting actions always ask for explicit confirmation. Reply in English.";
  const format = spoken
    ? " NEVER use markdown, lists, bullets, emojis, or code: your output is spoken aloud."
    : " Keep formatting minimal; a short line or at most a brief list, never code or tables.";
  return base + format + " /no_think";
}

const GREETINGS: Record<Locale, string[]> = {
  es: [
    "Hola, operativo.",
    "De vuelta en la estacion.",
    "Te estaba esperando.",
    "Linea segura. Dime.",
    "Aqui LeClerc. Que movemos?",
    "Buenas, agente. Todo en local.",
  ],
  en: [
    "Hey you.",
    "Back on station.",
    "Secure line. Talk to me.",
    "Welcome back, operative.",
    "LeClerc here. What are we moving?",
    "Hey, agent. All on-device.",
  ],
};

export function greeting(locale: Locale, index = 0): string {
  const list = GREETINGS[locale];
  const greetingIndex = ((index % list.length) + list.length) % list.length;
  return list[greetingIndex] as string;
}

export interface StarterChip {
  label: string;
  intent: string;
}

export function starterChips(locale: Locale): StarterChip[] {
  if (locale === "es") {
    return [
      { label: "gastos de la semana", intent: "finance.spend.week" },
      { label: "en que se me va el dinero?", intent: "finance.spend.top" },
      { label: "armar un plan de ahorro", intent: "finance.stash.plan" },
      { label: "pagar a un informante", intent: "finance.request.pay" },
      { label: "que tengo sobre un sujeto", intent: "intel.recall" },
      { label: "informe del dia", intent: "intel.brief" },
    ];
  }

  return [
    { label: "this week's spend", intent: "finance.spend.week" },
    { label: "where's my money going?", intent: "finance.spend.top" },
    { label: "build a save plan", intent: "finance.stash.plan" },
    { label: "pay an informant", intent: "finance.request.pay" },
    { label: "what do I have on a subject", intent: "intel.recall" },
    { label: "today's brief", intent: "intel.brief" },
  ];
}
