import Link from "next/link";
import { listLandingActions, listLandingSurfaces, type LandingAction } from "@leclerc/core";
import { setStaticParamsLocale } from "next-international/server";
import { getI18n } from "@/locales/server";
import { LandingOperationsScene } from "@/components/landing-operations-scene";

export default async function LandingPage({ params }: { params: Promise<{ locale: "es" | "en" }> }) {
  const { locale } = await params;
  setStaticParamsLocale(locale);
  const t = await getI18n();
  const actions = listLandingActions();
  const surfaces = listLandingSurfaces();

  return (
    <div className="ml-[calc(50%-50vw)] w-screen">
      <section className="relative flex min-h-[82dvh] overflow-hidden px-5 py-8">
        <div className="absolute inset-0 bg-surface">
          <LandingOperationsScene />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,14,20,.96)_0%,rgba(10,14,20,.82)_42%,rgba(10,14,20,.28)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col justify-center gap-8">
          <div className="max-w-2xl space-y-5">
            <p className="font-mono text-caption uppercase text-ignyte">
              {t("landing.eyebrow")}
            </p>
            <h1 className="font-display-lg text-[52px] leading-[1.02] text-on-surface">LeClerc</h1>
            <p className="max-w-xl text-body-lg text-on-surface-variant">{t("landing.hero")}</p>
          </div>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {actions.map((action) => (
              <LandingActionButton key={action.id} action={action} locale={locale} t={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 pb-12">
        <div className="mx-auto grid w-full max-w-5xl gap-3 sm:grid-cols-3">
          {surfaces.map((surface) => (
            <div key={surface.id} className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <span className="material-symbols-outlined text-[26px] text-ignyte" aria-hidden>
                {surface.icon}
              </span>
              <h2 className="mt-3 font-headline-sm">{translateKey(t, surface.titleKey)}</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">{translateKey(t, surface.bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LandingActionButton({
  action,
  locale,
  t,
}: {
  action: LandingAction;
  locale: "es" | "en";
  t: Awaited<ReturnType<typeof getI18n>>;
}) {
  const href = action.id === "operation-room" ? `/${locale}` : action.href;
  const content = (
    <>
      <span className="material-symbols-outlined text-[22px]" aria-hidden>
        {action.icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-label-md">{translateKey(t, action.labelKey)}</span>
        <span className="block truncate text-caption opacity-75">{translateKey(t, action.descriptionKey)}</span>
      </span>
    </>
  );
  if (!action.enabled) {
    return (
      <button
        type="button"
        disabled
        className="flex min-h-16 items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low/70 px-3 text-left text-on-surface-variant opacity-65"
      >
        {content}
      </button>
    );
  }
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-3 rounded-lg border border-outline-variant bg-ignyte px-3 text-left text-on-ignyte transition-transform active:active-tap"
    >
      {content}
    </Link>
  );
}

function translateKey(t: Awaited<ReturnType<typeof getI18n>>, key: string): string {
  return (t as unknown as (value: string) => string)(key);
}
