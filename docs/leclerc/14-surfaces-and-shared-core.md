# 14 · Surfaces & shared core (PWA + Desktop + Mobile)

> The Cleo UI ([13](./13-cleo-plan.md)) is the canonical experience. It ships on
> **three surfaces** from one monorepo: a **PWA** (web, mobile-first), a native
> **Desktop** app (Pear + Electron), and a native **Mobile** app (Expo + Bare).
> The Tether **PearPass** apps in `references/` are the build blueprint for the
> two native shells (see [12](./12-reference-apps.md)). This supersedes the
> "single PWA, no Expo" simplification noted in [13](./13-cleo-plan.md) §decisions.

## Why three surfaces
- **Hackathon tracks, one codebase:** Desktop/laptop = **General Purpose** (the
  full station, QVAC on a ≤32GB machine). Mobile = **Mobile track** (on-device
  QVAC via Bare). PWA + P2P delegation = the **Tinkerer / phone→laptop** story.
- **On-device everywhere:** native shells host `@qvac/sdk` (and WDK, Hyperswarm)
  in a **Bare worklet**, so inference + voice + wallet run fully on-device with no
  station. The PWA (browser can't run Bare) uses the station WS voice service or
  P2P-delegates to a desktop peer.
- **One brain, three skins:** the hard logic is shared; each surface only owns its
  shell (rendering + platform I/O).

## Shared core (extract once, reuse three times)
Promote the runtime-agnostic logic out of `apps/app` into packages so all shells
import it. Target layout:

```
packages/
  core/        @leclerc/core   — runtime-agnostic TS (NO React, NO DOM, NO node-only):
                 intel schema + assemble, finance insights, agents persona +
                 tool registry + orchestrator contracts, RAG/brief/wallet/p2p
                 request+response types, the WS voice protocol types, i18n message
                 types. Pure logic + types. The single source of truth.
  qvacs/       @repo/qvacs     — QVAC SDK wrapper (server/Bare only). (exists)
  worklet/     @leclerc/worklet — the Bare worklet entry that hosts @qvac/sdk +
                 WDK + Hyperswarm and exposes an RPC the shells call. Mirrors
                 references/pearpass-mobile/src/worklet/index.js. Bundled with
                 bare-pack for iOS/Android; loaded via react-native-bare-kit on
                 mobile and via Pear runtime on desktop.
  ui/          @leclerc/ui     — shared Cleo components per DESIGN.md. Web (Tailwind)
                 is canonical; native uses the same tokens/specs (react-strict-dom
                 or a thin RN mirror). Keep components dumb + token-driven so both
                 platforms render the same design.
apps/
  app/         the PWA (Next.js 16, exists) — imports @leclerc/core + ui
  desktop/     Pear + Electron shell (new)  — imports core + ui + worklet
  mobile/      Expo + Bare shell (new)      — imports core + ui + worklet
services/
  voice/       station WS voice service (exists) — for the PWA + delegation
```
v1 reality: `apps/app/src/lib/**` already holds most of this logic. Extraction can
be incremental — move shared types/logic into `packages/core` as the desktop/mobile
shells need them; do not block the PWA on a big-bang refactor.

## What runs where

| Capability | PWA (browser) | Desktop (Pear+Electron) | Mobile (Expo+Bare) |
|---|---|---|---|
| UI / capture (mic, camera) | ✅ web APIs | ✅ Electron renderer | ✅ RN |
| QVAC inference + RAG | station `:11434` / Node route / **delegate** | **on-device** (Bare worklet, in-process) | **on-device** (Bare worklet) |
| Voice loop (ASR→LLM→TTS) | station WS (`services/voice`) | **in-worklet** (no WS) | **in-worklet** |
| Dossier / finance store | IndexedDB (encrypted) | worklet + local FS / Hypercore | secure storage + worklet |
| WDK wallet | Node route / delegate | worklet (on-device) | worklet (on-device) |
| P2P delegate + dead-drop | join via station / delegate to desktop | Hyperswarm in worklet | Hyperswarm in worklet |
| Seed / key storage | passphrase AES-GCM (crypto.ts) | OS keychain | `@tetherto/wdk-react-native-secure-storage` |

## The Bare worklet (native on-device host)
Both native shells host one worklet that owns the heavy, server-only stack and
exposes a small RPC the UI calls. This is the PearPass pattern, verbatim shape:

- **Mobile:** `react-native-bare-kit` `Worklet` loads the bundled worklet entry
  (`bare-pack` → `bundles/app-*.bundle`). Blueprint:
  `references/pearpass-mobile/src/worklet/index.js`, the `bundle:ios|android`
  scripts in its `package.json`, and `src/native-modules/`.
- **Desktop:** Pear runtime / Electron loads the same worklet logic; the renderer
  talks to it via an IPC client. Blueprint:
  `references/pearpass-desktop/src/services/createOrGetPearpassClient.js`,
  `src/electron/vaultClientProxy.js`, `src/services/createOrGetPipe.js`.
- **Inside the worklet:** `@qvac/sdk` (completion/transcribeStream/textToSpeech/
  embed/rag/ocr), `@tetherto/wdk-*`, `hyperswarm`. The worklet RPC surface mirrors
  our existing Route Handlers (`/api/{chat,rag,brief,wallet,station,voice}`) so the
  same `@leclerc/core` request/response types serve both PWA-over-HTTP and
  native-over-worklet-RPC.

> ⚠️ The PearPass *engine* (`@tetherto/pearpass-lib-vault-core`) is their worklet's
> payload, not vendored here. We write our own worklet payload (QVAC + WDK +
> Hyperswarm); PearPass is the reference for *how to host and bridge* it.

## Voice across surfaces
- **PWA:** `lib/voice/client.ts` ↔ `services/voice` WS (continuous VAD). Built.
- **Native:** the same ASR→LLM→TTS loop ([13](./13-cleo-plan.md) §voice) runs
  **inside the worklet** (no WS, no network). The shell streams mic frames to the
  worklet and plays returned PCM. Reuse the `services/voice/server.mjs` logic as
  the worklet's voice module; swap the `ws` transport for worklet RPC/IPC.

## Design across surfaces
One design system, [DESIGN.md](./DESIGN.md): dark, serif-for-voice, mono-for-data,
two scarce accents, the soft spy gradient, mobile-first. Web uses Tailwind tokens
(`globals.css`); native mirrors the same tokens. The `app-background` WebGL gradient
runs on web + Electron; on RN use a native gradient/shader equivalent at the same
low-contrast, slow drift.

## Build order (surfaces)
1. **PWA** — done (Cleo home, voice client, components, finance, RAG chips).
2. **Extract `@leclerc/core`** — move shared types/logic out of `apps/app/src/lib`.
3. **Desktop (Pear+Electron)** — `apps/desktop`, worklet host via the PearPass
   desktop bridge pattern; on-device QVAC + voice; reuse `@leclerc/ui`.
4. **Mobile (Expo+Bare)** — `apps/mobile`, `react-native-bare-kit` worklet; on-device
   QVAC + voice; secure-storage seed; the PearPass mobile shell as blueprint.

## Acceptance (per surface)
- **PWA:** Cleo home works; voice via station; finance + RAG + brief; offline after cache.
- **Desktop:** launches as a Pear/Electron app; QVAC + voice run **on-device** (no station); same Cleo UI; packages build (`pear build` / electron-builder).
- **Mobile:** Expo app installs; Bare worklet runs QVAC + voice **on-device**; secure-storage seed; same Cleo UI; `bare-pack` bundles for iOS/Android.
- All three import `@leclerc/core` (one brain) and honor [DESIGN.md](./DESIGN.md).
