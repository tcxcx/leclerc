# Halketon

A single progressive web app for on-device push-to-talk, powered by [QVAC](https://github.com/tetherto/qvac).
Structured as a minimal [Turborepo](https://turborepo.com) monorepo on [Bun](https://bun.sh).

## Structure

```
.
├── apps/
│   └── app/          # The PWA — Next.js 16 (App Router), Node backend, port 3000
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

## Develop

```bash
bun install
bun run dev          # all workspaces (app on http://localhost:3000)
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
