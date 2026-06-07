/**
 * QVAC runtime smoke test — proves embed + RAG round-trip runs in-process.
 * Run: bun run scripts/qvac-smoke.mjs   (downloads the ~328MB embedding model
 * on first run). Validates the shapes wired in packages/qvacs + lib/qvac/server.
 */
import {
  loadModel,
  unloadModel,
  embed,
  ragSaveEmbeddings,
  ragSearch,
  ragCloseWorkspace,
  EMBEDDINGGEMMA_300M_Q8_0,
} from "@qvac/sdk";
import { ragIngestDocs, ragQuery } from "./src/index.ts";

const log = (...a) => console.log("[smoke]", ...a);

try {
  log("loading embedding model (EmbeddingGemma-300M)…");
  const modelId = await loadModel({
    modelSrc: EMBEDDINGGEMMA_300M_Q8_0,
    modelType: "llamacpp-embedding",
    onProgress: (p) => p?.percentage != null && log(`  ${p.percentage.toFixed(0)}%`),
  });
  log("loaded modelId =", modelId);

  const workspace = "smoke-dossier";
  const docs = [
    { id: "rec-1", text: "El sujeto Halcón fue visto en el puerto el martes con dos contactos." },
    { id: "rec-2", text: "Entrega de paquete cerca del mercado central; vehículo gris sin matrícula." },
    { id: "rec-3", text: "Reunión nocturna en el almacén 7; presencia de seguridad armada." },
  ];

  log("embedding", docs.length, "docs…");
  const { embedding } = await embed({ modelId, text: docs.map((d) => d.text) });
  log("embedding dims =", embedding[0].length);

  log("saving embeddings…");
  await ragSaveEmbeddings({
    workspace,
    documents: docs.map((d, i) => ({
      id: d.id,
      content: d.text,
      embedding: embedding[i],
      embeddingModelId: modelId,
    })),
  });

  log('searching "¿dónde se vio a Halcón?"…');
  const results = await ragSearch({ workspace, modelId, query: "¿dónde se vio a Halcón?", topK: 2 });
  for (const r of results) log(`  hit id=${r.id} score=${r.score?.toFixed?.(3)} :: ${r.content.slice(0, 60)}`);

  const scopedWorkspace = "smoke-mission-dossier";
  await ragIngestDocs(scopedWorkspace, modelId, [
    {
      id: "raven-funding",
      text: "Raven handler moved funds through the south pier escrow.",
      meta: { missionIds: ["raven"] },
    },
    {
      id: "glasshouse-funding",
      text: "Glasshouse handler moved funds through the warehouse escrow.",
      meta: { missionIds: ["glasshouse"] },
    },
  ]);
  const scoped = await ragQuery(scopedWorkspace, modelId, "handler moved funds escrow", 4);
  const ravenOnly = scoped.filter((hit) => {
    const ids = hit.meta?.missionIds;
    return Array.isArray(ids) && ids.map(String).includes("raven");
  });
  if (ravenOnly.length !== 1 || ravenOnly[0].id !== "raven-funding") {
    throw new Error(`mission RAG filter failed: ${JSON.stringify(scoped)}`);
  }
  log("mission metadata filter OK");

  await ragCloseWorkspace({ workspace, deleteOnClose: true });
  await ragCloseWorkspace({ workspace: scopedWorkspace, deleteOnClose: true });
  await unloadModel({ modelId });
  log("✅ embed + RAG round-trip OK");
  process.exit(0);
} catch (err) {
  console.error("[smoke] ❌", err);
  process.exit(1);
}
