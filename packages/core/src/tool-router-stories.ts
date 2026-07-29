import { MISSION_DOSSIER_SCOPES } from "./mission-dossier";
import type { OperatorToolIntent } from "./tool-router";

export type OperatorToolRouteKeywordSource = "missionDossier";

export interface OperatorToolRouteRuleStory {
  intent: OperatorToolIntent;
  href?: string;
  keywords?: readonly string[];
  keywordSource?: OperatorToolRouteKeywordSource;
}

export interface ResolvedOperatorToolRouteRule {
  intent: OperatorToolIntent;
  href?: string;
  keywords: readonly string[];
}

export interface OperatorToolRouterStory {
  id: string;
  dossierFallbackKeywords: readonly string[];
  rules: readonly OperatorToolRouteRuleStory[];
}

export const DEFAULT_OPERATOR_TOOL_ROUTER_STORY = {
  id: "operator-tool-router",
  dossierFallbackKeywords: ["dossier", "expediente"],
  rules: [
    {
      intent: "cards.open",
      href: "card",
      keywords: [
        "card",
        "tarjeta",
        "rain",
        "allowance",
        "asignacion",
      ],
    },
    {
      intent: "wallet.open",
      href: "billetera",
      keywords: [
        "wallet",
        "billetera",
        "balance",
        "balances",
        "send",
        "receive",
        "enviar",
        "recibir",
      ],
    },
    {
      intent: "link.open",
      href: "enlace",
      keywords: [
        "p2p",
        "drop",
        "dead-drop",
        "buzon",
        "station",
        "estacion",
        "peer",
        "par",
      ],
    },
    {
      intent: "analysis.open",
      href: "analisis",
      keywords: [
        "brief",
        "informe",
        "analysis",
        "analisis",
        "analyst",
        "mesa",
      ],
    },
    {
      intent: "dossier.search",
      keywords: ["search", "buscar", "find", "hallar"],
    },
    {
      intent: "dossier.answer",
      keywordSource: "missionDossier",
    },
  ],
} as const satisfies OperatorToolRouterStory;

export function operatorToolRouteRules(
  story: OperatorToolRouterStory = DEFAULT_OPERATOR_TOOL_ROUTER_STORY,
): ResolvedOperatorToolRouteRule[] {
  return story.rules.map((rule) => ({
    intent: rule.intent,
    href: rule.href,
    keywords: operatorToolRouteKeywords(rule, story),
  }));
}

function operatorToolRouteKeywords(
  rule: OperatorToolRouteRuleStory,
  story: OperatorToolRouterStory,
): readonly string[] {
  const keywords = [...(rule.keywords ?? [])];

  if (rule.keywordSource === "missionDossier") {
    keywords.push(...MISSION_DOSSIER_SCOPES.flatMap((scope) => scope.keywords));
    keywords.push(...story.dossierFallbackKeywords);
  }

  return [...new Set(keywords)];
}
