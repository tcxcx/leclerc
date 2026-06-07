import {
  WORKLET_CAPABILITIES,
  rpcError,
  rpcOk,
  type LeclercRpcMethod,
  type LeclercRpcPayload,
  type LeclercRpcRequest,
  type LeclercRpcResponse,
  type SurfaceCapabilities,
} from "@leclerc/core";

export type WorkletRuntimeStatus = "ready" | "not-configured" | "missing-adapter";

export interface WorkletStatus {
  capabilities: SurfaceCapabilities;
  qvac: WorkletRuntimeStatus;
  wdk: WorkletRuntimeStatus;
  p2p: WorkletRuntimeStatus;
  missingEnv: string[];
}

export interface WorkletEnvironment {
  LECLERC_MEDPSY_SRC?: string;
  LECLERC_OCR_SRC?: string;
  QVAC_HYPERSWARM_SEED?: string;
  USDT_ADDRESS?: string;
  EVM_CHAIN_ID?: string;
  EVM_RPC_URL?: string;
  SPARK_NETWORK?: string;
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

const REQUIRED_ENV: (keyof WorkletEnvironment)[] = ["SPARK_NETWORK"];

export function createLeclercWorkletHost(options: WorkletHostOptions = {}): LeclercWorkletHost {
  return {
    capabilities: WORKLET_CAPABILITIES,
    status(env = {}) {
      const missingEnv = REQUIRED_ENV.filter((key) => !env[key]);
      return {
        capabilities: WORKLET_CAPABILITIES,
        qvac: options.adapter ? "ready" : "missing-adapter",
        wdk: options.adapter ? "ready" : "missing-adapter",
        p2p: options.adapter ? "ready" : "missing-adapter",
        missingEnv,
      };
    },
    async handle(request) {
      if (options.adapter) {
        return options.adapter.handle(request) as Promise<
          LeclercRpcResponse<LeclercRpcPayload<typeof request.method>>
        >;
      }

      options.logger?.("native worklet adapter missing", {
        method: request.method,
        requestId: request.id,
      });
      return rpcError(
        request,
        "NATIVE_ADAPTER_NOT_CONFIGURED",
        `Worklet method ${request.method} is scaffolded but not wired to QVAC, WDK, or Hyperswarm yet.`,
      );
    },
  };
}

export function createWorkletStatusResponse(request: Extract<LeclercRpcRequest, { method: "station" }>) {
  return rpcOk(request, {
    publicKey: "native-worklet-scaffold",
  });
}

export { WORKLET_CAPABILITIES };
export type {
  LeclercRpcMethod,
  LeclercRpcPayload,
  LeclercRpcRequest,
  LeclercRpcResponse,
};
