"use client";

/** Thin client helpers for the station Route Handlers. */
import type { IntelRecord } from "@/lib/intel/schema";
import type { IntelBrief, BriefRequest } from "@/lib/agents/orchestrator";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `${url} ${res.status}`);
  return res.json() as Promise<T>;
}

export function ragIngest(docs: { id: string; text: string; meta?: Record<string, unknown> }[]) {
  return post<{ ok: boolean }>("/api/rag", { action: "ingest", docs });
}

export function chat(
  messages: { role: "user" | "assistant"; content: string }[],
  opts: { locale?: "es" | "en"; financeContext?: string } = {},
) {
  return post<{ text: string }>("/api/chat", { messages, ...opts });
}

export function captureExtract(input: {
  transcript: string;
  durationMs?: number | null;
  locale: "es" | "en";
}) {
  return post<{ record: IntelRecord }>("/api/capture", input);
}

export function ragAsk(query: string, k = 6) {
  return post<{ answer: string; sources: { id: string; score?: number }[] }>("/api/rag", {
    action: "query",
    query,
    k,
  });
}

export function ragSearch(query: string, k = 4) {
  return post<{ hits: { id: string; text: string; score?: number }[] }>("/api/rag", {
    action: "search",
    query,
    k,
  });
}

export async function documentIntel(
  image: File,
  opts: { translate?: boolean; from?: string; to?: string } = {},
): Promise<{
  text: string;
  translatedText?: string;
  blocks: { text: string; bbox?: number[]; confidence?: number }[];
}> {
  const form = new FormData();
  form.set("image", image);
  form.set("translate", opts.translate ? "true" : "false");
  if (opts.from) form.set("from", opts.from);
  if (opts.to) form.set("to", opts.to);
  const res = await fetch("/api/document", { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `document ${res.status}`);
  return res.json();
}

export function runBrief(req: BriefRequest) {
  return post<IntelBrief>("/api/brief", req);
}

export type BriefExportFormat = "pdf" | "docx";

export async function exportBrief(req: {
  brief: IntelBrief;
  records: IntelRecord[];
  locale: "es" | "en";
  format: BriefExportFormat;
}): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch("/api/brief/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `export ${res.status}`);
  const filename =
    res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ??
    `leclerc-brief.${req.format}`;
  return { blob: await res.blob(), filename };
}

export const wallet = {
  generate: () => post<{ seed: string }>("/api/wallet", { action: "generate" }),
  balances: (seed: string) =>
    post<{ address: string; usdt: string; sats: string }>("/api/wallet", {
      action: "balances",
      seed,
    }),
  payLightning: (seed: string, invoice: string) =>
    post<{ ok: true }>("/api/wallet", { action: "payLightning", seed, invoice }),
  payEvm: (seed: string, to: string, amount: string) =>
    post<{ hash: string }>("/api/wallet", { action: "payEvm", seed, to, amount }),
};

export const station = {
  start: () => post<{ publicKey: string; stableSeed: boolean }>("/api/station", { action: "start" }),
  ping: (peer: string) => post<{ alive: boolean }>("/api/station", { action: "ping", peer }),
};

export const drop = {
  join: (passphrase: string, label = "browser") =>
    post<{ dropId: string; topicHash: string; peers: number }>("/api/drop", {
      action: "join",
      passphrase,
      label,
    }),
  send: (dropId: string, secret: string, value: unknown, kind: "brief" | "record" = "brief") =>
    post<{ peers: number }>("/api/drop", { action: "send", dropId, secret, kind, value }),
  read: (dropId: string, secret: string) =>
    post<{ payloads: Array<{ kind: "brief" | "record"; value: unknown; ts: number }>; rawCount: number }>(
      "/api/drop",
      { action: "read", dropId, secret },
    ),
  close: (dropId: string) => post<{ ok: true }>("/api/drop", { action: "close", dropId }),
};

export type { IntelRecord, IntelBrief };
