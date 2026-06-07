"use client";

import { useState } from "react";
import { useI18n } from "@/locales/client";
import { station } from "@/lib/api-client";

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
        <button className="w-full rounded-xl bg-primary-container py-2.5 text-on-primary-container font-label-md">
          {t("link.join")}
        </button>
      </section>
    </div>
  );
}
