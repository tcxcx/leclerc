import type { ThreatLevel } from "./intel";

export type DossierFilter = ThreatLevel | "ALL";

export interface DossierStory {
  id: string;
  initialFilter: DossierFilter;
  filters: readonly [DossierFilter, ...DossierFilter[]];
  groundedAnswerIcon: string;
  sourceIdPreviewLength: number;
}

export const DEFAULT_DOSSIER_STORY = {
  id: "field-dossier-list",
  initialFilter: "ALL",
  filters: ["ALL", "CRITICO", "ELEVADO", "RUTINARIO"],
  groundedAnswerIcon: "auto_awesome",
  sourceIdPreviewLength: 8,
} as const satisfies DossierStory;

export function dossierInitialFilter(story: DossierStory = DEFAULT_DOSSIER_STORY): DossierFilter {
  return story.initialFilter;
}

export function dossierFilterOptions(story: DossierStory = DEFAULT_DOSSIER_STORY): DossierFilter[] {
  return [...story.filters];
}

export function dossierGroundedAnswerIcon(story: DossierStory = DEFAULT_DOSSIER_STORY): string {
  return story.groundedAnswerIcon;
}

export function dossierSourceIdPreviewLength(story: DossierStory = DEFAULT_DOSSIER_STORY): number {
  return story.sourceIdPreviewLength;
}
