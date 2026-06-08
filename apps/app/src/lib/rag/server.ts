import "server-only";

/**
 * QVAC-native RAG over the dossier (docs/leclerc/03). Embeddings + vector search
 * use @qvac/sdk rag* (HyperDB workspaces) — no third-party vector store. The
 * grounded answer is a QVAC completion constrained to cite record ids.
 */
import { ragIngestDocs, ragQuery, completeText, type RagHit } from "@repo/qvacs";
import { RAG_WORKSPACE, loadEmbed, loadLLM } from "@/lib/qvac/server";
import { missionMatchesMeta } from "@leclerc/core";

export interface IngestDoc {
  id: string;
  text: string;
  meta?: Record<string, unknown>;
}

export async function ingest(docs: IngestDoc[]): Promise<void> {
  const embed = await loadEmbed();
  await ragIngestDocs(RAG_WORKSPACE, embed, docs);
}

/** Raw top-k dossier hits (for contextual chips under answers). */
export async function search(query: string, k = 4, missionId?: string): Promise<RagHit[]> {
  const embed = await loadEmbed();
  const hits = await ragQuery(RAG_WORKSPACE, embed, query, missionId ? Math.max(k * 3, 12) : k);
  return hits.filter((hit) => missionMatchesMeta(hit.meta, missionId)).slice(0, k);
}

export interface GroundedAnswer {
  answer: string;
  sources: { id: string; score?: number }[];
}

function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAnswer(text: string, emptyAnswer: string): string {
  const stripped = stripThink(text);
  if (stripped === emptyAnswer) return stripped;
  return stripped.replace(new RegExp(`\\s*${escapeRegex(emptyAnswer)}\\s*$`, "i"), "").trim() || emptyAnswer;
}

/** Retrieve from the dossier and answer in prose, grounded with cited ids. */
export async function answer(
  query: string,
  k = 6,
  missionId?: string,
  locale: "es" | "en" = "es",
): Promise<GroundedAnswer> {
  const embed = await loadEmbed();
  const rawHits: RagHit[] = await ragQuery(RAG_WORKSPACE, embed, query, missionId ? Math.max(k * 3, 12) : k);
  const hits = rawHits.filter((hit) => missionMatchesMeta(hit.meta, missionId)).slice(0, k);
  const emptyAnswer = locale === "en" ? "No data in the dossier." : "Sin datos en el expediente.";

  if (hits.length === 0) {
    return { answer: emptyAnswer, sources: [] };
  }

  const context = hits
    .map((h, i) => `[${i + 1}] (id=${h.id}) ${h.text}`)
    .join("\n\n");

  const llm = await loadLLM("media");
  const prompt = [
    {
      role: "system" as const,
      content:
        (locale === "en"
          ? "Answer ONLY with information from the provided dossier excerpts. Respond in English. "
          : "Responde ÚNICAMENTE con la información de los extractos del expediente proporcionados. Responde en español. ") +
        "Cite record ids in brackets, e.g. [id=...]. " +
        `If the answer is not in the excerpts, say exactly: '${emptyAnswer}' ` +
        "No inventes. /no_think",
    },
    { role: "user" as const, content: `Pregunta: ${query}\n\nExtractos:\n${context}` },
  ];

  const text = await completeText({ modelId: llm, history: prompt, stream: true });
  return {
    answer: normalizeAnswer(text, emptyAnswer),
    sources: hits.map((h) => ({ id: h.id, score: h.score })),
  };
}
