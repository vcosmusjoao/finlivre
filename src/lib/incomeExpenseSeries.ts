import type { Entry } from './db';
import { effectiveMonth, monthLabel } from './format';

/**
 * Builds the "Receitas vs Gastos" bar-chart series.
 *
 * Extracted from IncomeExpenseChart so the mapping is unit-testable — the same
 * role `filters.ts` plays for the month/account rules. The component only wires
 * data sources to this function and renders the result.
 *
 * Two rules this encodes (and why the chart used to disagree with SummaryCards):
 *   1. Months are keyed by `effectiveMonth` (billingMonth priority), exactly like
 *      every other consumer via `matchesFilters`. Never by the raw purchase date.
 *   2. Projected recurring income / committed expenses can be folded in per month
 *      via `projectionByMonth`, so the current/future months match the summary
 *      cards (which already add projection on top of real entries).
 *
 * Transfers (e.g. credit-card bill payments) are excluded — they are not real
 * income or expense, only money moving between accounts.
 */

type SeriesEntry = Pick<Entry, 'direction' | 'date' | 'billingMonth' | 'amountCents'>;

/** Projected income/expense totals (in cents) to overlay onto a given month. */
export interface MonthProjection {
  income: number;
  expense: number;
}

export interface IncomeExpensePoint {
  monthKey: string; // 'yyyy-MM' — kept for sorting/domain logic, unused by the axis
  month: string;    // localized short label, e.g. "jul/26"
  Receitas: number; // income in cents
  Gastos: number;   // expense in cents
}

export function buildIncomeExpenseSeries(
  entries: SeriesEntry[],
  projectionByMonth: Record<string, MonthProjection> = {},
  locale: 'en' | 'pt' = 'pt',
): IncomeExpensePoint[] {
  const byMonth: Record<string, { income: number; expense: number }> = {};

  const bucket = (month: string) => (byMonth[month] ??= { income: 0, expense: 0 });

  for (const e of entries) {
    if (e.direction === 'transfer') continue;
    bucket(effectiveMonth(e))[e.direction] += e.amountCents;
  }

  // Overlay projected recurring income / committed expenses (current & future months).
  for (const [month, projection] of Object.entries(projectionByMonth)) {
    const b = bucket(month);
    b.income += projection.income;
    b.expense += projection.expense;
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, totals]) => ({
      monthKey,
      month: monthLabel(monthKey, locale),
      Receitas: totals.income,
      Gastos: totals.expense,
    }));
}
