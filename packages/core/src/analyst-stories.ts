export interface AnalystProgressStep {
  id: string;
  labelKey: string;
  fallbackLabel: string;
}

export interface AnalystStory {
  id: string;
  progressSteps: AnalystProgressStep[];
  errors: {
    demoSeedFailedKey: string;
    briefFailedKey: string;
    ragFailedKey: string;
    emptySourceKey: string;
    inferenceFailedKey: string;
    vaultWriteFailedKey: string;
  };
}

export const DEFAULT_ANALYST_STORY: AnalystStory = {
  id: "field-analyst-desk",
  progressSteps: [
    {
      id: "triage",
      labelKey: "brief.progress.triage",
      fallbackLabel: "triage",
    },
    {
      id: "geo",
      labelKey: "brief.progress.geo",
      fallbackLabel: "geo",
    },
    {
      id: "pattern",
      labelKey: "brief.progress.pattern",
      fallbackLabel: "pattern",
    },
    {
      id: "synth",
      labelKey: "brief.progress.synth",
      fallbackLabel: "synth",
    },
  ],
  errors: {
    demoSeedFailedKey: "brief.errors.demoSeedFailed",
    briefFailedKey: "brief.errors.briefFailed",
    ragFailedKey: "dossier.errors.ragFailed",
    emptySourceKey: "capture.errors.emptySource",
    inferenceFailedKey: "capture.errors.inferenceFailed",
    vaultWriteFailedKey: "capture.errors.vaultWriteFailed",
  },
};
