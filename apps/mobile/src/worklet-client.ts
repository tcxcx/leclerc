import {
  MOBILE_CAPABILITIES,
  walletNetworkOptions,
  type LeclercRpcRequest,
  type LeclercRpcResponse,
  type SurfaceCapabilities,
  type WalletNetworkOption,
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
  status(env?: WorkletEnvironment): WorkletStatus;
  invoke(request: LeclercRpcRequest): Promise<LeclercRpcResponse>;
}

export function createMobileWorkletClient(
  host: LeclercWorkletHost = createLeclercWorkletHost(),
): MobileWorkletClient {
  return {
    capabilities: MOBILE_CAPABILITIES,
    walletNetworks: walletNetworkOptions(),
    status(env) {
      return host.status(env);
    },
    invoke(request) {
      return host.handle(request);
    },
  };
}
