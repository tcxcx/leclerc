import type { LeclercAssetId } from "./asset-catalog";
import type {
  InviteStatus,
  MissionRisk,
  MissionStatus,
  OpsNetworkArc,
  OpsNetworkNode,
  OperativeRole,
  OperativeStatus,
} from "./ops-console";

export interface OpsConsoleStoryAlias {
  id: string;
  codename: string;
  displayNameKey: string;
  role: OperativeRole;
  status: OperativeStatus;
  nodeId?: string;
  walletHandle?: string;
  lastSeenOffsetMs: number;
}

export interface OpsConsoleStoryMission {
  id: string;
  titleKey: string;
  codename: string;
  status: MissionStatus;
  risk: MissionRisk;
  bounty: {
    assetId: LeclercAssetId;
    amount: string;
  };
  assignedAliasIds: string[];
  inviteIds: string[];
  dropTopic: string;
  fundingMissionIds?: string[];
  createdOffsetMs: number;
}

export interface OpsConsoleStoryInvite {
  id: string;
  missionId: string;
  codename: string;
  targetAlias: string;
  status: InviteStatus;
  inviteCode: string;
  createdOffsetMs: number;
  expiresOffsetMs: number;
}

export interface OpsConsoleStory {
  id: string;
  workspaceId: string;
  workspaceNameKey: string;
  inviteAliasPlaceholder: string;
  inviteCodePrefix: string;
  network: {
    nodes: OpsNetworkNode[];
    arcs: OpsNetworkArc[];
  };
  aliases: OpsConsoleStoryAlias[];
  missions: OpsConsoleStoryMission[];
  invites: OpsConsoleStoryInvite[];
}

const DAY = 86_400_000;

export const DEFAULT_OPS_CONSOLE_STORY_ID = "continental-desk";

export const DEFAULT_OPS_CONSOLE_STORY = {
  id: DEFAULT_OPS_CONSOLE_STORY_ID,
  workspaceId: "workspace-leclerc",
  workspaceNameKey: "opsConsole.stories.continental.workspace",
  inviteAliasPlaceholder: "NIGHT-31",
  inviteCodePrefix: "LC",
  network: {
    nodes: [
      {
        id: "safehouse-ba",
        labelKey: "ops.nodes.safehouseBa",
        role: "station",
        status: "online",
        location: [-34.6037, -58.3816],
        size: 0.055,
        color: [0.96, 0.88, 0.01],
      },
      {
        id: "agent-nyc",
        labelKey: "ops.nodes.agentNyc",
        role: "mobile-agent",
        status: "online",
        location: [40.7128, -74.006],
        size: 0.04,
        color: [0.18, 0.78, 0.54],
      },
      {
        id: "desktop-london",
        labelKey: "ops.nodes.desktopLondon",
        role: "desktop-peer",
        status: "standby",
        location: [51.5072, -0.1276],
        size: 0.038,
        color: [0.5, 0.65, 1],
      },
      {
        id: "agent-dubai",
        labelKey: "ops.nodes.agentDubai",
        role: "mobile-agent",
        status: "degraded",
        location: [25.2048, 55.2708],
        size: 0.035,
        color: [1, 0.42, 0.32],
      },
      {
        id: "observer-tokyo",
        labelKey: "ops.nodes.observerTokyo",
        role: "observer",
        status: "standby",
        location: [35.6764, 139.65],
        size: 0.034,
        color: [0.72, 0.54, 1],
      },
    ],
    arcs: [
      {
        id: "ba-nyc",
        fromNodeId: "safehouse-ba",
        toNodeId: "agent-nyc",
        color: [0.96, 0.88, 0.01],
      },
      {
        id: "ba-london",
        fromNodeId: "safehouse-ba",
        toNodeId: "desktop-london",
        color: [0.5, 0.65, 1],
      },
      {
        id: "london-dubai",
        fromNodeId: "desktop-london",
        toNodeId: "agent-dubai",
        color: [1, 0.42, 0.32],
      },
      {
        id: "london-tokyo",
        fromNodeId: "desktop-london",
        toNodeId: "observer-tokyo",
        color: [0.72, 0.54, 1],
      },
    ],
  },
  aliases: [
    {
      id: "alias-handler",
      codename: "CLERK-00",
      displayNameKey: "opsConsole.stories.continental.aliases.handler",
      role: "handler",
      status: "available",
      nodeId: "safehouse-ba",
      walletHandle: "leclerc.safehouse",
      lastSeenOffsetMs: -6 * 60_000,
    },
    {
      id: "alias-raven",
      codename: "RAVEN-07",
      displayNameKey: "opsConsole.stories.continental.aliases.raven",
      role: "field",
      status: "assigned",
      nodeId: "agent-nyc",
      walletHandle: "raven.arc",
      lastSeenOffsetMs: -21 * 60_000,
    },
    {
      id: "alias-glass",
      codename: "GLASS-12",
      displayNameKey: "opsConsole.stories.continental.aliases.glass",
      role: "analyst",
      status: "available",
      nodeId: "desktop-london",
      walletHandle: "glass.desk",
      lastSeenOffsetMs: -52 * 60_000,
    },
    {
      id: "alias-medic",
      codename: "PATCH-04",
      displayNameKey: "opsConsole.stories.continental.aliases.medic",
      role: "medic",
      status: "invited",
      nodeId: "agent-dubai",
      lastSeenOffsetMs: -DAY,
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
      assignedAliasIds: ["alias-raven"],
      inviteIds: ["invite-patch-raven"],
      dropTopic: "raven-ledger",
      fundingMissionIds: ["raven"],
      createdOffsetMs: -2 * DAY,
    },
    {
      id: "mission-glasshouse",
      titleKey: "missions.glasshouse.title",
      codename: "GLASSHOUSE ROUTE",
      status: "open",
      risk: "routine",
      bounty: { assetId: "usdc", amount: "125.00" },
      assignedAliasIds: ["alias-glass"],
      inviteIds: [],
      dropTopic: "glasshouse-route",
      createdOffsetMs: -DAY,
    },
    {
      id: "mission-medic",
      titleKey: "missions.medic.title",
      codename: "PATCH WINDOW",
      status: "draft",
      risk: "critical",
      bounty: { assetId: "usdc", amount: "400.00" },
      assignedAliasIds: [],
      inviteIds: ["invite-patch-raven"],
      dropTopic: "patch-window",
      createdOffsetMs: -8 * 60 * 60_000,
    },
  ],
  invites: [
    {
      id: "invite-patch-raven",
      missionId: "mission-medic",
      codename: "PATCH-04",
      targetAlias: "PATCH-04",
      status: "pending",
      inviteCode: "LC-PATCH-04-MEDIC",
      createdOffsetMs: -3 * 60 * 60_000,
      expiresOffsetMs: 3 * DAY,
    },
  ],
} as const satisfies OpsConsoleStory;
