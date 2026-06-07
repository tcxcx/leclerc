import { DESKTOP_CAPABILITIES, greeting, starterChips, type Locale } from "@leclerc/core";

export interface DesktopRendererModel {
  title: "LeClerc";
  surface: "desktop";
  greeting: string;
  chips: ReturnType<typeof starterChips>;
  capabilitySummary: string;
}

export function createDesktopRendererModel(locale: Locale = "es"): DesktopRendererModel {
  return {
    title: "LeClerc",
    surface: "desktop",
    greeting: greeting(locale),
    chips: starterChips(locale),
    capabilitySummary: `${DESKTOP_CAPABILITIES.qvac}:${DESKTOP_CAPABILITIES.voice}:${DESKTOP_CAPABILITIES.wallet}`,
  };
}
