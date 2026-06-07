# References — Tether PearPass apps (vendored benchmarks)

Read-only reference source vendored for the LeClerc build. These are **Tether's open-source PearPass apps** — the canonical example of a **local-first, P2P, end-to-end-encrypted app on the Holepunch/Pear/Bare stack**. They are the closest production analog to LeClerc's offline + P2P + encrypted-storage requirements, so Codex should mine them for real patterns rather than inventing.

> ⚠️ These are **references, not dependencies.** Do not import from `references/` in app code and do not add them to the workspace. Copy *patterns*, not files.

## What's here

| Dir | Upstream | Vendored commit | Stack |
|---|---|---|---|
| `pearpass-desktop/` | https://github.com/tetherto/pearpass-app-desktop | `323afc5300e8e3e37b16430f08517882ce379db9` | Pear + Electron (`pear-electron`, `pear-runtime`, `hyperdht`, `hyperdrive`) |
| `pearpass-mobile/` | https://github.com/tetherto/pearpass-app-mobile | `89c55b40401e9257621f5a8856fef6de44536889` | Expo + React Native + Bare (`react-native-bare-kit`, `bare-pack`, `sodium-native`) |

Vendored on 2026-06-06. Licenses preserved (`LICENSE.md` / `NOTICE.md` in each).

## What was stripped (to keep the repo lean — code only)
Removed from each: `.git`, `e2e/`, `assets/`, `plugins/`, `metadata/`, `resources/`, `build-assets/`, `appling/`, `flatpak/`, `snap/`, `fdroid/`, `.github/`, `.husky/`, `package-lock.json`, editor dirs. **All `src/`, configs, `docs/`, and `electron/` source is intact.** For the full repos (assets, e2e, build tooling) clone the upstream URLs at the SHAs above.

## The key thing to understand
The actual **P2P + CRDT + encrypted-vault engine is NOT in these repos** — it lives in their shared dependency **`@tetherto/pearpass-lib-vault-core`**, loaded into a **Bare worklet**. These two repos are the **UI shells** (desktop/mobile) that wire a native app to that Bare worklet. They are the benchmark for *how LeClerc should host its own Bare worklet* (QVAC `@qvac/sdk` + WDK both run in Node/Bare exactly this way) and *how to bridge a UI to it*.

See [`docs/leclerc/12-reference-apps.md`](../docs/leclerc/12-reference-apps.md) for the concern→file map.
