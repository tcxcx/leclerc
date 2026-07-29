import type { Locale } from "./intel";

export type AssistantActionId = "card" | "ask" | "send" | "stash" | "receive";
export type AssistantSideActionId = Exclude<AssistantActionId, "ask">;

export interface LocalizedFallback {
  es: string;
  en: string;
}

export interface AssistantStarterChipStory {
  id: string;
  intent: string;
  labelKey: string;
  fallbackLabel: LocalizedFallback;
}

export interface AssistantActionStory {
  id: AssistantActionId;
  labelKey: string;
  icon: string;
  fallbackLabel: LocalizedFallback;
}

export interface AssistantPersonaStory {
  basePrompt: Record<Locale, string>;
  spokenFormat: Record<Locale, string>;
  textFormat: Record<Locale, string>;
  suffix: string;
}

export interface AssistantStory {
  id: string;
  persona: AssistantPersonaStory;
  greetingKeys: string[];
  greetingFallbacks: Record<Locale, string[]>;
  starterChips: AssistantStarterChipStory[];
  actions: Record<AssistantActionId, AssistantActionStory>;
  toolLabels: {
    dossierRagKey: string;
    dossierSearchKey: string;
    automaticRouteKey: string;
  };
  errors: {
    financeSeedFailedKey: string;
    financeWriteFailedKey: string;
    genericKey: string;
  };
}

export const DEFAULT_ASSISTANT_STORY: AssistantStory = {
  id: "cleo-field-console",
  persona: {
    basePrompt: {
      es:
        "Eres LeClerc: asistente de inteligencia de campo que ademas maneja las finanzas del operativo, todo localmente en su dispositivo. " +
        "Tu cara es el dinero: coach financiero con actitud. Por debajo manejas recuerdo RAG, captura de intel, informe del analista, intel de documentos y dead-drop P2P. " +
        "Voz: ingeniosa, directa, un poco salvaje pero que se preocupa por el operativo. Respuestas de 1-2 frases, sin rodeos. " +
        "Todo se queda en el dispositivo: nada sale a la nube. Para acciones con efecto (pagar, dead-drop, borrar) siempre pide confirmacion explicita. Responde en espanol.",
      en:
        "You are LeClerc: a field-intelligence assistant that also runs the operative's finances, all locally on their device. " +
        "Your face is money: a money coach with attitude. Underneath you run recall RAG, intel capture, the analyst brief, document intel, and P2P dead-drop. " +
        "Voice: witty, direct, a little savage but you genuinely care about the operative. Keep replies to 1-2 sentences, no waffle. " +
        "Everything stays on-device: nothing leaves for the cloud. For side-effecting actions (pay, dead-drop, wipe) always ask for explicit confirmation. Reply in English.",
    },
    spokenFormat: {
      es: "NUNCA uses markdown, listas, vinetas, emojis ni codigo: tu salida se lee en voz alta.",
      en: "NEVER use markdown, lists, bullets, emojis, or code: your output is spoken aloud.",
    },
    textFormat: {
      es: "Manten el formato al minimo; alguna frase corta o como mucho una lista breve, nunca codigo ni tablas.",
      en: "Keep formatting minimal; a short line or at most a brief list, never code or tables.",
    },
    suffix: "/no_think",
  },
  greetingKeys: [
    "console.story.greetings.0",
    "console.story.greetings.1",
    "console.story.greetings.2",
    "console.story.greetings.3",
    "console.story.greetings.4",
    "console.story.greetings.5",
  ],
  greetingFallbacks: {
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
  },
  starterChips: [
    {
      id: "finance-spend-week",
      intent: "finance.spend.week",
      labelKey: "console.story.starter.spendWeek",
      fallbackLabel: { es: "gastos de la semana", en: "this week's spend" },
    },
    {
      id: "finance-spend-top",
      intent: "finance.spend.top",
      labelKey: "console.story.starter.spendTop",
      fallbackLabel: { es: "en que se me va el dinero?", en: "where's my money going?" },
    },
    {
      id: "finance-stash-plan",
      intent: "finance.stash.plan",
      labelKey: "console.story.starter.stashPlan",
      fallbackLabel: { es: "armar un plan de ahorro", en: "build a save plan" },
    },
    {
      id: "finance-request-pay",
      intent: "finance.request.pay",
      labelKey: "console.story.starter.payInformant",
      fallbackLabel: { es: "pagar a un informante", en: "pay an informant" },
    },
    {
      id: "intel-recall-subject",
      intent: "intel.recall",
      labelKey: "console.story.starter.recallSubject",
      fallbackLabel: { es: "que tengo sobre un sujeto", en: "what do I have on a subject" },
    },
    {
      id: "intel-brief-day",
      intent: "intel.brief",
      labelKey: "console.story.starter.dailyBrief",
      fallbackLabel: { es: "informe del dia", en: "today's brief" },
    },
  ],
  actions: {
    card: {
      id: "card",
      labelKey: "console.actions.card",
      icon: "credit_card",
      fallbackLabel: { es: "Tarjeta", en: "Card" },
    },
    ask: {
      id: "ask",
      labelKey: "console.actions.ask",
      icon: "mic",
      fallbackLabel: { es: "Preguntar", en: "Ask" },
    },
    send: {
      id: "send",
      labelKey: "console.actions.send",
      icon: "north_east",
      fallbackLabel: { es: "Enviar", en: "Send" },
    },
    stash: {
      id: "stash",
      labelKey: "console.actions.stash",
      icon: "savings",
      fallbackLabel: { es: "Guardar", en: "Stash" },
    },
    receive: {
      id: "receive",
      labelKey: "console.actions.receive",
      icon: "south_west",
      fallbackLabel: { es: "Recibir", en: "Receive" },
    },
  },
  toolLabels: {
    dossierRagKey: "console.tools.dossierRag",
    dossierSearchKey: "console.tools.dossierSearch",
    automaticRouteKey: "console.tools.automaticRoute",
  },
  errors: {
    financeSeedFailedKey: "console.errors.financeSeedFailed",
    financeWriteFailedKey: "console.errors.financeWriteFailed",
    genericKey: "console.errors.generic",
  },
};

