"use client";

import type { InferenceMode } from "./mode";
import type { IntelExtraction } from "@/lib/intel/schema";
import {
  transcribe,
  chatJSON,
  localTarget,
  remoteTarget,
  type ChatMessage,
  type QvacTarget,
} from "@/lib/qvac/client";
import { getStoredLevel, LEVEL_MODEL } from "@/lib/llm-level";

/**
 * Client-side inference routing for the PWA. Everything goes through QVAC:
 *
 *  - "station"  → local `qvac serve` if reachable, else the same-origin
 *                 `/api/qvac` proxy to a paired/remote station.
 *  - "delegate" → POST to `/api/infer/*` Route Handlers (Node) which run
 *                 @qvac/sdk completion({ delegate }) to the station peer.
 *  - "ondevice" → only meaningful in a native (Bare) client; in the browser it
 *                 falls back to "station".
 *
 * There is no non-QVAC path. See docs/leclerc/02.
 */
export type Backend = "station-local" | "station-proxy" | "delegate";

async function targetFor(mode: InferenceMode): Promise<QvacTarget> {
  if (mode === "station" || mode === "ondevice") {
    const local = await localTarget();
    if (local) return local;
  }
  // delegate (browser can't do DHT) and station-without-local both use the proxy
  return remoteTarget();
}

/** LLM id: honor the operator's level locally when present, else the target's. */
function pickLlm(t: QvacTarget): string {
  const want = LEVEL_MODEL[getStoredLevel()];
  return t.where === "local" && t.available.includes(want) ? want : t.llmModel;
}

export async function inferTranscribe(
  mode: InferenceMode,
  blob: Blob,
  opts: { language?: string; filename?: string },
): Promise<string> {
  const t = await targetFor(mode);
  return transcribe(
    blob,
    { model: t.asrModel, language: opts.language, filename: opts.filename },
    t,
  );
}

export async function inferExtract(
  mode: InferenceMode,
  messages: ChatMessage[],
  schema: Record<string, unknown>,
): Promise<IntelExtraction> {
  const t = await targetFor(mode);
  return chatJSON<IntelExtraction>(
    messages,
    schema,
    { model: pickLlm(t), schemaName: "intel" },
    t,
  );
}
