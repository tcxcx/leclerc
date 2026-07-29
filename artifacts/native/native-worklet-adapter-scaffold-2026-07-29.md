# Native worklet adapter scaffold proof - 2026-07-29

Branch: `feat/leclerc-scaffold`

## SDK/type verification

Checked before wiring this milestone:

- QVAC SDK declarations:
  `node_modules/.bun/@qvac+sdk@0.12.2+70cf2508f39d6f9e/node_modules/@qvac/sdk/dist/index.d.ts`
  exports `completion`, `loadModel`, `transcribe`, `ragIngest`,
  `ragSearch`, `ocr`, `startQVACProvider`, and related helpers.
- WDK Spark declarations:
  `node_modules/.bun/@tetherto+wdk-wallet-spark@1.0.0-beta.19+6dfd42b20e6ec6ff/node_modules/@tetherto/wdk-wallet-spark/types/index.d.ts`
  exports `WalletManagerSpark` and Spark wallet/account types.
- WDK EVM declarations:
  `node_modules/.bun/@tetherto+wdk-wallet-evm@1.0.0-beta.13+030c6f70d42d168c/node_modules/@tetherto/wdk-wallet-evm/types/index.d.ts`
  exports `WalletManagerEvm` and EVM wallet/account types.
- React Native Bare Kit declarations:
  `node_modules/.bun/react-native-bare-kit@0.14.2+6adff1a738b1dc8c/node_modules/react-native-bare-kit/index.d.ts`
  exposes `new Worklet(options?)` and `worklet.start(filename, source?, args?)`.

No direct QVAC, WDK, or Hyperswarm SDK calls were added in this milestone. The
new adapter router only exposes typed injection points and story-owned
`NATIVE_COMPONENT_NOT_CONFIGURED` errors until native SDK handlers are supplied.

## Commands run

```bash
bun --filter @leclerc/core typecheck
bun --filter @leclerc/worklet typecheck
bun --filter @leclerc/transfers typecheck
bun --filter @leclerc/desktop typecheck
bun --filter @leclerc/mobile typecheck
cd apps/app && bunx tsc --noEmit --pretty false
cd ../..
bun -e 'import { DEFAULT_NATIVE_WORKLET_STORY, nativeWorkletComponentNotConfiguredErrorCode, nativeWorkletComponentNotConfiguredEnvVars, nativeWorkletComponentNotConfiguredMessage } from "./packages/core/src/index.ts"; import { createDesktopShell } from "./apps/desktop/src/main.ts"; import { createMobileWorkletClient } from "./apps/mobile/src/worklet-client.ts"; import { createLeclercWorkletHost, createNativeWorkletAdapter } from "./packages/worklet/src/index.ts"; const host=createLeclercWorkletHost({adapter:createNativeWorkletAdapter()}); const status=host.status({SPARK_NETWORK:"TESTNET"}); const station=await host.handle({id:"station",method:"station",payload:{action:"start"}}); const wallet=await host.handle({id:"wallet",method:"wallet",payload:{action:"generate"}}); const rag=await host.handle({id:"rag",method:"rag",payload:{action:"query",query:"cleo"}}); const injected=createLeclercWorkletHost({adapter:createNativeWorkletAdapter({env:{SPARK_NETWORK:"TESTNET"},wallet:{wallet:(request)=>({id:request.id,ok:true,payload:{seed:"demo-seed"}})}})}); const injectedStatus=injected.status({SPARK_NETWORK:"TESTNET"}); const injectedWallet=await injected.handle({id:"gen",method:"wallet",payload:{action:"generate"}}); const desktop=createDesktopShell({env:{SPARK_NETWORK:"TESTNET"}}); const mobile=createMobileWorkletClient(); const mobileStatus=mobile.status({SPARK_NETWORK:"TESTNET"}); const values={story:DEFAULT_NATIVE_WORKLET_STORY.id,status,station,wallet,rag,injectedStatus,injectedWallet,desktop:desktop.boot.nativeStatus,mobile:mobileStatus,errorCode:nativeWorkletComponentNotConfiguredErrorCode(),qvacEnv:nativeWorkletComponentNotConfiguredEnvVars("qvac"),wdkMessage:nativeWorkletComponentNotConfiguredMessage("wdk")}; console.log(JSON.stringify(values)); if (values.story!=="native-worklet-scaffold" || values.status.qvac!=="not-configured" || values.status.wdk!=="not-configured" || values.status.p2p!=="not-configured" || values.station.ok!==true || values.station.payload.publicKey!=="native-worklet-scaffold" || values.wallet.ok!==false || values.wallet.error.code!=="NATIVE_COMPONENT_NOT_CONFIGURED" || !values.wallet.error.message.includes("SPARK_NETWORK") || values.rag.ok!==false || values.injectedStatus.wdk!=="ready" || values.injectedWallet.ok!==true || values.injectedWallet.payload.seed!=="demo-seed" || values.desktop.wdk!=="not-configured" || values.mobile.qvac!=="not-configured" || values.errorCode!=="NATIVE_COMPONENT_NOT_CONFIGURED" || !values.qvacEnv.includes("LECLERC_QVAC_MODEL_SRC") || !values.wdkMessage.includes("EVM_RPC_URL")) process.exit(1);'
bun --filter @leclerc/mobile bundle:ios
bun --filter @leclerc/mobile bundle:android
bun --filter @leclerc/desktop build
bun --filter app lint
NODE_OPTIONS=--max-old-space-size=8192 bun --filter app build
git diff --check
lsof -nP -iTCP:7001 -sTCP:LISTEN
```

Results: all typecheck/lint/build/bundle commands exited 0. The smoke proved
default desktop/mobile native hosts are adapter-present but `not-configured`
for QVAC, WDK, and P2P; station start returns the scaffold public key; missing
wallet and RAG handlers return `NATIVE_COMPONENT_NOT_CONFIGURED`; and an
injected wallet handler flips WDK status to `ready`. `git diff --check` exited
0. `lsof` returned no rows on `:7001`.
