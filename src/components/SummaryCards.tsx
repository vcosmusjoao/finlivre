'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatBRL, effectiveMonth } from '@/lib/format';
import { useMonth } from '@/context/MonthContext';

export function SummaryCards() {
  const { selectedMonth } = useMonth();

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

  const net = income - expense;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card label="Receitas" value={formatBRL(income)} color="text-emerald-600" />
      <Card label="Gastos" value={formatBRL(expense)} color="text-red-500" />
      <Card
        label="Saldo"
        value={formatBRL(Math.abs(net))}
        prefix={net >= 0 ? '+' : '-'}
        color={net >= 0 ? 'text-emerald-600' : 'text-red-500'}
      />
    </div>
  );
}

function Card({ label, value, color, prefix = '' }: {
  label: string;
  value: string;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{prefix}{value}</p>
    </div>
  );
}
