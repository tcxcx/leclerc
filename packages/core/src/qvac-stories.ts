export type QvacModelSourceKey = "medpsy" | "ocr" | "translate";

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

export interface QvacStory {
  id: string;
  modelSources: Record<QvacModelSourceKey, QvacModelSourceCopy>;
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
