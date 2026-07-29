export type InferenceMode = "station" | "delegate" | "ondevice";

export interface InferenceModeStory {
  id: string;
  storageKey: string;
  defaultMode: InferenceMode;
  modes: readonly InferenceMode[];
  icons: Record<InferenceMode, string>;
}

export const DEFAULT_INFERENCE_MODE_STORY: InferenceModeStory = {
  id: "qvac-inference-mode-routing",
  storageKey: "leclerc-inference-mode",
  defaultMode: "station",
  modes: ["station", "delegate", "ondevice"],
  icons: {
    station: "dns",
    delegate: "lan",
    ondevice: "smartphone",
  },
};

export function defaultInferenceMode(
  story: InferenceModeStory = DEFAULT_INFERENCE_MODE_STORY,
): InferenceMode {
  return story.defaultMode;
}

export function inferenceModeStorageKey(
  story: InferenceModeStory = DEFAULT_INFERENCE_MODE_STORY,
): string {
  return story.storageKey;
}

export function inferenceModeOptions(
  story: InferenceModeStory = DEFAULT_INFERENCE_MODE_STORY,
): readonly InferenceMode[] {
  return story.modes;
}

export function isInferenceMode(
  value: unknown,
  story: InferenceModeStory = DEFAULT_INFERENCE_MODE_STORY,
): value is InferenceMode {
  return typeof value === "string" && story.modes.includes(value as InferenceMode);
}

export function inferenceModeIcon(
  mode: InferenceMode,
  story: InferenceModeStory = DEFAULT_INFERENCE_MODE_STORY,
): string {
  return story.icons[mode];
}
