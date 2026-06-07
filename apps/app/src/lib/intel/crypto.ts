"use client";

/**
 * Encryption-at-rest for the dossier and the wallet seed (docs/leclerc/03 §2,
 * 06 §2). Normal local writes lazily create a random device key and persist it
 * in browser storage, so the IndexedDB contents stay ciphertext during casual
 * inspection without forcing an upfront passphrase. A passphrase-derived
 * in-memory key remains available as an optional stronger vault mode.
 *
 * Web reference. The mobile (Bare/Expo) client uses the hardware keystore
 * (@tetherto/wdk-react-native-secure-storage) instead.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();
const DEVICE_KEY_STORAGE_KEY = "leclerc-device-vault-key-v1";

/** Cast a byte view to BufferSource (works around lib-dom ArrayBufferLike strictness). */
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

let sessionKey: CryptoKey | null = null;
let sessionKeyKind: Sealed["keyId"] | null = null;
let deviceKeyPromise: Promise<CryptoKey> | null = null;

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
  sessionKeyKind = "passphrase";
  // Return the salt so the caller can persist it (needed to re-derive the key).
  return bytesToB64(salt);
}

export function isUnlocked(): boolean {
  return sessionKey !== null;
}

export function lock(): void {
  sessionKey = null;
  sessionKeyKind = null;
}

export interface Sealed {
  iv: string;
  ct: string;
  keyId?: "device" | "passphrase";
}

/** Encrypt an arbitrary JSON-serialisable value. */
export async function seal(value: unknown): Promise<Sealed> {
  const key = await currentVaultKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = enc.encode(JSON.stringify(value));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: bs(iv) }, key.key, bs(data));
  return { iv: bytesToB64(iv), ct: bytesToB64(new Uint8Array(ct)), keyId: key.kind };
}

/** Decrypt a sealed value. */
export async function open<T = unknown>(sealed: Sealed): Promise<T> {
  const iv = b64ToBytes(sealed.iv);
  const ct = b64ToBytes(sealed.ct);
  const pt = await decryptSealed(sealed, iv, ct);
  return JSON.parse(dec.decode(pt)) as T;
}

/** Ensure a vault key is available for read paths, including legacy plaintext fallback gates. */
export async function ensureVaultReady(): Promise<void> {
  await currentVaultKey();
}

export function forgetDeviceKey(): void {
  deviceKeyPromise = null;
  storage().removeItem(DEVICE_KEY_STORAGE_KEY);
}

async function currentVaultKey(): Promise<{ key: CryptoKey; kind: NonNullable<Sealed["keyId"]> }> {
  if (sessionKey) return { key: sessionKey, kind: sessionKeyKind ?? "passphrase" };
  return { key: await deviceKey(), kind: "device" };
}

async function decryptSealed(sealed: Sealed, iv: Uint8Array, ct: Uint8Array): Promise<ArrayBuffer> {
  if (sealed.keyId === "passphrase") {
    if (!sessionKey || sessionKeyKind !== "passphrase") {
      throw new Error("vault locked: unlock passphrase-protected data before reading");
    }
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, sessionKey, bs(ct));
  }
  if (sealed.keyId === "device") {
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, await deviceKey(), bs(ct));
  }
  if (sessionKey) {
    try {
      return await crypto.subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, sessionKey, bs(ct));
    } catch {
      /* fall back to device key below for legacy envelopes */
    }
  }
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, await deviceKey(), bs(ct));
}

function deviceKey(): Promise<CryptoKey> {
  deviceKeyPromise ??= (async () => {
    const existing = storage().getItem(DEVICE_KEY_STORAGE_KEY);
    if (existing) {
      return crypto.subtle.importKey("raw", bs(b64ToBytes(existing)), "AES-GCM", false, ["encrypt", "decrypt"]);
    }
    const raw = crypto.getRandomValues(new Uint8Array(32));
    storage().setItem(DEVICE_KEY_STORAGE_KEY, bytesToB64(raw));
    return crypto.subtle.importKey("raw", bs(raw), "AES-GCM", false, ["encrypt", "decrypt"]);
  })();
  return deviceKeyPromise;
}

function storage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("vault storage is unavailable in this runtime");
  }
  return window.localStorage;
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
