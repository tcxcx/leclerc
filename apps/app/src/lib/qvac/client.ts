"use client";

/**
 * Browser-side QVAC client. Talks to an OpenAI-compatible `qvac serve openai`
 * endpoint — NOT @qvac/sdk (which needs the native bare runtime and can't run
 * on Vercel). Base URL resolution prioritizes the operator's own device:
 *
 *   1. Local `qvac serve` (NEXT_PUBLIC_QVAC_LOCAL_URL, default localhost:11434)
 *      — true offline-first, runs on the field device. http://localhost is a
 *      "potentially trustworthy" origin so HTTPS pages may call it (Chrome).
 *   2. Fallback to `/api/qvac` — a same-origin Vercel proxy that forwards to a
 *      Railway-hosted qvac serve (key stays server-side). Never fails.
 */

const LOCAL_URL =
  process.env.NEXT_PUBLIC_QVAC_LOCAL_URL?.replace(/\/$/, "") ?? "http://localhost:11434";
const LOCAL_KEY = process.env.NEXT_PUBLIC_QVAC_LOCAL_KEY;
const PROXY_BASE = "/api/qvac";
const PROBE_TIMEOUT_MS = 1500;
// The local server is only usable if it actually serves this model. This
// rejects an unrelated server squatting on :11434 (e.g. Ollama, or a qvac
// serve started without the config) so we correctly fall back to Railway.
const REQUIRED_LOCAL_MODEL =
  process.env.NEXT_PUBLIC_QVAC_ASR_MODEL ?? "whisper-base";

export interface QvacTarget {
  base: string;
  key?: string;
  /** "local" (operator device) or "remote" (Railway via Vercel proxy). */
  where: "local" | "remote";
}

let resolved: Promise<QvacTarget> | null = null;

async function probeLocal(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(`${LOCAL_URL}/v1/models`, {
      signal: ctrl.signal,
      headers: LOCAL_KEY ? { Authorization: `Bearer ${LOCAL_KEY}` } : undefined,
    });
    clearTimeout(t);
    if (!res.ok) return false;
    // Only trust local if it actually serves the model we need (loaded).
    const data = (await res.json()) as { data?: Array<{ id?: string }> };
    const ids = (data.data ?? []).map((m) => m.id);
    return ids.includes(REQUIRED_LOCAL_MODEL);
  } catch {
    return false;
  }
}

/** Resolve the inference target once per session (local device, else proxy). */
export function resolveTarget(force = false): Promise<QvacTarget> {
  if (resolved && !force) return resolved;
  resolved = (async () => {
    if (await probeLocal()) {
      console.log("[qvac] using LOCAL device:", LOCAL_URL);
      return { base: LOCAL_URL, key: LOCAL_KEY, where: "local" as const };
    }
    console.log("[qvac] local unavailable → using Railway via", PROXY_BASE);
    return { base: PROXY_BASE, where: "remote" as const };
  })();
  return resolved;
}

function authHeaders(t: QvacTarget): Record<string, string> {
  // The proxy injects the Railway key server-side, so we only send a key when
  // calling a local server that was started with --api-key.
  return t.key ? { Authorization: `Bearer ${t.key}` } : {};
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Speech-to-text via POST /v1/audio/transcriptions (OpenAI multipart). */
export async function transcribe(
  blob: Blob,
  opts: { model: string; language?: string; filename?: string },
): Promise<string> {
  const t = await resolveTarget();
  const form = new FormData();
  form.append("file", blob, opts.filename ?? "registro.wav");
  form.append("model", opts.model);
  if (opts.language) form.append("language", opts.language);

  const res = await fetch(`${t.base}/v1/audio/transcriptions`, {
    method: "POST",
    headers: authHeaders(t),
    body: form,
  });
  if (!res.ok) {
    throw new Error(`transcriptions ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/**
 * Chat completion constrained to a JSON schema via POST /v1/chat/completions.
 * Returns the parsed object. Tolerates servers that don't honor json_schema by
 * extracting the first JSON object from the content.
 */
export async function chatJSON<T = unknown>(
  messages: ChatMessage[],
  schema: Record<string, unknown>,
  opts: { model: string; schemaName?: string },
): Promise<T> {
  const t = await resolveTarget();
  const res = await fetch(`${t.base}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(t) },
    body: JSON.stringify({
      model: opts.model,
      messages,
      stream: false,
      response_format: {
        type: "json_schema",
        json_schema: { name: opts.schemaName ?? "result", schema, strict: true },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`chat/completions ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseJson<T>(content);
}

function parseJson<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`LLM did not return JSON: ${content.slice(0, 200)}`);
  }
}
