import { I18nProviderClient } from "@/locales/client";
import { InferenceModeProvider } from "@/lib/inference/mode";
import { TopBar } from "@/components/top-bar";
import { AppBackground } from "@/components/app-background";

export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <I18nProviderClient locale={locale}>
      <InferenceModeProvider>
        <AppBackground variant="ignyte" />
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-6xl">
          <TopBar />
          <main className="flex-1 px-4 pb-4 pt-2">{children}</main>
        </div>
      </InferenceModeProvider>
    </I18nProviderClient>
  );
}
