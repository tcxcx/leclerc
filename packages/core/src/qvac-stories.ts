export type QvacModelSourceKey = "medpsy" | "ocr" | "translate";
export type QvacRuntimeEnvKey =
  | "localUrl"
  | "localKey"
  | "remoteAsrModel"
  | "remoteLlmModel"
  | "asrLanguage"
  | "ragWorkspace"
  | "embedSource"
  | "translateModelType";
export type QvacTranslateModelKind = "llm" | "nmt";

export interface QvacModelSourceCopy {
  envVar: string;
  feature: string;
  missingMessage: string;
}

export interface QvacClientErrorCopy {
  transcriptionTemplate: string;
  chatCompletionTemplate: string;
  invalidJsonTemplate: string;
}

export interface QvacRuntimeConfig {
  envVars: Record<QvacRuntimeEnvKey, string>;
  defaults: {
    localUrl: string;
    remoteAsrModel: string;
    remoteLlmModel: string;
    asrLanguage: string;
    ragWorkspace: string;
    translateTargetLocale: string;
    translateModelKind: QvacTranslateModelKind;
  };
  proxyBase: string;
  probeTimeoutMs: number;
  transcriptionFilename: string;
}

export interface QvacStory {
  id: string;
  modelSources: Record<QvacModelSourceKey, QvacModelSourceCopy>;
  runtime: QvacRuntimeConfig;
  clientErrors: QvacClientErrorCopy;
  responsePreviewChars: number;
}

export const DEFAULT_QVAC_STORY: QvacStory = {
  id: "offline-qvac-runtime",
  modelSources: {
    medpsy: {
      envVar: "LECLERC_MEDPSY_SRC",
      feature: "MedPsy medic mode",
      missingMessage: "LECLERC_MEDPSY_SRC not set (MedPsy medic mode).",
    },
    ocr: {
      envVar: "LECLERC_OCR_SRC",
      feature: "document-intel feature",
      missingMessage: "LECLERC_OCR_SRC not set (document-intel feature).",
    },
    translate: {
      envVar: "LECLERC_TRANSLATE_SRC",
      feature: "translate feature",
      missingMessage: "LECLERC_TRANSLATE_SRC not set (translate feature).",
    },
  },
  runtime: {
    envVars: {
      localUrl: "NEXT_PUBLIC_QVAC_LOCAL_URL",
      localKey: "NEXT_PUBLIC_QVAC_LOCAL_KEY",
      remoteAsrModel: "NEXT_PUBLIC_QVAC_ASR_MODEL",
      remoteLlmModel: "NEXT_PUBLIC_QVAC_REMOTE_LLM",
      asrLanguage: "NEXT_PUBLIC_QVAC_ASR_LANG",
      ragWorkspace: "LECLERC_RAG_WORKSPACE",
      embedSource: "LECLERC_EMBED_SRC",
      translateModelType: "LECLERC_TRANSLATE_MODEL_TYPE",
    },
    defaults: {
      localUrl: "http://localhost:11434",
      remoteAsrModel: "whisper-base",
      remoteLlmModel: "llama-1b",
      asrLanguage: "es",
      ragWorkspace: "dossier",
      translateTargetLocale: "es",
      translateModelKind: "nmt",
    },
    proxyBase: "/api/qvac",
    probeTimeoutMs: 1_500,
    transcriptionFilename: "registro.wav",
  },
  clientErrors: {
    transcriptionTemplate: "transcriptions {status}: {body}",
    chatCompletionTemplate: "chat/completions {status}: {body}",
    invalidJsonTemplate: "LLM did not return JSON: {content}",
  },
  responsePreviewChars: 300,
};

export function qvacMissingModelSourceMessage(
  source: QvacModelSourceKey,
  story: QvacStory = DEFAULT_QVAC_STORY,
): string {
  return story.modelSources[source].missingMessage;
}

export function qvacRuntimeEnvVar(
  key: QvacRuntimeEnvKey,
  story: QvacStory = DEFAULT_QVAC_STORY,
): string {
  return story.runtime.envVars[key];
}

export function qvacClientLocalUrlDefault(story: QvacStory = DEFAULT_QVAC_STORY): string {
  return story.runtime.defaults.localUrl;
}

export function qvacClientProxyBase(story: QvacStory = DEFAULT_QVAC_STORY): string {
  return story.runtime.proxyBase;
}

export function qvacClientProbeTimeoutMs(story: QvacStory = DEFAULT_QVAC_STORY): number {
  return story.runtime.probeTimeoutMs;
}

export function qvacRemoteAsrModelDefault(story: QvacStory = DEFAULT_QVAC_STORY): string {
  return story.runtime.defaults.remoteAsrModel;
}

export function qvacRemoteLlmModelDefault(story: QvacStory = DEFAULT_QVAC_STORY): string {
  return story.runtime.defaults.remoteLlmModel;
}

export function qvacAsrLanguageDefault(story: QvacStory = DEFAULT_QVAC_STORY): string {
  return story.runtime.defaults.asrLanguage;
}

export function qvacDefaultRagWorkspace(story: QvacStory = DEFAULT_QVAC_STORY): string {
  return story.runtime.defaults.ragWorkspace;
}

export function qvacDefaultTranslateTargetLocale(story: QvacStory = DEFAULT_QVAC_STORY): string {
  return story.runtime.defaults.translateTargetLocale;
}

export function qvacDefaultTranscriptionFilename(story: QvacStory = DEFAULT_QVAC_STORY): string {
  return story.runtime.transcriptionFilename;
}

export function qvacTranslateModelKind(
  value: unknown,
  story: QvacStory = DEFAULT_QVAC_STORY,
): QvacTranslateModelKind {
  return value === "llm" ? "llm" : story.runtime.defaults.translateModelKind;
}

export function qvacTranscriptionError(
  status: number,
  body: string,
  story: QvacStory = DEFAULT_QVAC_STORY,
): string {
  return renderQvacTemplate(story.clientErrors.transcriptionTemplate, {
    status,
    body: trimQvacPreview(body, story.responsePreviewChars),
  });
}

export function qvacChatCompletionError(
  status: number,
  body: string,
  story: QvacStory = DEFAULT_QVAC_STORY,
): string {
  return renderQvacTemplate(story.clientErrors.chatCompletionTemplate, {
    status,
    body: trimQvacPreview(body, story.responsePreviewChars),
  });
}

export function qvacInvalidJsonMessage(
  content: string,
  story: QvacStory = DEFAULT_QVAC_STORY,
): string {
  return renderQvacTemplate(story.clientErrors.invalidJsonTemplate, {
    content: trimQvacPreview(content, 200),
  });
}

function trimQvacPreview(value: string, chars: number): string {
  return value.slice(0, chars);
}

function renderQvacTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
