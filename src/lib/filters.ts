import type { Entry } from './db';
import { effectiveMonth } from './format';

/**
 * The single source of truth for "does this entry pass the active filters?".
 *
 * Before this, every component (SummaryCards, SpendingChart, TransactionsTable,
 * InvoiceCards) hand-rolled its own `.and(e => effectiveMonth(e) === month)` clause.
 * Adding the account filter on top of that would mean duplicating two conditions in
 * 4+ places. Centralizing here keeps the filtering rules in one place — the same role
 * `effectiveMonth` already plays for month logic.
 */

/** Account filter value: a specific account id, all accounts, or only entries without an account. */
export type AccountFilter = number | 'all' | 'manual';

export interface EntryFilters {
  month?: string;          // 'yyyy-MM', or '' / undefined for all months
  accountId?: AccountFilter;
}

/** True when an entry matches both the month and the account filter. */
export function matchesFilters(
  entry: Pick<Entry, 'date' | 'billingMonth' | 'accountId'>,
  { month, accountId = 'all' }: EntryFilters,
): boolean {
  if (month && effectiveMonth(entry) !== month) return false;
  return matchesAccount(entry.accountId, accountId);
}

/** Account-only match. Shared with projected items, which aren't Entries but carry accountId. */
export function matchesAccount(entryAccountId: number | undefined, filter: AccountFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'manual') return entryAccountId === undefined;
  return entryAccountId === filter;
}
