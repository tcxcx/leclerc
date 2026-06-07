import { createI18nServer } from "next-international/server";

export const { getI18n, getScopedI18n, getCurrentLocale, getStaticParams } =
  createI18nServer({
    es: () => import("../../messages/es.json"),
    en: () => import("../../messages/en.json"),
  });
