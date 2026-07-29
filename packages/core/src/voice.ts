import type { ChatMessage, Locale } from "./agents";
import type { LlmLevel } from "./model-level-stories";

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";
export type VoiceStatusIconState = Exclude<VoiceState, "idle"> | "error";

export type VoiceRuntimeEnvVar = "webSocketUrl";

export interface VoiceLoopStory {
  id: string;
  envVars: Record<VoiceRuntimeEnvVar, string>;
  defaults: {
    webSocketUrl: string;
    pcmSampleRate: number;
    ttsSampleRate: number;
    postPlaybackCooldownMs: number;
    pushToTalkMaxDurationMs: number;
    scriptProcessorBufferSize: number;
  };
  icons: Record<VoiceStatusIconState, string>;
  speakToggleIcons: {
    on: string;
    off: string;
  };
}

export const DEFAULT_VOICE_LOOP_STORY: VoiceLoopStory = {
  id: "browser-voice-loop-runtime",
  envVars: {
    webSocketUrl: "NEXT_PUBLIC_VOICE_WS_URL",
  },
  defaults: {
    webSocketUrl: "ws://localhost:7077",
    pcmSampleRate: 16_000,
    ttsSampleRate: 44_100,
    postPlaybackCooldownMs: 300,
    pushToTalkMaxDurationMs: 60_000,
    scriptProcessorBufferSize: 4_096,
  },
  icons: {
    connecting: "sync",
    listening: "hearing",
    thinking: "neurology",
    speaking: "graphic_eq",
    error: "error",
  },
  speakToggleIcons: {
    on: "graphic_eq",
    off: "volume_off",
  },
};

export function voiceRuntimeEnvVar(
  key: VoiceRuntimeEnvVar,
  story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY,
): string {
  return story.envVars[key];
}

export function voiceDefaultWebSocketUrl(story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY): string {
  return story.defaults.webSocketUrl;
}

export function voicePcmSampleRate(story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY): number {
  return story.defaults.pcmSampleRate;
}

export function voiceTtsSampleRate(story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY): number {
  return story.defaults.ttsSampleRate;
}

export function voicePostPlaybackCooldownMs(story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY): number {
  return story.defaults.postPlaybackCooldownMs;
}

export function voicePushToTalkMaxDurationMs(story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY): number {
  return story.defaults.pushToTalkMaxDurationMs;
}

export function voiceScriptProcessorBufferSize(story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY): number {
  return story.defaults.scriptProcessorBufferSize;
}

export function voiceStatusIcon(
  state: VoiceStatusIconState,
  story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY,
): string {
  return story.icons[state];
}

export function voiceSpeakToggleIcon(
  speak: boolean,
  story: VoiceLoopStory = DEFAULT_VOICE_LOOP_STORY,
): string {
  return speak ? story.speakToggleIcons.on : story.speakToggleIcons.off;
}

export interface VoiceConfig {
  locale: Locale;
  speak: boolean;
  llmLevel?: LlmLevel;
}

export type VoiceClientToHostMessage =
  | { type: "config"; speak: boolean; locale: Locale }
  | { type: "speaking"; value: boolean }
  | { type: "audio"; pcm: string };

export type VoiceHostToClientMessage =
  | { type: "transcript"; text: string }
  | { type: "token"; text: string }
  | { type: "answer"; text: string }
  | { type: "audio"; rate: number; pcm: string }
  | { type: "speaking"; value: boolean }
  | { type: "error"; message: string };

export interface VoiceTurnRequest {
  audioPcmBase64: string;
  config: VoiceConfig;
  history: ChatMessage[];
}

export interface VoiceTurnResponse {
  transcript: string;
  answer: string;
  audioPcmBase64?: string;
  sampleRate?: number;
}

export const VOICE_PCM_SAMPLE_RATE = voicePcmSampleRate();
export const VOICE_TTS_SAMPLE_RATE = voiceTtsSampleRate();
export const VOICE_POST_PLAYBACK_COOLDOWN_MS = voicePostPlaybackCooldownMs();
