"use client";

import type { InferenceMode } from "./mode";
import type { ReportExtraction } from "@/lib/reports/schema";
import {
  transcribe as qvacTranscribe,
  chatJSON as qvacChat,
  probeLocal,
  localTarget,
  remoteTarget,
  type ChatMessage,
} from "@/lib/qvac/client";
import { transcribeOffline, extractOffline } from "./offline-engine";

/**
 * Routes inference to the right backend for the chosen mode:
 *
 *  - "online"  → "remote": Railway via the /api/qvac proxy.
 *  - "offline" → "local"  if a `qvac serve` is reachable (best quality, qvacs),
 *                else "browser" (transformers.js in-browser fallback for a PWA
 *                on a plain phone).
 */
export type Backend = "remote" | "local" | "browser";

export async function resolveBackend(mode: InferenceMode): Promise<Backend> {
  if (mode === "online") return "remote";
  return (await probeLocal()) ? "local" : "browser";
}

export async function inferTranscribe(
  mode: InferenceMode,
  blob: Blob,
  opts: { model: string; language?: string; filename?: string },
): Promise<string> {
  const backend = await resolveBackend(mode);
  if (backend === "browser") return transcribeOffline(blob, { language: opts.language });
  return qvacTranscribe(blob, opts, backend === "local" ? localTarget() : remoteTarget());
}

export async function inferExtract(
  mode: InferenceMode,
  messages: ChatMessage[],
  schema: Record<string, unknown>,
  opts: { model: string; schemaName?: string },
): Promise<ReportExtraction> {
  const backend = await resolveBackend(mode);
  if (backend === "browser") return extractOffline(messages, schema);
  return qvacChat<ReportExtraction>(
    messages,
    schema,
    opts,
    backend === "local" ? localTarget() : remoteTarget(),
  );
}
