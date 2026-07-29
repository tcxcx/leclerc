import {
  EXTRACTION_JSON_SCHEMA,
  SYSTEM_PROMPT,
  buildExtractionUserMessage,
  buildRecord as buildCoreRecord,
  emptyExtraction,
  isMeaningfulText,
  longDate,
  recordToRagText,
  type IntelExtraction,
  type IntelMetadata,
  type IntelRecord,
} from "@leclerc/core";
import { qvacAsrLanguageDefault, qvacRuntimeEnvVar } from "@leclerc/core/qvac-stories";

export { EXTRACTION_JSON_SCHEMA, SYSTEM_PROMPT, emptyExtraction };

export const ASR_LANGUAGE =
  process.env[qvacRuntimeEnvVar("asrLanguage")] ?? qvacAsrLanguageDefault();

export const fechaLarga = longDate;
export const isMeaningful = isMeaningfulText;
export const buildUserMessage = buildExtractionUserMessage;
export const ragText = recordToRagText;

/** Assemble the persisted IntelRecord from the source + LLM extraction. */
export function buildRecord(
  source: string,
  extraction: IntelExtraction,
  metadata: IntelMetadata,
): IntelRecord {
  return buildCoreRecord(source, extraction, metadata, { idFactory: () => crypto.randomUUID() });
}
