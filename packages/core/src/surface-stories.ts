import type { LeclercSurface } from "./surfaces";

export type NativeSurfaceId = Extract<LeclercSurface, "desktop" | "mobile">;
export type NativeSurfaceRuntime = "pear-electron" | "expo-bare";
export type NativeSurfaceReadinessState = "scaffold-only" | "installable";

export interface NativeSurfaceArtifactRequirement {
  command: string;
  accepted: readonly string[];
}

export interface NativeSurfaceReadiness {
  surface: NativeSurfaceId;
  runtime: NativeSurfaceRuntime;
  state: NativeSurfaceReadinessState;
  installable: boolean;
  runtimeVended: boolean;
  workletAdapterWired: boolean;
  buildArtifactPresent: boolean;
  artifactRequirement: NativeSurfaceArtifactRequirement;
  blockers: readonly string[];
}

export interface SurfaceStory {
  id: string;
  native: Record<NativeSurfaceId, NativeSurfaceReadiness>;
}

export const DEFAULT_SURFACE_STORY: SurfaceStory = {
  id: "cleo-three-surface-readiness",
  native: {
    desktop: {
      surface: "desktop",
      runtime: "pear-electron",
      state: "scaffold-only",
      installable: false,
      runtimeVended: false,
      workletAdapterWired: false,
      buildArtifactPresent: false,
      artifactRequirement: {
        command: "bun --filter @leclerc/desktop build",
        accepted: ["Electron/Pear app launch proof", "signed .dmg"],
      },
      blockers: [
        "Pear/Electron runtime is not vendored in apps/desktop.",
        "Native worklet adapter is not wired to QVAC, WDK, or Hyperswarm.",
        "Desktop install artifact has not been produced.",
      ],
    },
    mobile: {
      surface: "mobile",
      runtime: "expo-bare",
      state: "scaffold-only",
      installable: false,
      runtimeVended: false,
      workletAdapterWired: false,
      buildArtifactPresent: false,
      artifactRequirement: {
        command: "bun --filter @leclerc/mobile bundle:android",
        accepted: ["signed .apk", "signed .aab", "signed .ipa", "simulator install proof"],
      },
      blockers: [
        "Expo, React Native, react-native-bare-kit, and bare-pack are not vendored in apps/mobile.",
        "Native worklet adapter is not wired to QVAC, WDK, or Hyperswarm.",
        "Mobile install artifact has not been produced.",
      ],
    },
  },
};

export function nativeSurfaceReadiness(
  surface: NativeSurfaceId,
  story: SurfaceStory = DEFAULT_SURFACE_STORY,
): NativeSurfaceReadiness {
  return story.native[surface];
}

export function nativeSurfaceReadinessList(
  story: SurfaceStory = DEFAULT_SURFACE_STORY,
): NativeSurfaceReadiness[] {
  return Object.values(story.native);
}

export function nativeSurfaceInstallable(
  surface: NativeSurfaceId,
  story: SurfaceStory = DEFAULT_SURFACE_STORY,
): boolean {
  return nativeSurfaceReadiness(surface, story).installable;
}

export function nativeSurfaceBlockers(
  surface: NativeSurfaceId,
  story: SurfaceStory = DEFAULT_SURFACE_STORY,
): string[] {
  return [...nativeSurfaceReadiness(surface, story).blockers];
}

export function nativeSurfaceAcceptedArtifacts(
  surface: NativeSurfaceId,
  story: SurfaceStory = DEFAULT_SURFACE_STORY,
): string[] {
  return [...nativeSurfaceReadiness(surface, story).artifactRequirement.accepted];
}
