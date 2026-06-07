export interface DropPayload {
  kind: "brief" | "record";
  ct: string;
  iv: string;
  ts: number;
}

export type DropRequest =
  | { action: "join"; passphrase: string; label?: string }
  | { action: "send"; dropId: string; secret: string; kind: DropPayload["kind"]; value: unknown }
  | { action: "read"; dropId: string; secret: string }
  | { action: "close"; dropId: string };

export type DropResponse =
  | { dropId: string; topicHash: string; peers: number }
  | { peers: number }
  | { payloads: Array<{ kind: DropPayload["kind"]; value: unknown; ts: number }>; rawCount: number }
  | { ok: true }
  | { error: string };

export type StationRequest =
  | { action: "start" }
  | { action: "stop" }
  | { action: "ping"; peer: string }
  | { action: "delegateTest"; peer?: string };

export type StationResponse =
  | { publicKey: string }
  | { ok: true }
  | { alive: boolean }
  | { providerPublicKey: string; text: string }
  | { error: string };
