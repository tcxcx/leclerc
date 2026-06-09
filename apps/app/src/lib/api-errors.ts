export type ApiErrorCode =
  | "unknown_action"
  | "drop_failed"
  | "drop_not_joined"
  | "drop_passphrase_required"
  | "mission_funding_failed"
  | "wallet_seed_required"
  | "unknown_mission"
  | "confirm_id_required"
  | "confirmation_not_mission_funding";

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
  if (normalized.includes("confirmid required")) return "confirm_id_required";
  if (normalized.includes("confirmation is not for mission funding")) return "confirmation_not_mission_funding";
  return null;
}

function statusForCode(code: ApiErrorCode): number {
  switch (code) {
    case "unknown_action":
    case "drop_passphrase_required":
    case "wallet_seed_required":
    case "unknown_mission":
    case "confirm_id_required":
    case "confirmation_not_mission_funding":
      return 400;
    case "drop_not_joined":
      return 404;
    case "drop_failed":
    case "mission_funding_failed":
      return 500;
  }
}
