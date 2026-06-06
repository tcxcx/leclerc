import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Estado, FieldReport } from "./schema";

/**
 * Durable, local report store backed by a single JSON file on the device. No
 * network — this is the on-device record of truth. Reads are served from an
 * in-memory cache; writes are serialised and persisted write-through so the
 * history survives restarts. Swap this module for SQLite/Postgres later without
 * touching callers (Phase-2 offline-first sync builds on top of it).
 */

const DATA_DIR = process.env.QVAC_DATA_DIR ?? join(process.cwd(), ".data");
const FILE = join(DATA_DIR, "reports.json");

interface StoreState {
  cache: Map<string, FieldReport> | null;
  writeChain: Promise<void>;
}

const g = globalThis as typeof globalThis & { __reportStore?: StoreState };
const state: StoreState = (g.__reportStore ??= { cache: null, writeChain: Promise.resolve() });

async function load(): Promise<Map<string, FieldReport>> {
  if (state.cache) return state.cache;
  const map = new Map<string, FieldReport>();
  try {
    const raw = await readFile(FILE, "utf8");
    const arr = JSON.parse(raw) as FieldReport[];
    for (const r of arr) map.set(r.id, r);
  } catch (err) {
    // ENOENT on first run is expected; anything else is logged but non-fatal.
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") {
      console.error("Failed to read report store:", err);
    }
  }
  state.cache = map;
  return map;
}

function persist(map: Map<string, FieldReport>): Promise<void> {
  const payload = JSON.stringify([...map.values()], null, 2);
  // Serialise writes so concurrent requests don't clobber the file.
  state.writeChain = state.writeChain.then(async () => {
    await mkdir(dirname(FILE), { recursive: true });
    await writeFile(FILE, payload, "utf8");
  });
  return state.writeChain;
}

export async function createReport(report: FieldReport): Promise<FieldReport> {
  const map = await load();
  map.set(report.id, report);
  await persist(map);
  return report;
}

/** All reports, newest first (chronological history for the program manager). */
export async function listReports(): Promise<FieldReport[]> {
  const map = await load();
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getReport(id: string): Promise<FieldReport | null> {
  const map = await load();
  return map.get(id) ?? null;
}

export async function updateEstado(
  id: string,
  estado: Estado,
): Promise<FieldReport | null> {
  const map = await load();
  const existing = map.get(id);
  if (!existing) return null;
  const updated = { ...existing, estado };
  map.set(id, updated);
  await persist(map);
  return updated;
}
