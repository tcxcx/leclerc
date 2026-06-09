import type { LeclercAssetId, LeclercChainId } from "./asset-catalog";
import { DEFAULT_OPS_CONSOLE_STORY, type OpsConsoleStory } from "./ops-stories";

export type OperativeStatus = "available" | "assigned" | "invited" | "offline";
export type OperativeRole = "handler" | "field" | "analyst" | "medic" | "treasury";
export type MissionRisk = "routine" | "elevated" | "critical";
export type MissionStatus = "draft" | "open" | "assigned" | "active" | "complete";
export type InviteStatus = "pending" | "accepted" | "expired";

export interface OperativeAlias {
  id: string;
  codename: string;
  displayName: string;
  displayNameKey?: string;
  role: OperativeRole;
  status: OperativeStatus;
  workspaceId: string;
  nodeId?: string;
  walletHandle?: string;
  lastSeenAt: number;
}

export interface MissionBounty {
  id: string;
  titleKey: string;
  codename: string;
  status: MissionStatus;
  risk: MissionRisk;
  bounty: {
    assetId: LeclercAssetId;
    amount: string;
  };
  workspaceId: string;
  assignedAliasIds: string[];
  inviteIds: string[];
  dropTopic: string;
  fundingMissionIds?: string[];
  createdAt: number;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  missionId: string;
  codename: string;
  targetAlias: string;
  status: InviteStatus;
  inviteCode: string;
  createdAt: number;
  expiresAt: number;
}

export type OpsNotificationKind = "assignment" | "invite" | "funding" | "system";

export interface OpsNotification {
  id: string;
  kind: OpsNotificationKind;
  titleKey: string;
  bodyKey: string;
  meta?: Record<string, string>;
  missionId?: string;
  aliasId?: string;
  inviteId?: string;
  createdAt: number;
}

export interface OpsConsoleState {
  storyId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceNameKey: string;
  inviteAliasPlaceholder: string;
  inviteCodePrefix: string;
  aliases: OperativeAlias[];
  missions: MissionBounty[];
  invites: WorkspaceInvite[];
  notifications: OpsNotification[];
  updatedAt: number;
}

const NOW = Date.UTC(2026, 5, 8, 18, 0, 0);
const DAY = 86_400_000;
const MAX_NOTIFICATIONS = 50;

export const DEFAULT_OPS_WORKSPACE_ID = DEFAULT_OPS_CONSOLE_STORY.workspaceId;

export function defaultOpsConsoleState(
  now = NOW,
  story: OpsConsoleStory = DEFAULT_OPS_CONSOLE_STORY,
): OpsConsoleState {
  return {
    storyId: story.id,
    workspaceId: story.workspaceId,
    workspaceName: story.workspaceNameKey,
    workspaceNameKey: story.workspaceNameKey,
    inviteAliasPlaceholder: story.inviteAliasPlaceholder,
    inviteCodePrefix: story.inviteCodePrefix,
    updatedAt: now,
    aliases: story.aliases.map((alias) => ({
      id: alias.id,
      codename: alias.codename,
      displayName: alias.displayNameKey,
      displayNameKey: alias.displayNameKey,
      role: alias.role,
      status: alias.status,
      workspaceId: story.workspaceId,
      nodeId: alias.nodeId,
      walletHandle: alias.walletHandle,
      lastSeenAt: now + alias.lastSeenOffsetMs,
    })),
    missions: story.missions.map((mission) => ({
      id: mission.id,
      titleKey: mission.titleKey,
      codename: mission.codename,
      status: mission.status,
      risk: mission.risk,
      bounty: { ...mission.bounty },
      workspaceId: story.workspaceId,
      assignedAliasIds: [...mission.assignedAliasIds],
      inviteIds: [...mission.inviteIds],
      dropTopic: mission.dropTopic,
      fundingMissionIds: mission.fundingMissionIds ? [...mission.fundingMissionIds] : undefined,
      createdAt: now + mission.createdOffsetMs,
    })),
    invites: story.invites.map((invite) => ({
      id: invite.id,
      workspaceId: story.workspaceId,
      missionId: invite.missionId,
      codename: invite.codename,
      targetAlias: invite.targetAlias,
      status: invite.status,
      inviteCode: invite.inviteCode,
      createdAt: now + invite.createdOffsetMs,
      expiresAt: now + invite.expiresOffsetMs,
    })),
    notifications: [],
  };
}

