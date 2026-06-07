import type { BriefRequest, ChatMessage, IntelBrief, Locale } from "./agents";
import type { DocumentIntelRequest, DocumentIntelResponse, RagRequest, RagResponse } from "./rag";
import type { DropRequest, DropResponse, StationRequest, StationResponse } from "./p2p";
import type { IntelExtraction, IntelMetadata, IntelRecord } from "./intel";
import type { VoiceTurnRequest, VoiceTurnResponse } from "./voice";
import type { WalletRequest, WalletResponse } from "./wallet";

export interface ChatTurnRequest {
  messages: ChatMessage[];
  locale: Locale;
  financeContext?: string;
}

export interface ChatTurnResponse {
  text: string;
}

export interface CaptureExtractRequest {
  source: string;
  metadata: IntelMetadata;
  attachments?: { kind: "ocr" | "foto"; text?: string; sha256?: string }[];
}

export interface CaptureExtractResponse {
  extraction: IntelExtraction;
  record: IntelRecord;
}

export type LeclercRpcMethod =
  | "chat.turn"
  | "capture.extract"
  | "rag"
  | "brief"
  | "wallet"
  | "drop"
  | "station"
  | "voice.turn"
  | "document.ocr";

type RpcEnvelope<M extends LeclercRpcMethod, P> = {
  id: string;
  method: M;
  payload: P;
};

export type LeclercRpcRequest =
  | RpcEnvelope<"chat.turn", ChatTurnRequest>
  | RpcEnvelope<"capture.extract", CaptureExtractRequest>
  | RpcEnvelope<"rag", RagRequest>
  | RpcEnvelope<"brief", BriefRequest>
  | RpcEnvelope<"wallet", WalletRequest>
  | RpcEnvelope<"drop", DropRequest>
  | RpcEnvelope<"station", StationRequest>
  | RpcEnvelope<"voice.turn", VoiceTurnRequest>
  | RpcEnvelope<"document.ocr", DocumentIntelRequest>;

export type LeclercRpcPayload<M extends LeclercRpcMethod> =
  M extends "chat.turn"
    ? ChatTurnResponse
    : M extends "capture.extract"
      ? CaptureExtractResponse
      : M extends "rag"
        ? RagResponse
        : M extends "brief"
          ? IntelBrief
          : M extends "wallet"
            ? WalletResponse
            : M extends "drop"
              ? DropResponse
              : M extends "station"
                ? StationResponse
                : M extends "voice.turn"
                  ? VoiceTurnResponse
                  : M extends "document.ocr"
                    ? DocumentIntelResponse
                    : never;

export type LeclercRpcResponse<P = unknown> =
  | { id: string; ok: true; payload: P }
  | { id: string; ok: false; error: { code: string; message: string } };

export function rpcOk<M extends LeclercRpcMethod>(
  request: { id: string; method: M },
  payload: LeclercRpcPayload<M>,
): LeclercRpcResponse<LeclercRpcPayload<M>> {
  return { id: request.id, ok: true, payload };
}

export function rpcError(
  request: { id: string },
  code: string,
  message: string,
): LeclercRpcResponse<never> {
  return { id: request.id, ok: false, error: { code, message } };
}
