export type ApiErrorCode =
  | "unknown_action"
  | "drop_failed"
  | "drop_not_joined"
  | "drop_passphrase_required"
  | "wallet_failed"
  | "rain_card_failed"
  | "station_failed"
  | "wallet_agent_tool_failed"
  | "mission_funding_failed"
  | "wallet_seed_required"
  | "unknown_mission"
  | "unknown_card"
  | "tool_required"
  | "agent_wallet_token_required"
  | "unauthorized_wallet_tool_caller"
  | "rain_card_deposit_unconfigured"
  | "confirm_id_required"
  | "confirmation_not_mission_funding"
  | "confirmation_not_rain_card"
  | "transfer_confirmation_not_found"
  | "transfer_confirmation_expired"
  | "transfer_confirmation_integrity_failed"
  | "chain_read_only"
  | "unsupported_chain"
  | "asset_not_enabled"
  | "asset_not_configured"
  | "evm_chain_mismatch"
  | "spark_network_mismatch"
  | "station_key_missing";

export interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
}

export class LeclercApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message?: string, status?: number) {
    super(message ?? code);
    this.name = "LeclercApiError";
    this.code = code;
    this.status = status ?? statusForCode(code);
  }
}

export function apiError(code: ApiErrorCode, message?: string, status?: number): LeclercApiError {
  return new LeclercApiError(code, message, status);
}

export function isLeclercApiError(error: unknown): error is LeclercApiError {
  return error instanceof LeclercApiError;
}

export function apiErrorBody(error: LeclercApiError): ApiErrorBody {
  return { error: error.message, code: error.code };
}

export function apiErrorFromUnknown(error: unknown, fallbackCode: ApiErrorCode): LeclercApiError {
  if (isLeclercApiError(error)) return error;
  const message = error instanceof Error ? error.message : fallbackCode;
  const mapped = codeForMessage(message);
  const code = mapped ?? fallbackCode;
  return new LeclercApiError(code, code, mapped ? statusForCode(mapped) : 500);
}

function codeForMessage(message: string): ApiErrorCode | null {
  const normalized = message.toLowerCase();
  if (normalized.includes("unknown action")) return "unknown_action";
  if (normalized.includes("drop passphrase required")) return "drop_passphrase_required";
  if (normalized.includes("drop not joined")) return "drop_not_joined";
  if (normalized.includes("wallet seed required")) return "wallet_seed_required";
  if (normalized.includes("unknown mission")) return "unknown_mission";
  if (normalized.includes("unknown card")) return "unknown_card";
  if (normalized.includes("confirmid required")) return "confirm_id_required";
  if (normalized.includes("confirmation is not for mission funding")) return "confirmation_not_mission_funding";
  if (normalized.includes("confirmation is not for rain card funding")) return "confirmation_not_rain_card";
  if (normalized.includes("transfer confirmation not found or already used")) return "transfer_confirmation_not_found";
  if (normalized.includes("transfer confirmation expired")) return "transfer_confirmation_expired";
  if (normalized.includes("transfer confirmation failed integrity check")) return "transfer_confirmation_integrity_failed";
  if (normalized.includes("must be configured for live rain card funding")) return "rain_card_deposit_unconfigured";
  if (normalized.includes("is read-only in leclerc")) return "chain_read_only";
  if (normalized.includes("unsupported chainid")) return "unsupported_chain";
  if (normalized.includes("is not enabled for evm testnet transfers")) return "asset_not_enabled";
  if (normalized.includes("is not configured on")) return "asset_not_configured";
  if (normalized.includes("evm_chain_id must be arc testnet")) return "evm_chain_mismatch";
  if (normalized.includes("spark_network must be testnet")) return "spark_network_mismatch";
  if (normalized.includes("startqvacprovider returned no publickey")) return "station_key_missing";
  return null;
}

function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case "unknown_action":
    case "drop_passphrase_required":
    case "wallet_seed_required":
    case "unknown_mission":
    case "unknown_card":
    case "tool_required":
    case "confirm_id_required":
    case "confirmation_not_mission_funding":
    case "confirmation_not_rain_card":
    case "chain_read_only":
    case "unsupported_chain":
    case "asset_not_enabled":
    case "asset_not_configured":
    case "evm_chain_mismatch":
    case "spark_network_mismatch":
    case "station_key_missing":
      return 400;
    case "unauthorized_wallet_tool_caller":
      return 401;
    case "drop_not_joined":
    case "transfer_confirmation_not_found":
      return 404;
    case "agent_wallet_token_required":
      return 503;
    case "transfer_confirmation_expired":
    case "transfer_confirmation_integrity_failed":
    case "rain_card_deposit_unconfigured":
      return 409;
    case "drop_failed":
    case "mission_funding_failed":
    case "wallet_failed":
    case "rain_card_failed":
    case "station_failed":
    case "wallet_agent_tool_failed":
      return 500;
  }
}
