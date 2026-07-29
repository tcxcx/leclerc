# LeClerc desktop

Pear + Electron shell scaffold for the General Purpose surface.

This package imports `@leclerc/core` for contracts, the shared operative
control-center model, the wallet network-token selector, native readiness
status, and `@leclerc/worklet` for the native RPC host. It intentionally does
not vendor Electron, Pear, QVAC, WDK, or Hyperswarm yet. The native worklet
host uses the adapter router, but QVAC/WDK/P2P handlers still return
`not-configured`. The next implementation step is to add the PearPass-style
Electron bridge from `references/pearpass-desktop`, render `opsConsole.state`
plus `walletSelector.availableTokens`, and wire SDK handlers after rechecking
installed SDK `.d.ts` files. The scaffold reports
`nativeSurfaceReadiness("desktop").installable === false` until a real desktop
artifact is produced.

Current gate:

```sh
bun --filter @leclerc/desktop typecheck
```
