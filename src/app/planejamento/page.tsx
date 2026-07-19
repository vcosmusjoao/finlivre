'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { currentMonth, formatBRL } from '@/lib/format';
import { rollupBuckets, monthExpenseCents, monthIncomeCents } from '@/lib/buckets';
import { BucketSettings } from '@/components/BucketSettings';
import { BucketsView } from '@/components/BucketsView';
import { useLocale } from '@/i18n/LocaleContext';

export default function PlanejamentoPage() {
  const { selectedMonth } = useMonth();
  const { t } = useLocale();

  const buckets = useLiveQuery(() => db.buckets.orderBy('order').toArray(), []);

  // Planejamento is always a global view — account filter is intentionally ignored.
  const rollup = useLiveQuery(
    () => rollupBuckets({ month: selectedMonth }),
    [selectedMonth],
  );


const income = useLiveQuery(
  () => monthIncomeCents({ month: selectedMonth }),
  [selectedMonth],
  0,
);

const expense = useLiveQuery(
  () => monthExpenseCents({ month: selectedMonth }),
  [selectedMonth],
  0,
);

  const isFuture = !!selectedMonth && selectedMonth > currentMonth();

  // Still loading
  if (buckets === undefined || rollup === undefined) return null;

  // Empty state — no buckets configured yet
  if (buckets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border-subtle p-12 text-center">
        <p className="text-sm font-medium text-body">
          {t.planejamentoPage.noBucketsTitle}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {t.planejamentoPage.noBucketsHint}
        </p>
        <BucketSettings />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {t.nav.planning}
          </h1>
          {!selectedMonth && (
            <p className="text-xs text-zinc-400 mt-0.5">{t.planejamentoPage.aggregateOfAllMonths}</p>
          )}
        </div>
        <BucketSettings />
      </div>

      {/* Financial summary — gives context before the bucket visualization */}
      {selectedMonth && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: t.totals.income, value: formatBRL(income), color: 'text-emerald-600' },
            { label: t.totals.expenses, value: formatBRL(expense), color: 'text-red-500' },
            {
              label: t.totals.balance,
              value: (income - expense >= 0 ? '+' : '−') + formatBRL(Math.abs(income - expense)),
              color: income - expense >= 0 ? 'text-emerald-600' : 'text-red-500',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card rounded-xl border border-border-subtle p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
              <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {isFuture && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
          {t.planejamentoPage.futureMonthNotice}
        </div>
      )}

      <BucketsView
        rollup={rollup}
        incomeCents={income}
        expenseCents={expense}
      />    </>
  );
}
