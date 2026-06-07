"use client";

import type { Status, IntelRecord } from "./schema";
import { isUnlocked, seal, open, type Sealed } from "./crypto";

/**
 * Offline-first, encrypted-at-rest dossier store (IndexedDB on the operative's
 * device). When the vault is unlocked the record body is sealed (AES-GCM);
 * `id` and `createdAt` stay in clear for indexing (docs/leclerc/03).
 */
const DB_NAME = "leclerc-dossier";
const STORE = "records";
const VERSION = 1;

interface Envelope {
  id: string;
  createdAt: number;
  sealed?: Sealed;
  /** Fallback when the vault is not configured (dev only). */
  plain?: IntelRecord;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const req = fn(transaction.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

async function toEnvelope(r: IntelRecord): Promise<Envelope> {
  if (isUnlocked()) {
    return { id: r.id, createdAt: r.createdAt, sealed: await seal(r) };
  }
  return { id: r.id, createdAt: r.createdAt, plain: r };
}

async function fromEnvelope(e: Envelope | undefined): Promise<IntelRecord | null> {
  if (!e) return null;
  if (e.sealed) return open<IntelRecord>(e.sealed);
  return e.plain ?? null;
}

export async function putRecord(record: IntelRecord): Promise<void> {
  const env = await toEnvelope(record);
  await tx("readwrite", (s) => s.put(env));
}

export async function getRecord(id: string): Promise<IntelRecord | null> {
  const e = await tx<Envelope | undefined>("readonly", (s) => s.get(id));
  return fromEnvelope(e);
}

/** All records, newest first. */
export async function listRecords(): Promise<IntelRecord[]> {
  const envs = await tx<Envelope[]>("readonly", (s) => s.getAll());
  envs.sort((a, b) => b.createdAt - a.createdAt);
  const out: IntelRecord[] = [];
  for (const e of envs) {
    const r = await fromEnvelope(e);
    if (r) out.push(r);
  }
  return out;
}

export async function updateEstado(id: string, estado: Status): Promise<IntelRecord | null> {
  const existing = await getRecord(id);
  if (!existing) return null;
  const updated = { ...existing, estado };
  await putRecord(updated);
  return updated;
}

export async function deleteRecord(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

/** Panic-wipe: clear the entire dossier (the in-memory key is forgotten by lock()). */
export async function wipeAll(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
}
