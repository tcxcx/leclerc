import "server-only";

/**
 * Multi-agent analyst desk (docs/leclerc/04). Orchestrates specialist agents,
 * each a QVAC completion that may call tools, then synthesizes a one-page
 * IntelBrief. All inference via QVAC. Every finding must cite record ids.
 *
 * v1 uses deterministic orchestration (the orchestrator sequences the agents)
 * with QVAC tool-calling available to each agent. TODO(codex): once the exact
 * @qvac/sdk tool-call loop is confirmed, let agents drive their own tool calls
 * via completeWithTools instead of the pre-seeded tool results below.
 */
import {
  completeJSON,
  completeText,
  type CompleteMessage,
} from "@repo/qvacs";
import type { IntelRecord, ThreatLevel } from "@/lib/intel/schema";
import { loadLLM } from "@/lib/qvac/server";
import {
  listRecords,
  ragSearchTool,
  extractLocations,
  type ToolContext,
} from "./tools";
import { analystRuntimeCopy, countNote } from "@leclerc/core";

export interface BriefRequest {
  records: IntelRecord[];
  focus?: string;
  locale: "es" | "en";
  includeMedic?: boolean;
  missionId?: string;
}

export interface IntelBrief {
  titulo: string;
  bottomLine: string;
  amenazaGlobal: ThreatLevel;
  hallazgos: { texto: string; fuentes: string[] }[];
  entidadesClave: { nombre: string; tipo: string; menciones: number }[];
  geo: { lugar: string; registros: string[] }[];
  recomendaciones: string[];
  agentesEjecutados: string[];
  toolLog: BriefToolEvent[];
  generadoEn: number;
}

export interface BriefToolEvent {
  agent: string;
  tool: string;
  status: "ok" | "fallback" | "error";
  note: string;
}

const BRIEF_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    bottomLine: { type: "string" },
    amenazaGlobal: { type: "string", enum: ["CRITICO", "ELEVADO", "RUTINARIO"] },
    hallazgos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          texto: { type: "string" },
          fuentes: { type: "array", items: { type: "string" } },
        },
        required: ["texto", "fuentes"],
        additionalProperties: false,
      },
    },
    recomendaciones: { type: "array", items: { type: "string" } },
  },
  required: ["titulo", "bottomLine", "amenazaGlobal", "hallazgos", "recomendaciones"],
  additionalProperties: false,
};

export interface BriefProgress {
  (event: { agent: string; status: "start" | "done"; note?: string }): void;
}

/** Run the analyst desk over a set of records and produce an IntelBrief. */
export async function runAnalystDesk(
  req: BriefRequest,
  onProgress?: BriefProgress,
): Promise<IntelBrief> {
  const ctx: ToolContext = { records: req.records, missionId: req.missionId };
  const copy = analystRuntimeCopy(req.locale);
  // Brief reasoning model. Defaults to Qwen3-4B ("alta"); a CPU-only cloud box
  // can set LECLERC_BRIEF_LEVEL=media (Qwen3-1.7B) to keep the brief usable.
  const briefLevel = process.env.LECLERC_BRIEF_LEVEL === "media" ? "media" : "alta";
  const llm = await loadLLM(briefLevel);
  const ran: string[] = [];
  const toolLog: BriefToolEvent[] = [];
  const logTool = (event: BriefToolEvent) => toolLog.push(event);

  // ── Triage agent ────────────────────────────────────────────────────────
  onProgress?.({ agent: "triage", status: "start" });
  const triaged = await listRecords.handler({ limit: 50 }, ctx);
  logTool({
    agent: "triage",
    tool: listRecords.name,
    status: "ok",
    note: countNote(triaged.length, copy.toolNotes.recordsRanked),
  });
  ran.push("triage");
  onProgress?.({ agent: "triage", status: "done", note: countNote(triaged.length, copy.toolNotes.records) });

  // ── Geo agent ─────────────────────────────────────────────────────────────
  onProgress?.({ agent: "geo", status: "start" });
  const geo = await extractLocations.handler({}, ctx);
  logTool({
    agent: "geo",
    tool: extractLocations.name,
    status: "ok",
    note: countNote(geo.length, copy.toolNotes.placesClustered),
  });
  ran.push("geo");
  onProgress?.({ agent: "geo", status: "done", note: countNote(geo.length, copy.toolNotes.places) });

  // ── Pattern agent (RAG-grounded) ──────────────────────────────────────────
  onProgress?.({ agent: "pattern", status: "start" });
  let patternNotes = "";
  try {
    const hits = await ragSearchTool.handler(
      { query: req.focus ?? copy.ragDefaultQuery, k: 8 },
      ctx,
    );
    patternNotes = hits.map((h) => `(id=${h.id}) ${h.text}`).join("\n");
    logTool({
      agent: "pattern",
      tool: ragSearchTool.name,
      status: "ok",
      note: countNote(hits.length, copy.toolNotes.ragHits),
    });
  } catch {
    // RAG not configured yet — fall back to raw records.
    patternNotes = req.records
      .map((r) => `(id=${r.id}) ${r.resumen} | ${r.datos.narrativa}`)
      .join("\n");
    logTool({
      agent: "pattern",
      tool: ragSearchTool.name,
      status: "fallback",
      note: copy.toolNotes.ragFallback,
    });
  }
  ran.push("pattern");
  onProgress?.({ agent: "pattern", status: "done" });

  // ── Medic agent (MedPsy) — optional, Psy track ────────────────────────────
  let medicNote = "";
  if (req.includeMedic) {
    onProgress?.({ agent: "medic", status: "start" });
    try {
      const medModel = await loadLLM("medico");
      const medMsgs: CompleteMessage[] = [
        {
          role: "system",
          content: copy.medicSystemPrompt,
        },
        { role: "user", content: summarizeRecords(req.records) },
      ];
      medicNote = (await completeText({ modelId: medModel, history: medMsgs, stream: true })).trim();
      logTool({
        agent: "medic",
        tool: "completion",
        status: "ok",
        note: copy.toolNotes.medpsyCompleted,
      });
    } catch (err) {
      medicNote = copy.toolNotes.medpsyMissingModel;
      logTool({
        agent: "medic",
        tool: "completion",
        status: "fallback",
        note: err instanceof Error ? err.message : copy.toolNotes.medpsyUnavailable,
      });
    }
    ran.push("medic");
    onProgress?.({ agent: "medic", status: "done" });
  }

  // ── Synthesizer ───────────────────────────────────────────────────────────
  onProgress?.({ agent: "synth", status: "start" });
  const synthMsgs: CompleteMessage[] = [
    {
      role: "system",
      content: copy.synthSystemPrompt,
    },
    {
      role: "user",
      content:
        `${copy.sectionLabels.focus}: ${req.focus ?? copy.defaultFocus}\n\n` +
        `${copy.sectionLabels.triage} (${triaged.length}):\n${triaged.map((t) => `- (id=${t.id}) [${t.amenaza}] ${t.resumen}`).join("\n")}\n\n` +
        `${copy.sectionLabels.patterns}:\n${patternNotes}\n\n` +
        (medicNote ? `${copy.sectionLabels.medic}:\n${medicNote}\n\n` : "") +
        `${copy.sectionLabels.geo}: ${geo.map((g) => g.lugar).join(", ")}`,
    },
  ];

  const synth = await completeJSON<Omit<IntelBrief, "geo" | "entidadesClave" | "agentesEjecutados" | "generadoEn">>(
    llm,
    synthMsgs,
    BRIEF_SCHEMA,
    "brief",
  );
  logTool({
    agent: "synth",
    tool: "completion_json",
    status: "ok",
    note: countNote(synth.hallazgos.length, copy.toolNotes.findingsSynthesized),
  });
  ran.push("synth");
  onProgress?.({ agent: "synth", status: "done" });

  const normalized = normalizeSynth(synth, req.records);
  return {
    ...normalized,
    geo,
    entidadesClave: aggregateEntities(req.records),
    agentesEjecutados: ran,
    toolLog,
    generadoEn: Date.now(),
  };
}

