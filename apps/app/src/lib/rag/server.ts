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

/** Retrieve from the dossier and answer in prose, grounded with cited ids. */
export async function answer(query: string, k = 6, missionId?: string): Promise<GroundedAnswer> {
  const embed = await loadEmbed();
  const rawHits: RagHit[] = await ragQuery(RAG_WORKSPACE, embed, query, missionId ? Math.max(k * 3, 12) : k);
  const hits = rawHits.filter((hit) => missionMatchesMeta(hit.meta, missionId)).slice(0, k);

  if (hits.length === 0) {
    return { answer: "Sin datos en el expediente.", sources: [] };
  }

  const context = hits
    .map((h, i) => `[${i + 1}] (id=${h.id}) ${h.text}`)
    .join("\n\n");

  const llm = await loadLLM("media");
  const prompt = [
    {
      role: "system" as const,
      content:
        "Responde ÚNICAMENTE con la información de los extractos del expediente proporcionados. " +
        "Cita los ids de los registros entre corchetes, p. ej. [id=...]. " +
        "Si la respuesta no está en los extractos, di exactamente: 'Sin datos en el expediente.' " +
        "No inventes. /no_think",
    },
    { role: "user" as const, content: `Pregunta: ${query}\n\nExtractos:\n${context}` },
  ];

  const text = await completeText({ modelId: llm, history: prompt, stream: true });
  return {
    answer: text.trim(),
    sources: hits.map((h) => ({ id: h.id, score: h.score })),
  };
}
