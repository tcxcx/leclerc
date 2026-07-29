import { listMissionStories, type LeclercMissionStoryId } from "@leclerc/transfer-core";

export type SpyGadgetId =
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

export type SpyGadgetFieldType = "text" | "textarea" | "select";

export interface SpyGadgetField {
  name: string;
  type: SpyGadgetFieldType;
  i18nKey: string;
  options?: string[];
}

export interface SpyGadget {
  id: SpyGadgetId;
  icon: string;
  labelKey: string;
  descriptionKey: string;
  fields: SpyGadgetField[];
}

export type SpyMissionId = LeclercMissionStoryId;

export interface SpyMission {
  id: SpyMissionId;
  icon: string;
  titleKey: string;
  briefKey: string;
  gadgetIds: SpyGadgetId[];
  prefill: Partial<Record<SpyGadgetId, Record<string, string>>>;
}

export interface SpyGadgetStory {
  id: string;
  gadgets: SpyGadget[];
}

export const DEFAULT_SPY_GADGET_STORY: SpyGadgetStory = {
  id: "spy-console-gadget-shelf",
  gadgets: [
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
  ],
};

export function spyGadgetStories(story: SpyGadgetStory = DEFAULT_SPY_GADGET_STORY): SpyGadget[] {
  return story.gadgets.map((gadget) => ({
    ...gadget,
    fields: gadget.fields.map((field) => ({
      ...field,
      options: field.options ? [...field.options] : undefined,
    })),
  }));
}

export function spyMissionStories(story: SpyGadgetStory = DEFAULT_SPY_GADGET_STORY): SpyMission[] {
  return listMissionStories().map((mission) => ({
    id: mission.id,
    icon: mission.spy.icon,
    titleKey: mission.titleKey,
    briefKey: mission.briefKey,
    gadgetIds: mission.spy.gadgetIds.map((id) => assertSpyGadgetId(id, story)),
    prefill: cloneSpyPrefill(mission.spy.prefill, story),
  }));
}

export function spyDefaultGadgetValues(
  gadgets: SpyGadget[] = spyGadgetStories(),
): Partial<Record<SpyGadgetId, Record<string, string>>> {
  return Object.fromEntries(
    gadgets.map((gadget) => [gadget.id, Object.fromEntries(gadget.fields.map((field) => [field.name, ""]))]),
  ) as Partial<Record<SpyGadgetId, Record<string, string>>>;
}

export function isSpyGadgetId(id: string, story: SpyGadgetStory = DEFAULT_SPY_GADGET_STORY): id is SpyGadgetId {
  return story.gadgets.some((gadget) => gadget.id === id);
}

function assertSpyGadgetId(id: string, story: SpyGadgetStory): SpyGadgetId {
  if (isSpyGadgetId(id, story)) return id;
  throw new Error(`Unknown SPY gadget id: ${id}`);
}

function cloneSpyPrefill(
  prefill: Record<string, Record<string, string>>,
  story: SpyGadgetStory,
): Partial<Record<SpyGadgetId, Record<string, string>>> {
  const entries = Object.entries(prefill).map(([id, fields]) => [assertSpyGadgetId(id, story), { ...fields }]);
  return Object.fromEntries(entries) as Partial<Record<SpyGadgetId, Record<string, string>>>;
}
