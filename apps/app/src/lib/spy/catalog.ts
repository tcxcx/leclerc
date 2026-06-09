import { listMissionStories, type LeclercMissionStoryId } from "@leclerc/transfer-core";

export type GadgetId =
  | "transcribe"
  | "extract"
  | "chat"
  | "ragAsk"
  | "ragSearch"
  | "brief"
  | "geo"
  | "reasoning"
  | "wallet"
  | "station";

export type GadgetField = {
  name: string;
  type: "text" | "textarea" | "select";
  i18nKey: string;
  options?: string[];
};

export type Gadget = {
  id: GadgetId;
  icon: string;
  labelKey: string;
  descriptionKey: string;
  fields: GadgetField[];
};

export const GADGETS: Gadget[] = [
  {
    id: "transcribe",
    icon: "graphic_eq",
    labelKey: "spy.gadgets.transcribe.label",
    descriptionKey: "spy.gadgets.transcribe.description",
    fields: [{ name: "note", type: "textarea", i18nKey: "spy.fields.audioNote" }],
  },
  {
    id: "extract",
    icon: "genetics",
    labelKey: "spy.gadgets.extract.label",
    descriptionKey: "spy.gadgets.extract.description",
    fields: [{ name: "transcript", type: "textarea", i18nKey: "spy.fields.transcript" }],
  },
  {
    id: "chat",
    icon: "forum",
    labelKey: "spy.gadgets.chat.label",
    descriptionKey: "spy.gadgets.chat.description",
    fields: [{ name: "prompt", type: "textarea", i18nKey: "spy.fields.prompt" }],
  },
  {
    id: "ragAsk",
    icon: "auto_stories",
    labelKey: "spy.gadgets.ragAsk.label",
    descriptionKey: "spy.gadgets.ragAsk.description",
    fields: [{ name: "query", type: "textarea", i18nKey: "spy.fields.query" }],
  },
  {
    id: "ragSearch",
    icon: "search",
    labelKey: "spy.gadgets.ragSearch.label",
    descriptionKey: "spy.gadgets.ragSearch.description",
    fields: [{ name: "query", type: "textarea", i18nKey: "spy.fields.query" }],
  },
  {
    id: "brief",
    icon: "satellite_alt",
    labelKey: "spy.gadgets.brief.label",
    descriptionKey: "spy.gadgets.brief.description",
    fields: [{ name: "focus", type: "textarea", i18nKey: "spy.fields.focus" }],
  },
  {
    id: "geo",
    icon: "location_on",
    labelKey: "spy.gadgets.geo.label",
    descriptionKey: "spy.gadgets.geo.description",
    fields: [{ name: "query", type: "textarea", i18nKey: "spy.fields.query" }],
  },
  {
    id: "reasoning",
    icon: "psychology",
    labelKey: "spy.gadgets.reasoning.label",
    descriptionKey: "spy.gadgets.reasoning.description",
    fields: [
      {
        name: "level",
        type: "select",
        i18nKey: "spy.fields.level",
        options: ["medio", "alto", "medico"],
      },
    ],
  },
  {
    id: "wallet",
    icon: "account_balance_wallet",
    labelKey: "spy.gadgets.wallet.label",
    descriptionKey: "spy.gadgets.wallet.description",
    fields: [{ name: "seed", type: "textarea", i18nKey: "spy.fields.seed" }],
  },
  {
    id: "station",
    icon: "hub",
    labelKey: "spy.gadgets.station.label",
    descriptionKey: "spy.gadgets.station.description",
    fields: [{ name: "peer", type: "text", i18nKey: "spy.fields.peer" }],
  },
];

export type MissionId = LeclercMissionStoryId;

export type Mission = {
  id: MissionId;
  icon: string;
  titleKey: string;
  briefKey: string;
  gadgetIds: GadgetId[];
  prefill: Partial<Record<GadgetId, Record<string, string>>>;
};

export const MISSIONS: Mission[] = listMissionStories().map((story) => ({
  id: story.id,
  icon: story.spy.icon,
  titleKey: story.titleKey,
  briefKey: story.briefKey,
  gadgetIds: [...story.spy.gadgetIds] as GadgetId[],
  prefill: story.spy.prefill as Partial<Record<GadgetId, Record<string, string>>>,
}));
