export type LlmLevel = "media" | "alta" | "medico";

export type ModelLevelSelector = "settings" | "compact";
export type ModelLevelUseCase = "capture" | "chat" | "rag" | "analyst" | "medic";

export interface ModelLevelStory {
  id: string;
  storageKey: string;
  defaultLevel: LlmLevel;
  selectors: Record<ModelLevelSelector, readonly LlmLevel[]>;
  modelIds: Record<LlmLevel, string>;
  cacheKeys: Record<LlmLevel, string>;
  useCaseDefaults: Record<ModelLevelUseCase, LlmLevel>;
}

export const DEFAULT_MODEL_LEVEL_STORY: ModelLevelStory = {
  id: "qvac-model-level-routing",
  storageKey: "leclerc-llm-level",
  defaultLevel: "media",
  selectors: {
    settings: ["media", "alta", "medico"],
    compact: ["alta", "media"],
  },
  modelIds: {
    alta: "qwen3-4b",
    media: "qwen3-1.7b",
    medico: "medpsy-4b",
  },
  cacheKeys: {
    alta: "llm-alta",
    media: "llm-media",
    medico: "llm-medico",
  },
  useCaseDefaults: {
    capture: "media",
    chat: "media",
    rag: "media",
    analyst: "alta",
    medic: "medico",
  },
};

export function defaultModelLevel(
  story: ModelLevelStory = DEFAULT_MODEL_LEVEL_STORY,
): LlmLevel {
  return story.defaultLevel;
}

export function modelLevelStorageKey(
  story: ModelLevelStory = DEFAULT_MODEL_LEVEL_STORY,
): string {
  return story.storageKey;
}

export function modelLevelOptions(
  selector: ModelLevelSelector,
  story: ModelLevelStory = DEFAULT_MODEL_LEVEL_STORY,
): readonly LlmLevel[] {
  return story.selectors[selector];
}

export function isModelLevel(
  value: unknown,
  story: ModelLevelStory = DEFAULT_MODEL_LEVEL_STORY,
): value is LlmLevel {
  return typeof value === "string" && Object.hasOwn(story.modelIds, value);
}

export function modelIdForLevel(
  level: LlmLevel,
  story: ModelLevelStory = DEFAULT_MODEL_LEVEL_STORY,
): string {
  return story.modelIds[level];
}

export function modelCacheKeyForLevel(
  level: LlmLevel,
  story: ModelLevelStory = DEFAULT_MODEL_LEVEL_STORY,
): string {
  return story.cacheKeys[level];
}

export function modelLevelForUseCase(
  useCase: ModelLevelUseCase,
  story: ModelLevelStory = DEFAULT_MODEL_LEVEL_STORY,
): LlmLevel {
  return story.useCaseDefaults[useCase];
}
