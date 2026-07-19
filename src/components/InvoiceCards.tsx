'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, type InvoiceStatement } from '@/lib/db';
import { formatBRL, monthLabel } from '@/lib/format';
import { useMonth } from '@/context/MonthContext';
import { useAccountFilter } from '@/context/AccountFilterContext';
import { matchesAccount } from '@/lib/filters';
import { useLocale } from '@/i18n/LocaleContext';

export function InvoiceCards() {
  const { selectedMonth } = useMonth();
  const { selectedAccountId } = useAccountFilter();
  const { locale, t } = useLocale();

  const statements = useLiveQuery(
    () => selectedMonth
      ? db.invoiceStatements.where('month').equals(selectedMonth).toArray()
      : Promise.resolve([] as InvoiceStatement[]),
    [selectedMonth]
  );

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);

  // Scope to the active account filter (statements are always tied to an account).
  const visible = statements?.filter(s => matchesAccount(s.accountId, selectedAccountId)) ?? [];

  if (!selectedMonth || visible.length === 0) return null;

  const accountMap = new Map(accounts?.map(a => [a.id!, a]) ?? []);

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {visible.map(stmt => {
        const account = accountMap.get(stmt.accountId);

        return (
          <div
            key={stmt.id}
            className="bg-card rounded-xl border border-border-subtle p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              {account?.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: account.color }}
                />
              )}
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {account?.name ?? t.invoiceCards.cardFallback} · {t.invoiceCards.invoiceFor(monthLabel(stmt.month, locale))}
              </span>
            </div>

            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatBRL(stmt.balanceCents)}
            </p>
            <p className="text-xs text-red-400 mt-0.5">{t.invoiceCards.due}</p>
          </div>
        );
      })}
    </div>
  );
}
