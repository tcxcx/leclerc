# 04 · Multi-Agent Analyst Desk & Tool Calling

> This is the heaviest-weighted scoring criterion ("multi-agent workflows with orchestration and tool calling"). It runs entirely on QVAC `completion` with Zod tool schemas — no external LLM.

## 1. Concept

The **analyst desk** turns a set of dossier records into a one-page **intel brief**. An **orchestrator** dispatches specialist agents, each of which can call **tools** (functions). Agents are QVAC `completion` runs bound to a tool set; the orchestrator sequences them and synthesizes.

```
Orchestrator (QVAC completion, planner)
  ├─ Triage agent     → tool: list_records, get_record           → ranks by threat/recency
  ├─ Dedup agent      → tool: rag_search                         → flags same subject across records
  ├─ Geo agent        → tool: rag_search, extract_locations      → clusters by place
  ├─ Pattern agent    → tool: rag_search, get_record             → links entities/timelines
  └─ Medic agent*     → MedPsy model                             → health/casualty assessment (Psy track)
            │
            ▼
  Synthesizer (QVAC completion) → IntelBrief → DOCX/PDF + optional TTS readout + dead-drop
```
\*Medic agent is the Psy-track hook; include when records contain medical content.

## 2. Tool registry (`apps/app/src/lib/agents/tools.ts`)

Single source of truth. Each tool = `{ name, description, schema (Zod), handler }`. QVAC `completion` supports **structured tool calling with Zod schemas** directly — pass the Zod schema; parse `final.toolCalls`.

```ts
import { z } from "zod";

export const tools = {
  list_records: {
    description: "List dossier records, newest first, optionally filtered by threat level.",
    schema: z.object({ amenaza: z.enum(["CRITICO","ELEVADO","RUTINARIO"]).optional(), limit: z.number().default(20) }),
    handler: async (a) => /* store-client.listRecords + filter */,
  },
  get_record: {
    description: "Fetch one dossier record by id.",
    schema: z.object({ id: z.string() }),
    handler: async (a) => /* store-client.getRecord */,
  },
  rag_search: {
    description: "Semantic search across the dossier. Returns excerpts + record ids.",
    schema: z.object({ query: z.string(), k: z.number().default(6) }),
    handler: async (a) => /* ragQuery */,
  },
  extract_locations: {
    description: "Return geo entities mentioned across matching records.",
    schema: z.object({ query: z.string().optional() }),
    handler: async (a) => /* aggregate datos.ubicacion + entidades.lugares */,
  },
  // wallet + p2p tools are registered but gated (require explicit operator confirm):
  pay_asset:   { /* see 06 — requires confirmation */ },
  dead_drop:   { /* see 05 — requires confirmation */ },
} as const;
```

**Safety gate (prompt-injection / autonomy):** read-only tools (`list_*`, `get_*`, `rag_*`, `extract_*`) run freely. **Side-effecting tools** (`pay_asset`, `dead_drop`, `delete_record`, `wipe`) require an explicit human confirmation step in the UI before the handler executes — the model can *propose* them, never auto-execute. Mirror sendero's scoped-key pattern ([09](./09-reuse-map.md)).

## 3. Orchestrator (`apps/app/src/lib/agents/orchestrator.ts`)

```ts
interface BriefRequest { focus?: string; recordIds?: string[]; locale: "en"|"es"; includeMedic?: boolean; }
interface IntelBrief {
  titulo: string;
  bottomLine: string;                 // BLUF — bottom line up front
  amenazaGlobal: ThreatLevel;
  hallazgos: { texto: string; fuentes: string[] }[];   // findings w/ cited record ids
  entidadesClave: { nombre: string; tipo: string; menciones: number }[];
  geo: { lugar: string; registros: string[] }[];
  recomendaciones: string[];
  generadoEn: number;
}

export async function runAnalystDesk(req: BriefRequest): Promise<IntelBrief>;
```

Execution:
1. **Plan.** Orchestrator `completion` decides which agents to run for this `focus`.
2. **Fan-out.** Run agents (sequential is fine for v1; each is a `completeWithTools` call). Collect structured partials.
3. **Synthesize.** Final `completion` with a strict JSON schema → `IntelBrief`. System prompt: *cite record ids for every finding; never invent; if thin, say so.*
4. **Render.** `IntelBrief` → DOCX/PDF via existing `apps/app/src/lib/reports/export/*` (re-themed) → optional `textToSpeech` readout → offer dead-drop.

> Keep agent prompts short and in the active locale. Use the "high reasoning" model (`qwen3-4b` / MedPsy-4B) for orchestrator + synthesizer, the fast model for fan-out agents.

## 4. Grounding & honesty rules (baked into every agent prompt)

- Answer **only** from tool results / dossier excerpts. No outside knowledge.
- Every finding cites the `record id(s)` it came from.
- Unknown → explicitly "sin datos / no data", never a guess.
- Side-effecting actions are proposals requiring confirmation.

## 5. Where it runs

`runAnalystDesk` is server-only (calls `@qvac/sdk`). Expose via a Next.js Route Handler (`runtime="nodejs"`) that streams progress (which agent is running) to the UI. On mobile, either run on-device (Bare) or call the station via delegate.

## 6. Acceptance criteria

- [ ] Given ≥3 dossier records, `runAnalystDesk` produces an `IntelBrief` where every `hallazgo` cites real record ids.
- [ ] At least 3 distinct agents run with ≥1 tool call each; tool calls are visible in logs (`artifacts/`).
- [ ] `pay_asset`/`dead_drop` are *proposed* by the model but never execute without UI confirmation.
- [ ] Brief exports to DOCX **and** PDF; optional TTS readout plays.
- [ ] Entire flow runs offline on the station (capture `loggingStream`).
- [ ] MedPsy "medic agent" path demonstrably runs for medical-content records (Psy track evidence).
