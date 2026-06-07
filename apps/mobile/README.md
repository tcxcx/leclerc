# LeClerc mobile

Expo + Bare shell scaffold for the Mobile surface.

This package imports `@leclerc/core` for shared contracts and
`@leclerc/worklet` for the Bare RPC boundary. It intentionally does not vendor
Expo, React Native, `react-native-bare-kit`, `bare-pack`, QVAC, WDK, or
Hyperswarm yet. The next implementation step is to mirror
`references/pearpass-mobile/src/worklet/index.js`, add the linked Bare bundles,
and wire the adapter after rechecking installed SDK `.d.ts` files.

Current gates:

```sh
bun --filter @leclerc/mobile typecheck
bun --filter @leclerc/mobile bundle:ios
bun --filter @leclerc/mobile bundle:android
```
