import type { LeclercAssetId, LeclercChainId } from "./asset-catalog";

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

export const LECLERC_MISSION_FUNDING = [
  {
    missionId: "raven",
    titleKey: "missions.raven.title",
    assetId: "usdc",
    chainId: 5042002,
    defaultAmount: "25.00",
    fundingTargetEnv: "LECLERC_MISSION_RAVEN_USDC_ADDRESS",
    notificationTopicHint: "raven-ops",
  },
] as const satisfies readonly MissionFundingConfig[];

export function listMissionFundingConfigs(): MissionFundingConfig[] {
  return [...LECLERC_MISSION_FUNDING];
}

export function getMissionFundingConfig(missionId: string): MissionFundingConfig | null {
  return LECLERC_MISSION_FUNDING.find((mission) => mission.missionId === missionId) ?? null;
}
