import {
  DESKTOP_CAPABILITIES,
  walletNetworkOptions,
  type LeclercRpcRequest,
  type LeclercRpcResponse,
  type SurfaceCapabilities,
  type WalletNetworkOption,
} from "@leclerc/core";
import {
  createLeclercWorkletHost,
  createNativeWorkletAdapter,
  type LeclercWorkletHost,
} from "@leclerc/worklet";

export interface DesktopBridge {
  capabilities: SurfaceCapabilities;
  walletNetworks: WalletNetworkOption[];
  invoke(request: LeclercRpcRequest): Promise<LeclercRpcResponse>;
}

export function createDesktopBridge(
  host: LeclercWorkletHost = createLeclercWorkletHost({ adapter: createNativeWorkletAdapter() }),
): DesktopBridge {
  return {
    capabilities: DESKTOP_CAPABILITIES,
    walletNetworks: walletNetworkOptions(),
    invoke(request) {
      return host.handle(request);
    },
  };
}
