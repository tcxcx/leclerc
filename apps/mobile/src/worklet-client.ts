import {
  MOBILE_CAPABILITIES,
  createWalletNetworkSelector,
  walletNetworkOptions,
  type LeclercRpcRequest,
  type LeclercRpcResponse,
  type SurfaceCapabilities,
  type WalletNetworkOption,
  type WalletNetworkSelectorModel,
} from "@leclerc/core";
import {
  createLeclercWorkletHost,
  type LeclercWorkletHost,
  type WorkletEnvironment,
  type WorkletStatus,
} from "@leclerc/worklet";

export interface MobileWorkletClient {
  capabilities: SurfaceCapabilities;
  walletNetworks: WalletNetworkOption[];
  walletSelector: WalletNetworkSelectorModel;
  status(env?: WorkletEnvironment): WorkletStatus;
  invoke(request: LeclercRpcRequest): Promise<LeclercRpcResponse>;
}

export function createMobileWorkletClient(
  host: LeclercWorkletHost = createLeclercWorkletHost(),
): MobileWorkletClient {
  const walletNetworks = walletNetworkOptions();
  return {
    capabilities: MOBILE_CAPABILITIES,
    walletNetworks,
    walletSelector: createWalletNetworkSelector({}, walletNetworks),
    status(env) {
      return host.status(env);
    },
    invoke(request) {
      return host.handle(request);
    },
  };
}
