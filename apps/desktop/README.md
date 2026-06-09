# LeClerc desktop

Pear + Electron shell scaffold for the General Purpose surface.

This package imports `@leclerc/core` for contracts, the shared operative
control-center model, the wallet network-token selector, and `@leclerc/worklet`
for the native RPC host. It intentionally does not vendor Electron, Pear, QVAC,
WDK, or Hyperswarm yet. The next implementation step is to add the
PearPass-style Electron bridge from `references/pearpass-desktop`, render
`opsConsole.state` plus `walletSelector.availableTokens`, and wire the adapter
after rechecking installed SDK `.d.ts` files.

Current gate:

```sh
bun --filter @leclerc/desktop typecheck
```
