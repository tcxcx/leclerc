import {
  DESKTOP_CAPABILITIES,
  brandAppMetadata,
  createWalletNetworkSelector,
  greeting,
  nativeSurfaceReadiness,
  starterChips,
  type BrandAppMetadata,
  type Locale,
  type NativeSurfaceReadiness,
  type WalletNetworkSelectorInput,
  type WalletNetworkSelectorModel,
} from "@leclerc/core";

export interface DesktopRendererModel {
  title: string;
  brand: BrandAppMetadata;
  surface: "desktop";
  readiness: NativeSurfaceReadiness;
  greeting: string;
  chips: ReturnType<typeof starterChips>;
  capabilitySummary: string;
  walletSelector: WalletNetworkSelectorModel;
}

export function createDesktopRendererModel(
  locale: Locale = "es",
  wallet?: WalletNetworkSelectorInput,
): DesktopRendererModel {
  const brand = brandAppMetadata();
  return {
    title: brand.productName,
    brand,
    surface: "desktop",
    readiness: nativeSurfaceReadiness("desktop"),
    greeting: greeting(locale),
    chips: starterChips(locale),
    capabilitySummary: `${DESKTOP_CAPABILITIES.qvac}:${DESKTOP_CAPABILITIES.voice}:${DESKTOP_CAPABILITIES.wallet}`,
    walletSelector: createWalletNetworkSelector(wallet),
  };
}
