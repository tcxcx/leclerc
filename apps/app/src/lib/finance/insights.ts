/**
 * Local spend insights (docs/leclerc/13-cleo-plan.md §"Finance data"): pure
 * functions over the transaction list. No IO, no React. Computed on-device;
 * the LLM narrates them with attitude via financeContext + sassySummary.
 */

import type { Transaction } from "./store-client";

const WEEK = 7 * 86_400_000;

export interface SpendSummary {
  weekSpend: number;
  weekByCategory: { category: string; amount: number }[]; // desc
  topCategory: { category: string; amount: number } | null;
  txCount: number;
  currency: string; // dominant currency
}

/** Pick the most common currency among spend transactions (ties → first seen). */
function dominantCurrency(spends: Transaction[]): string {
  const counts = new Map<string, number>();
  for (const t of spends) counts.set(t.currency, (counts.get(t.currency) ?? 0) + 1);
  let best = "USDT";
  let bestN = -1;
  for (const [cur, n] of counts) {
    if (n > bestN) {
      best = cur;
      bestN = n;
    }
  }
  return best;
}

/** Round to 2 decimals, avoiding float noise (sats stay integer-ish anyway). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Summarise the last 7 days of spend. Only "spend" transactions in the
 * dominant currency count toward the totals (mixing USDT and sats would be
 * meaningless math); other-currency spend is excluded from the figures.
 */
export function summarize(txs: Transaction[], now: number = Date.now()): SpendSummary {
  const since = now - WEEK;
  const recentSpends = txs.filter(
    (t) => t.kind === "spend" && t.ts >= since && t.ts <= now,
  );
  const currency = dominantCurrency(recentSpends.length ? recentSpends : txs);

  const inCurrency = recentSpends.filter((t) => t.currency === currency);

  const byCat = new Map<string, number>();
  let total = 0;
  for (const t of inCurrency) {
    byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    total += t.amount;
  }

  const weekByCategory = [...byCat.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);

  return {
    weekSpend: round2(total),
    weekByCategory,
    topCategory: weekByCategory[0] ?? null,
    txCount: inCurrency.length,
    currency,
  };
}

/** Format an amount with its currency, sats as whole numbers. */
function fmt(amount: number, currency: string): string {
  if (currency === "sats") return `${Math.round(amount).toLocaleString("en-US")} sats`;
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/** A short, sassy one-liner the UI/LLM can show, localized. */
export function sassySummary(s: SpendSummary, locale: "es" | "en"): string {
  if (s.txCount === 0) {
    return locale === "es"
      ? "Semana limpia: ni un gasto registrado. Sospechosamente disciplinado."
      : "Clean week — not a single spend logged. Suspiciously disciplined.";
  }
  const spend = fmt(s.weekSpend, s.currency);
  if (s.topCategory) {
    const top = fmt(s.topCategory.amount, s.currency);
    return locale === "es"
      ? `Llevas ${spend} esta semana y "${s.topCategory.category}" se come ${top}. ¿Seguimos así o intervenimos?`
      : `${spend} this week, and "${s.topCategory.category}" is eating ${top} of it. Keep going or do we intervene?`;
  }
  return locale === "es"
    ? `Llevas ${spend} esta semana. Vigilado, operativo.`
    : `${spend} this week. I'm watching, operative.`;
}

/** Build a compact text block to feed the LLM as grounded finance context. */
export function financeContext(txs: Transaction[], now: number = Date.now()): string {
  const s = summarize(txs, now);
  const lines: string[] = [];
  lines.push("FINANCE CONTEXT (local, last 7 days):");
  lines.push(`- currency: ${s.currency}`);
  lines.push(`- total spend: ${fmt(s.weekSpend, s.currency)} across ${s.txCount} tx`);
  if (s.topCategory) {
    lines.push(`- top category: ${s.topCategory.category} (${fmt(s.topCategory.amount, s.currency)})`);
  }
  if (s.weekByCategory.length) {
    const cats = s.weekByCategory
      .map((c) => `${c.category} ${fmt(c.amount, s.currency)}`)
      .join("; ");
    lines.push(`- by category: ${cats}`);
  }

  // A few most-recent transactions for grounding (any currency).
  const recent = [...txs].sort((a, b) => b.ts - a.ts).slice(0, 5);
  if (recent.length) {
    lines.push("- recent:");
    for (const t of recent) {
      const sign = t.kind === "income" ? "+" : t.kind === "spend" ? "-" : "~";
      const date = new Date(t.ts).toISOString().slice(0, 10);
      const note = t.note ? ` (${t.note})` : "";
      lines.push(`  ${date} ${sign}${fmt(t.amount, t.currency)} ${t.category} @ ${t.merchant}${note}`);
    }
  }
  return lines.join("\n");
}
