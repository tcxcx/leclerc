import {
  DESKTOP_CAPABILITIES,
  createWalletNetworkSelector,
  greeting,
  starterChips,
  type Locale,
  type WalletNetworkSelectorInput,
  type WalletNetworkSelectorModel,
} from "@leclerc/core";

export interface DesktopRendererModel {
  title: "LeClerc";
  surface: "desktop";
  greeting: string;
  chips: ReturnType<typeof starterChips>;
  capabilitySummary: string;
  walletSelector: WalletNetworkSelectorModel;
}

export function createDesktopRendererModel(
  locale: Locale = "es",
  wallet?: WalletNetworkSelectorInput,
): DesktopRendererModel {
  return {
    title: "LeClerc",
    surface: "desktop",
    greeting: greeting(locale),
    chips: starterChips(locale),
    capabilitySummary: `${DESKTOP_CAPABILITIES.qvac}:${DESKTOP_CAPABILITIES.voice}:${DESKTOP_CAPABILITIES.wallet}`,
    walletSelector: createWalletNetworkSelector(wallet),
  };
}
