# Halketon

A single progressive web app for on-device push-to-talk, powered by [QVAC](https://github.com/tetherto/qvac).
Structured as a minimal [Turborepo](https://turborepo.com) monorepo on [Bun](https://bun.sh).

## Structure

```
.
├── apps/
│   └── app/          # The PWA — Next.js 16 (App Router), Node backend, port 7001
└── packages/
    └── qvacs/        # @repo/qvacs — server-only wrapper around @qvac/sdk
```

- **`apps/app`** — the installable PWA UI (manifest + service worker) with a
  push-to-talk control. Audio is captured in the browser and POSTed to the
  Node runtime route `/api/transcribe`, which runs on-device inference.
- **`packages/qvacs`** — the only shared package. Keeps a single QVAC provider
  and a model cache alive across requests and exposes typed
  `getModel` / `transcribeOnce` / `completeText` helpers, plus the full SDK
  surface re-exported.

## Modelo de datos (JSON)

El pipeline `audio → Whisper → LLM` produce datos en **dos capas**.

### 1. Extracción del LLM (grammar-constrained)

El modelo recibe la transcripción y devuelve **solo** estos campos, forzados por
JSON Schema (`responseFormat: json_schema`) — definido en
[`apps/app/src/lib/reports/schema.ts`](apps/app/src/lib/reports/schema.ts)
(`EXTRACTION_JSON_SCHEMA`). El prompt obliga a resumir **únicamente** lo dicho,
sin alucinar:

| Campo                | Tipo                  | Qué captura |
|----------------------|-----------------------|-------------|
| `resumen`            | `string`              | 1–2 frases con los puntos clave (suministros entregados, estado de salud…). |
| `prioridad`          | `"ALTA" \| "MEDIA" \| "BAJA"` | Triaje visual. `ALTA` solo ante emergencia médica/seguridad explícita; `MEDIA` si hay seguimiento; si no, `BAJA`. |
| `entidades.nombres`  | `string[]`            | Nombres propios de personas dichos literalmente (`[]` si no hay). |
| `entidades.fechas`   | `string[]`            | Fechas dichas literalmente (`[]` si no hay). |
| `accionesPendientes` | `string[]`            | Tareas de seguimiento (seguimientos médicos, renovaciones…). |

### 2. Informe persistido (`FieldReport`)

Es lo que se guarda en `apps/app/.data/reports.json` y devuelven las rutas
`/api/reports`. Envuelve la extracción anterior y le añade transcripción,
metadatos auto-capturados y estado del registro:

| Campo                    | Tipo                  | Origen / qué captura |
|--------------------------|-----------------------|----------------------|
| `id`                     | `string` (uuid)       | Generado en el servidor. |
| `transcripcion`          | `string`              | Texto verbatim de Whisper — fuente de verdad, disponible bajo demanda. |
| `resumen`                | `string`              | ↑ de la extracción del LLM. |
| `prioridad`              | enum                  | ↑ de la extracción del LLM. |
| `entidades`              | `{ nombres[], fechas[] }` | ↑ de la extracción del LLM. |
| `accionesPendientes`     | `string[]`            | ↑ de la extracción del LLM. |
| `metadatos.tipo`         | `"individual" \| "grupal" \| null` | Tipo de registro elegido al inicio del flujo. |
| `metadatos.beneficiario` | `{ nombre, dni } \| null` | Identificación del beneficiario (flujo individual); `null` en actividad grupal. |
| `metadatos.sector`       | `string \| null`      | Ubicación — sector. |
| `metadatos.unidad`       | `string \| null`      | Ubicación — unidad. |
| `metadatos.capturedAt`   | `number` (epoch ms)   | Cuándo se capturó el audio en el dispositivo. |
| `metadatos.durationMs`   | `number \| null`      | Duración de la grabación (derivada del header WAV, tope 60 s). |
| `estado`                 | `"PENDIENTE" \| "CONFIRMADO"` | Nace `PENDIENTE`; pasa a `CONFIRMADO` al validar el informe. |
| `createdAt`              | `number` (epoch ms)   | Cuándo se creó el registro en el servidor. |

## Develop

```bash
bun install
bun run dev           # all workspaces (app on http://localhost:7001)
bun run dev:complete  # frees port 7001, boots dev, warms QVAC models
bun run dev --filter app
```

## Build / lint

```bash
bun run build
bun run lint
```

## Notes

- `@qvac/sdk` runs a native worker, so the transcription route is pinned to the
  Node.js runtime and the SDK is kept out of the bundle via
  `serverExternalPackages` in `apps/app/next.config.ts`.
- The service worker only registers in production builds.
- Microphone capture requires a secure context (localhost or HTTPS).

## Deploy

Deploy `apps/app` to Vercel as a project rooted at `apps/app`.
