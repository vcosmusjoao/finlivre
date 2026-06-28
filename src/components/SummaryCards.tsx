'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatBRL, effectiveMonth, currentMonth } from '@/lib/format';
import { useMonth } from '@/context/MonthContext';
import { getProjectedMonth } from '@/lib/projection';

export function SummaryCards() {
  const { selectedMonth } = useMonth();
  const isFuture = !!selectedMonth && selectedMonth > currentMonth();

  // Real entries — past/current months use these directly; future months add them on top of projection
  const income = useLiveQuery(() =>
    db.entries.where('direction').equals('income')
      .and(e => !selectedMonth || effectiveMonth(e) === selectedMonth)
      .toArray()
      .then(rows => rows.reduce((sum, e) => sum + e.amountCents, 0))
  , [selectedMonth], 0);

  const expense = useLiveQuery(() =>
    db.entries.where('direction').equals('expense')
      .and(e => !selectedMonth || effectiveMonth(e) === selectedMonth)
      .toArray()
      .then(rows => rows.reduce((sum, e) => sum + e.amountCents, 0))
  , [selectedMonth], 0);

  // Projected data — recurring + installment commitments for future months
  const projection = useLiveQuery(
    () => isFuture && selectedMonth ? getProjectedMonth(selectedMonth) : Promise.resolve(null),
    [selectedMonth, isFuture]
  );

  // For future months: real entries (manual) + projected items (recurring/installments)
  const displayIncome  = isFuture ? income + (projection?.totalIncomeCents  ?? 0) : income;
  const displayExpense = isFuture ? expense + (projection?.totalExpenseCents ?? 0) : expense;
  const net = displayIncome - displayExpense;

  return (
    <div className="mb-6">
      {isFuture && (
        <p className="text-xs text-indigo-400 dark:text-indigo-500 text-center mb-2">
          Projeção — parcelas comprometidas + receitas/despesas recorrentes
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Receitas" value={formatBRL(displayIncome)} color="text-emerald-600" />
        <Card label="Gastos"   value={formatBRL(displayExpense)} color="text-red-500" />
        <Card
          label="Saldo"
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
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{prefix}{value}</p>
    </div>
  );
}
