import { inferMissionIdsForText, MISSION_DOSSIER_SCOPES, type MissionScopeId } from "./mission-dossier";

export type OperatorToolIntent =
  | "dossier.answer"
  | "dossier.search"
  | "analysis.open"
  | "wallet.open"
  | "cards.open"
  | "link.open"
  | "chat";

export interface OperatorToolRoute {
  intent: OperatorToolIntent;
  missionId?: MissionScopeId;
  targetHref?: string;
}

interface RouteRule {
  intent: OperatorToolIntent;
  href?: string;
  keywords: readonly string[];
}

const DOSSIER_ROUTE_KEYWORDS = [
  ...new Set([
    ...MISSION_DOSSIER_SCOPES.flatMap((scope) => scope.keywords),
    "dossier",
    "expediente",
  ]),
];

const ROUTE_RULES = [
  {
    intent: "cards.open",
    href: "card",
    keywords: ["card", "tarjeta", "rain", "allowance", "asignacion"],
  },
  {
    intent: "wallet.open",
    href: "billetera",
    keywords: ["wallet", "billetera", "balance", "balances", "send", "receive", "enviar", "recibir"],
  },
  {
    intent: "link.open",
    href: "enlace",
    keywords: ["p2p", "drop", "dead-drop", "buzon", "station", "estacion", "peer", "par"],
  },
  {
    intent: "analysis.open",
    href: "analisis",
    keywords: ["brief", "informe", "analysis", "analisis", "analyst", "mesa"],
  },
  {
    intent: "dossier.search",
    keywords: ["search", "buscar", "find", "hallar"],
  },
  {
    intent: "dossier.answer",
    keywords: DOSSIER_ROUTE_KEYWORDS,
  },
] as const satisfies readonly RouteRule[];

export function routeOperatorQuery(query: string): OperatorToolRoute {
  const normalized = query.toLowerCase();
  const missionId = inferMissionIdsForText(query)[0];
  const match = ROUTE_RULES.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  if (!match) return { intent: "chat", missionId };
  return {
    intent: match.intent,
    missionId,
    targetHref: "href" in match ? match.href : undefined,
  };
}
