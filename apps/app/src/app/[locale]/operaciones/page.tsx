"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/locales/client";
import { GlassIcon } from "@/components/glass-icon";
import { OperationsGlobe } from "@/components/operations-globe";
import { missionFunding } from "@/lib/api-client";
import {
  assignOpsMission,
  inviteOpsAlias,
  loadOpsConsole,
  mergeOpsConsoleNotifications,
  resetOpsConsole,
} from "@/lib/ops/store-client";
import {
  opsNotificationFromMissionFunding,
  opsConsoleCounts,
  type MissionBounty,
  type OperativeAlias,
  type OpsNotification,
  type OpsConsoleState,
  type WorkspaceInvite,
} from "@leclerc/core";

export default function OperationsPage() {
  const t = useI18n();
  const tt = t as unknown as (key: string) => string;
  const [state, setState] = useState<OpsConsoleState | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [selectedAliasId, setSelectedAliasId] = useState("");
  const [inviteAlias, setInviteAlias] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const applyOpsState = useCallback((next: OpsConsoleState) => {
    setState(next);
    setSelectedMissionId((current) =>
      current && next.missions.some((mission) => mission.id === current) ? current : next.missions[0]?.id ?? "",
    );
    setSelectedAliasId((current) =>
      current && next.aliases.some((alias) => alias.id === current) ? current : next.aliases[0]?.id ?? "",
    );
  }, []);

  const refreshFundingNotifications = useCallback(
    async (baseState: OpsConsoleState, announce = true) => {
      try {
        const res = await missionFunding.events();
        const notifications = res.events.map((event) => opsNotificationFromMissionFunding(event, baseState));
        const next = await mergeOpsConsoleNotifications(notifications);
        applyOpsState(next);
        if (announce) setStatus(t("opsConsole.notifications.synced"));
      } catch (error) {
        if (announce) setStatus(error instanceof Error ? error.message : t("opsConsole.notifications.loadFailed"));
      }
    },
    [applyOpsState, t],
  );

  useEffect(() => {
    loadOpsConsole()
      .then((next) => {
        applyOpsState(next);
        return refreshFundingNotifications(next, false);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : t("opsConsole.loadFailed")));
  }, [applyOpsState, refreshFundingNotifications, t]);

  const counts = useMemo(() => (state ? opsConsoleCounts(state) : null), [state]);
  const selectedMission = state?.missions.find((mission) => mission.id === selectedMissionId) ?? state?.missions[0];
  const selectedAlias = state?.aliases.find((alias) => alias.id === selectedAliasId) ?? state?.aliases[0];
  const workspaceLabel = state?.workspaceNameKey ? tt(state.workspaceNameKey) : state?.workspaceName;

  async function assignSelected() {
    if (!selectedMission || !selectedAlias) return;
    setBusy(true);
    try {
      const next = await assignOpsMission(selectedMission.id, selectedAlias.id);
      applyOpsState(next);
      setStatus(t("opsConsole.assigned"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("opsConsole.assignFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function inviteSelected() {
    if (!selectedMission || !inviteAlias.trim()) return;
    setBusy(true);
    try {
      const next = await inviteOpsAlias(selectedMission.id, inviteAlias);
      applyOpsState(next);
      setInviteAlias("");
      setStatus(t("opsConsole.invited"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("opsConsole.inviteFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      const next = await resetOpsConsole();
      applyOpsState(next);
      setStatus(t("opsConsole.resetDone"));
    } finally {
      setBusy(false);
    }
  }

  if (!state || !counts) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-5xl items-center justify-center text-on-surface-variant">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-8">
      <section className="rounded-lg border border-ignyte/30 bg-surface-container-low/90 p-4 shadow-[0_0_40px_rgba(245,224,3,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-ignyte/40 bg-ignyte/10 px-3 py-1 text-caption text-ignyte">
              <span className="material-symbols-outlined text-[16px]" aria-hidden>
                assignment_ind
              </span>
              {t("opsConsole.eyebrow")}
            </div>
            <h1 className="font-display-lg text-[34px] leading-tight text-on-surface">
              {t("opsConsole.title")}
            </h1>
            {workspaceLabel ? <p className="font-mono text-caption text-ignyte">{workspaceLabel}</p> : null}
            <p className="max-w-2xl text-body-md text-on-surface-variant">{t("opsConsole.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-label-md text-on-surface-variant disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              restart_alt
            </span>
            {t("opsConsole.reset")}
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label={t("opsConsole.metrics.aliases")} value={counts.aliases} icon="badge" />
          <Metric label={t("opsConsole.metrics.missions")} value={counts.missions} icon="flag" />
          <Metric label={t("opsConsole.metrics.active")} value={counts.activeMissions} icon="local_activity" />
          <Metric label={t("opsConsole.metrics.open")} value={counts.openMissions} icon="radio_button_unchecked" />
          <Metric label={t("opsConsole.metrics.invites")} value={counts.pendingInvites} icon="outgoing_mail" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low/90 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-headline-sm">{t("opsConsole.assigner")}</h2>
              <p className="text-body-md text-on-surface-variant">{t("opsConsole.assignerBody")}</p>
            </div>
            <GlassIcon icon="paid" active size="lg" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-caption text-on-surface-variant">{t("opsConsole.mission")}</span>
              <select
                value={selectedMission?.id ?? ""}
                onChange={(event) => setSelectedMissionId(event.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md outline-none"
              >
                {state.missions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.codename} / {tt(mission.titleKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-caption text-on-surface-variant">{t("opsConsole.alias")}</span>
              <select
                value={selectedAlias?.id ?? ""}
                onChange={(event) => setSelectedAliasId(event.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md outline-none"
              >
                {state.aliases.map((alias) => (
                  <option key={alias.id} value={alias.id}>
                    {alias.codename} / {t(`opsConsole.roles.${alias.role}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedMission ? <MissionCard mission={selectedMission} aliases={state.aliases} t={t} /> : null}

          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={assignSelected}
              disabled={busy || !selectedMission || !selectedAlias}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ignyte px-4 py-2 text-label-md text-on-ignyte disabled:bg-surface-container-high disabled:text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                assignment_turned_in
              </span>
              {t("opsConsole.assign")}
            </button>
            <button
              type="button"
              onClick={() => setStatus(t("opsConsole.dropHint"))}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                hub
              </span>
              {t("opsConsole.deadDrop")}
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low/90 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-headline-sm">{t("opsConsole.agentControl")}</h2>
              <p className="text-body-md text-on-surface-variant">{t("opsConsole.agentControlBody")}</p>
            </div>
            <GlassIcon icon="groups_3" active size="lg" />
          </div>

          <div className="space-y-2">
            {state.aliases.map((alias) => (
              <AliasRow key={alias.id} alias={alias} t={t} />
            ))}
          </div>

          <div className="space-y-2 rounded-lg border border-ignyte/25 bg-ignyte/10 p-3">
            <label className="space-y-1">
              <span className="text-caption text-ignyte">{t("opsConsole.inviteAlias")}</span>
              <input
                value={inviteAlias}
                onChange={(event) => setInviteAlias(event.target.value)}
                placeholder={state.inviteAliasPlaceholder}
                className="w-full rounded-lg border border-ignyte/30 bg-surface px-3 py-2 font-mono text-body-md outline-none"
              />
            </label>
            <button
              type="button"
              onClick={inviteSelected}
              disabled={busy || !selectedMission || !inviteAlias.trim()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ignyte px-4 py-2 text-label-md text-on-ignyte disabled:bg-surface-container-high disabled:text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                forward_to_inbox
              </span>
              {t("opsConsole.sendInvite")}
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <OperationsGlobe />
        <div className="space-y-4">
          <NotificationFeed
            notifications={state.notifications}
            missions={state.missions}
            aliases={state.aliases}
            busy={busy}
            onRefresh={() => {
              void refreshFundingNotifications(state);
            }}
            t={t}
          />
          <section className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low/90 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline-sm">{t("opsConsole.invites")}</h2>
                <p className="text-body-md text-on-surface-variant">{t("opsConsole.invitesBody")}</p>
              </div>
              <GlassIcon icon="mark_email_unread" active size="lg" />
            </div>
            {state.invites.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">{t("common.empty")}</p>
            ) : (
              <div className="space-y-2">
                {state.invites.map((invite) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    mission={state.missions.find((m) => m.id === invite.missionId)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {status ? (
        <div role="status" className="rounded-lg border border-ignyte/30 bg-ignyte/10 px-3 py-2 text-label-md text-ignyte">
          {status}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-caption text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-[18px] text-ignyte" aria-hidden>
          {icon}
        </span>
      </div>
      <div className="font-mono text-[24px] text-on-surface">{value}</div>
    </div>
  );
}

function MissionCard({
  mission,
  aliases,
  t,
}: {
  mission: MissionBounty;
  aliases: OperativeAlias[];
  t: ReturnType<typeof useI18n>;
}) {
  const tt = t as unknown as (key: string) => string;
  const assigned = mission.assignedAliasIds
    .map((id) => aliases.find((alias) => alias.id === id)?.codename)
    .filter(Boolean)
    .join(", ");
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-caption text-ignyte">{mission.codename}</div>
          <h3 className="font-headline-sm">{tt(mission.titleKey)}</h3>
        </div>
        <span className={`rounded-full px-2 py-1 text-caption ${riskClass(mission.risk)}`}>
          {t(`opsConsole.risk.${mission.risk}`)}
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Fact label={t("opsConsole.bounty")} value={`${mission.bounty.amount} ${mission.bounty.assetId.toUpperCase()}`} />
        <Fact label={t("opsConsole.status")} value={t(`opsConsole.missionStatus.${mission.status}`)} />
        <Fact label={t("opsConsole.assignedTo")} value={assigned || t("common.noData")} />
      </div>
    </div>
  );
}

function AliasRow({ alias, t }: { alias: OperativeAlias; t: ReturnType<typeof useI18n> }) {
  const tt = t as unknown as (key: string) => string;
  const displayName = alias.displayNameKey ? tt(alias.displayNameKey) : alias.displayName;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3">
      <div className="min-w-0">
        <div className="font-mono text-label-md text-ignyte">{alias.codename}</div>
        <div className="truncate text-caption text-on-surface-variant">
          {displayName} / {t(`opsConsole.roles.${alias.role}`)}
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-1 text-caption ${aliasStatusClass(alias.status)}`}>
        {t(`opsConsole.aliasStatus.${alias.status}`)}
      </span>
    </div>
  );
}

function InviteRow({
  invite,
  mission,
  t,
}: {
  invite: WorkspaceInvite;
  mission?: MissionBounty;
  t: ReturnType<typeof useI18n>;
}) {
  const tt = t as unknown as (key: string) => string;
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-mono text-label-md text-ignyte">{invite.inviteCode}</div>
          <div className="text-caption text-on-surface-variant">
            {invite.targetAlias} / {mission ? tt(mission.titleKey) : invite.missionId}
          </div>
        </div>
        <span className="rounded-full bg-surface-container-high px-2 py-1 text-caption text-on-surface-variant">
          {t(`opsConsole.inviteStatus.${invite.status}`)}
        </span>
      </div>
    </div>
  );
}

function NotificationFeed({
  notifications,
  missions,
  aliases,
  busy,
  onRefresh,
  t,
}: {
  notifications: OpsNotification[];
  missions: MissionBounty[];
  aliases: OperativeAlias[];
  busy: boolean;
  onRefresh: () => void;
  t: ReturnType<typeof useI18n>;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low/90 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-sm">{t("opsConsole.notifications.title")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("opsConsole.notifications.body")}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-50"
          aria-label={t("opsConsole.notifications.refresh")}
          title={t("opsConsole.notifications.refresh")}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            sync
          </span>
        </button>
      </div>
      {notifications.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">{t("opsConsole.notifications.empty")}</p>
      ) : (
        <div className="space-y-2">
          {notifications.slice(0, 8).map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              missions={missions}
              aliases={aliases}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationRow({
  notification,
  missions,
  aliases,
  t,
}: {
  notification: OpsNotification;
  missions: MissionBounty[];
  aliases: OperativeAlias[];
  t: ReturnType<typeof useI18n>;
}) {
  const tt = t as unknown as (key: string) => string;
  const mission = notification.missionId ? missions.find((candidate) => candidate.id === notification.missionId) : null;
  const alias = notification.aliasId ? aliases.find((candidate) => candidate.id === notification.aliasId) : null;
  const details = notificationDetails(notification, mission, alias, t);
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="flex items-start gap-3">
        <span
          className={`material-symbols-outlined mt-0.5 rounded-lg p-2 text-[18px] ${notificationIconClass(
            notification.kind,
          )}`}
          aria-hidden
        >
          {notificationIcon(notification.kind)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-headline-sm text-[16px]">{tt(notification.titleKey)}</h3>
            <time className="font-mono text-caption text-on-surface-variant">
              {new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(
                new Date(notification.createdAt),
              )}
            </time>
          </div>
          <p className="text-body-md text-on-surface-variant">{tt(notification.bodyKey)}</p>
          {details.length > 0 ? (
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={`${label}-${value}`} className="min-w-0 rounded-md bg-surface-container-low px-2 py-1">
                  <dt className="text-caption text-on-surface-variant">{label}</dt>
                  <dd className="truncate font-mono text-caption text-on-surface">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function notificationDetails(
  notification: OpsNotification,
  mission: MissionBounty | null | undefined,
  alias: OperativeAlias | null | undefined,
  t: ReturnType<typeof useI18n>,
): Array<[string, string]> {
  const meta = notification.meta ?? {};
  const details: Array<[string, string]> = [];
  if (mission) details.push([t("opsConsole.mission"), mission.codename]);
  else if (meta.mission) details.push([t("opsConsole.mission"), meta.mission]);
  if (alias) details.push([t("opsConsole.alias"), alias.codename]);
  else if (meta.alias) details.push([t("opsConsole.alias"), meta.alias]);
  if (meta.amount) details.push([t("opsConsole.notificationMeta.amount"), meta.amount]);
  if (meta.invite) details.push([t("opsConsole.notificationMeta.invite"), meta.invite]);
  if (meta.chain) details.push([t("opsConsole.notificationMeta.chain"), meta.chain]);
  if (meta.reason) details.push([t("opsConsole.notificationMeta.reason"), meta.reason]);
  if (meta.hash) details.push([t("opsConsole.notificationMeta.hash"), meta.hash]);
  return details.slice(0, 6);
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-2">
      <div className="text-caption text-on-surface-variant">{label}</div>
      <div className="truncate font-mono text-label-md text-on-surface">{value}</div>
    </div>
  );
}

function riskClass(risk: string) {
  if (risk === "critical") return "bg-error-container text-on-error-container";
  if (risk === "elevated") return "bg-ignyte text-on-ignyte";
  return "bg-secondary-container text-on-secondary-container";
}

function aliasStatusClass(status: string) {
  if (status === "available") return "bg-secondary-container text-on-secondary-container";
  if (status === "assigned") return "bg-ignyte text-on-ignyte";
  if (status === "invited") return "bg-primary-container text-on-primary-container";
  return "bg-surface-container-high text-on-surface-variant";
}

function notificationIcon(kind: OpsNotification["kind"]) {
  if (kind === "assignment") return "assignment_turned_in";
  if (kind === "invite") return "forward_to_inbox";
  if (kind === "funding") return "account_balance_wallet";
  return "notifications";
}

function notificationIconClass(kind: OpsNotification["kind"]) {
  if (kind === "assignment") return "bg-ignyte text-on-ignyte";
  if (kind === "invite") return "bg-primary-container text-on-primary-container";
  if (kind === "funding") return "bg-secondary-container text-on-secondary-container";
  return "bg-surface-container-high text-on-surface-variant";
}
