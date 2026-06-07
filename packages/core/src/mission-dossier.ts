export type MissionScopeId = "raven" | "glasshouse" | "medic";

export interface MissionDossierScope {
  id: MissionScopeId;
  labelKey: string;
  keywords: readonly string[];
}

export const MISSION_DOSSIER_SCOPES = [
  {
    id: "raven",
    labelKey: "missions.raven.title",
    keywords: ["raven", "cuervo", "fund", "funding", "handler", "kestrel", "vector gris", "money"],
  },
  {
    id: "glasshouse",
    labelKey: "missions.glasshouse.title",
    keywords: ["glasshouse", "casa de vidrio", "warehouse", "almacen", "south gate", "route", "ruta"],
  },
  {
    id: "medic",
    labelKey: "missions.medic.title",
    keywords: ["medic", "medical", "medico", "triage", "triaje", "wound", "herida", "clinic", "clinica"],
  },
] as const satisfies readonly MissionDossierScope[];

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
