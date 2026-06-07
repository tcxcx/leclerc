# 03 · Data Model & RAG

## 1. The dossier — re-theme the existing report schema

The baseline has `apps/app/src/lib/reports/schema.ts` (`ReportExtraction`, `FieldReport`, `EXTRACTION_JSON_SCHEMA`) and `store-client.ts` (IndexedDB `halketon-reports`). LeClerc renames `reports/` → `intel/` and re-themes fields. **Keep the structure; rename the domain.**

### `IntelRecord` (replaces `FieldReport`)
```ts
type ThreatLevel = "CRITICO" | "ELEVADO" | "RUTINARIO";   // ES; EN labels via i18n
type RecordKind  = "observacion" | "contacto" | "documento" | "incidente";
type Status      = "BORRADOR" | "CONFIRMADO";

interface IntelExtraction {            // LLM output (grammar-constrained via QVAC)
  resumen: string;                     // executive summary
  amenaza: ThreatLevel;                // threat triage (was `prioridad`)
  entidades: {
    personas: string[];                // named subjects (was nombres)
    organizaciones: string[];
    lugares: string[];                 // geo entities (NEW — feeds geo agent)
    fechas: string[];
  };
  accionesPendientes: string[];        // follow-ups / taskings
  datos: {
    sujeto: { alias: string; descripcion: string; afiliacion: string };
    ubicacion: { lugar: string; coordenadas: string; contexto: string };
    evaluacion: { fiabilidad: string; corroboracion: string; riesgos: string[] };
    narrativa: string;
  };
}

interface IntelRecord extends IntelExtraction {
  id: string;
  transcripcion: string;               // verbatim source (audio→text or typed)
  adjuntos?: { kind: "ocr"|"foto"; text?: string; sha256?: string }[]; // doc-intel results
  metadatos: {
    kind: RecordKind | null;
    sector: string | null;
    capturedAt: number;                // epoch ms
    durationMs: number | null;
    locale: "en" | "es";
  };
  estado: Status;
  createdAt: number;
}
```

### `EXTRACTION_JSON_SCHEMA`
Mirror the existing JSON-schema object (`type:"object"`, `required`, `additionalProperties:false`, enums for `amenaza`). Pass it to QVAC `completion` for grammar-constrained output (mode A) or as the `json_schema` response format over the OpenAI-compat server (mode B). The baseline already does tolerant `{}` extraction as a fallback — keep it.

### Store (`apps/app/src/lib/intel/store-client.ts`)
Keep the existing IndexedDB API, renamed DB `leclerc-dossier`, store `records`, index `createdAt`:
```ts
putRecord(r: IntelRecord): Promise<void>
getRecord(id): Promise<IntelRecord | null>
listRecords(): Promise<IntelRecord[]>          // newest first
updateEstado(id, estado): Promise<IntelRecord | null>
deleteRecord(id): Promise<void>
wipeAll(): Promise<void>                        // NEW: panic-wipe
```

## 2. Encryption at rest (threat model requirement)

The dossier must be unreadable on a seized device without the operative's passphrase.

- Derive a key from a passphrase with WebCrypto **PBKDF2** (or `scrypt` if available) → AES-GCM key. Never persist the passphrase or raw key; hold it in memory for the session only.
- Encrypt each `IntelRecord` value before `putRecord` (store `{iv, ciphertext}`); decrypt on read. Keep `id` + `createdAt` in clear for indexing.
- On the station (server-side), reuse the same envelope; the per-tenant DEK/HKDF pattern from **sendero** (`packages/encryption`) is a good reference — see [09](./09-reuse-map.md).
- `wipeAll()` clears the object store and forgets the in-memory key (panic button in UI).

> v1 acceptable simplification: passphrase-gated AES-GCM on the web client; document it as the encryption boundary. Hardware-backed keystore is the mobile path (`@tetherto/wdk-react-native-secure-storage`).

## 3. RAG over the dossier (QVAC-native — mandatory)

RAG **must** use QVAC `rag*` (not a hand-rolled or third-party vector store). QVAC ships HyperDB-backed workspaces.

### Workspace
- One workspace per dossier: `LECLERC_RAG_WORKSPACE` (default `dossier`).
- `ragListWorkspaces()` on boot; create on first ingest.

### Ingest (on every confirmed record)
```ts
// when a record is CONFIRMADO, index it for recall
await ragIngestDocs("dossier", [{
  id: record.id,
  text: ragText(record),                 // resumen + narrativa + entidades + transcripcion
  meta: { amenaza: record.amenaza, createdAt: record.createdAt, kind: record.metadatos.kind },
}]);
```
`ragText()` flattens the record into one retrieval string. Re-ingest on edit; `ragDeleteEmbeddings(id)` on delete.

### Query (the recall gadget)
```ts
const hits = await ragQuery("dossier", "¿qué sabemos sobre <alias>?", 6); // ragSearch under the hood
// feed hits as grounded context into a QVAC completion to answer in prose w/ citations to record ids
```
The answer step is a QVAC `completion` whose system prompt says: *answer only from the provided dossier excerpts; cite record ids; say "sin datos en el expediente" if unknown.* This is the grounded, no-hallucination recall.

### Maintenance
- `ragReindex()` occasionally (rebalances centroids).
- `ragCloseWorkspace()` on `suspend`/shutdown to free memory (mobile).

## 4. Where RAG runs

RAG is **in-process (mode A)** on the station, or on-device via Bare on mobile, or delegated to the station peer. The OpenAI-compat HTTP server does not expose `rag*`, so the browser UI calls a Next.js Route Handler (`runtime="nodejs"`) that runs `ragQuery` and streams the grounded answer back. Mobile either runs `rag*` on-device (Bare) or calls the station's delegate.

## 5. Acceptance criteria

- [ ] Confirming a record ingests it into the QVAC `dossier` workspace (verify with `ragListWorkspaces`).
- [ ] A natural-language question returns an answer grounded in real records with cited ids, fully offline.
- [ ] Deleting a record removes it from RAG (`ragDeleteEmbeddings`) and from IndexedDB.
- [ ] Dossier values at rest are AES-GCM ciphertext; `wipeAll()` leaves nothing readable.
- [ ] No third-party embedding/vector lib in the dependency tree — only `@qvac/sdk`.
