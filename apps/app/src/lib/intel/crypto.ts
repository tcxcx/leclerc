"use client";

/**
 * Encryption-at-rest for the dossier and the wallet seed (docs/leclerc/03 §2,
 * 06 §2). A passphrase-derived AES-GCM key is held in memory for the session
 * only — never persisted. On a seized device the IndexedDB contents are
 * ciphertext without the passphrase.
 *
 * Web reference. The mobile (Bare/Expo) client uses the hardware keystore
 * (@tetherto/wdk-react-native-secure-storage) instead.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Cast a byte view to BufferSource (works around lib-dom ArrayBufferLike strictness). */
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

let sessionKey: CryptoKey | null = null;

/** Derive (and cache for the session) an AES-GCM key from a passphrase. */
export async function unlock(passphrase: string, saltB64?: string): Promise<string> {
  const salt = saltB64 ? b64ToBytes(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  sessionKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: bs(salt), iterations: 210_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  // Return the salt so the caller can persist it (needed to re-derive the key).
  return bytesToB64(salt);
}

export function isUnlocked(): boolean {
  return sessionKey !== null;
}

export function lock(): void {
  sessionKey = null;
}

export interface Sealed {
  iv: string;
  ct: string;
}

/** Encrypt an arbitrary JSON-serialisable value. */
export async function seal(value: unknown): Promise<Sealed> {
  if (!sessionKey) throw new Error("locked: call unlock() first");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = enc.encode(JSON.stringify(value));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: bs(iv) }, sessionKey, bs(data));
  return { iv: bytesToB64(iv), ct: bytesToB64(new Uint8Array(ct)) };
}

/** Decrypt a sealed value. */
export async function open<T = unknown>(sealed: Sealed): Promise<T> {
  if (!sessionKey) throw new Error("locked: call unlock() first");
  const iv = b64ToBytes(sealed.iv);
  const ct = b64ToBytes(sealed.ct);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, sessionKey, bs(ct));
  return JSON.parse(dec.decode(pt)) as T;
}

function bytesToB64(b: Uint8Array): string {
  let s = "";
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s);
}
function b64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
