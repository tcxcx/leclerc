import {
  MOBILE_CAPABILITIES,
  greeting,
  starterChips,
  type Locale,
  type SurfaceCapabilities,
} from "@leclerc/core";
import { createMobileWorkletClient, type MobileWorkletClient } from "./worklet-client";

export interface MobileAppModel {
  surface: "mobile";
  capabilities: SurfaceCapabilities;
  greeting: string;
  starterIntents: string[];
  worklet: MobileWorkletClient;
}

export function createMobileAppModel(locale: Locale = "es"): MobileAppModel {
  return {
    surface: "mobile",
    capabilities: MOBILE_CAPABILITIES,
    greeting: greeting(locale),
    starterIntents: starterChips(locale).map((chip) => chip.intent),
    worklet: createMobileWorkletClient(),
  };
}
