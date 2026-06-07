# M11 desktop and mobile native scaffolds

Date: 2026-06-07
Branch: feat/leclerc-scaffold

## Result

- Added `apps/desktop` as `@leclerc/desktop`.
- Added a Pear + Electron bridge scaffold that imports `@leclerc/core` and
  `@leclerc/worklet`.
- Added `apps/mobile` as `@leclerc/mobile`.
- Added an Expo + Bare client scaffold that imports `@leclerc/core` and
  `@leclerc/worklet`.
- Updated the shipped PWA finance helper to delegate pure spend insights to
  `@leclerc/core/finance`, so PWA, desktop, and mobile now all consume the
  shared core package.

## QVAC / WDK verification

No new QVAC SDK or WDK calls were wired in this milestone. Desktop and mobile
use the worklet RPC scaffold only. Native QVAC, voice, WDK wallet, and
Hyperswarm calls remain behind the missing adapter boundary until the concrete
native dependencies are added and their installed `.d.ts` and QVAC examples are
checked again.

Missing native runtime dependencies:

- Electron / Pear runtime for `apps/desktop`.
- Expo / React Native / `react-native-bare-kit` / `bare-pack` for `apps/mobile`.
- Native worklet adapter for QVAC, WDK, and Hyperswarm.

Environment to document when the adapter is wired:

- `LECLERC_MEDPSY_SRC`
- `LECLERC_OCR_SRC`
- `QVAC_HYPERSWARM_SEED`
- `USDT_ADDRESS`
- `EVM_CHAIN_ID`
- `EVM_RPC_URL`
- `SPARK_NETWORK=TESTNET`

## Commands

```sh
bun install
bun --filter @leclerc/core typecheck
bun --filter @leclerc/worklet typecheck
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
bun --filter app typecheck
bun --filter @leclerc/desktop build
bun --filter @leclerc/mobile bundle:ios
bun --filter @leclerc/mobile bundle:android
cd apps/desktop && bun -e 'import { createDesktopShell } from "./src/main.ts"; const shell = createDesktopShell({ locale: "en", env: { SPARK_NETWORK: "TESTNET" } }); console.log(JSON.stringify({ surface: shell.surface, qvac: shell.capabilities.qvac, greeting: shell.boot.greeting, native: shell.boot.nativeStatus.qvac }));'
cd apps/mobile && bun -e 'import { createMobileAppModel } from "./src/App.ts"; const app = createMobileAppModel("es"); console.log(JSON.stringify({ surface: app.surface, qvac: app.capabilities.qvac, greeting: app.greeting, native: app.worklet.status({ SPARK_NETWORK: "TESTNET" }).qvac }));'
```

Smoke output:

```json
{"surface":"desktop","qvac":"on-device","greeting":"Hey you.","native":"missing-adapter"}
{"surface":"mobile","qvac":"on-device","greeting":"Hola, operativo.","native":"missing-adapter"}
```

## Notes

This satisfies the incremental scaffold portion of
`docs/leclerc/14-surfaces-and-shared-core.md`. The native shells compile and
share contracts, but they do not yet launch full Electron/Pear or Expo/Bare
apps because those runtime dependencies are not vendored in this repository.
