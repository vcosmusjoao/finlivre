'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { monthLabel, formatBRL, effectiveMonth } from '@/lib/format';
import { useMonth } from '@/context/MonthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function IncomeExpenseChart() {
  const { selectedMonth } = useMonth();
  // The bar chart always shows the full picture across months.
  // When a month is selected it highlights that slice; otherwise shows all.
  const entries = useLiveQuery(() =>
    db.entries
      .filter(e => !selectedMonth || e.date.startsWith(selectedMonth))
      .toArray()
  , [selectedMonth], []);

  if (!entries.length) return null;

  // Group by month (yyyy-MM), accumulate income and expense separately.
  // Transfers (bill payments from credit card OFX) are excluded from this view.
  const byMonth: Record<string, { income: number; expense: number }> = {};
  for (const e of entries) {
    if (e.direction === 'transfer') continue;
    const month = effectiveMonth(e);
    if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0 };
    byMonth[month][e.direction] += e.amountCents;
  }

  const data = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totals]) => ({
      month: monthLabel(month),
      Receitas: totals.income,
      Gastos: totals.expense,
    }));

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mt-6">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Receitas vs Gastos</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4}>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={v => `R$${(v / 100).toFixed(0)}`} tick={{ fontSize: 11 }} width={60} />
          <Tooltip formatter={(value) => formatBRL(value as number)} />
          <Legend />
          <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
