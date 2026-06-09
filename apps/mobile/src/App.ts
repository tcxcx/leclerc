import {
  MOBILE_CAPABILITIES,
  createWalletNetworkSelector,
  defaultOpsConsoleState,
  greeting,
  opsConsoleCounts,
  starterChips,
  walletNetworkOptions,
  type Locale,
  type OpsConsoleState,
  type SurfaceCapabilities,
  type WalletNetworkOption,
  type WalletNetworkSelectorInput,
  type WalletNetworkSelectorModel,
} from "@leclerc/core";
import { createMobileWorkletClient, type MobileWorkletClient } from "./worklet-client";

export interface MobileAppModelOptions {
  wallet?: WalletNetworkSelectorInput;
}

export interface MobileAppModel {
  surface: "mobile";
  capabilities: SurfaceCapabilities;
  walletNetworks: WalletNetworkOption[];
  walletSelector: WalletNetworkSelectorModel;
  opsConsole: {
    state: OpsConsoleState;
    counts: ReturnType<typeof opsConsoleCounts>;
  };
  greeting: string;
  starterIntents: string[];
  worklet: MobileWorkletClient;
}

export function createMobileAppModel(
  locale: Locale = "es",
  options: MobileAppModelOptions = {},
): MobileAppModel {
  const opsState = defaultOpsConsoleState();
  const walletNetworks = walletNetworkOptions();
  const walletSelector = createWalletNetworkSelector(options.wallet, walletNetworks);
  return {
    surface: "mobile",
    capabilities: MOBILE_CAPABILITIES,
    walletNetworks,
    walletSelector,
    opsConsole: {
      state: opsState,
      counts: opsConsoleCounts(opsState),
    },
    greeting: greeting(locale),
    starterIntents: starterChips(locale).map((chip) => chip.intent),
    worklet: createMobileWorkletClient(),
  };
}
