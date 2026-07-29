# LeClerc mobile

Expo + Bare shell scaffold for the Mobile surface.

This package imports `@leclerc/core` for shared contracts, the operative
control-center model, the wallet network-token selector, native readiness
status, and `@leclerc/worklet` for the Bare RPC boundary. It now declares Expo,
React Native, `react-native-bare-kit`, and `bare-pack`, renders a minimal native
screen from `createMobileAppModel()`, and bundles a placeholder Bare worklet
entry. The native host uses the adapter router, but QVAC/WDK/P2P methods return
`not-configured` until handler implementations are supplied. The next
implementation step is to replace the placeholder worklet with handler-backed
QVAC/WDK/Hyperswarm execution after rechecking installed SDK `.d.ts` files.
The scaffold reports `nativeSurfaceReadiness("mobile").installable === false`
until a real mobile artifact is produced.

Current gates:

```sh
bun --filter @leclerc/mobile typecheck
bun --filter @leclerc/mobile bundle:ios
bun --filter @leclerc/mobile bundle:android
```

## Native build artifact requirement

The landing page must not expose the Expo app as a completed download until this
package produces a real native artifact from an Expo/Bare build. A valid artifact
is one of:

- iOS: a signed `.ipa` from EAS Build or an equivalent local Xcode archive.
- Android: a signed `.apk` or `.aab` from EAS Build or an equivalent local
  Gradle build.

Placeholder `bundle:ios` and `bundle:android` scripts only prove TypeScript
compatibility for the scaffold. They are not installable native builds and should
remain documented as pending in PWA/landing artifacts.
