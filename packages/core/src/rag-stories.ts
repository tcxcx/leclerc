import type { Locale } from "./intel";

export interface RagAnswerCopy {
  emptyAnswer: string;
  groundingInstruction: string;
  citationInstruction: string;
  missingAnswerInstruction: string;
  noInventInstruction: string;
  questionLabel: string;
  excerptsLabel: string;
}

export interface RagStory {
  id: string;
  query: {
    defaultAnswerK: number;
    defaultSearchK: number;
  };
  answerCopy: Record<Locale, RagAnswerCopy>;
}

export const DEFAULT_RAG_STORY: RagStory = {
  id: "grounded-dossier-rag",
  query: {
    defaultAnswerK: 6,
    defaultSearchK: 4,
  },
  answerCopy: {
    en: {
      emptyAnswer: "No data in the dossier.",
      groundingInstruction: "Answer ONLY with information from the provided dossier excerpts. Respond in English.",
      citationInstruction: "Cite record ids in brackets, e.g. [id=...].",
      missingAnswerInstruction: "If the answer is not in the excerpts, say exactly:",
      noInventInstruction: "Do not invent. /no_think",
      questionLabel: "Question",
      excerptsLabel: "Excerpts",
    },
    es: {
      emptyAnswer: "Sin datos en el expediente.",
      groundingInstruction:
        "Responde UNICAMENTE con la informacion de los extractos del expediente proporcionados. Responde en espanol.",
      citationInstruction: "Cita ids de registros entre corchetes, p. ej. [id=...].",
      missingAnswerInstruction: "Si la respuesta no esta en los extractos, di exactamente:",
      noInventInstruction: "No inventes. /no_think",
      questionLabel: "Pregunta",
      excerptsLabel: "Extractos",
    },
  },
};

export function ragAnswerCopy(locale: Locale, story: RagStory = DEFAULT_RAG_STORY): RagAnswerCopy {
  return story.answerCopy[locale];
}

export function ragDefaultAnswerLimit(story: RagStory = DEFAULT_RAG_STORY): number {
  return story.query.defaultAnswerK;
}

export function ragDefaultSearchLimit(story: RagStory = DEFAULT_RAG_STORY): number {
  return story.query.defaultSearchK;
}

export function ragSystemPrompt(locale: Locale, story: RagStory = DEFAULT_RAG_STORY): string {
  const copy = ragAnswerCopy(locale, story);
  return [
    copy.groundingInstruction,
    copy.citationInstruction,
    `${copy.missingAnswerInstruction} '${copy.emptyAnswer}'`,
    copy.noInventInstruction,
  ].join(" ");
}

export function ragUserPrompt(
  locale: Locale,
  input: { query: string; context: string },
  story: RagStory = DEFAULT_RAG_STORY,
): string {
  const copy = ragAnswerCopy(locale, story);
  return `${copy.questionLabel}: ${input.query}\n\n${copy.excerptsLabel}:\n${input.context}`;
}
