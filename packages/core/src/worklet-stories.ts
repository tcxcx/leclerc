export type WorkletRuntimeStatus = "ready" | "not-configured" | "missing-adapter";
export type NativeWorkletRuntimeComponent = "qvac" | "wdk" | "p2p";
export type NativeWorkletEnvVar = "SPARK_NETWORK";

export interface NativeWorkletAdapterMissingStory {
  logMessage: string;
  errorCode: string;
  messageTemplate: string;
}

export interface NativeWorkletStory {
  id: string;
  runtime: {
    statuses: Record<"ready" | "notConfigured" | "missingAdapter", WorkletRuntimeStatus>;
    components: readonly NativeWorkletRuntimeComponent[];
    requiredEnv: readonly NativeWorkletEnvVar[];
  };
  adapterMissing: NativeWorkletAdapterMissingStory;
  station: {
    scaffoldPublicKey: string;
  };
}

export const DEFAULT_NATIVE_WORKLET_STORY: NativeWorkletStory = {
  id: "native-worklet-scaffold",
  runtime: {
    statuses: {
      ready: "ready",
      notConfigured: "not-configured",
      missingAdapter: "missing-adapter",
    },
    components: ["qvac", "wdk", "p2p"],
    requiredEnv: ["SPARK_NETWORK"],
  },
  adapterMissing: {
    logMessage: "native worklet adapter missing",
    errorCode: "NATIVE_ADAPTER_NOT_CONFIGURED",
    messageTemplate:
      "Worklet method {method} is scaffolded but not wired to QVAC, WDK, or Hyperswarm yet.",
  },
  station: {
    scaffoldPublicKey: "native-worklet-scaffold",
  },
};

export function nativeWorkletRuntimeStatus(
  hasAdapter: boolean,
  story: NativeWorkletStory = DEFAULT_NATIVE_WORKLET_STORY,
): WorkletRuntimeStatus {
  return hasAdapter ? story.runtime.statuses.ready : story.runtime.statuses.missingAdapter;
}

export function nativeWorkletRequiredEnv(
  story: NativeWorkletStory = DEFAULT_NATIVE_WORKLET_STORY,
): NativeWorkletEnvVar[] {
  return [...story.runtime.requiredEnv];
}

export function nativeWorkletMissingEnv(
  env: Partial<Record<NativeWorkletEnvVar, string | undefined>>,
  story: NativeWorkletStory = DEFAULT_NATIVE_WORKLET_STORY,
): NativeWorkletEnvVar[] {
  return story.runtime.requiredEnv.filter((key) => !env[key]);
}

export function nativeWorkletAdapterMissingLogMessage(
  story: NativeWorkletStory = DEFAULT_NATIVE_WORKLET_STORY,
): string {
  return story.adapterMissing.logMessage;
}

export function nativeWorkletAdapterMissingErrorCode(
  story: NativeWorkletStory = DEFAULT_NATIVE_WORKLET_STORY,
): string {
  return story.adapterMissing.errorCode;
}

export function nativeWorkletAdapterMissingMessage(
  method: string,
  story: NativeWorkletStory = DEFAULT_NATIVE_WORKLET_STORY,
): string {
  return story.adapterMissing.messageTemplate.replace("{method}", method);
}

export function nativeWorkletStationPublicKey(
  story: NativeWorkletStory = DEFAULT_NATIVE_WORKLET_STORY,
): string {
  return story.station.scaffoldPublicKey;
}
