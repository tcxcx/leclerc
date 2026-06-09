import { listMissionStories, type LeclercMissionStoryId } from "@leclerc/transfer-core";

export type MissionScopeId = LeclercMissionStoryId;

export interface MissionDossierScope {
  id: MissionScopeId;
  labelKey: string;
  keywords: readonly string[];
}

export const MISSION_DOSSIER_SCOPES = listMissionStories().map((story) => ({
  id: story.id,
  labelKey: story.titleKey,
  keywords: story.dossierKeywords,
})) satisfies MissionDossierScope[];

export function listMissionDossierScopes(): MissionDossierScope[] {
  return [...MISSION_DOSSIER_SCOPES];
}

export function inferMissionIdsForText(text: string): MissionScopeId[] {
  const normalized = text.toLowerCase();
  return MISSION_DOSSIER_SCOPES.filter((scope) =>
    scope.keywords.some((keyword) => normalized.includes(keyword)),
  ).map((scope) => scope.id);
}

export function missionMatchesMeta(meta: Record<string, unknown> | undefined, missionId?: string): boolean {
  if (!missionId) return true;
  const raw = meta?.missionIds ?? meta?.missionId;
  if (Array.isArray(raw)) return raw.map(String).includes(missionId);
  return raw ? String(raw) === missionId : false;
}
