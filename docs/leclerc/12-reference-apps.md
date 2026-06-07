# 12 · Reference Apps — PearPass (Holepunch/Bare benchmark)

Tether's PearPass apps are vendored under [`references/`](../../references/README.md) as a **direct, production-grade benchmark** for the parts of LeClerc that have no analog in the halketon baseline: **Bare worklet hosting, P2P, encrypted local vault, QR pairing, offline job queue, and i18n**. They are the closest real-world example of the exact stack LeClerc targets.

> Use them to copy *patterns*, not files. Don't import from `references/`.

## Why these matter to LeClerc
PearPass = local-first, P2P, e2e-encrypted password manager on Holepunch/Pear/Bare. LeClerc = local-first, P2P, e2e-encrypted intelligence app on QVAC (which itself bundles Holepunch). Same architecture; swap "vault" for "dossier + inference". The hard P2P/CRDT/encryption work that LeClerc needs is demonstrated here in shipping code.

**Mental model:** PearPass loads `@tetherto/pearpass-lib-vault-core` into a **Bare worklet**, and the native UI talks to it over RPC. LeClerc does the same shape: a **Bare/Node worklet hosting `@qvac/sdk` + `@tetherto/wdk-*` + Hyperswarm**, with the Next.js/Expo UI talking to it. PearPass is the reference for that bridge.

## Concern → file map

### A. Bare worklet hosting (powers LeClerc mobile on-device QVAC/WDK — [01](./01-architecture.md), [05](./05-p2p.md))
| LeClerc need | PearPass reference file |
|---|---|
| RN → Bare worklet bootstrap (`react-native-bare-kit`) | `references/pearpass-mobile/src/worklet/index.js` |
| What runs *inside* the worklet (entry the bundler points at) | upstream `@tetherto/pearpass-lib-vault-core/src/worklet/app.js` (see mobile `package.json` `bundle:*` scripts) |
| Bare bundling for iOS/Android (`bare-pack`) | `references/pearpass-mobile/package.json` → `bundle:ios` / `bundle:android` |
| Native module bridging | `references/pearpass-mobile/src/native-modules/` |
| Desktop equivalent: Electron ↔ vault client proxy | `references/pearpass-desktop/src/electron/vaultClientProxy.js`, `src/services/createOrGetPearpassClient.js`, `src/services/createOrGetPipe.js`, `src/services/nativeMessagingIPCServer.js` |

### B. Encrypted storage, identity & sessions (powers LeClerc dossier + seed at rest — [03](./03-data-and-rag.md), [06](./06-wallet.md))
| LeClerc need | PearPass reference file |
|---|---|
| App identity / keypair management | `references/pearpass-desktop/src/services/security/appIdentity.js` |
| Session lifecycle (unlock/lock, in-memory key) | `references/pearpass-desktop/src/services/security/sessionManager.js` |
| Stale-vault cleanup / wipe patterns | `references/pearpass-desktop/electron/clearStaleVaultsDir.cjs` |
| `sodium-native` crypto in a Bare/RN context | mobile `package.json` dep + worklet usage |

### C. P2P pairing & transport (powers LeClerc delegation + dead-drop — [05](./05-p2p.md))
| LeClerc need | PearPass reference file |
|---|---|
| QR-code pairing (scan a peer/topic) | `references/pearpass-mobile/src/hooks/useQRScanner.js` |
| Import-over-channel UX | `references/pearpass-mobile/src/screens/ImportItems/index.tsx`, `references/pearpass-desktop/src/pages/SettingsView/content/ImportItemsContent/index.tsx` |
| DHT / drive deps & versions to match | desktop `package.json` (`hyperdht`, `hyperdrive`, `compact-encoding`, `pear-runtime`) |

### D. Offline job queue (powers LeClerc deferred sync/sends when offline — [05](./05-p2p.md))
| LeClerc need | PearPass reference file |
|---|---|
| Durable offline job queue (read/process/worker) | `references/pearpass-mobile/src/jobQueue/` (`processJobQueue.js`, `JobWorker.js`, `readJobQueue.js`, `useJobQueueProcessor.js`) |
| Lifecycle design notes | `references/pearpass-mobile/src/jobQueue/job-queue-lifecycle.md` |

### E. i18n (secondary reference to [07](./07-i18n.md))
PearPass uses **lingui** (`@lingui`, `lingui.config.js`), not next-international. LeClerc's web app stays on next-international (defi-web-app pattern). Use PearPass only as a reference for **how a Bare/RN app structures translations** if/when building the Expo client. Files: `references/pearpass-mobile/src/main.jsx`, `lingui.config.js`.

### F. Project conventions worth skimming
- `references/pearpass-*/AGENTS.md` and `CLAUDE.md` — how Tether structures agent/dev guidance for these apps (useful tone/structure for our own).
- `references/pearpass-*/README.md` — build/run instructions for Pear desktop and Expo+Bare mobile (the real reproducibility bar — informs [11](./11-codex-guide.md)).

## Going deeper (optional)
The vault engine itself (`@tetherto/pearpass-lib-vault-core`) is the richest P2P/CRDT reference but isn't vendored here. If Codex needs it, either (a) read it from `node_modules` after the mobile app's `npm install`, or (b) clone `tetherto/pearpass-lib-vault-core` separately. For LeClerc v1 the shells above are enough to copy the worklet-hosting and pairing patterns.
