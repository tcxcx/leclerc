import {
  MOBILE_CAPABILITIES,
  greeting,
  starterChips,
  walletNetworkOptions,
  type Locale,
  type SurfaceCapabilities,
  type WalletNetworkOption,
} from "@leclerc/core";
import { createMobileWorkletClient, type MobileWorkletClient } from "./worklet-client";

export interface MobileAppModel {
  surface: "mobile";
  capabilities: SurfaceCapabilities;
  walletNetworks: WalletNetworkOption[];
  greeting: string;
  starterIntents: string[];
  worklet: MobileWorkletClient;
}

export function createMobileAppModel(locale: Locale = "es"): MobileAppModel {
  return {
    surface: "mobile",
    capabilities: MOBILE_CAPABILITIES,
    walletNetworks: walletNetworkOptions(),
    greeting: greeting(locale),
    starterIntents: starterChips(locale).map((chip) => chip.intent),
    worklet: createMobileWorkletClient(),
  };
}
