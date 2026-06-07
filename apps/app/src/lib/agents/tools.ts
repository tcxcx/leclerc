import "server-only";

import { z } from "zod";
import type { IntelRecord } from "@/lib/intel/schema";
import { ragQuery, type RagHit } from "@repo/qvacs";
import { RAG_WORKSPACE, loadEmbed } from "@/lib/qvac/server";
import { missionMatchesMeta } from "@leclerc/core";

/**
 * Tool registry for the analyst desk (docs/leclerc/04). Single source of truth.
 * Read-only tools run freely; side-effecting tools (pay_asset, dead_drop) are
 * NOT in this registry — they are proposed in the brief and require explicit UI
 * confirmation before execution (see lib/wallet + lib/p2p + UI).
 *
 * The orchestrator receives the relevant records (decrypted by the client and
 * posted to the station, which is trusted compute) plus access to QVAC RAG.
 */

export interface ToolContext {
  records: IntelRecord[];
  missionId?: string;
}

export interface ToolDef<A = unknown, R = unknown> {
  name: string;
  description: string;
  schema: z.ZodType<A>;
  handler: (args: A, ctx: ToolContext) => Promise<R>;
}

export const listRecords: ToolDef<
  { amenaza?: "CRITICO" | "ELEVADO" | "RUTINARIO"; limit?: number },
  { id: string; resumen: string; amenaza: string; createdAt: number }[]
> = {
  name: "list_records",
  description: "List dossier records, newest first, optionally filtered by threat level.",
  schema: z.object({
    amenaza: z.enum(["CRITICO", "ELEVADO", "RUTINARIO"]).optional(),
    limit: z.number().default(20),
  }),
  handler: async (a, ctx) => {
    let rs = [...ctx.records].sort((x, y) => y.createdAt - x.createdAt);
    if (a.amenaza) rs = rs.filter((r) => r.amenaza === a.amenaza);
    return rs.slice(0, a.limit ?? 20).map((r) => ({
      id: r.id,
      resumen: r.resumen,
      amenaza: r.amenaza,
      createdAt: r.createdAt,
    }));
  },
};

export const getRecord: ToolDef<{ id: string }, IntelRecord | null> = {
  name: "get_record",
  description: "Fetch one dossier record by id.",
  schema: z.object({ id: z.string() }),
  handler: async (a, ctx) => ctx.records.find((r) => r.id === a.id) ?? null,
};

export const ragSearchTool: ToolDef<{ query: string; k?: number }, RagHit[]> = {
  name: "rag_search",
  description: "Semantic search across the dossier. Returns excerpts + record ids.",
  schema: z.object({ query: z.string(), k: z.number().default(6) }),
  handler: async (a, ctx) => {
    const embed = await loadEmbed();
    const k = a.k ?? 6;
    const hits = await ragQuery(RAG_WORKSPACE, embed, a.query, ctx.missionId ? Math.max(k * 3, 12) : k);
    return hits.filter((hit) => missionMatchesMeta(hit.meta, ctx.missionId)).slice(0, k);
  },
};

export const extractLocations: ToolDef<
  { query?: string },
  { lugar: string; registros: string[] }[]
> = {
  name: "extract_locations",
  description: "Aggregate geo entities mentioned across records.",
  schema: z.object({ query: z.string().optional() }),
  handler: async (_a, ctx) => {
    const map = new Map<string, Set<string>>();
    for (const r of ctx.records) {
      const places = [...r.entidades.lugares, r.datos.ubicacion.lugar].filter(Boolean);
      for (const p of places) {
        if (!map.has(p)) map.set(p, new Set());
        map.get(p)!.add(r.id);
      }
    }
    return [...map.entries()].map(([lugar, ids]) => ({ lugar, registros: [...ids] }));
  },
};

export const TOOLS: ToolDef[] = [
  listRecords as ToolDef,
  getRecord as ToolDef,
  ragSearchTool as ToolDef,
  extractLocations as ToolDef,
];

/** Tool defs shaped for QVAC completeWithTools (Zod schema passthrough). */
export function qvacToolDefs() {
  return TOOLS.map((t) => ({ name: t.name, description: t.description, schema: t.schema }));
}
