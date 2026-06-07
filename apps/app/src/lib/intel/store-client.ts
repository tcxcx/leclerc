"use client";

import type { Status, IntelRecord } from "./schema";
import { fromVaultEnvelope, toVaultEnvelope, type VaultEnvelope } from "@/lib/vault/envelope-client";

/**
 * Offline-first, encrypted-at-rest dossier store (IndexedDB on the operative's
 * device). When the vault is unlocked the record body is sealed (AES-GCM);
 * `id` and `createdAt` stay in clear for indexing (docs/leclerc/03).
 */
const DB_NAME = "leclerc-dossier";
const STORE = "records";
const VERSION = 1;

interface Envelope extends VaultEnvelope<IntelRecord> {
  id: string;
  createdAt: number;
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
  return toVaultEnvelope({ id: r.id, createdAt: r.createdAt }, r);
}

async function fromEnvelope(e: Envelope | undefined): Promise<IntelRecord | null> {
  return fromVaultEnvelope<IntelRecord>(e);
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

function demoRecords(locale: "es" | "en", now: number): IntelRecord[] {
  const es = locale === "es";
  return [
    {
      id: "demo-rio-001",
      resumen: es
        ? "Contacto nocturno de Vector Gris con mensajero de Kestrel en el muelle sur."
        : "Night contact between Gray Vector and a Kestrel courier at the south pier.",
      amenaza: "ELEVADO",
      entidades: {
        personas: ["Vector Gris", "mensajero Kestrel"],
        organizaciones: ["Kestrel"],
        lugares: ["Muelle Sur", "Darsena 4"],
        fechas: [new Date(now - 86_400_000).toISOString().slice(0, 10)],
      },
      accionesPendientes: es
        ? ["Corroborar matricula del vehiculo", "Cruzar camaras del acceso este"]
        : ["Corroborate vehicle plate", "Cross-check east-access cameras"],
      datos: {
        sujeto: {
          alias: "Vector Gris",
          descripcion: es ? "operador logistico con escolta discreta" : "logistics operator with discreet escort",
          afiliacion: "Kestrel",
        },
        ubicacion: {
          lugar: "Muelle Sur",
          coordenadas: "-34.6037,-58.3816",
          contexto: es ? "intercambio bajo lluvia, sin ingreso a deposito" : "rainy exchange, no warehouse entry",
        },
        evaluacion: {
          fiabilidad: es ? "media-alta" : "medium-high",
          corroboracion: es ? "dos observadores y audio parcial" : "two observers and partial audio",
          riesgos: es ? ["seguimiento hostil", "contra-vigilancia"] : ["hostile tail", "counter-surveillance"],
        },
        narrativa: es
          ? "A las 23:40, Vector Gris recibio un sobre metalizado de un mensajero vinculado a Kestrel en Darsena 4."
          : "At 23:40, Gray Vector received a metallic envelope from a Kestrel-linked courier at Dock 4.",
      },
      transcripcion: es
        ? "Vector Gris llego por el acceso este, hizo contacto con el mensajero y se retiro hacia la avenida."
        : "Gray Vector arrived through the east access, made contact with the courier, and left toward the avenue.",
      metadatos: {
        kind: "contacto",
        sector: "Rio",
        capturedAt: now - 86_400_000,
        durationMs: 94_000,
        locale,
      },
      estado: "CONFIRMADO",
      createdAt: now - 86_400_000,
    },
    {
      id: "demo-clinica-002",
      resumen: es
        ? "Sujeto Alfa salio de la clinica San Telmo con vendaje y apoyo de un tercero."
        : "Subject Alpha exited San Telmo clinic with a bandage and third-party support.",
      amenaza: "CRITICO",
      entidades: {
        personas: ["Sujeto Alfa", "Dra. Marquez"],
        organizaciones: ["Clinica San Telmo"],
        lugares: ["Clinica San Telmo", "Pasaje Defensa"],
        fechas: [new Date(now - 43_200_000).toISOString().slice(0, 10)],
      },
      accionesPendientes: es
        ? ["Confirmar gravedad de la herida", "Identificar acompanante"]
        : ["Confirm injury severity", "Identify companion"],
      datos: {
        sujeto: {
          alias: "Sujeto Alfa",
          descripcion: es ? "varon, renguera visible, vendaje en antebrazo" : "male, visible limp, forearm bandage",
          afiliacion: es ? "sin confirmar" : "unconfirmed",
        },
        ubicacion: {
          lugar: "Clinica San Telmo",
          coordenadas: "-34.6197,-58.3712",
          contexto: es ? "salida lateral, traslado a vehiculo oscuro" : "side exit, transferred to dark vehicle",
        },
        evaluacion: {
          fiabilidad: "alta",
          corroboracion: es ? "foto y testigo presencial" : "photo and eyewitness",
          riesgos: es ? ["posible herida reciente", "extraccion medica"] : ["possible recent injury", "medical extraction"],
        },
        narrativa: es
          ? "El sujeto presentaba dolor, vendaje fresco y respiracion agitada; la acompanante evito el acceso principal."
          : "The subject showed pain, fresh bandage, and labored breathing; the companion avoided the main entrance.",
      },
      transcripcion: es
        ? "Alfa sale por lateral de la clinica, brazo derecho vendado, parece lesionado, sube a sedan negro."
        : "Alpha exits the clinic side door, right arm bandaged, appears injured, enters a black sedan.",
      metadatos: {
        kind: "incidente",
        sector: "San Telmo",
        capturedAt: now - 43_200_000,
        durationMs: 61_000,
        locale,
      },
      estado: "CONFIRMADO",
      createdAt: now - 43_200_000,
    },
    {
      id: "demo-boveda-003",
      resumen: es
        ? "Documento fotografiado menciona entrega aplazada de baterias cifradas a Kestrel."
        : "Photographed document mentions a delayed delivery of encrypted batteries to Kestrel.",
      amenaza: "ELEVADO",
      entidades: {
        personas: ["Nina", "Vector Gris"],
        organizaciones: ["Kestrel", "Taller Norte"],
        lugares: ["Taller Norte", "Darsena 4"],
        fechas: [new Date(now - 7_200_000).toISOString().slice(0, 10)],
      },
      accionesPendientes: es
        ? ["Revisar inventario del Taller Norte", "Preparar vigilancia en Darsena 4"]
        : ["Review North Workshop inventory", "Prepare surveillance at Dock 4"],
      datos: {
        sujeto: {
          alias: "Nina",
          descripcion: es ? "intermediaria de suministros tecnicos" : "technical supplies intermediary",
          afiliacion: "Taller Norte",
        },
        ubicacion: {
          lugar: "Taller Norte",
          coordenadas: "-34.5940,-58.4050",
          contexto: es ? "nota recuperada en mesa de embalaje" : "note recovered on packing table",
        },
        evaluacion: {
          fiabilidad: es ? "media" : "medium",
          corroboracion: es ? "OCR del documento y cruce con contacto previo" : "document OCR and prior contact cross-check",
          riesgos: es ? ["material cifrado", "entrega proxima"] : ["encrypted material", "near-term delivery"],
        },
        narrativa: es
          ? "La nota indica que el paquete de baterias cifradas se aplazo 24 horas y conserva destino Darsena 4."
          : "The note says the encrypted battery package slipped 24 hours and still targets Dock 4.",
      },
      transcripcion: es
        ? "OCR: baterias cifradas, entrega aplazada, contactar a Vector Gris antes de medianoche."
        : "OCR: encrypted batteries, delivery delayed, contact Gray Vector before midnight.",
      adjuntos: [
        {
          kind: "ocr",
          text: es
            ? "Baterias cifradas. Entrega aplazada 24h. Vector Gris confirma Darsena 4."
            : "Encrypted batteries. Delivery delayed 24h. Gray Vector confirms Dock 4.",
          sha256: "demo-ocr-boveda-003",
        },
      ],
      metadatos: {
        kind: "documento",
        sector: "Norte",
        capturedAt: now - 7_200_000,
        durationMs: null,
        locale,
      },
      estado: "CONFIRMADO",
      createdAt: now - 7_200_000,
    },
  ];
}

/** Seed three confirmed demo records for the analyst desk smoke/demo path. */
export async function seedDemoRecords(locale: "es" | "en"): Promise<IntelRecord[]> {
  const existing = await listRecords();
  const existingIds = new Set(existing.map((r) => r.id));
  for (const record of demoRecords(locale, Date.now())) {
    if (!existingIds.has(record.id)) {
      await putRecord(record);
    }
  }
  return listRecords();
}
