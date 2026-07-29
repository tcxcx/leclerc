export type AnimatedBackgroundColorTuple = readonly [string, string, string, string];
export type AnimatedBackgroundRuntimeMode = "mac" | "default";

const ANIMATED_BACKGROUND_PRESETS = {
  default: ["#225ee1", "#28d7bf", "#ac53cf", "#e7a39c"],
  spy: ["#090d12", "#15222b", "#283a44", "#3f2c1d"],
  ignyte: ["#08090b", "#141b22", "#2a3a40", "#5a5012"],
  spyDusk: ["#0b0e13", "#1b2630", "#33414a", "#5a3b22"],
  bufi: ["#6954CF", "#8B7DD8", "#A78BFA", "#D8C2FF"],
  vibrant: ["#A78BFA", "#6954CF", "#C4B5FD", "#8B7DD8"],
  subtle: ["#EDE9FE", "#D8C2FF", "#8B7DD8", "#F3E8FF"],
  dark: ["#4C3D99", "#5B4BA8", "#7C6BBF", "#6954CF"],
  celebration: ["#A78BFA", "#F472B6", "#60A5FA", "#34D399"],
  premium: ["#8B5CF6", "#6366F1", "#A855F7", "#7C3AED"],
  pink: ["#E879F9", "#F0ABFC", "#D8C2FF", "#D946EF"],
} as const satisfies Record<string, AnimatedBackgroundColorTuple>;

export type AnimatedBackgroundPresetId = keyof typeof ANIMATED_BACKGROUND_PRESETS;

export interface AnimatedBackgroundRuntimeProfile {
  resolutionScale: number;
  targetFps: number;
  frameIntervalMs: number;
  timeScale: number;
  resizeCheckIntervalMs: number;
  maxCanvasPixels: number;
}

export interface AnimatedBackgroundStory {
  id: string;
  defaultPreset: AnimatedBackgroundPresetId;
  fallbackPreset: AnimatedBackgroundPresetId;
  gradient: {
    angleDeg: number;
    stops: readonly [number, number, number, number];
  };
  presets: Record<AnimatedBackgroundPresetId, AnimatedBackgroundColorTuple>;
  runtime: {
    resolutionScale: Record<AnimatedBackgroundRuntimeMode, number>;
    targetFps: Record<AnimatedBackgroundRuntimeMode, number>;
    timeScale: number;
    resizeCheckIntervalMs: number;
    maxCanvasPixels: number;
  };
}

export const DEFAULT_ANIMATED_BACKGROUND_STORY = {
  id: "cleo-animated-background",
  defaultPreset: "ignyte",
  fallbackPreset: "default",
  gradient: {
    angleDeg: 135,
    stops: [0, 35, 65, 100],
  },
  presets: ANIMATED_BACKGROUND_PRESETS,
  runtime: {
    resolutionScale: {
      mac: 0.4,
      default: 0.3,
    },
    targetFps: {
      mac: 24,
      default: 20,
    },
    timeScale: 1 / 260,
    resizeCheckIntervalMs: 250,
    maxCanvasPixels: 480 * 270,
  },
} as const satisfies AnimatedBackgroundStory;

export function animatedBackgroundDefaultPreset(
  story: AnimatedBackgroundStory = DEFAULT_ANIMATED_BACKGROUND_STORY,
): AnimatedBackgroundPresetId {
  return story.defaultPreset;
}

export function animatedBackgroundPresetIds(
  story: AnimatedBackgroundStory = DEFAULT_ANIMATED_BACKGROUND_STORY,
): AnimatedBackgroundPresetId[] {
  return Object.keys(story.presets) as AnimatedBackgroundPresetId[];
}

export function animatedBackgroundColors(
  preset: string | null | undefined,
  story: AnimatedBackgroundStory = DEFAULT_ANIMATED_BACKGROUND_STORY,
): AnimatedBackgroundColorTuple {
  const hasPreset = Boolean(preset && Object.hasOwn(story.presets, preset));
  const presetId = hasPreset ? (preset as AnimatedBackgroundPresetId) : story.fallbackPreset;
  return story.presets[presetId];
}

export function animatedBackgroundCssGradient(
  colors: AnimatedBackgroundColorTuple,
  story: AnimatedBackgroundStory = DEFAULT_ANIMATED_BACKGROUND_STORY,
): string {
  const { angleDeg, stops } = story.gradient;
  const colorStops = colors.map((color, index) => `${color} ${stops[index]}%`);
  return `linear-gradient(${angleDeg}deg, ${colorStops.join(", ")})`;
}

export function animatedBackgroundRuntime(
  isMac: boolean,
  story: AnimatedBackgroundStory = DEFAULT_ANIMATED_BACKGROUND_STORY,
): AnimatedBackgroundRuntimeProfile {
  const mode: AnimatedBackgroundRuntimeMode = isMac ? "mac" : "default";
  const targetFps = story.runtime.targetFps[mode];

  return {
    resolutionScale: story.runtime.resolutionScale[mode],
    targetFps,
    frameIntervalMs: 1000 / targetFps,
    timeScale: story.runtime.timeScale,
    resizeCheckIntervalMs: story.runtime.resizeCheckIntervalMs,
    maxCanvasPixels: story.runtime.maxCanvasPixels,
  };
}
