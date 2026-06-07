"use client";

import { useState } from "react";
import { useI18n } from "@/locales/client";
import { drop, station } from "@/lib/api-client";

/**
 * P2P link/pairing. Shows the station's stable peer key for delegation, and a
 * mission dead-drop topic. Full QR pairing + swarm wiring is the Codex overnight
 * task — references/pearpass-mobile/src/hooks/useQRScanner.js is the benchmark.
 */
export default function LinkPage() {
  const t = useI18n();
  const [key, setKey] = useState<string | null>(null);
  const [peer, setPeer] = useState("");
  const [alive, setAlive] = useState<boolean | null>(null);
  const [topic, setTopic] = useState("");
  const [secret, setSecret] = useState("");
  const [dropId, setDropId] = useState("");
  const [dropStatus, setDropStatus] = useState("");
  const [inbox, setInbox] = useState<Array<{ kind: string; value: unknown; ts: number }>>([]);
  const [busy, setBusy] = useState(false);

  async function startStation() {
    setBusy(true);
    try {
      setKey((await station.start()).publicKey);
    } catch {
      setKey("error — see /api/station");
    } finally {
      setBusy(false);
    }
  }
  async function ping() {
    if (!peer.trim()) return;
    setAlive((await station.ping(peer.trim()).catch(() => ({ alive: false }))).alive);
  }
  async function joinDrop() {
    if (!topic.trim()) return;
    setBusy(true);
    try {
      const joined = await drop.join(topic.trim());
      setDropId(joined.dropId);
      setDropStatus(`${t("link.dropReady")} · ${joined.topicHash} · peers ${joined.peers}`);
    } catch (e) {
      setDropStatus(e instanceof Error ? e.message : "drop failed");
    } finally {
      setBusy(false);
    }
  }
  async function sendTest() {
    if (!dropId) return;
    const res = await drop.send(dropId, secret.trim() || topic.trim(), {
      title: "LeClerc dead-drop test",
      sentAt: Date.now(),
    });
    setDropStatus(`${t("link.dropSent")} · peers ${res.peers}`);
  }
  async function pollDrop() {
    if (!dropId) return;
    const res = await drop.read(dropId, secret.trim() || topic.trim());
    setInbox(res.payloads.map((p) => ({ kind: p.kind, value: p.value, ts: p.ts })));
    setDropStatus(`${t("link.dropInbox")} · ${res.payloads.length}/${res.rawCount}`);
  }

  return (
    <div className="anim-enter space-y-4">
      <h1 className="font-headline-md">{t("link.title")}</h1>

      <section className="space-y-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <h2 className="font-headline-sm">{t("link.stationKey")}</h2>
        {key ? (
          <p className="break-all rounded-lg bg-surface p-2 font-mono text-caption">{key}</p>
        ) : (
          <button
            onClick={startStation}
            disabled={busy}
            className="w-full rounded-xl bg-primary py-3 text-on-primary font-label-md disabled:opacity-50"
          >
            {busy ? "…" : t("link.showQr")}
          </button>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <h2 className="font-headline-sm">{t("link.delegate")}</h2>
        <input
          value={peer}
          onChange={(e) => setPeer(e.target.value)}
          placeholder="provider public key"
          className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 font-mono text-caption"
        />
        <button onClick={ping} className="w-full rounded-xl border border-outline-variant py-2.5 text-label-md">
          {t("link.scan")}
        </button>
        {alive !== null && (
          <p className={`text-label-md ${alive ? "text-secondary" : "text-error"}`}>
            {alive ? `● ${t("link.peerOnline")}` : `○ ${t("link.peerOffline")}`}
          </p>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <h2 className="font-headline-sm">{t("link.dropTopic")}</h2>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="mission passphrase"
          className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md"
        />
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={t("link.dropSecret")}
          className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md"
        />
        <button
          onClick={joinDrop}
          disabled={busy || !topic.trim()}
          className="w-full rounded-xl bg-primary-container py-2.5 text-on-primary-container font-label-md disabled:opacity-50"
        >
          {t("link.join")}
        </button>
        {dropId && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={sendTest} className="rounded-xl border border-outline-variant py-2.5 text-label-md">
              {t("link.sendTest")}
            </button>
            <button onClick={pollDrop} className="rounded-xl border border-outline-variant py-2.5 text-label-md">
              {t("link.poll")}
            </button>
          </div>
        )}
        {dropStatus && <p className="text-label-md text-on-surface-variant">{dropStatus}</p>}
        {inbox.length > 0 && (
          <ul className="space-y-1">
            {inbox.map((item, index) => (
              <li key={`${item.ts}-${index}`} className="rounded-lg bg-surface p-2 text-caption">
                {item.kind} · {new Date(item.ts).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