export function normalizeOpsConsoleState(
  input: OpsConsoleState | null | undefined,
  now = Date.now(),
  story: OpsConsoleStory = DEFAULT_OPS_CONSOLE_STORY,
): OpsConsoleState {
  const fallback = defaultOpsConsoleState(now, story);
  if (!input) return fallback;

  const candidate = input as Partial<OpsConsoleState>;
  return {
    ...fallback,
    ...candidate,
    storyId: candidate.storyId ?? story.id,
    workspaceId: candidate.workspaceId ?? story.workspaceId,
    workspaceName: candidate.workspaceName ?? fallback.workspaceName,
    workspaceNameKey: candidate.workspaceNameKey ?? story.workspaceNameKey,
    inviteAliasPlaceholder: candidate.inviteAliasPlaceholder ?? story.inviteAliasPlaceholder,
    inviteCodePrefix: candidate.inviteCodePrefix ?? story.inviteCodePrefix,
    aliases: (candidate.aliases ?? fallback.aliases).map((alias) => ({
      ...alias,
      displayName: alias.displayName ?? alias.displayNameKey ?? alias.codename,
    })),
    missions: candidate.missions ?? fallback.missions,
    invites: candidate.invites ?? fallback.invites,
    notifications: sortNotifications(candidate.notifications ?? fallback.notifications),
    updatedAt: candidate.updatedAt ?? now,
  };
}

export function assignMission(
  state: OpsConsoleState,
  missionId: string,
  aliasId: string,
  now = Date.now(),
): OpsConsoleState {
  const mission = state.missions.find((candidate) => candidate.id === missionId);
  const alias = state.aliases.find((candidate) => candidate.id === aliasId);
  if (!mission || !alias) return state;

  const next: OpsConsoleState = {
    ...state,
    updatedAt: now,
    aliases: state.aliases.map((candidate): OperativeAlias =>
      candidate.id === aliasId ? { ...candidate, status: "assigned", lastSeenAt: now } : candidate,
    ),
    missions: state.missions.map((candidate) =>
      candidate.id === missionId
        ? {
            ...candidate,
            status: candidate.status === "draft" || candidate.status === "open" ? "assigned" : candidate.status,
            assignedAliasIds: candidate.assignedAliasIds.includes(aliasId)
              ? candidate.assignedAliasIds
              : [...candidate.assignedAliasIds, aliasId],
          }
        : candidate,
    ),
  };

  return addOpsNotification(
    next,
    {
      id: `notification-assignment-${missionId}-${aliasId}-${now}`,
      kind: "assignment",
      titleKey: "opsConsole.notifications.assignment.title",
      bodyKey: "opsConsole.notifications.assignment.body",
      missionId,
      aliasId,
      createdAt: now,
      meta: {
        mission: mission.codename,
        alias: alias.codename,
      },
    },
    now,
  );
}

