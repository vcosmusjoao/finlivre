'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { effectiveMonth } from '@/lib/format';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899'];

export function SpendingChart() {
  const { selectedMonth } = useMonth();

  const entries = useLiveQuery(() =>
    db.entries.where('direction').equals('expense')
      .and(e => !selectedMonth || effectiveMonth(e) === selectedMonth)
      .toArray()
  , [selectedMonth]);

  if (!entries || entries.length === 0) return null;
   const grouped = entries.reduce((acc,entry)=>{
    const category = entry.category;
    acc[category] = (acc[category]??0) + entry.amountCents;
    return acc;
   }, {} as Record<string,number>);
   const data = Object.entries(grouped).map(([category, total]) => ({ category, total }));

   return (
  <div className="w-full">
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category" innerRadius={60} outerRadius={100}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `R$ ${((value as number) / 100).toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3">
      {data.map((item, i) => (
        <div key={item.category} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{item.category}</span>
        </div>
      ))}
    </div>
  </div>
);
}