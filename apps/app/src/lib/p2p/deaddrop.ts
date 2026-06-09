import "server-only";

/**
 * Encrypted dead-drop messaging over Hyperswarm (docs/leclerc/05 §2). No central
 * server: peers join a shared 32-byte topic and get a Noise-encrypted stream.
 * Payloads are ALSO AES-GCM sealed with a shared drop secret (defense in depth),
 * so a wrong-topic peer learns nothing.
 *
 * Reference: references/pearpass-mobile/src/hooks/useQRScanner.js (pairing) and
 * the Holepunch deps in references/pearpass-desktop/package.json.
 *
 * The registry is stored on globalThis so route-handler reloads in the same
 * station process reuse the same channels. A native/Bare worker can later host
 * the same channel API out-of-process.
 */
import Hyperswarm from "hyperswarm";
import crypto from "node:crypto";
import { apiError } from "@/lib/api-errors";

export interface DropPayload {
  kind: "brief" | "record" | "notification";
  /** AES-GCM ciphertext (base64) of the JSON payload. */
  ct: string;
  iv: string;
  ts: number;
}

export interface DropChannel {
  send(payload: DropPayload): Promise<void>;
  onMessage(cb: (payload: DropPayload) => void): void;
  peerCount(): number;
  close(): Promise<void>;
}

export type SendDropStatus = "sent" | "pending";

/** Derive a 32-byte topic from a mission passphrase. */
export function topicFromPassphrase(passphrase: string): Buffer {
  return crypto.createHash("sha256").update(`leclerc:${passphrase}`).digest();
}

/** Seal a JSON value with a shared drop secret. */
export function sealPayload(kind: DropPayload["kind"], value: unknown, secret: string): DropPayload {
  const key = crypto.createHash("sha256").update(`drop:${secret}`).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    kind,
    iv: iv.toString("base64"),
    ct: Buffer.concat([data, tag]).toString("base64"),
    ts: Date.now(),
  };
}

/** Open the sealed payload; returns null on auth failure (wrong secret). */
export function openPayload<T = unknown>(payload: DropPayload, secret: string): T | null {
  try {
    const key = crypto.createHash("sha256").update(`drop:${secret}`).digest();
    const raw = Buffer.from(payload.ct, "base64");
    const tag = raw.subarray(raw.length - 16);
    const body = raw.subarray(0, raw.length - 16);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(body), decipher.final()]);
    return JSON.parse(out.toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** Join a dead-drop topic and exchange encrypted payloads. */
export async function openDrop(topic: Buffer): Promise<DropChannel> {
  const swarm = new Hyperswarm();
  const sockets = new Set<NodeJS.ReadWriteStream & { write: (b: Buffer) => void }>();
  const handlers: ((p: DropPayload) => void)[] = [];
  const pending = new WeakMap<NodeJS.ReadWriteStream, string>();

  swarm.on("connection", (socket: NodeJS.ReadWriteStream & { write: (b: Buffer) => void }) => {
    sockets.add(socket);
    socket.on("data", (buf: Buffer) => {
      const next = `${pending.get(socket) ?? ""}${buf.toString("utf8")}`;
      const frames = next.split("\n");
      pending.set(socket, frames.pop() ?? "");
      for (const frame of frames) {
        if (!frame.trim()) continue;
        try {
          const p = JSON.parse(frame) as DropPayload;
          handlers.forEach((h) => h(p));
        } catch {
          /* ignore malformed frames */
        }
      }
    });
    socket.on("close", () => {
      sockets.delete(socket);
      pending.delete(socket);
    });
    socket.on("error", () => {
      sockets.delete(socket);
      pending.delete(socket);
    });
  });

  const discovery = swarm.join(topic, { server: true, client: true });
  await Promise.race([
    discovery.flushed(),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  return {
    async send(payload) {
      const buf = Buffer.from(`${JSON.stringify(payload)}\n`, "utf8");
      for (const s of sockets) s.write(buf);
    },
    onMessage(cb) {
      handlers.push(cb);
    },
    peerCount() {
      return sockets.size;
    },
    async close() {
      await swarm.destroy();
    },
  };
}

interface ManagedDrop {
  channel: DropChannel;
  messages: DropPayload[];
  topicHash: string;
}

const drops = dropRegistry();

function dropKey(passphrase: string, label: string): string {
  return `${label}:${topicFromPassphrase(passphrase).toString("hex")}`;
}

/** Join or reuse a long-lived drop channel for this process. */
export async function joinDrop(
  passphrase: string,
  label = "default",
): Promise<{ dropId: string; topicHash: string; peers: number }> {
  if (!passphrase.trim()) throw apiError("drop_passphrase_required");
  const key = dropKey(passphrase, label);
  let pending = drops.get(key);
  if (!pending) {
    pending = (async () => {
      const topic = topicFromPassphrase(passphrase);
      const channel = await openDrop(topic);
      const managed: ManagedDrop = {
        channel,
        messages: [],
        topicHash: topic.toString("hex"),
      };
      channel.onMessage((payload) => managed.messages.push(payload));
      return managed;
    })();
    drops.set(key, pending);
  }
  const managed = await pending;
  return { dropId: key, topicHash: managed.topicHash.slice(0, 12), peers: managed.channel.peerCount() };
}

export async function sendDrop(
  dropId: string,
  kind: DropPayload["kind"],
  value: unknown,
  secret: string,
): Promise<{ peers: number; status: SendDropStatus }> {
  const managed = await drops.get(dropId);
  if (!managed) throw apiError("drop_not_joined");
  const peers = managed.channel.peerCount();
  if (peers === 0) {
    return { peers, status: "pending" };
  }
  await managed.channel.send(sealPayload(kind, value, secret));
  return { peers: managed.channel.peerCount(), status: "sent" };
}

export async function readDrop<T = unknown>(
  dropId: string,
  secret: string,
): Promise<{ payloads: Array<{ kind: DropPayload["kind"]; value: T; ts: number }>; rawCount: number }> {
  const managed = await drops.get(dropId);
  if (!managed) throw apiError("drop_not_joined");
  const payloads = managed.messages
    .map((payload) => ({
      kind: payload.kind,
      ts: payload.ts,
      value: openPayload<T>(payload, secret),
    }))
    .filter((payload): payload is { kind: DropPayload["kind"]; value: T; ts: number } => payload.value !== null);
  return { payloads, rawCount: managed.messages.length };
}

export async function closeDrop(dropId: string): Promise<void> {
  const pending = drops.get(dropId);
  if (!pending) return;
  drops.delete(dropId);
  await (await pending).channel.close();
}

function dropRegistry(): Map<string, Promise<ManagedDrop>> {
  const globalWithDrops = globalThis as typeof globalThis & {
    __leclercDeadDrops?: Map<string, Promise<ManagedDrop>>;
  };
  globalWithDrops.__leclercDeadDrops ??= new Map<string, Promise<ManagedDrop>>();
  return globalWithDrops.__leclercDeadDrops;
}
