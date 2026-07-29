import {
  DESKTOP_CAPABILITIES,
  brandAppMetadata,
  createWalletNetworkSelector,
  defaultOpsConsoleState,
  greeting,
  opsConsoleCounts,
  starterChips,
  walletNetworkOptions,
  type BrandAppMetadata,
  type Locale,
  type OpsConsoleState,
  type SurfaceCapabilities,
  type WalletNetworkOption,
  type WalletNetworkSelectorInput,
  type WalletNetworkSelectorModel,
} from "@leclerc/core";
import { createLeclercWorkletHost, type WorkletEnvironment } from "@leclerc/worklet";
import { createDesktopBridge, type DesktopBridge } from "./bridge";

export interface DesktopShellConfig {
  locale?: Locale;
  env?: WorkletEnvironment;
  wallet?: WalletNetworkSelectorInput;
}

export interface DesktopShell {
  surface: "desktop";
  brand: BrandAppMetadata;
  capabilities: SurfaceCapabilities;
  walletNetworks: WalletNetworkOption[];
  walletSelector: WalletNetworkSelectorModel;
  opsConsole: {
    state: OpsConsoleState;
    counts: ReturnType<typeof opsConsoleCounts>;
  };
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
  const opsState = defaultOpsConsoleState();
  const walletNetworks = walletNetworkOptions();
  const walletSelector = createWalletNetworkSelector(config.wallet, walletNetworks);
  return {
    surface: "desktop",
    brand: brandAppMetadata(),
    capabilities: DESKTOP_CAPABILITIES,
    walletNetworks,
    walletSelector,
    opsConsole: {
      state: opsState,
      counts: opsConsoleCounts(opsState),
    },
    bridge: createDesktopBridge(host),
    boot: {
      greeting: greeting(locale),
      starterIntents: starterChips(locale).map((chip) => chip.intent),
      nativeStatus: host.status(config.env),
    },
  };
}
