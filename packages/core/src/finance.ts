export type TxKind = "spend" | "income" | "transfer";

export interface Transaction {
  id: string;
  ts: number;
  amount: number;
  currency: string;
  kind: TxKind;
  category: string;
  merchant: string;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  createdAt: number;
  title: string;
  target: number;
  current: number;
  currency: string;
}

export interface SpendSummary {
  weekSpend: number;
  weekByCategory: { category: string; amount: number }[];
  topCategory: { category: string; amount: number } | null;
  txCount: number;
  currency: string;
}

const WEEK = 7 * 86_400_000;

function dominantCurrency(spends: Transaction[]): string {
  const counts = new Map<string, number>();
  for (const transaction of spends) {
    counts.set(transaction.currency, (counts.get(transaction.currency) ?? 0) + 1);
  }

  let best = "USDT";
  let bestCount = -1;
  for (const [currency, count] of counts) {
    if (count > bestCount) {
      best = currency;
      bestCount = count;
    }
  }
  return best;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function summarizeSpend(transactions: Transaction[], now: number = Date.now()): SpendSummary {
  const since = now - WEEK;
  const recentSpends = transactions.filter(
    (transaction) =>
      transaction.kind === "spend" && transaction.ts >= since && transaction.ts <= now,
  );
  const currency = dominantCurrency(recentSpends.length ? recentSpends : transactions);
  const inCurrency = recentSpends.filter((transaction) => transaction.currency === currency);

  const byCategory = new Map<string, number>();
  let total = 0;
  for (const transaction of inCurrency) {
    byCategory.set(
      transaction.category,
      (byCategory.get(transaction.category) ?? 0) + transaction.amount,
    );
    total += transaction.amount;
  }

  const weekByCategory = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .sort((left, right) => right.amount - left.amount);

  return {
    weekSpend: round2(total),
    weekByCategory,
    topCategory: weekByCategory[0] ?? null,
    txCount: inCurrency.length,
    currency,
  };
}

export function formatAmount(amount: number, currency: string): string {
  if (currency === "sats") return `${Math.round(amount).toLocaleString("en-US")} sats`;
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function sassySummary(summary: SpendSummary, locale: "es" | "en"): string {
  if (summary.txCount === 0) {
    return locale === "es"
      ? "Semana limpia: ni un gasto registrado. Sospechosamente disciplinado."
      : "Clean week: not a single spend logged. Suspiciously disciplined.";
  }

  const spend = formatAmount(summary.weekSpend, summary.currency);
  if (summary.topCategory) {
    const top = formatAmount(summary.topCategory.amount, summary.currency);
    return locale === "es"
      ? `Llevas ${spend} esta semana y "${summary.topCategory.category}" se come ${top}. Seguimos asi o intervenimos?`
      : `${spend} this week, and "${summary.topCategory.category}" is eating ${top} of it. Keep going or do we intervene?`;
  }

  return locale === "es"
    ? `Llevas ${spend} esta semana. Vigilado, operativo.`
    : `${spend} this week. I'm watching, operative.`;
}

export function financeContext(transactions: Transaction[], now: number = Date.now()): string {
  const summary = summarizeSpend(transactions, now);
  const lines: string[] = [];
  lines.push("FINANCE CONTEXT (local, last 7 days):");
  lines.push(`- currency: ${summary.currency}`);
  lines.push(
    `- total spend: ${formatAmount(summary.weekSpend, summary.currency)} across ${summary.txCount} tx`,
  );
  if (summary.topCategory) {
    lines.push(
      `- top category: ${summary.topCategory.category} (${formatAmount(
        summary.topCategory.amount,
        summary.currency,
      )})`,
    );
  }
  if (summary.weekByCategory.length) {
    lines.push(
      `- by category: ${summary.weekByCategory
        .map((category) => `${category.category} ${formatAmount(category.amount, summary.currency)}`)
        .join("; ")}`,
    );
  }

  const recent = [...transactions].sort((left, right) => right.ts - left.ts).slice(0, 5);
  if (recent.length) {
    lines.push("- recent:");
    for (const transaction of recent) {
      const sign = transaction.kind === "income" ? "+" : transaction.kind === "spend" ? "-" : "~";
      const date = new Date(transaction.ts).toISOString().slice(0, 10);
      const note = transaction.note ? ` (${transaction.note})` : "";
      lines.push(
        `  ${date} ${sign}${formatAmount(transaction.amount, transaction.currency)} ${transaction.category} @ ${transaction.merchant}${note}`,
      );
    }
  }

  return lines.join("\n");
}
