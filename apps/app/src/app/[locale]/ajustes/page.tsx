"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLlmLevel, type LlmLevel } from "@/lib/llm-level";
import { unlock, lock, isUnlocked, forgetDeviceKey } from "@/lib/intel/crypto";
import { wipeAll } from "@/lib/intel/store-client";
import { wipeAllFinance } from "@/lib/finance/store-client";

const LEVELS: LlmLevel[] = ["media", "alta", "medico"];

export default function SettingsPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const router = useRouter();
  const [level, setLevel] = useLlmLevel();
  const [pass, setPass] = useState("");
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [confirmWipe, setConfirmWipe] = useState(false);

  async function doUnlock() {
    if (!pass) return;
    const salt = window.localStorage.getItem("leclerc-salt") ?? undefined;
    const newSalt = await unlock(pass, salt);
    window.localStorage.setItem("leclerc-salt", newSalt);
    setUnlocked(true);
    setPass("");
  }

  async function panic() {
    await wipeAll();
    await wipeAllFinance();
    lock();
    forgetDeviceKey();
    window.localStorage.removeItem("leclerc-salt");
    setConfirmWipe(false);
    setUnlocked(false);
    router.push(`/${locale}`);
  }

  return (
    <div className="anim-enter space-y-5">
      <h1 className="font-headline-md">{t("settings.title")}</h1>

      <Section title={t("settings.language")}>
        <LocaleSwitcher />
      </Section>

      <Section title={t("settings.model")}>
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`flex-1 rounded-xl border px-2 py-2.5 text-label-md ${
                level === l
                  ? "border-primary bg-primary-container text-on-primary-container"
                  : "border-outline-variant text-on-surface-variant"
              }`}
            >
              {t(`settings.modelLevels.${l}`)}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("settings.lock")}>
        {unlocked ? (
          <button
            onClick={() => {
              lock();
              setUnlocked(false);
            }}
            className="w-full rounded-xl border border-outline-variant py-3 text-label-md"
          >
            🔓 → 🔒 {t("settings.lock")}
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={t("settings.passphrase")}
              className="flex-1 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md"
            />
            <button onClick={doUnlock} className="rounded-xl bg-primary px-4 text-on-primary font-label-md">
              {t("settings.unlock")}
            </button>
          </div>
        )}
      </Section>

      <Section title={t("settings.panicWipe")}>
        <button
          onClick={() => setConfirmWipe(true)}
          className="w-full rounded-xl bg-error py-3 text-on-error font-label-md"
        >
          <span className="material-symbols-outlined align-middle text-[18px]" aria-hidden>
            local_fire_department
          </span>{" "}
          {t("settings.panicWipe")}
        </button>
      </Section>

      {confirmWipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface-container p-5 anim-pop">
            <p className="text-body-md">{t("settings.panicConfirm")}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmWipe(false)}
                className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md"
              >
                {t("common.cancel")}
              </button>
              <button onClick={panic} className="flex-1 rounded-xl bg-error py-3 text-on-error font-label-md">
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-caption uppercase tracking-wide text-on-surface-variant">{title}</h2>
      {children}
    </section>
  );
}
