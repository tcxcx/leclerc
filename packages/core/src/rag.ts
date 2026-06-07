export interface RagDocument {
  id: string;
  text: string;
  meta?: Record<string, unknown>;
}

export interface RagHit {
  id: string;
  text: string;
  score?: number;
  meta?: Record<string, unknown>;
}

export interface RagAnswer {
  text: string;
  hits: RagHit[];
}

export type RagRequest =
  | { action: "ingest"; docs: RagDocument[] }
  | { action: "query"; query: string; k?: number }
  | { action: "search"; query: string; k?: number };

export type RagResponse =
  | { ok: true; count: number }
  | RagAnswer
  | { hits: RagHit[] }
  | { error: string };

export interface DocumentIntelRequest {
  image: ArrayBuffer;
  translate?: boolean;
  from?: string;
  to?: string;
}

export interface DocumentIntelResponse {
  text: string;
  translatedText: string;
  blocks?: unknown;
}
