import type { Locale } from "./intel";

export interface FinanceRoastCopy {
  cleanWeek: string;
  topCategory: string;
  watched: string;
}

export interface FinanceContextCopy {
  heading: string;
  currencyLine: string;
  totalSpendLine: string;
  topCategoryLine: string;
  byCategoryLine: string;
  recentLabel: string;
  transactionLine: string;
  note: string;
}

export interface FinanceStory {
  id: string;
  roast: Record<Locale, FinanceRoastCopy>;
  context: Record<Locale, FinanceContextCopy>;
  chatSystemHeader: Record<Locale, string>;
}

export const DEFAULT_FINANCE_STORY: FinanceStory = {
  id: "cleo-local-finance",
  roast: {
    es: {
      cleanWeek: "Semana limpia: ni un gasto registrado. Sospechosamente disciplinado.",
      topCategory:
        'Llevas {spend} esta semana y "{category}" se come {top}. Seguimos asi o intervenimos?',
      watched: "Llevas {spend} esta semana. Vigilado, operativo.",
    },
    en: {
      cleanWeek: "Clean week: not a single spend logged. Suspiciously disciplined.",
      topCategory: '{spend} this week, and "{category}" is eating {top} of it. Keep going or do we intervene?',
      watched: "{spend} this week. I'm watching, operative.",
    },
  },
  context: {
    es: {
      heading: "CONTEXTO FINANCIERO (local, ultimos 7 dias):",
      currencyLine: "- moneda: {currency}",
      totalSpendLine: "- gasto total: {spend} en {txCount} tx",
      topCategoryLine: "- categoria principal: {category} ({amount})",
      byCategoryLine: "- por categoria: {categories}",
      recentLabel: "- recientes:",
      transactionLine: "  {date} {sign}{amount} {category} @ {merchant}{note}",
      note: " ({note})",
    },
    en: {
      heading: "FINANCE CONTEXT (local, last 7 days):",
      currencyLine: "- currency: {currency}",
      totalSpendLine: "- total spend: {spend} across {txCount} tx",
      topCategoryLine: "- top category: {category} ({amount})",
      byCategoryLine: "- by category: {categories}",
      recentLabel: "- recent:",
      transactionLine: "  {date} {sign}{amount} {category} @ {merchant}{note}",
      note: " ({note})",
    },
  },
  chatSystemHeader: {
    es: "Contexto financiero local",
    en: "Local finance context",
  },
};

export function financeRoastCopy(
  locale: Locale,
  story: FinanceStory = DEFAULT_FINANCE_STORY,
): FinanceRoastCopy {
  return story.roast[locale];
}

export function financeContextCopy(
  locale: Locale,
  story: FinanceStory = DEFAULT_FINANCE_STORY,
): FinanceContextCopy {
  return story.context[locale];
}

export function financeChatSystemContent(
  locale: Locale,
  context: string,
  story: FinanceStory = DEFAULT_FINANCE_STORY,
): string {
  return `${story.chatSystemHeader[locale]}:\n${context}`;
}

export function renderFinanceTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
