import type { DropPayload } from "./p2p";

export interface DeadDropDefaults {
  serverLabel: string;
  browserLabel: string;
  payloadKind: DropPayload["kind"];
  topicNamespace: string;
  secretNamespace: string;
  topicHashPreviewLength: number;
  discoveryFlushTimeoutMs: number;
}

export interface P2pStory {
  id: string;
  deadDrop: DeadDropDefaults;
}

export const DEFAULT_P2P_STORY: P2pStory = {
  id: "dead-drop-protocol-defaults",
  deadDrop: {
    serverLabel: "default",
    browserLabel: "browser",
    payloadKind: "brief",
    topicNamespace: "leclerc",
    secretNamespace: "drop",
    topicHashPreviewLength: 12,
    discoveryFlushTimeoutMs: 5_000,
  },
};

export function deadDropServerLabel(story: P2pStory = DEFAULT_P2P_STORY): string {
  return story.deadDrop.serverLabel;
}

export function deadDropBrowserLabel(story: P2pStory = DEFAULT_P2P_STORY): string {
  return story.deadDrop.browserLabel;
}

export function deadDropDefaultPayloadKind(story: P2pStory = DEFAULT_P2P_STORY): DropPayload["kind"] {
  return story.deadDrop.payloadKind;
}

export function deadDropTopicMaterial(passphrase: string, story: P2pStory = DEFAULT_P2P_STORY): string {
  return `${story.deadDrop.topicNamespace}:${passphrase}`;
}

export function deadDropSecretMaterial(secret: string, story: P2pStory = DEFAULT_P2P_STORY): string {
  return `${story.deadDrop.secretNamespace}:${secret}`;
}

export function deadDropTopicHashPreviewLength(story: P2pStory = DEFAULT_P2P_STORY): number {
  return story.deadDrop.topicHashPreviewLength;
}

export function deadDropDiscoveryFlushTimeoutMs(story: P2pStory = DEFAULT_P2P_STORY): number {
  return story.deadDrop.discoveryFlushTimeoutMs;
}