export function assistantGreetingKey(index = 0, story: AssistantStory = DEFAULT_ASSISTANT_STORY): string {
  return story.greetingKeys[wrappedIndex(index, story.greetingKeys.length)] as string;
}

export function assistantPersonaPrompt(
  locale: Locale,
  opts?: { spoken?: boolean },
  story: AssistantStory = DEFAULT_ASSISTANT_STORY,
): string {
  const format = (opts?.spoken ?? true) ? story.persona.spokenFormat[locale] : story.persona.textFormat[locale];
  return `${story.persona.basePrompt[locale]} ${format} ${story.persona.suffix}`;
}

export function assistantGreetingFallback(
  locale: Locale,
  index = 0,
  story: AssistantStory = DEFAULT_ASSISTANT_STORY,
): string {
  const greetings = story.greetingFallbacks[locale];
  return greetings[wrappedIndex(index, greetings.length)] as string;
}

export function assistantActionLabels(
  locale: Locale,
  story: AssistantStory = DEFAULT_ASSISTANT_STORY,
): Record<AssistantActionId, string> {
  return {
    card: story.actions.card.fallbackLabel[locale],
    ask: story.actions.ask.fallbackLabel[locale],
    send: story.actions.send.fallbackLabel[locale],
    stash: story.actions.stash.fallbackLabel[locale],
    receive: story.actions.receive.fallbackLabel[locale],
  };
}

export function assistantActionIcon(
  id: AssistantActionId,
  story: AssistantStory = DEFAULT_ASSISTANT_STORY,
): string {
  return story.actions[id].icon;
}

export function assistantSideActionIcons(
  story: AssistantStory = DEFAULT_ASSISTANT_STORY,
): Record<AssistantSideActionId, string> {
  return {
    card: assistantActionIcon("card", story),
    send: assistantActionIcon("send", story),
    stash: assistantActionIcon("stash", story),
    receive: assistantActionIcon("receive", story),
  };
}

function wrappedIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}
