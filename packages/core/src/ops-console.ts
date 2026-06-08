import type { LeclercAssetId } from "./asset-catalog";

export type OperativeStatus = "available" | "assigned" | "invited" | "offline";
export type OperativeRole = "handler" | "field" | "analyst" | "medic" | "treasury";
export type MissionRisk = "routine" | "elevated" | "critical";
export type MissionStatus = "draft" | "open" | "assigned" | "active" | "complete";
export type InviteStatus = "pending" | "accepted" | "expired";

export interface OperativeAlias {
  id: string;
  codename: string;
  displayName: string;
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

export interface OpsConsoleState {
  workspaceId: string;
  workspaceName: string;
  aliases: OperativeAlias[];
  missions: MissionBounty[];
  invites: WorkspaceInvite[];
  updatedAt: number;
}

const NOW = Date.UTC(2026, 5, 8, 18, 0, 0);
const DAY = 86_400_000;

export const DEFAULT_OPS_WORKSPACE_ID = "workspace-leclerc";

export function defaultOpsConsoleState(now = NOW): OpsConsoleState {
  return {
    workspaceId: DEFAULT_OPS_WORKSPACE_ID,
    workspaceName: "LeClerc Continental Desk",
    updatedAt: now,
    aliases: [
      {
        id: "alias-handler",
        codename: "CLERK-00",
        displayName: "Handler",
        role: "handler",
        status: "available",
        workspaceId: DEFAULT_OPS_WORKSPACE_ID,
        nodeId: "safehouse-ba",
        walletHandle: "leclerc.safehouse",
        lastSeenAt: now - 6 * 60_000,
      },
      {
        id: "alias-raven",
        codename: "RAVEN-07",
        displayName: "North pier operative",
        role: "field",
        status: "assigned",
        workspaceId: DEFAULT_OPS_WORKSPACE_ID,
        nodeId: "agent-nyc",
        walletHandle: "raven.arc",
        lastSeenAt: now - 21 * 60_000,
      },
      {
        id: "alias-glass",
        codename: "GLASS-12",
        displayName: "Route analyst",
        role: "analyst",
        status: "available",
        workspaceId: DEFAULT_OPS_WORKSPACE_ID,
        nodeId: "desktop-london",
        walletHandle: "glass.desk",
        lastSeenAt: now - 52 * 60_000,
      },
      {
        id: "alias-medic",
        codename: "PATCH-04",
        displayName: "Field medic",
        role: "medic",
        status: "invited",
        workspaceId: DEFAULT_OPS_WORKSPACE_ID,
        nodeId: "agent-dubai",
        lastSeenAt: now - DAY,
      },
    ],
    missions: [
      {
        id: "mission-raven",
        titleKey: "missions.raven.title",
        codename: "RAVEN LEDGER",
        status: "active",
        risk: "elevated",
        bounty: { assetId: "usdc", amount: "250.00" },
        workspaceId: DEFAULT_OPS_WORKSPACE_ID,
        assignedAliasIds: ["alias-raven"],
        inviteIds: ["invite-patch-raven"],
        dropTopic: "raven-ledger",
        createdAt: now - 2 * DAY,
      },
      {
        id: "mission-glasshouse",
        titleKey: "missions.glasshouse.title",
        codename: "GLASSHOUSE ROUTE",
        status: "open",
        risk: "routine",
        bounty: { assetId: "usdc", amount: "125.00" },
        workspaceId: DEFAULT_OPS_WORKSPACE_ID,
        assignedAliasIds: ["alias-glass"],
        inviteIds: [],
        dropTopic: "glasshouse-route",
        createdAt: now - DAY,
      },
      {
        id: "mission-medic",
        titleKey: "missions.medic.title",
        codename: "PATCH WINDOW",
        status: "draft",
        risk: "critical",
        bounty: { assetId: "usdc", amount: "400.00" },
        workspaceId: DEFAULT_OPS_WORKSPACE_ID,
        assignedAliasIds: [],
        inviteIds: ["invite-patch-raven"],
        dropTopic: "patch-window",
        createdAt: now - 8 * 60 * 60_000,
      },
    ],
    invites: [
      {
        id: "invite-patch-raven",
        workspaceId: DEFAULT_OPS_WORKSPACE_ID,
        missionId: "mission-medic",
        codename: "PATCH-04",
        targetAlias: "PATCH-04",
        status: "pending",
        inviteCode: "LC-PATCH-04-MEDIC",
        createdAt: now - 3 * 60 * 60_000,
        expiresAt: now + 3 * DAY,
      },
    ],
  };
}

export function assignMission(
  state: OpsConsoleState,
  missionId: string,
  aliasId: string,
  now = Date.now(),
): OpsConsoleState {
  const missionExists = state.missions.some((mission) => mission.id === missionId);
  const aliasExists = state.aliases.some((alias) => alias.id === aliasId);
  if (!missionExists || !aliasExists) return state;

  return {
    ...state,
    updatedAt: now,
    aliases: state.aliases.map((alias) =>
      alias.id === aliasId ? { ...alias, status: "assigned", lastSeenAt: now } : alias,
    ),
    missions: state.missions.map((mission) =>
      mission.id === missionId
        ? {
            ...mission,
            status: mission.status === "draft" || mission.status === "open" ? "assigned" : mission.status,
            assignedAliasIds: mission.assignedAliasIds.includes(aliasId)
              ? mission.assignedAliasIds
              : [...mission.assignedAliasIds, aliasId],
          }
        : mission,
    ),
  };
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
  const invite: WorkspaceInvite = {
    id,
    workspaceId: state.workspaceId,
    missionId: mission.id,
    codename: input.codename?.trim().toUpperCase() || targetAlias,
    targetAlias,
    status: "pending",
    inviteCode: `LC-${targetAlias.replace(/[^A-Z0-9]+/g, "-")}-${now.toString(36).toUpperCase()}`,
    createdAt: now,
    expiresAt: now + 3 * DAY,
  };
  return {
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
      : [
          {
            id: `alias-${id}`,
            codename: targetAlias,
            displayName: targetAlias,
            role: "field",
            status: "invited",
            workspaceId: state.workspaceId,
            lastSeenAt: now,
          },
          ...state.aliases,
        ],
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
