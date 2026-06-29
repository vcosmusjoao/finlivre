'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatBRL } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';

export function SpendingByAccountChart() {
  const entries = useLiveQuery(
    () => db.entries.where('direction').equals('expense').toArray(),
    []
  );
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);

  if (!entries?.length || !accounts) return null;

  const accountMap = new Map(accounts.map(a => [a.id!, { name: a.name, color: a.color }]));

  const totals: Record<string, { name: string; color: string; total: number }> = {};
  for (const e of entries) {
    const key = e.accountId !== undefined ? String(e.accountId) : '__none__';
    if (!totals[key]) {
      const acc = e.accountId !== undefined ? accountMap.get(e.accountId) : undefined;
      totals[key] = { name: acc?.name ?? 'Sem conta', color: acc?.color ?? '#94a3b8', total: 0 };
    }
    totals[key].total += e.amountCents;
  }

  const data = Object.values(totals).sort((a, b) => b.total - a.total);
  if (!data.length) return null;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis
            type="number"
            tickFormatter={v => `R$${(v / 100).toFixed(0)}`}
            tick={{ fontSize: 11 }}
          />
          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatBRL(value as number)} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {data.map((item, i) => (
              <Cell key={i} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
