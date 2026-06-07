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
