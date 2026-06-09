import type { LeclercAssetId, LeclercChainId } from "@leclerc/transfer-core";
import { DEFAULT_MISSION_FUNDING_STORY_ID, listMissionStories } from "@leclerc/transfer-core";
import { confirmTransfer, proposeTransfer } from "./confirmation";

export type MissionFundingStatus = "submitted" | "blocked";
export type MissionFundingEventKind = "mission_funding";

export interface MissionFundingConfig {
  missionId: string;
  titleKey: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  defaultAmount: string;
  fundingTargetEnv: string;
  notificationTopicHint: string;
}

export interface MissionFundingNotification {
  id: string;
  kind: MissionFundingEventKind;
  missionId: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  amount: string;
  status: MissionFundingStatus;
  hash?: string;
  reason?: string;
  createdAt: string;
}

export const DEFAULT_MISSION_FUNDING_ID = DEFAULT_MISSION_FUNDING_STORY_ID;

export const LECLERC_MISSION_FUNDING = listMissionStories().flatMap((story) =>
  story.funding
    ? [
        {
          missionId: story.funding.missionId,
          titleKey: story.titleKey,
          assetId: story.funding.assetId,
          chainId: story.funding.chainId,
          defaultAmount: story.funding.defaultAmount,
          fundingTargetEnv: story.funding.fundingTargetEnv,
          notificationTopicHint: story.funding.notificationTopicHint,
        },
      ]
    : [],
) satisfies MissionFundingConfig[];

export function listMissionFundingConfigs(): MissionFundingConfig[] {
  return [...LECLERC_MISSION_FUNDING];
}

export function getMissionFundingConfig(missionId: string): MissionFundingConfig | null {
  return LECLERC_MISSION_FUNDING.find((mission) => mission.missionId === missionId) ?? null;
}

export function proposeMissionFunding(input: {
  seed?: string;
  missionId?: string;
  amount?: string;
  env: Partial<Record<string, string | undefined>>;
}):
  | { status: "requires_confirmation"; proposal: ReturnType<typeof proposeTransfer> }
  | { status: "blocked"; notification: MissionFundingNotification } {
  const missionId = input.missionId?.trim() || DEFAULT_MISSION_FUNDING_ID;
  const mission = getMissionFundingConfig(missionId);
  if (!mission) throw new Error("unknown mission");

  const amount = input.amount?.trim() || mission.defaultAmount;
  const target = input.env[mission.fundingTargetEnv]?.trim();
  if (!target || target === "0x0000000000000000000000000000000000000000") {
    return {
      status: "blocked",
      notification: createMissionFundingNotification({
        missionId: mission.missionId,
        assetId: mission.assetId,
        chainId: mission.chainId,
        amount,
        status: "blocked",
        reason: `${mission.fundingTargetEnv} is not configured`,
      }),
    };
  }

  const seed = input.seed?.trim();
  if (!seed) throw new Error("wallet seed required");
  const proposal = proposeTransfer({
    seed,
    to: target,
    amount,
    assetId: mission.assetId,
    chainId: mission.chainId,
    purpose: "mission-funding",
    metadata: { missionId: mission.missionId },
  });
  return { status: "requires_confirmation", proposal };
}

export async function confirmMissionFunding(confirmId: string): Promise<MissionFundingNotification> {
  const id = confirmId.trim();
  if (!id) throw new Error("confirmId required");
  const result = await confirmTransfer(id);
  if (result.proposal.purpose !== "mission-funding") throw new Error("confirmation is not for mission funding");
  const missionId = String(result.proposal.metadata?.missionId ?? "");
  const mission = getMissionFundingConfig(missionId);
  if (!mission) throw new Error("unknown mission");
  return createMissionFundingNotification({
    missionId: mission.missionId,
    assetId: result.proposal.assetId,
    chainId: result.proposal.chainId,
    amount: result.proposal.amount,
    status: "submitted",
    hash: result.hash,
  });
}

export function createMissionFundingNotification(
  input: Omit<MissionFundingNotification, "id" | "kind" | "createdAt">,
): MissionFundingNotification {
  return {
    id: `fund-${input.missionId}-${Date.now()}`,
    kind: "mission_funding",
    createdAt: new Date().toISOString(),
    ...input,
  };
}
