'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, type InvoiceStatement } from '@/lib/db';
import { formatBRL, monthLabel } from '@/lib/format';
import { useMonth } from '@/context/MonthContext';

export function InvoiceCards() {
  const { selectedMonth } = useMonth();

  const statements = useLiveQuery(
    () => selectedMonth
      ? db.invoiceStatements.where('month').equals(selectedMonth).toArray()
      : Promise.resolve([] as InvoiceStatement[]),
    [selectedMonth]
  );

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);

  if (!selectedMonth || !statements?.length) return null;

  const accountMap = new Map(accounts?.map(a => [a.id!, a]) ?? []);

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {statements.map(stmt => {
        const account = accountMap.get(stmt.accountId);

        return (
          <div
            key={stmt.id}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              {account?.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: account.color }}
                />
              )}
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {account?.name ?? 'Cartão'} · fatura {monthLabel(stmt.month)}
              </span>
            </div>

            <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatBRL(stmt.balanceCents)}
            </p>
            <p className="text-xs text-red-400 mt-0.5">a pagar</p>
          </div>
        );
      })}
    </div>
  );
}
