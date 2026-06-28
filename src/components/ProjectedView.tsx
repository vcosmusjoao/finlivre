'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatBRL } from '@/lib/format';
import { getProjectedMonth, type ProjectedItem } from '@/lib/projection';
import { useMonth } from '@/context/MonthContext';

export function ProjectedView() {
  const { selectedMonth } = useMonth();

  const projection = useLiveQuery(
    () => selectedMonth ? getProjectedMonth(selectedMonth) : Promise.resolve(null),
    [selectedMonth]
  );

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const accountMap = useMemo(
    () => new Map(accounts?.map(a => [a.id!, a]) ?? []),
    [accounts]
  );

  if (!projection) return <p className="text-sm text-zinc-500">Calculando projeção…</p>;

  const income  = projection.items.filter(i => i.direction === 'income');
  const expense = projection.items.filter(i => i.direction === 'expense');

  if (projection.items.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-400 text-sm">
        <p className="text-2xl mb-2">🎉</p>
        <p>Nenhum compromisso futuro detectado para este mês.</p>
        <p className="text-xs mt-1 text-zinc-300">Parcelas e recorrentes aparecerão aqui automaticamente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {income.length > 0 && (
        <Section
          title="Receitas previstas"
          items={income}
          accountMap={accountMap}
          amountColor="text-emerald-600"
          sign="+"
        />
      )}
      {expense.length > 0 && (
        <Section
          title="Despesas comprometidas"
          items={expense}
          accountMap={accountMap}
          amountColor="text-zinc-900 dark:text-zinc-100"
          sign="-"
        />
      )}
    </div>
  );
}

function Section({ title, items, accountMap, amountColor, sign }: {
  title: string;
  items: ProjectedItem[];
  accountMap: Map<number, { name: string; color: string }>;
  amountColor: string;
  sign: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">{title}</p>
      <div className="flex flex-col">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            {/* Account color dot */}
            {item.accountId !== undefined
              ? <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accountMap.get(item.accountId)?.color ?? '#6B7280' }} />
              : <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-300 dark:bg-zinc-600" />
            }

            <span className="text-sm text-zinc-800 dark:text-zinc-200 flex-1 truncate">{item.description}</span>

            {/* Installment badge */}
            {item.installment && (
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                {item.installment.current}/{item.installment.total}
              </span>
            )}

            {/* Recurring badge */}
            {item.type === 'recurring' && (
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                fixo
              </span>
            )}

            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
              {item.category}
            </span>

            <span className={`text-sm font-medium tabular-nums ${amountColor} whitespace-nowrap`}>
              {sign} {formatBRL(item.amountCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
