import type { LeclercAssetId } from "./asset-catalog";
import type {
  InviteStatus,
  MissionRisk,
  MissionStatus,
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
