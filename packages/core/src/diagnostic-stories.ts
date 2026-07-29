export type RecorderDiagnosticKey =
  | "microphoneRequested"
  | "recordingStarted"
  | "emptyRecording"
  | "getUserMediaFailed";

export type AnimatedBackgroundDiagnosticKey = "vertex" | "fragment" | "link";

export interface DiagnosticStory {
  id: string;
  recorder: {
    scope: string;
    messages: Record<RecorderDiagnosticKey, string>;
    audioContextSampleRate: string;
    maxDurationReached: string;
    stopSummary: string;
  };
  voiceClient: {
    scope: string;
    micAudioContextSampleRate: string;
    startFailed: string;
  };
  animatedBackground: {
    scope: string;
    messages: Record<AnimatedBackgroundDiagnosticKey, string>;
  };
}

export const DEFAULT_DIAGNOSTIC_STORY: DiagnosticStory = {
  id: "client-runtime-diagnostics",
  recorder: {
    scope: "[recorder]",
    messages: {
      microphoneRequested: "start(): requesting microphone...",
      recordingStarted: "recording started",
      emptyRecording: "empty recording (no audio captured)",
      getUserMediaFailed: "getUserMedia failed:",
    },
    audioContextSampleRate: "AudioContext sampleRate",
    maxDurationReached: "max duration reached - auto-stopping + sending",
    stopSummary: "stop()",
  },
  voiceClient: {
    scope: "[voice-client]",
    micAudioContextSampleRate: "mic AudioContext sampleRate",
    startFailed: "start failed:",
  },
  animatedBackground: {
    scope: "[AnimatedBackground]",
    messages: {
      vertex: "vertex",
      fragment: "fragment",
      link: "link",
    },
  },
};

function diagnosticLine(scope: string, message: string): string {
  return `${scope} ${message}`;
}

export function recorderDiagnosticMessage(
  key: RecorderDiagnosticKey,
  story: DiagnosticStory = DEFAULT_DIAGNOSTIC_STORY,
): string {
  return diagnosticLine(story.recorder.scope, story.recorder.messages[key]);
}

export function recorderAudioContextSampleRateDiagnostic(
  sampleRate: number,
  story: DiagnosticStory = DEFAULT_DIAGNOSTIC_STORY,
): string {
  return diagnosticLine(story.recorder.scope, `${story.recorder.audioContextSampleRate}=${sampleRate}`);
}

export function recorderMaxDurationReachedDiagnostic(
  maxMs: number,
  story: DiagnosticStory = DEFAULT_DIAGNOSTIC_STORY,
): string {
  return diagnosticLine(story.recorder.scope, `max duration ${maxMs}ms ${story.recorder.maxDurationReached}`);
}

export function recorderStopSummaryDiagnostic(
  input: { durationMs: number; sourceRate: number; samples: number; wavBytes: number },
  story: DiagnosticStory = DEFAULT_DIAGNOSTIC_STORY,
): string {
  const { durationMs, sourceRate, samples, wavBytes } = input;
  return diagnosticLine(
    story.recorder.scope,
    `${story.recorder.stopSummary}: durationMs=${durationMs} sourceRate=${sourceRate} samples=${samples} wavBytes=${wavBytes}`,
  );
}

export function voiceStartFailedDiagnostic(
  story: DiagnosticStory = DEFAULT_DIAGNOSTIC_STORY,
): string {
  return diagnosticLine(story.voiceClient.scope, story.voiceClient.startFailed);
}

export function voiceMicAudioContextSampleRateDiagnostic(
  sampleRate: number,
  story: DiagnosticStory = DEFAULT_DIAGNOSTIC_STORY,
): string {
  return diagnosticLine(story.voiceClient.scope, `${story.voiceClient.micAudioContextSampleRate}=${sampleRate}`);
}

export function animatedBackgroundDiagnostic(
  key: AnimatedBackgroundDiagnosticKey,
  story: DiagnosticStory = DEFAULT_DIAGNOSTIC_STORY,
): string {
  return diagnosticLine(story.animatedBackground.scope, story.animatedBackground.messages[key]);
}