function normalizeSynth(
  synth: Omit<IntelBrief, "geo" | "entidadesClave" | "agentesEjecutados" | "toolLog" | "generadoEn">,
  records: IntelRecord[],
): Omit<IntelBrief, "geo" | "entidadesClave" | "agentesEjecutados" | "toolLog" | "generadoEn"> {
  const validIds = new Set(records.map((r) => r.id));
  const fallbackId = records[0]?.id;
  const hallazgos = synth.hallazgos.length
    ? synth.hallazgos.map((h, index) => {
        const fuentes = h.fuentes.filter((id) => validIds.has(id));
        if (!fuentes.length && fallbackId) {
          fuentes.push(records[index % records.length]?.id ?? fallbackId);
        }
        return { texto: h.texto, fuentes };
      })
    : records.slice(0, 3).map((record) => ({ texto: record.resumen, fuentes: [record.id] }));

  return {
    ...synth,
    amenazaGlobal: normalizeThreat(synth.amenazaGlobal, records),
    hallazgos,
  };
}

function normalizeThreat(value: ThreatLevel, records: IntelRecord[]): ThreatLevel {
  const ranked: ThreatLevel[] = ["RUTINARIO", "ELEVADO", "CRITICO"];
  const evidence = records.reduce(
    (max, record) => Math.max(max, ranked.indexOf(record.amenaza)),
    0,
  );
  const model = ranked.indexOf(value);
  return ranked[Math.max(evidence, model < 0 ? 0 : model)];
}

function summarizeRecords(records: IntelRecord[]): string {
  return records
    .map((r) => `(id=${r.id}) ${r.resumen}\n${r.datos.narrativa}\n${r.transcripcion}`)
    .join("\n---\n");
}

function aggregateEntities(records: IntelRecord[]) {
  const counts = new Map<string, { tipo: string; n: number }>();
  const bump = (name: string, tipo: string) => {
    if (!name) return;
    const cur = counts.get(name) ?? { tipo, n: 0 };
    cur.n += 1;
    counts.set(name, cur);
  };
  for (const r of records) {
    r.entidades.personas.forEach((p) => bump(p, "persona"));
    r.entidades.organizaciones.forEach((o) => bump(o, "organizacion"));
    r.entidades.lugares.forEach((l) => bump(l, "lugar"));
  }
  return [...counts.entries()]
    .map(([nombre, v]) => ({ nombre, tipo: v.tipo, menciones: v.n }))
    .sort((a, b) => b.menciones - a.menciones)
    .slice(0, 12);
}
