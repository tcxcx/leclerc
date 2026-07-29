# Mobile Bare bundle proof — 2026-07-29

Branch: `feat/leclerc-scaffold`

Commands run:

```bash
bun --filter @leclerc/mobile typecheck
bun --filter @leclerc/mobile bundle:ios
bun --filter @leclerc/mobile bundle:android
wc -c apps/mobile/bundles/app-ios.bundle.js apps/mobile/bundles/app-android.bundle.js
```

Results:

- `@leclerc/mobile typecheck` exited 0.
- `@leclerc/mobile bundle:ios` exited 0.
- `@leclerc/mobile bundle:android` exited 0.
- `apps/mobile/bundles/app-ios.bundle.js`: 1709 bytes.
- `apps/mobile/bundles/app-android.bundle.js`: 1709 bytes.

The generated `.bundle.js` files are ignored by `apps/mobile/bundles/.gitignore`.
They prove the placeholder Bare worklet entry packs for iOS/Android; they are not
installable native artifacts. Signed `.apk`/`.aab`/`.ipa` output remains pending.
