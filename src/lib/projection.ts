import { db } from './db';
import { addMonths, monthDiff } from './format';

/** Removes embedded installment text from OFX descriptions so the badge is the single source of truth. */
export function stripInstallmentText(description: string): string {
  return description
    .replace(/\s*[-–]?\s*Parcela\s+\d+\/\d+/gi, '') // "Parcela 8/12", "- Parcela 8/12"
    .replace(/\s*[-–]\s*\d+\/\d+\s*$/i, '')          // "- 1/3" at end
    .replace(/\s+\d+\/\d+\s*$/, '')                   // " 1/3" at end
    .trim();
}

export interface ProjectedItem {
  description: string;
  amountCents: number;
  direction: 'income' | 'expense';
  type: 'recurring' | 'installment';
  category: string;
  accountId?: number;
  installment?: { current: number; total: number };
}

export interface ProjectedMonth {
  month: string;
  items: ProjectedItem[];
  totalIncomeCents: number;
  totalExpenseCents: number;
}

/**
 * Computes what a future month will look like based on:
 *   1. RecurringItems (salary, rent, subscriptions)
 *   2. Installments from real entries that extend into targetMonth
 *
 * Never materializes data into the DB — always derived on-the-fly.
 * Safe to call inside useLiveQuery so it reacts to DB changes automatically.
 */
export async function getProjectedMonth(targetMonth: string): Promise<ProjectedMonth> {
  const items: ProjectedItem[] = [];

  // ── 1. Recurring income and fixed expenses ──────────────────────────────
  const recurring = await db.recurringItems.toArray();
  for (const r of recurring) {
    if (targetMonth < r.activeFrom) continue;
    if (r.activeTo && targetMonth > r.activeTo) continue;
    items.push({
      description: r.description,
      amountCents: r.amountCents,
      direction: r.direction,
      type: 'recurring',
      category: r.category,
    });
  }

  // ── 2. Installment commitments from real entries ────────────────────────
  const installmentEntries = await db.entries
    .filter(e => e.installment !== undefined && e.direction === 'expense')
    .toArray();

  for (const entry of installmentEntries) {
    const { current, total } = entry.installment!;
    const entryMonth = entry.billingMonth ?? entry.date.slice(0, 7);

    // Month of the very first installment of this purchase
    const firstMonth = addMonths(entryMonth, -(current - 1));
    // How many months from firstMonth to targetMonth?
    const diff = monthDiff(firstMonth, targetMonth);

    if (diff < 0 || diff >= total) continue; // targetMonth is outside this purchase's range
    if (targetMonth === entryMonth) continue;  // this is the entry's own month — already in DB

    items.push({
      description: stripInstallmentText(entry.description),
      amountCents: entry.amountCents,
      direction: 'expense',
      type: 'installment',
      category: entry.category,
      accountId: entry.accountId,
      installment: { current: diff + 1, total },
    });
  }

  const totalIncomeCents = items
    .filter(i => i.direction === 'income')
    .reduce((sum, i) => sum + i.amountCents, 0);

  const totalExpenseCents = items
    .filter(i => i.direction === 'expense')
    .reduce((sum, i) => sum + i.amountCents, 0);

  return { month: targetMonth, items, totalIncomeCents, totalExpenseCents };
}
