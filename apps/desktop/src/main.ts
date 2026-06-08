import {
  DESKTOP_CAPABILITIES,
  greeting,
  starterChips,
  walletNetworkOptions,
  type Locale,
  type SurfaceCapabilities,
  type WalletNetworkOption,
} from "@leclerc/core";
import { createLeclercWorkletHost, type WorkletEnvironment } from "@leclerc/worklet";
import { createDesktopBridge, type DesktopBridge } from "./bridge";

export interface DesktopShellConfig {
  locale?: Locale;
  env?: WorkletEnvironment;
}

export interface DesktopShell {
  surface: "desktop";
  capabilities: SurfaceCapabilities;
  walletNetworks: WalletNetworkOption[];
  bridge: DesktopBridge;
  boot: {
    greeting: string;
    starterIntents: string[];
    nativeStatus: ReturnType<ReturnType<typeof createLeclercWorkletHost>["status"]>;
  };
}

export function createDesktopShell(config: DesktopShellConfig = {}): DesktopShell {
  const locale = config.locale ?? "es";
  const host = createLeclercWorkletHost();
  return {
    surface: "desktop",
    capabilities: DESKTOP_CAPABILITIES,
    walletNetworks: walletNetworkOptions(),
    bridge: createDesktopBridge(host),
    boot: {
      greeting: greeting(locale),
      starterIntents: starterChips(locale).map((chip) => chip.intent),
      nativeStatus: host.status(config.env),
    },
  };
}
