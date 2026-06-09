"use client";

import {
  assignMission,
  createWorkspaceInvite,
  defaultOpsConsoleState,
  mergeOpsNotifications,
  normalizeOpsConsoleState,
  type OpsNotification,
  type OpsConsoleState,
} from "@leclerc/core";
import { fromVaultEnvelope, toVaultEnvelope, type VaultEnvelope } from "@/lib/vault/envelope-client";

const DB_NAME = "leclerc-ops-console";
const STORE = "workspace";
const STATE_ID = "ops-console-state";
const VERSION = 1;

interface Envelope<T = unknown> extends VaultEnvelope<T> {
  id: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
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

async function writeState(state: OpsConsoleState): Promise<OpsConsoleState> {
  const normalized = normalizeOpsConsoleState(state);
  const env = await toVaultEnvelope({ id: STATE_ID, updatedAt: normalized.updatedAt }, normalized);
  await tx("readwrite", (store) => store.put(env));
  return normalized;
}

async function readState(): Promise<OpsConsoleState | null> {
  const env = await tx<Envelope<OpsConsoleState> | undefined>("readonly", (store) => store.get(STATE_ID));
  return fromVaultEnvelope<OpsConsoleState>(env);
}

export async function loadOpsConsole(): Promise<OpsConsoleState> {
  const existing = await readState();
  if (existing) return writeState(normalizeOpsConsoleState(existing));
  return writeState(defaultOpsConsoleState(Date.now()));
}

export async function resetOpsConsole(): Promise<OpsConsoleState> {
  return writeState(defaultOpsConsoleState(Date.now()));
}

export async function assignOpsMission(missionId: string, aliasId: string): Promise<OpsConsoleState> {
  const state = await loadOpsConsole();
  return writeState(assignMission(state, missionId, aliasId, Date.now()));
}

export async function inviteOpsAlias(missionId: string, targetAlias: string): Promise<OpsConsoleState> {
  const state = await loadOpsConsole();
  return writeState(createWorkspaceInvite(state, { missionId, targetAlias }, Date.now()));
}

export async function mergeOpsConsoleNotifications(notifications: OpsNotification[]): Promise<OpsConsoleState> {
  const state = await loadOpsConsole();
  return writeState(mergeOpsNotifications(state, notifications, Date.now()));
}
