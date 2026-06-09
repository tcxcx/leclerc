"use client";

import { fromVaultEnvelope, toVaultEnvelope, type VaultEnvelope } from "@/lib/vault/envelope-client";
import { financeDemoRows } from "@/lib/stories/field-demo-story";

/**
 * Offline-first, encrypted-at-rest local transaction store (IndexedDB on the
 * operative's device). Mirrors lib/intel/store-client.ts: when the vault is
 * unlocked the transaction body is sealed (AES-GCM); `id` and `createdAt` stay
 * in clear for indexing. Legacy `ts` envelope rows are still read so old demo
 * data does not strand the UI.
 *
 * No bank API for v1 (docs/leclerc/13-cleo-plan.md §"Finance data"). Insights
 * are computed locally and narrated by the LLM with attitude.
 */

export type TxKind = "spend" | "income" | "transfer";

export interface Transaction {
  id: string;
  ts: number; // epoch ms
  amount: number; // positive number; sign by kind (spend reduces balance)
  currency: string; // "USDT" | "USD" | "EUR" | "sats" ...
  kind: TxKind;
  category: string; // "comida", "transporte", "informante", "equipo", ...
  merchant: string; // counterparty / payee
  note?: string;
}

const DB_NAME = "leclerc-finance";
const TX_STORE = "transactions";
const GOAL_STORE = "goals";
const VERSION = 3;

export interface SavingsGoal {
  id: string;
  createdAt: number;
  title: string;
  target: number;
  current: number;
  currency: string;
}

interface Envelope<T = unknown> extends VaultEnvelope<T> {
  id: string;
  createdAt: number;
  ts?: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      ensureStore(db, req.transaction, TX_STORE);
      ensureStore(db, req.transaction, GOAL_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function storeTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const req = fn(transaction.objectStore(storeName));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return storeTx(TX_STORE, mode, fn);
}

function goalTx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return storeTx(GOAL_STORE, mode, fn);
}

function ensureStore(db: IDBDatabase, transaction: IDBTransaction | null, storeName: string): void {
  const store = db.objectStoreNames.contains(storeName)
    ? transaction?.objectStore(storeName)
    : db.createObjectStore(storeName, { keyPath: "id" });
  if (store && !store.indexNames.contains("createdAt")) {
    store.createIndex("createdAt", "createdAt");
  }
}

function envelopeCreatedAt(e: Pick<Envelope, "createdAt" | "ts">): number {
  return e.createdAt ?? e.ts ?? 0;
}

async function toEnvelope<T>(id: string, createdAt: number, value: T): Promise<Envelope<T>> {
  return toVaultEnvelope({ id, createdAt }, value);
}

async function fromEnvelope<T>(e: Envelope<T> | undefined): Promise<T | null> {
  return fromVaultEnvelope<T>(e);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Add a transaction (generates id + ts when omitted). Returns the stored row. */
export async function addTransaction(
  input: Omit<Transaction, "id"> & { id?: string },
): Promise<Transaction> {
  const t: Transaction = {
    ...input,
    id: input.id ?? newId(),
    ts: input.ts ?? Date.now(),
  };
  const env = await toEnvelope(t.id, t.ts, t);
  await tx("readwrite", (s) => s.put(env));
  return t;
}

/** All transactions, newest first. */
export async function listTransactions(): Promise<Transaction[]> {
  const envs = await tx<Envelope<Transaction>[]>("readonly", (s) => s.getAll());
  envs.sort((a, b) => envelopeCreatedAt(b) - envelopeCreatedAt(a));
  const out: Transaction[] = [];
  for (const e of envs) {
    const t = await fromEnvelope<Transaction>(e);
    if (t) out.push(t);
  }
  return out;
}

export async function deleteTransaction(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

/** Panic-wipe: clear the entire finance store. */
export async function wipeAllFinance(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
  await goalTx("readwrite", (s) => s.clear());
}

/** Add a local savings goal. */
export async function addSavingsGoal(
  input: Omit<SavingsGoal, "id" | "createdAt" | "current"> &
    Partial<Pick<SavingsGoal, "id" | "createdAt" | "current">>,
): Promise<SavingsGoal> {
  const goal: SavingsGoal = {
    ...input,
    id: input.id ?? newId(),
    createdAt: input.createdAt ?? Date.now(),
    current: input.current ?? 0,
  };
  const env = await toEnvelope(goal.id, goal.createdAt, goal);
  await goalTx("readwrite", (s) => s.put(env));
  return goal;
}

/** All savings goals, newest first. */
export async function listSavingsGoals(): Promise<SavingsGoal[]> {
  const envs = await goalTx<Envelope<SavingsGoal>[]>("readonly", (s) => s.getAll());
  envs.sort((a, b) => envelopeCreatedAt(b) - envelopeCreatedAt(a));
  const out: SavingsGoal[] = [];
  for (const e of envs) {
    const goal = await fromEnvelope<SavingsGoal>(e);
    if (goal) out.push(goal);
  }
  return out;
}

const DAY = 86_400_000;

/**
 * Insert ~12 believable spy-themed demo transactions across the last ~10 days.
 * Idempotent: skips entirely if any transaction already exists.
 */
export async function seedDemo(locale: "es" | "en"): Promise<void> {
  const existing = await tx<number>("readonly", (s) => s.count());
  if (existing > 0) return;
  const now = Date.now();
  for (const row of financeDemoRows(locale)) {
    const { dayAgo, ...rest } = row;
    // Spread within the day so the list ordering looks natural.
    const ts = now - dayAgo * DAY - Math.floor(Math.random() * DAY * 0.4);
    await addTransaction({ ...rest, ts });
  }
}
