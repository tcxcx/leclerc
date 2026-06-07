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
 * TODO(codex): this is a Node worker pattern; for production wire it to a
 * long-lived process or Bare. In the Next.js station it runs inside a Route
 * Handler keyed by topic. Verify hyperswarm version API after install.
 */
import Hyperswarm from "hyperswarm";
import crypto from "node:crypto";

export interface DropPayload {
  kind: "brief" | "record";
  /** AES-GCM ciphertext (base64) of the JSON payload. */
  ct: string;
  iv: string;
  ts: number;
}

export interface DropChannel {
  send(payload: DropPayload): void;
  onMessage(cb: (payload: DropPayload) => void): void;
  close(): Promise<void>;
}

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
  const sockets = new Set<{ write: (b: Buffer) => void }>();
  const handlers: ((p: DropPayload) => void)[] = [];

  swarm.on("connection", (socket: NodeJS.ReadWriteStream & { write: (b: Buffer) => void }) => {
    sockets.add(socket);
    socket.on("data", (buf: Buffer) => {
      try {
        const p = JSON.parse(buf.toString("utf8")) as DropPayload;
        handlers.forEach((h) => h(p));
      } catch {
        /* ignore malformed frames */
      }
    });
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => sockets.delete(socket));
  });

  const discovery = swarm.join(topic, { server: true, client: true });
  await discovery.flushed();

  return {
    send(payload) {
      const buf = Buffer.from(JSON.stringify(payload), "utf8");
      for (const s of sockets) s.write(buf);
    },
    onMessage(cb) {
      handlers.push(cb);
    },
    async close() {
      await swarm.destroy();
    },
  };
}
