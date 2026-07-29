import {
  WORKLET_CAPABILITIES,
  nativeWorkletAdapterMissingErrorCode,
  nativeWorkletAdapterMissingLogMessage,
  nativeWorkletAdapterMissingMessage,
  nativeWorkletMissingEnv,
  nativeWorkletRuntimeStatus,
  nativeWorkletStationPublicKey,
  rpcError,
  rpcOk,
  type LeclercRpcMethod,
  type LeclercRpcPayload,
  type LeclercRpcRequest,
  type LeclercRpcResponse,
  type NativeWorkletEnvVar,
  type SurfaceCapabilities,
  type WorkletRuntimeStatus,
} from "@leclerc/core";

export type { WorkletRuntimeStatus } from "@leclerc/core";

export interface WorkletStatus {
  capabilities: SurfaceCapabilities;
  qvac: WorkletRuntimeStatus;
  wdk: WorkletRuntimeStatus;
  p2p: WorkletRuntimeStatus;
  missingEnv: string[];
}

export interface WorkletEnvironment extends Partial<Record<NativeWorkletEnvVar, string | undefined>> {
  LECLERC_MEDPSY_SRC?: string;
  LECLERC_OCR_SRC?: string;
  QVAC_HYPERSWARM_SEED?: string;
  USDT_ADDRESS?: string;
  EVM_CHAIN_ID?: string;
  EVM_RPC_URL?: string;
}

export interface WorkletAdapter {
  handle(request: LeclercRpcRequest): Promise<LeclercRpcResponse>;
}

export interface WorkletHostOptions {
  adapter?: WorkletAdapter;
  logger?: (message: string, meta?: Record<string, unknown>) => void;
}

export interface LeclercWorkletHost {
  capabilities: SurfaceCapabilities;
  status(env?: WorkletEnvironment): WorkletStatus;
  handle<M extends LeclercRpcMethod>(
    request: Extract<LeclercRpcRequest, { method: M }>,
  ): Promise<LeclercRpcResponse<LeclercRpcPayload<M>>>;
}

export function createLeclercWorkletHost(options: WorkletHostOptions = {}): LeclercWorkletHost {
  return {
    capabilities: WORKLET_CAPABILITIES,
    status(env = {}) {
      const runtimeStatus = nativeWorkletRuntimeStatus(Boolean(options.adapter));
      const missingEnv = nativeWorkletMissingEnv(env);
      return {
        capabilities: WORKLET_CAPABILITIES,
        qvac: runtimeStatus,
        wdk: runtimeStatus,
        p2p: runtimeStatus,
        missingEnv,
      };
    },
    async handle(request) {
      if (options.adapter) {
        return options.adapter.handle(request) as Promise<
          LeclercRpcResponse<LeclercRpcPayload<typeof request.method>>
        >;
      }

      options.logger?.(nativeWorkletAdapterMissingLogMessage(), {
        method: request.method,
        requestId: request.id,
      });
      return rpcError(
        request,
        nativeWorkletAdapterMissingErrorCode(),
        nativeWorkletAdapterMissingMessage(request.method),
      );
    },
  };
}

export function createWorkletStatusResponse(request: Extract<LeclercRpcRequest, { method: "station" }>) {
  return rpcOk(request, {
    publicKey: nativeWorkletStationPublicKey(),
  });
}

export { WORKLET_CAPABILITIES };
export type {
  LeclercRpcMethod,
  LeclercRpcPayload,
  LeclercRpcRequest,
  LeclercRpcResponse,
};
