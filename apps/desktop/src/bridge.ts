import {
  DESKTOP_CAPABILITIES,
  type LeclercRpcRequest,
  type LeclercRpcResponse,
  type SurfaceCapabilities,
} from "@leclerc/core";
import { createLeclercWorkletHost, type LeclercWorkletHost } from "@leclerc/worklet";

export interface DesktopBridge {
  capabilities: SurfaceCapabilities;
  invoke(request: LeclercRpcRequest): Promise<LeclercRpcResponse>;
}

export function createDesktopBridge(host: LeclercWorkletHost = createLeclercWorkletHost()): DesktopBridge {
  return {
    capabilities: DESKTOP_CAPABILITIES,
    invoke(request) {
      return host.handle(request);
    },
  };
}
