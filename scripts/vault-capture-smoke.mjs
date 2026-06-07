import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = path.join(ROOT, "apps", "app");
const ARTIFACT_DIR = path.join(ROOT, "artifacts", "vault");
const DATE = new Date().toISOString().slice(0, 10);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function serializeError(err) {
  return err instanceof Error ? err.message : String(err);
}

function installLocalStorage() {
  const values = new Map();
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
  globalThis.window = { localStorage };
}

function request(result) {
  return { result, error: null, onsuccess: null, onerror: null };
}

function complete(req, tx, result) {
  queueMicrotask(() => {
    req.result = result;
    req.onsuccess?.();
    tx?.oncomplete?.();
  });
  return req;
}

function installIndexedDB() {
  const dbs = new Map();

  function names(map) {
    return { contains: (name) => map.has(name) };
  }

  function indexNames(set) {
    return { contains: (name) => set.has(name) };
  }

  function storeApi(store, tx) {
    return {
      indexNames: indexNames(store.indexes),
      createIndex: (name) => store.indexes.add(name),
      put: (value) => complete(request(value), tx, store.records.set(value.id, value).get(value.id)),
      get: (id) => complete(request(undefined), tx, store.records.get(id)),
      getAll: () => complete(request([]), tx, Array.from(store.records.values())),
      delete: (id) => complete(request(undefined), tx, store.records.delete(id)),
      clear: () => complete(request(undefined), tx, store.records.clear()),
      count: () => complete(request(0), tx, store.records.size),
    };
  }

  function dbApi(name, state) {
    return {
      objectStoreNames: names(state.stores),
      createObjectStore: (storeName) => {
        const store = { records: new Map(), indexes: new Set() };
        state.stores.set(storeName, store);
        return storeApi(store, null);
      },
      transaction: (storeName) => {
        const tx = {
          oncomplete: null,
          objectStore: (nextStoreName) => storeApi(state.stores.get(nextStoreName), tx),
        };
        assert(storeName, "store name required");
        return tx;
      },
      close: () => {},
    };
  }

  globalThis.indexedDB = {
    __dbs: dbs,
    open: (name, version) => {
      const req = request(null);
      queueMicrotask(() => {
        let state = dbs.get(name);
        const upgrade = !state || version > state.version;
        if (!state) {
          state = { version, stores: new Map() };
          dbs.set(name, state);
        }
        state.version = Math.max(state.version, version);
        req.result = dbApi(name, state);
        if (upgrade) req.onupgradeneeded?.();
        req.onsuccess?.();
      });
      return req;
    },
  };
  globalThis.window.indexedDB = globalThis.indexedDB;
}

async function main() {
  installLocalStorage();
  installIndexedDB();

  const cryptoModule = await import(pathToFileURL(path.join(APP_DIR, "src", "lib", "intel", "crypto.ts")).href);
  const storeModule = await import(pathToFileURL(path.join(APP_DIR, "src", "lib", "intel", "store-client.ts")).href);

  cryptoModule.lock();
  const record = {
    id: "vault-capture-smoke-001",
    resumen: "Smoke capture while locked",
    amenaza: "RUTINARIO",
    entidades: { personas: [], organizaciones: [], lugares: ["Test"], fechas: [] },
    accionesPendientes: ["verify sealed storage"],
    datos: {
      sujeto: { alias: "", descripcion: "", afiliacion: "" },
      ubicacion: { lugar: "Test", coordenadas: "", contexto: "" },
      evaluacion: { fiabilidad: "test", corroboracion: "smoke", riesgos: [] },
      narrativa: "A locked-default capture should still persist as ciphertext.",
    },
    transcripcion: "locked-default capture smoke",
    metadatos: { kind: "nota", capturedAt: Date.now(), durationMs: null, locale: "en" },
    estado: "CONFIRMADO",
    createdAt: Date.now(),
  };

  await storeModule.putRecord(record);
  const raw = globalThis.indexedDB.__dbs.get("leclerc-dossier").stores.get("records").records.get(record.id);
  assert(raw, "record was not written");
  assert(raw.sealed?.ct && raw.sealed?.iv, "record was not sealed");
  assert(raw.sealed.keyId === "device", "record did not use the device vault key");
  assert(!("plain" in raw), "record leaked a plaintext body");

  cryptoModule.lock();
  const reread = await storeModule.getRecord(record.id);
  assert(reread?.id === record.id, "record did not read back while lock UI state was closed");
  const listed = await storeModule.listRecords();
  assert(listed.length === 1 && listed[0].id === record.id, "listRecords did not return sealed capture");

  await mkdir(ARTIFACT_DIR, { recursive: true });
  const artifact = {
    createdAt: new Date().toISOString(),
    status: "PASS",
    checks: [
      "putRecord succeeds with no passphrase unlock",
      "IndexedDB row contains sealed ciphertext and no plaintext body",
      "device-key sealed record reads back after lock() clears passphrase session state",
    ],
  };
  await writeFile(path.join(ARTIFACT_DIR, `vault-capture-smoke-${DATE}.json`), JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify(artifact, null, 2));
}

main().catch((err) => {
  console.error(serializeError(err));
  process.exit(1);
});
