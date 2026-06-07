import {
  MOBILE_CAPABILITIES,
  type LeclercRpcRequest,
  type LeclercRpcResponse,
  type SurfaceCapabilities,
} from "@leclerc/core";
import {
  createLeclercWorkletHost,
  type LeclercWorkletHost,
  type WorkletEnvironment,
  type WorkletStatus,
} from "@leclerc/worklet";

export interface MobileWorkletClient {
  capabilities: SurfaceCapabilities;
  status(env?: WorkletEnvironment): WorkletStatus;
  invoke(request: LeclercRpcRequest): Promise<LeclercRpcResponse>;
}

export function createMobileWorkletClient(
  host: LeclercWorkletHost = createLeclercWorkletHost(),
): MobileWorkletClient {
  return {
    capabilities: MOBILE_CAPABILITIES,
    status(env) {
      return host.status(env);
    },
    invoke(request) {
      return host.handle(request);
    },
  };
}
