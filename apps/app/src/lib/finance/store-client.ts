"use client";

import { fromVaultEnvelope, toVaultEnvelope, type VaultEnvelope } from "@/lib/vault/envelope-client";

/**
 * Offline-first, encrypted-at-rest local transaction store (IndexedDB on the
 * operative's device). Mirrors lib/intel/store-client.ts: when the vault is
 * unlocked the transaction body is sealed (AES-GCM); `id` and `ts` stay in
 * clear for indexing. Locked writes are refused; legacy plaintext rows can
 * still be read so old demo data does not strand the UI.
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
const VERSION = 2;

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
  ts: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TX_STORE)) {
        const store = db.createObjectStore(TX_STORE, { keyPath: "id" });
        store.createIndex("ts", "ts");
      }
      if (!db.objectStoreNames.contains(GOAL_STORE)) {
        const store = db.createObjectStore(GOAL_STORE, { keyPath: "id" });
        store.createIndex("ts", "ts");
      }
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

async function toEnvelope<T>(id: string, ts: number, value: T): Promise<Envelope<T>> {
  return toVaultEnvelope({ id, ts }, value);
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
  envs.sort((a, b) => b.ts - a.ts);
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
  envs.sort((a, b) => b.ts - a.ts);
  const out: SavingsGoal[] = [];
  for (const e of envs) {
    const goal = await fromEnvelope<SavingsGoal>(e);
    if (goal) out.push(goal);
  }
  return out;
}

const DAY = 86_400_000;

/** Spy-themed demo data so the UI/demo has believable spend (docs §13). */
function demoRows(
  locale: "es" | "en",
): (Omit<Transaction, "id" | "ts"> & { dayAgo: number })[] {
  const es = locale === "es";
  // Mostly spend, a couple income, single currency (USDT) for clean math,
  // plus two Lightning (sats) payments. Amounts are realistic.
  const c = {
    informant: es ? "informante" : "informant",
    safehouse: es ? "alojamiento" : "safehouse",
    comms: es ? "comunicaciones" : "comms",
    transport: es ? "transporte" : "transport",
    meals: es ? "comida" : "meals",
    gear: es ? "equipo" : "gear",
    income: es ? "ingreso" : "income",
  };
  return [
    {
      dayAgo: 0,
      amount: 18.4,
      currency: "USDT",
      kind: "spend",
      category: c.meals,
      merchant: es ? "Café de la esquina" : "Corner Café",
      note: es ? "reunión de tapadera" : "cover meeting",
    },
    {
      dayAgo: 0,
      amount: 12000,
      currency: "sats",
      kind: "spend",
      category: c.comms,
      merchant: es ? "VPN sin logs" : "No-log VPN",
      note: es ? "pago Lightning" : "Lightning payment",
    },
    {
      dayAgo: 1,
      amount: 250,
      currency: "USDT",
      kind: "spend",
      category: c.informant,
      merchant: es ? 'Sujeto "Halcón"' : 'Subject "Falcon"',
      note: es ? "soplo verificado" : "verified tip",
    },
    {
      dayAgo: 2,
      amount: 42.75,
      currency: "USDT",
      kind: "spend",
      category: c.transport,
      merchant: es ? "Taxi nocturno" : "Night cab",
      note: es ? "vigilancia móvil" : "mobile surveillance",
    },
    {
      dayAgo: 2,
      amount: 89.99,
      currency: "USDT",
      kind: "spend",
      category: c.gear,
      merchant: es ? "Teléfono desechable" : "Burner phone",
    },
    {
      dayAgo: 3,
      amount: 1500,
      currency: "USDT",
      kind: "income",
      category: c.income,
      merchant: es ? "Estipendio de la Agencia" : "Agency stipend",
      note: es ? "asignación de misión" : "mission allowance",
    },
    {
      dayAgo: 4,
      amount: 600,
      currency: "USDT",
      kind: "spend",
      category: c.safehouse,
      merchant: es ? "Piso franco — Distrito 7" : "Safehouse — District 7",
      note: es ? "renta semanal" : "weekly rent",
    },
    {
      dayAgo: 5,
      amount: 27.3,
      currency: "USDT",
      kind: "spend",
      category: c.meals,
      merchant: es ? "Mercado nocturno" : "Night market",
    },
    {
      dayAgo: 6,
      amount: 8500,
      currency: "sats",
      kind: "spend",
      category: c.informant,
      merchant: es ? "Contacto portuario" : "Dock contact",
      note: es ? "pago Lightning discreto" : "discreet Lightning payment",
    },
    {
      dayAgo: 7,
      amount: 64.0,
      currency: "USDT",
      kind: "spend",
      category: c.gear,
      merchant: es ? "Tienda de electrónica" : "Electronics shop",
      note: es ? "cables y baterías" : "cables and batteries",
    },
    {
      dayAgo: 8,
      amount: 33.5,
      currency: "USDT",
      kind: "spend",
      category: c.transport,
      merchant: es ? "Alquiler de coche" : "Car rental",
    },
    {
      dayAgo: 9,
      amount: 175,
      currency: "USDT",
      kind: "spend",
      category: c.informant,
      merchant: es ? 'Sujeto "Cuervo"' : 'Subject "Raven"',
      note: es ? "documentos filtrados" : "leaked documents",
    },
  ];
}

/**
 * Insert ~12 believable spy-themed demo transactions across the last ~10 days.
 * Idempotent: skips entirely if any transaction already exists.
 */
export async function seedDemo(locale: "es" | "en"): Promise<void> {
  const existing = await tx<number>("readonly", (s) => s.count());
  if (existing > 0) return;
  const now = Date.now();
  for (const row of demoRows(locale)) {
    const { dayAgo, ...rest } = row;
    // Spread within the day so the list ordering looks natural.
    const ts = now - dayAgo * DAY - Math.floor(Math.random() * DAY * 0.4);
    await addTransaction({ ...rest, ts });
  }
}
