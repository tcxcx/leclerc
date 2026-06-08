import {
  MOBILE_CAPABILITIES,
  defaultOpsConsoleState,
  greeting,
  opsConsoleCounts,
  starterChips,
  walletNetworkOptions,
  type Locale,
  type OpsConsoleState,
  type SurfaceCapabilities,
  type WalletNetworkOption,
} from "@leclerc/core";
import { createMobileWorkletClient, type MobileWorkletClient } from "./worklet-client";

export interface MobileAppModel {
  surface: "mobile";
  capabilities: SurfaceCapabilities;
  walletNetworks: WalletNetworkOption[];
  opsConsole: {
    state: OpsConsoleState;
    counts: ReturnType<typeof opsConsoleCounts>;
  };
  greeting: string;
  starterIntents: string[];
  worklet: MobileWorkletClient;
}

export function createMobileAppModel(locale: Locale = "es"): MobileAppModel {
  const opsState = defaultOpsConsoleState();
  return {
    surface: "mobile",
    capabilities: MOBILE_CAPABILITIES,
    walletNetworks: walletNetworkOptions(),
    opsConsole: {
      state: opsState,
      counts: opsConsoleCounts(opsState),
    },
    greeting: greeting(locale),
    starterIntents: starterChips(locale).map((chip) => chip.intent),
    worklet: createMobileWorkletClient(),
  };
}
