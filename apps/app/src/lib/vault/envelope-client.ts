"use client";

import { isUnlocked, open, seal, type Sealed } from "@/lib/intel/crypto";

export interface VaultEnvelope<T = unknown> {
  id: string;
  sealed?: Sealed;
  /** Legacy read-only fallback for records written before locked writes were rejected. */
  plain?: T;
}

export async function toVaultEnvelope<T, C extends { id: string }>(
  clear: C,
  value: T,
): Promise<C & VaultEnvelope<T>> {
  if (!isUnlocked()) {
    throw new Error("vault locked: unlock before writing encrypted local data");
  }
  return { ...clear, sealed: await seal(value) };
}

export async function fromVaultEnvelope<T>(envelope: VaultEnvelope<T> | undefined): Promise<T | null> {
  if (!envelope) return null;
  if (envelope.sealed) return open<T>(envelope.sealed);
  return envelope.plain ?? null;
}