export function createWorkspaceInvite(
  state: OpsConsoleState,
  input: { missionId: string; targetAlias: string; codename?: string },
  now = Date.now(),
): OpsConsoleState {
  const targetAlias = input.targetAlias.trim().toUpperCase();
  if (!targetAlias) return state;
  const mission = state.missions.find((candidate) => candidate.id === input.missionId);
  if (!mission) return state;
  const id = `invite-${now.toString(36)}-${targetAlias.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const inviteCodePrefix = (state.inviteCodePrefix || DEFAULT_OPS_CONSOLE_STORY.inviteCodePrefix)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-");
  const invite: WorkspaceInvite = {
    id,
    workspaceId: state.workspaceId,
    missionId: mission.id,
    codename: input.codename?.trim().toUpperCase() || targetAlias,
    targetAlias,
    status: "pending",
    inviteCode: `${inviteCodePrefix}-${targetAlias.replace(/[^A-Z0-9]+/g, "-")}-${now
      .toString(36)
      .toUpperCase()}`,
    createdAt: now,
    expiresAt: now + 3 * DAY,
  };
  const invitedAlias: OperativeAlias = {
    id: `alias-${id}`,
    codename: targetAlias,
    displayName: targetAlias,
    role: "field",
    status: "invited",
    workspaceId: state.workspaceId,
    lastSeenAt: now,
  };
  const next: OpsConsoleState = {
    ...state,
    updatedAt: now,
    invites: [invite, ...state.invites],
    missions: state.missions.map((candidate) =>
      candidate.id === mission.id
        ? { ...candidate, inviteIds: [invite.id, ...candidate.inviteIds] }
        : candidate,
    ),
    aliases: state.aliases.some((alias) => alias.codename === targetAlias)
      ? state.aliases
      : [invitedAlias, ...state.aliases],
  };

  return addOpsNotification(
    next,
    {
      id: `notification-invite-${invite.id}`,
      kind: "invite",
      titleKey: "opsConsole.notifications.invite.title",
      bodyKey: "opsConsole.notifications.invite.body",
      missionId: mission.id,
      inviteId: invite.id,
      createdAt: now,
      meta: {
        mission: mission.codename,
        alias: invite.targetAlias,
        invite: invite.inviteCode,
      },
    },
    now,
  );
}

export function addOpsNotification(
  state: OpsConsoleState,
  notification: OpsNotification,
  now = Date.now(),
): OpsConsoleState {
  return mergeOpsNotifications(state, [notification], now);
}

export function mergeOpsNotifications(
  state: OpsConsoleState,
  incoming: OpsNotification[],
  now = Date.now(),
): OpsConsoleState {
  const byId = new Map<string, OpsNotification>();
  for (const notification of state.notifications) byId.set(notification.id, notification);
  for (const notification of incoming) byId.set(notification.id, notification);
  return {
    ...state,
    notifications: sortNotifications([...byId.values()]).slice(0, MAX_NOTIFICATIONS),
    updatedAt: now,
  };
}

export function opsNotificationFromMissionFunding(
  input: {
    id: string;
    missionId: string;
    assetId: LeclercAssetId;
    chainId: LeclercChainId;
    amount: string;
    status: "submitted" | "blocked";
    hash?: string;
    reason?: string;
    createdAt: string | number;
  },
  state?: OpsConsoleState,
): OpsNotification {
  const mission = state?.missions.find(
    (candidate) => candidate.id === input.missionId || candidate.fundingMissionIds?.includes(input.missionId),
  );
  const createdAt = toTimestamp(input.createdAt);
  const statusTitle = input.status === "submitted" ? "fundingSubmitted" : "fundingBlocked";
  return {
    id: `notification-funding-${input.id}`,
    kind: "funding",
    titleKey: `opsConsole.notifications.${statusTitle}.title`,
    bodyKey: `opsConsole.notifications.${statusTitle}.body`,
    missionId: mission?.id ?? input.missionId,
    createdAt,
    meta: {
      mission: mission?.codename ?? input.missionId,
      amount: `${input.amount} ${input.assetId.toUpperCase()}`,
      chain: String(input.chainId),
      ...(input.hash ? { hash: input.hash } : {}),
      ...(input.reason ? { reason: input.reason } : {}),
    },
  };
}

export function opsConsoleCounts(state: OpsConsoleState) {
  return {
    aliases: state.aliases.length,
    missions: state.missions.length,
    openMissions: state.missions.filter((mission) => mission.status === "open" || mission.status === "draft").length,
    activeMissions: state.missions.filter((mission) => mission.status === "active" || mission.status === "assigned").length,
    pendingInvites: state.invites.filter((invite) => invite.status === "pending").length,
  };
}

function sortNotifications(notifications: OpsNotification[]): OpsNotification[] {
  return [...notifications].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
}

function toTimestamp(value: string | number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}
