import {
  WORKLET_CAPABILITIES,
  nativeWorkletAdapterMissingErrorCode,
  nativeWorkletAdapterMissingLogMessage,
  nativeWorkletAdapterMissingMessage,
  nativeWorkletComponentNotConfiguredErrorCode,
  nativeWorkletComponentNotConfiguredMessage,
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
  type NativeWorkletRuntimeComponent,
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
  LECLERC_QVAC_MODEL_SRC?: string;
  LECLERC_EMBED_SRC?: string;
  LECLERC_MEDPSY_SRC?: string;
  LECLERC_OCR_SRC?: string;
  QVAC_HYPERSWARM_SEED?: string;
  USDT_ADDRESS?: string;
  EVM_CHAIN_ID?: string;
  EVM_RPC_URL?: string;
}

export type WorkletComponentStatus = Partial<Record<NativeWorkletRuntimeComponent, WorkletRuntimeStatus>>;

export interface WorkletAdapter {
  status?(env?: WorkletEnvironment): WorkletComponentStatus;
  handle(request: LeclercRpcRequest): Promise<LeclercRpcResponse>;
}

export type NativeWorkletRpcHandler<M extends LeclercRpcMethod> = (
  request: Extract<LeclercRpcRequest, { method: M }>,
) => LeclercRpcResponse<LeclercRpcPayload<M>> | Promise<LeclercRpcResponse<LeclercRpcPayload<M>>>;

export interface NativeQvacHandlers {
  chatTurn?: NativeWorkletRpcHandler<"chat.turn">;
  captureExtract?: NativeWorkletRpcHandler<"capture.extract">;
  rag?: NativeWorkletRpcHandler<"rag">;
  brief?: NativeWorkletRpcHandler<"brief">;
  voiceTurn?: NativeWorkletRpcHandler<"voice.turn">;
  documentOcr?: NativeWorkletRpcHandler<"document.ocr">;
}

export interface NativeWalletHandlers {
  wallet?: NativeWorkletRpcHandler<"wallet">;
}

export interface NativeP2pHandlers {
  drop?: NativeWorkletRpcHandler<"drop">;
  station?: NativeWorkletRpcHandler<"station">;
}

export interface NativeWorkletAdapterOptions {
  env?: WorkletEnvironment;
  qvac?: NativeQvacHandlers;
  wallet?: NativeWalletHandlers;
  p2p?: NativeP2pHandlers;
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
      const missingEnv = nativeWorkletMissingEnv(env);
      const runtimeStatus = nativeWorkletRuntimeStatus(Boolean(options.adapter));
      const adapterStatus = options.adapter?.status?.(env) ?? {};
      return {
        capabilities: WORKLET_CAPABILITIES,
        qvac: adapterStatus.qvac ?? runtimeStatus,
        wdk: adapterStatus.wdk ?? runtimeStatus,
        p2p: adapterStatus.p2p ?? runtimeStatus,
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

export function createNativeWorkletAdapter(options: NativeWorkletAdapterOptions = {}): WorkletAdapter {
  return {
    status(env = options.env ?? {}) {
      return {
        qvac: hasHandlers(options.qvac) ? "ready" : "not-configured",
        wdk: hasHandlers(options.wallet) && !nativeWorkletMissingEnv(env).length ? "ready" : "not-configured",
        p2p: hasHandlers(options.p2p) ? "ready" : "not-configured",
      };
    },
    async handle(request) {
      switch (request.method) {
        case "chat.turn":
          return invokeConfigured(options.qvac?.chatTurn, request, "qvac");
        case "capture.extract":
          return invokeConfigured(options.qvac?.captureExtract, request, "qvac");
        case "rag":
          return invokeConfigured(options.qvac?.rag, request, "qvac");
        case "brief":
          return invokeConfigured(options.qvac?.brief, request, "qvac");
        case "voice.turn":
          return invokeConfigured(options.qvac?.voiceTurn, request, "qvac");
        case "document.ocr":
          return invokeConfigured(options.qvac?.documentOcr, request, "qvac");
        case "wallet":
          return invokeConfigured(options.wallet?.wallet, request, "wdk");
        case "drop":
          return invokeConfigured(options.p2p?.drop, request, "p2p");
        case "station":
          if (options.p2p?.station) return options.p2p.station(request);
          if (request.payload.action === "start") return createWorkletStatusResponse(request);
          if (request.payload.action === "stop") return rpcOk(request, { ok: true });
          return nativeWorkletComponentNotConfiguredResponse(request, "p2p");
      }
    },
  };
}

export function createWorkletStatusResponse(request: Extract<LeclercRpcRequest, { method: "station" }>) {
  return rpcOk(request, {
    publicKey: nativeWorkletStationPublicKey(),
  });
}

function hasHandlers(handlers: object | undefined): boolean {
  return Boolean(handlers && Object.values(handlers).some(Boolean));
}

async function invokeConfigured<M extends LeclercRpcMethod>(
  handler: NativeWorkletRpcHandler<M> | undefined,
  request: Extract<LeclercRpcRequest, { method: M }>,
  component: NativeWorkletRuntimeComponent,
): Promise<LeclercRpcResponse<LeclercRpcPayload<M>>> {
  if (handler) return handler(request);
  return nativeWorkletComponentNotConfiguredResponse(request, component);
}

function nativeWorkletComponentNotConfiguredResponse(
  request: LeclercRpcRequest,
  component: NativeWorkletRuntimeComponent,
): LeclercRpcResponse<never> {
  return rpcError(
    request,
    nativeWorkletComponentNotConfiguredErrorCode(),
    nativeWorkletComponentNotConfiguredMessage(component),
  );
}

export { WORKLET_CAPABILITIES };
export type {
  LeclercRpcMethod,
  LeclercRpcPayload,
  LeclercRpcRequest,
  LeclercRpcResponse,
};
