"use client";

import { useMemo, useState, type JSX } from "react";
import { useI18n } from "@/locales/client";
import { captureExtract, chat, ragAsk, ragSearch, runBrief, station, wallet } from "@/lib/api-client";
import { GADGETS, MISSIONS, type Gadget, type GadgetId, type MissionId } from "@/lib/spy/catalog";
import { GlassIcon } from "./glass-icon";

type Values = Partial<Record<GadgetId, Record<string, string>>>;
type MissionState = Partial<Record<MissionId, "accepted" | "denied">>;

const DEFAULT_VALUES: Values = Object.fromEntries(
  GADGETS.map((gadget) => [gadget.id, Object.fromEntries(gadget.fields.map((field) => [field.name, ""]))]),
) as Values;

export function SpyConsole({ locale, onClose }: { locale: "es" | "en"; onClose: () => void }): JSX.Element {
  const t = useI18n();
  const tt = t as unknown as (key: string) => string;
  const [selectedMission, setSelectedMission] = useState<MissionId>(MISSIONS[0].id);
  const [missionState, setMissionState] = useState<MissionState>({});
  const [values, setValues] = useState<Values>(DEFAULT_VALUES);
  const [running, setRunning] = useState<GadgetId | null>(null);
  const [result, setResult] = useState<{ gadget: GadgetId; text: string } | null>(null);

  const mission = useMemo(
    () => MISSIONS.find((candidate) => candidate.id === selectedMission) ?? MISSIONS[0],
    [selectedMission],
  );
  const unlocked = new Set(mission.gadgetIds);
  const selectedMissionState = missionState[mission.id];

  function acceptMission(next: "accepted" | "denied") {
    setMissionState((prev) => ({ ...prev, [mission.id]: next }));
    if (next === "accepted") {
      setValues((prev) => ({ ...prev, ...mission.prefill }));
    }
  }

  function setField(gadget: GadgetId, field: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [gadget]: { ...(prev[gadget] ?? {}), [field]: value },
    }));
  }

  async function runGadget(gadget: Gadget) {
    const input = values[gadget.id] ?? {};
    setRunning(gadget.id);
    setResult(null);
    try {
      const output = await executeGadget(gadget.id, input, locale);
      setResult({ gadget: gadget.id, text: output });
    } catch (error) {
      setResult({
        gadget: gadget.id,
        text: error instanceof Error ? error.message : t("spy.runFailed"),
      });
    } finally {
      setRunning(null);
    }
  }

  return (
    <section className="anim-enter space-y-3 rounded-lg border border-outline-variant bg-surface-container-low/95 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-headline-sm text-on-surface">{t("spy.title")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("spy.subtitle")}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t("common.cancel")} className="rounded-full">
          <GlassIcon icon="close" label={t("common.cancel")} size="sm" />
        </button>
      </div>

      <div className="space-y-2 rounded-lg border border-outline-variant bg-surface/70 p-3">
        <div className="grid grid-cols-[3rem_1fr] gap-3">
          <GlassIcon icon={mission.icon} active size="md" />
          <div className="min-w-0">
            <label className="text-caption text-on-surface-variant" htmlFor="mission-select">
              {t("missions.selector")}
            </label>
            <select
              id="mission-select"
              value={selectedMission}
              onChange={(event) => setSelectedMission(event.target.value as MissionId)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-body-md outline-none"
            >
              {MISSIONS.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {tt(candidate.titleKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-body-md text-on-surface">{tt(mission.briefKey)}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => acceptMission("accepted")}
            className="flex-1 rounded-lg bg-ignyte px-3 py-2 text-on-ignyte font-label-md"
          >
            {t("missions.accept")}
          </button>
          <button
            type="button"
            onClick={() => acceptMission("denied")}
            className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-on-surface font-label-md"
          >
            {t("missions.deny")}
          </button>
        </div>
        {selectedMissionState ? (
          <p className="text-caption text-on-surface-variant">
            {tt(`missions.state.${selectedMissionState}`)}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {GADGETS.map((gadget) => (
          <GadgetTile
            key={gadget.id}
            gadget={gadget}
            values={values[gadget.id] ?? {}}
            disabled={!unlocked.has(gadget.id)}
            running={running === gadget.id}
            onField={setField}
            onRun={() => runGadget(gadget)}
          />
        ))}
      </div>

      {result && (
        <div className="rounded-lg border border-outline-variant bg-surface-container p-3">
          <div className="mb-1 flex items-center gap-2 text-label-md text-ignyte">
            <GlassIcon icon={GADGETS.find((g) => g.id === result.gadget)?.icon ?? "terminal"} active size="sm" />
            <span>{t("spy.toolResult")}</span>
          </div>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-caption text-on-surface-variant">
            {result.text}
          </pre>
        </div>
      )}
    </section>
  );
}

function GadgetTile({
  gadget,
  values,
  disabled,
  running,
  onField,
  onRun,
}: {
  gadget: Gadget;
  values: Record<string, string>;
  disabled: boolean;
  running: boolean;
  onField: (gadget: GadgetId, field: string, value: string) => void;
  onRun: () => void;
}): JSX.Element {
  const t = useI18n();
  const tt = t as unknown as (key: string) => string;

  return (
    <div
      className={`rounded-lg border border-outline-variant bg-surface-container/80 p-2 ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <GlassIcon icon={gadget.icon} active={!disabled} size="sm" />
        <div className="min-w-0">
          <h3 className="truncate text-label-md text-on-surface">{tt(gadget.labelKey)}</h3>
          <p className="text-caption text-on-surface-variant">{tt(gadget.descriptionKey)}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {gadget.fields.map((field) =>
          field.type === "select" ? (
            <select
              key={field.name}
              value={values[field.name] ?? field.options?.[0] ?? ""}
              onChange={(event) => onField(gadget.id, field.name, event.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-caption outline-none"
            >
              {(field.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              key={field.name}
              value={values[field.name] ?? ""}
              onChange={(event) => onField(gadget.id, field.name, event.target.value)}
              placeholder={tt(field.i18nKey)}
              disabled={disabled}
              rows={2}
              className="w-full resize-none rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-caption outline-none"
            />
          ) : (
            <input
              key={field.name}
              value={values[field.name] ?? ""}
              onChange={(event) => onField(gadget.id, field.name, event.target.value)}
              placeholder={tt(field.i18nKey)}
              disabled={disabled}
              className="w-full rounded-lg border border-outline-variant bg-surface px-2 py-1.5 text-caption outline-none"
            />
          ),
        )}
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={disabled || running}
        className="mt-2 w-full rounded-lg bg-ignyte px-2 py-1.5 text-on-ignyte text-caption font-semibold disabled:bg-surface-container-high disabled:text-on-surface-variant"
      >
        {running ? t("common.loading") : t("spy.run")}
      </button>
    </div>
  );
}

async function executeGadget(id: GadgetId, input: Record<string, string>, locale: "es" | "en") {
  switch (id) {
    case "transcribe":
      return locale === "es"
        ? "La transcripción en vivo se ejecuta desde el botón central de voz y el servicio WS."
        : "Live transcription runs from the center voice button and WS service.";
    case "extract":
      return JSON.stringify(await captureExtract({ transcript: input.transcript ?? "", locale }), null, 2);
    case "chat":
      return (await chat([{ role: "user", content: input.prompt ?? "" }], { locale })).text;
    case "ragAsk":
      return JSON.stringify(await ragAsk(input.query ?? ""), null, 2);
    case "ragSearch":
      return JSON.stringify(await ragSearch(input.query ?? ""), null, 2);
    case "brief":
      return JSON.stringify(await runBrief({ records: [], focus: input.focus, locale }), null, 2);
    case "geo":
      return JSON.stringify(await ragSearch(input.query ?? "location", 8), null, 2);
    case "reasoning":
      return JSON.stringify({ level: input.level || "medio", mode: "configured in settings/model level" }, null, 2);
    case "wallet":
      return input.seed ? JSON.stringify(await wallet.balances(input.seed), null, 2) : "seed required";
    case "station":
      return input.peer
        ? JSON.stringify(await station.ping(input.peer), null, 2)
        : JSON.stringify(await station.start(), null, 2);
  }
}
