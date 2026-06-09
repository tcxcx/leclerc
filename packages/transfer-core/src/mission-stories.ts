import type { LeclercAssetId, LeclercChainId } from "./asset-catalog";
import { ARC_TESTNET_CHAIN_ID } from "./asset-catalog";

export type LeclercMissionStoryId = "raven" | "glasshouse" | "medic";

export interface LeclercMissionSpyStory {
  icon: string;
  gadgetIds: readonly string[];
  prefill: Record<string, Record<string, string>>;
}

export interface LeclercMissionRainCardStory {
  id: string;
  codename: string;
  type: "virtual" | "physical";
  status: "notActivated" | "active" | "locked" | "canceled" | "frozen";
  networkLabel: string;
  last4: string;
  expiry: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  balance: string;
  limit: {
    amount: string;
    assetId: LeclercAssetId;
    frequency: "daily" | "weekly" | "monthly" | "yearly";
  };
  defaultFundingAmount: string;
  fundingDepositEnv: string;
  backgroundImagePath: string;
  networkIconPath: string;
  brandIconPath: string;
  source: string;
}

export interface LeclercMissionFundingStory {
  missionId: string;
  assetId: LeclercAssetId;
  chainId: LeclercChainId;
  defaultAmount: string;
  fundingTargetEnv: string;
  notificationTopicHint: string;
}

export interface LeclercMissionStory {
  id: LeclercMissionStoryId;
  titleKey: string;
  briefKey: string;
  dossierKeywords: readonly string[];
  spy: LeclercMissionSpyStory;
  rainCard?: LeclercMissionRainCardStory;
  funding?: LeclercMissionFundingStory;
}

const RAIN_USDC_DEPOSIT_ENV = "LECLERC_RAIN_USDC_DEPOSIT_ADDRESS";

export const LECLERC_MISSION_STORIES: readonly LeclercMissionStory[] = [
  {
    id: "raven",
    titleKey: "missions.raven.title",
    briefKey: "missions.raven.brief",
    dossierKeywords: ["raven", "cuervo", "fund", "funding", "handler", "kestrel", "vector gris", "money"],
    spy: {
      icon: "person_pin_circle",
      gadgetIds: ["ragAsk", "ragSearch", "brief", "wallet"],
      prefill: {
        ragAsk: { query: "who funds Raven" },
        ragSearch: { query: "Raven funding handler" },
        brief: { focus: "Raven funding network" },
      },
    },
    rainCard: {
      id: "raven-07-usdc-virtual",
      codename: "RAVEN-07",
      type: "virtual",
      status: "active",
      networkLabel: "Rain issuing",
      last4: "0707",
      expiry: "10/28",
      assetId: "usdc",
      chainId: ARC_TESTNET_CHAIN_ID,
      balance: "240.00",
      limit: {
        amount: "500.00",
        assetId: "usdc",
        frequency: "monthly",
      },
      defaultFundingAmount: "25.00",
      fundingDepositEnv: RAIN_USDC_DEPOSIT_ENV,
      backgroundImagePath: "/assets/cards/bufi-card-bg-new.png",
      networkIconPath: "/networks/arc.svg",
      brandIconPath: "/icons/mastercard.svg",
      source:
        "../desk-v1 Rain card flows: getUserContracts().depositAddress + USDC funding; adapted to LeClerc WDK Arc Testnet.",
    },
    funding: {
      missionId: "raven",
      assetId: "usdc",
      chainId: ARC_TESTNET_CHAIN_ID,
      defaultAmount: "25.00",
      fundingTargetEnv: "LECLERC_MISSION_RAVEN_USDC_ADDRESS",
      notificationTopicHint: "raven-ops",
    },
  },
  {
    id: "glasshouse",
    titleKey: "missions.glasshouse.title",
    briefKey: "missions.glasshouse.brief",
    dossierKeywords: ["glasshouse", "casa de vidrio", "warehouse", "almacen", "south gate", "route", "ruta"],
    spy: {
      icon: "warehouse",
      gadgetIds: ["extract", "geo", "brief", "station"],
      prefill: {
        extract: { transcript: "Warehouse lights active after midnight near the south gate." },
        geo: { query: "warehouse south gate" },
        brief: { focus: "Glasshouse route and site exposure" },
      },
    },
  },
  {
    id: "medic",
    titleKey: "missions.medic.title",
    briefKey: "missions.medic.brief",
    dossierKeywords: ["medic", "medical", "medico", "triage", "triaje", "wound", "herida", "clinic", "clinica"],
    spy: {
      icon: "medical_services",
      gadgetIds: ["extract", "ragAsk", "reasoning", "brief"],
      prefill: {
        extract: { transcript: "Asset reports dizziness, shallow breathing, and dehydration after transit." },
        ragAsk: { query: "medical symptoms transit asset" },
        reasoning: { level: "medico" },
        brief: { focus: "Medic triage and field risk" },
      },
    },
  },
] as const;

export const DEFAULT_MISSION_FUNDING_STORY_ID =
  LECLERC_MISSION_STORIES.find((story) => story.funding)?.funding?.missionId ?? LECLERC_MISSION_STORIES[0].id;

export function listMissionStories(): LeclercMissionStory[] {
  return LECLERC_MISSION_STORIES.map((story) => ({
    ...story,
    dossierKeywords: [...story.dossierKeywords],
    spy: {
      ...story.spy,
      gadgetIds: [...story.spy.gadgetIds],
      prefill: clonePrefill(story.spy.prefill),
    },
    rainCard: story.rainCard
      ? {
          ...story.rainCard,
          limit: { ...story.rainCard.limit },
        }
      : undefined,
    funding: story.funding ? { ...story.funding } : undefined,
  }));
}

export function getMissionStory(id: string): LeclercMissionStory | null {
  return listMissionStories().find((story) => story.id === id) ?? null;
}

function clonePrefill(prefill: Record<string, Record<string, string>>): Record<string, Record<string, string>> {
  return Object.fromEntries(
    Object.entries(prefill).map(([gadgetId, fields]) => [gadgetId, { ...fields }]),
  );
}
