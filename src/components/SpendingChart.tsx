'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { useAccountFilter } from '@/context/AccountFilterContext';
import { matchesFilters } from '@/lib/filters';
import { colorForCategory, OUTROS_COLOR } from '@/lib/categoryColor';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export function SpendingChart() {
  const { selectedMonth } = useMonth();
  const { selectedAccountId } = useAccountFilter();

  const entries = useLiveQuery(() =>
    db.entries.where('direction').equals('expense')
      .and(e => matchesFilters(e, { month: selectedMonth, accountId: selectedAccountId }))
      .toArray()
  , [selectedMonth, selectedAccountId]);

  if (!entries || entries.length === 0) return null;
  const MAX_SLICES = 6;

  const grouped = entries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] ?? 0) + entry.amountCents;
    return acc;
  }, {} as Record<string, number>);

  const sorted = Object.entries(grouped)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const top = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES);
  const outrosTotal = rest.reduce((sum, item) => sum + item.total, 0);

  const data = outrosTotal > 0 ? [...top, { category: 'Outros', total: outrosTotal }] : top;

   return (
  <div className="w-full">
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category" innerRadius={60} outerRadius={100}>
          {data.map((item) => (
            <Cell
              key={item.category}
              fill={item.category === 'Outros' ? OUTROS_COLOR : colorForCategory(item.category)}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `R$ ${((value as number) / 100).toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3">
      {data.map((item) => (
        <div key={item.category} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: item.category === 'Outros' ? OUTROS_COLOR : colorForCategory(item.category) }}
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.category}</span>
        </div>
      ))}
    </div>
  </div>
);
}