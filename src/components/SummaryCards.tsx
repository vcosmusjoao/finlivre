'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatBRL, currentMonth } from '@/lib/format';
import { matchesFilters } from '@/lib/filters';
import { useMonth } from '@/context/MonthContext';
import { useAccountFilter } from '@/context/AccountFilterContext';
import { getProjectedMonth } from '@/lib/projection';
import { useLocale } from '@/i18n/LocaleContext';

export function SummaryCards() {
  const { selectedMonth } = useMonth();
  const { selectedAccountId } = useAccountFilter();
  const { t } = useLocale();
  const now = currentMonth();
  const isFuture = !!selectedMonth && selectedMonth > now;
  // Current month also gets projection so recurring items set from this month are visible.
  // Risk accepted: same double-count risk that already exists for future months.
  const hasProjection = !!selectedMonth && selectedMonth >= now;

  // Real entries — past/current months use these directly; current/future months add projection on top
  const income = useLiveQuery(() =>
    db.entries.where('direction').equals('income')
      .and(e => matchesFilters(e, { month: selectedMonth, accountId: selectedAccountId }))
      .toArray()
      .then(rows => rows.reduce((sum, e) => sum + e.amountCents, 0))
  , [selectedMonth, selectedAccountId], 0);

  const expense = useLiveQuery(() =>
    db.entries.where('direction').equals('expense')
      .and(e => matchesFilters(e, { month: selectedMonth, accountId: selectedAccountId }))
      .toArray()
      .then(rows => rows.reduce((sum, e) => sum + e.amountCents, 0))
  , [selectedMonth, selectedAccountId], 0);

  // Projected data — recurring + installment commitments for current and future months
  const projection = useLiveQuery(
    () => hasProjection && selectedMonth ? getProjectedMonth(selectedMonth, selectedAccountId) : Promise.resolve(null),
    [selectedMonth, hasProjection, selectedAccountId]
  );

  // Current/future months: real entries + projected items (recurring/installments)
  const displayIncome  = hasProjection ? income + (projection?.totalIncomeCents  ?? 0) : income;
  const displayExpense = hasProjection ? expense + (projection?.totalExpenseCents ?? 0) : expense;
  const net = displayIncome - displayExpense;

  if (!selectedMonth) return null;

  return (
    <div className="mb-6">
      {isFuture && (
        <p className="text-xs text-primary-muted text-center mb-2">
          {t.summaryCards.projectionNote}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label={t.totals.income} value={formatBRL(displayIncome)} color="text-emerald-600" />
        <Card label={t.totals.expenses} value={formatBRL(displayExpense)} color="text-red-500" />
        <Card
          label={t.totals.balance}
          value={formatBRL(Math.abs(net))}
          prefix={net >= 0 ? '+' : '-'}
          color={net >= 0 ? 'text-emerald-600' : 'text-red-500'}
        />
      </div>
    </div>
  );
}

function Card({ label, value, color, prefix = '' }: {
  label: string; value: string; color: string; prefix?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border-subtle p-5">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{prefix}{value}</p>
    </div>
  );
}
