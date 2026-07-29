import { inferMissionIdsForText, type MissionScopeId } from "./mission-dossier";
import {
  DEFAULT_OPERATOR_TOOL_ROUTER_STORY,
  operatorToolRouteRules,
  type OperatorToolRouterStory,
} from "./tool-router-stories";

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

export function routeOperatorQuery(
  query: string,
  story: OperatorToolRouterStory = DEFAULT_OPERATOR_TOOL_ROUTER_STORY,
): OperatorToolRoute {
  const normalized = query.toLowerCase();
  const missionId = inferMissionIdsForText(query)[0];
  const match = operatorToolRouteRules(story).find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  );
  if (!match) return { intent: "chat", missionId };
  return {
    intent: match.intent,
    missionId,
    targetHref: "href" in match ? match.href : undefined,
  };
}
