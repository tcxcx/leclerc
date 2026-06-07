import { I18nProviderClient } from "@/locales/client";
import { InferenceModeProvider } from "@/lib/inference/mode";
import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

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
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <TopBar />
          <main className="flex-1 px-4 pb-28 pt-2">{children}</main>
          <BottomNav />
        </div>
      </InferenceModeProvider>
    </I18nProviderClient>
  );
}
