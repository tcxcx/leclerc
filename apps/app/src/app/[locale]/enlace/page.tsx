"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/locales/client";
import { OperationsGlobe } from "@/components/operations-globe";
import { drop, isApiClientError, missionFunding, station } from "@/lib/api-client";
import { DEFAULT_MISSION_FUNDING_STORY_ID } from "@leclerc/transfer-core";
import type { MissionFundingConfig, MissionFundingNotification, TransferProposal } from "@leclerc/transfers";

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
  const [missions, setMissions] = useState<MissionFundingConfig[]>([]);
  const [missionId, setMissionId] = useState(DEFAULT_MISSION_FUNDING_STORY_ID);
  const [fundSeed, setFundSeed] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundingProposal, setFundingProposal] = useState<TransferProposal | null>(null);
  const [fundingStatus, setFundingStatus] = useState("");
  const [events, setEvents] = useState<MissionFundingNotification[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    missionFunding
      .list()
      .then((res) => {
        setMissions(res.missions);
        setMissionId(res.missions[0]?.missionId ?? DEFAULT_MISSION_FUNDING_STORY_ID);
        setFundAmount(res.missions[0]?.defaultAmount ?? "");
      })
      .catch(() => {});
  }, []);

  async function startStation() {
    setBusy(true);
    try {
      setKey((await station.start()).publicKey);
    } catch {
      setKey(t("link.stationFailed"));
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
      setDropStatus(`${t("link.dropReady")} · ${joined.topicHash} · ${t("link.peers")} ${joined.peers}`);
    } catch (e) {
      setDropStatus(apiErrorText(t, e, "link.dropFailed"));
    } finally {
      setBusy(false);
    }
  }
  async function sendTest() {
    if (!dropId) return;
    try {
      const res = await drop.send(dropId, secret.trim() || topic.trim(), {
        title: t("link.dropTestTitle"),
        sentAt: Date.now(),
      });
      setDropStatus(`${t("link.dropSent")} · ${res.status} · ${t("link.peers")} ${res.peers}`);
    } catch (e) {
      setDropStatus(apiErrorText(t, e, "link.dropFailed"));
    }
  }
  async function pollDrop() {
    if (!dropId) return;
    try {
      const res = await drop.read(dropId, secret.trim() || topic.trim());
      setInbox(res.payloads.map((p) => ({ kind: p.kind, value: p.value, ts: p.ts })));
      setDropStatus(`${t("link.dropInbox")} · ${res.payloads.length}/${res.rawCount}`);
    } catch (e) {
      setDropStatus(apiErrorText(t, e, "link.dropFailed"));
    }
  }
  async function fundMission() {
    if (!fundSeed.trim() || !fundAmount.trim()) return;
    setBusy(true);
    try {
      setFundingProposal(null);
      const res = await missionFunding.fund({
        seed: fundSeed,
        missionId,
        amount: fundAmount,
        dropId: dropId || undefined,
        secret: secret.trim() || topic.trim() || undefined,
      });
      if ("proposal" in res) {
        setFundingProposal(res.proposal);
        setFundingStatus(t("link.fundingReviewReady"));
        return;
      }
      setFundingStatus(
        `${t(`link.fundingStatus.${res.notification.status}`)} · ${t("link.peers")} ${res.peers}`,
      );
      setEvents((current) => [res.notification, ...current].slice(0, 20));
    } catch (e) {
      setFundingStatus(apiErrorText(t, e, "link.missionFundingFailed"));
    } finally {
      setBusy(false);
    }
  }
  async function confirmMissionFunding() {
    if (!fundingProposal) return;
    setBusy(true);
    try {
      const res = await missionFunding.confirm({
        confirmId: fundingProposal.confirmId,
        dropId: dropId || undefined,
        secret: secret.trim() || topic.trim() || undefined,
      });
      setFundingProposal(null);
      setFundingStatus(
        `${t(`link.fundingStatus.${res.notification.status}`)} · ${t("link.peers")} ${res.peers}`,
      );
      setEvents((current) => [res.notification, ...current].slice(0, 20));
    } catch (e) {
      setFundingStatus(apiErrorText(t, e, "link.missionFundingFailed"));
    } finally {
      setBusy(false);
    }
  }
  async function pollMissionEvents() {
    const res = await missionFunding.events();
    setEvents(res.events);
  }

  const selectedMission = missions.find((mission) => mission.missionId === missionId);

  return (
    <div className="anim-enter space-y-4">
      <h1 className="font-headline-md">{t("link.title")}</h1>

      <OperationsGlobe />

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
          placeholder={t("link.peerPlaceholder")}
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
          placeholder={t("link.dropPlaceholder")}
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

      <section className="space-y-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        <h2 className="font-headline-sm">{t("link.missionFunding")}</h2>
        <select
          value={missionId}
          onChange={(event) => {
            const next = event.target.value;
            setMissionId(next);
            const mission = missions.find((entry) => entry.missionId === next);
            setFundAmount(mission?.defaultAmount ?? "");
            setFundingProposal(null);
          }}
          className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md"
        >
          {missions.map((mission) => (
            <option key={mission.missionId} value={mission.missionId}>
              {translateKey(t, mission.titleKey)}
            </option>
          ))}
        </select>
        <input
          value={fundSeed}
          onChange={(event) => {
            setFundSeed(event.target.value);
            setFundingProposal(null);
          }}
          type="password"
          autoComplete="off"
          placeholder={t("link.fundingSeed")}
          className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md"
        />
        <input
          value={fundAmount}
          onChange={(event) => {
            setFundAmount(event.target.value);
            setFundingProposal(null);
          }}
          inputMode="decimal"
          placeholder={t("link.fundingAmount")}
          className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 font-mono text-body-md"
        />
        {selectedMission && (
          <p className="text-caption text-on-surface-variant">
            {t("link.fundingRoute")} · {selectedMission.assetId.toUpperCase()} · {selectedMission.notificationTopicHint}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={fundMission}
            disabled={busy || !missionId || !fundSeed.trim() || !fundAmount.trim()}
            className="rounded-xl bg-ignyte py-2.5 text-on-ignyte font-label-md disabled:opacity-50"
          >
            {t("link.fundMission")}
          </button>
          <button
            onClick={pollMissionEvents}
            className="rounded-xl border border-outline-variant py-2.5 text-label-md"
          >
            {t("link.pollNotifications")}
          </button>
        </div>
        {fundingProposal && (
          <div className="space-y-2 rounded-xl border border-outline-variant bg-surface p-3">
            <p className="font-mono text-caption text-on-surface-variant">{fundingProposal.summary}</p>
            <button
              type="button"
              onClick={confirmMissionFunding}
              disabled={busy}
              className="w-full rounded-xl bg-primary py-2.5 text-on-primary font-label-md disabled:opacity-50"
            >
              {busy ? "..." : t("link.confirmFunding")}
            </button>
          </div>
        )}
        {fundingStatus && <p className="text-label-md text-on-surface-variant">{fundingStatus}</p>}
        {events.length > 0 && (
          <ul className="space-y-1">
            {events.map((event) => (
              <li key={event.id} className="rounded-lg bg-surface p-2 text-caption">
                <span className="font-mono text-primary">{event.missionId}</span> · {event.status} ·{" "}
                {event.amount} {event.assetId.toUpperCase()}
                {event.hash ? ` · ${event.hash}` : event.reason ? ` · ${event.reason}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function translateKey(t: ReturnType<typeof useI18n>, key: string): string {
  return (t as unknown as (value: string) => string)(key);
}

function apiErrorText(t: ReturnType<typeof useI18n>, error: unknown, fallbackKey: string): string {
  if (isApiClientError(error) && error.code) {
    return translateKey(t, `apiErrors.${error.code}`);
  }
  return translateKey(t, fallbackKey);
}
