import type { ChatMessage, Locale } from "./agents";

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

export interface VoiceConfig {
  locale: Locale;
  speak: boolean;
  llmLevel?: "media" | "alta";
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

export const VOICE_PCM_SAMPLE_RATE = 16_000;
export const VOICE_TTS_SAMPLE_RATE = 44_100;
export const VOICE_POST_PLAYBACK_COOLDOWN_MS = 300;
