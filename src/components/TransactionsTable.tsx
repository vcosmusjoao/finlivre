'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { effectiveMonth } from '@/lib/format';

export function TransactionsTable() {
  const { selectedMonth } = useMonth();
  const entries = useLiveQuery(() =>
    db.entries.orderBy('date').reverse()
      .and(e => !selectedMonth || effectiveMonth(e) === selectedMonth)
      .toArray()
  , [selectedMonth]);

  if (!entries) return <p className="text-sm text-zinc-500">Carregando...</p>;
  if (entries.length === 0) return <p className="text-sm text-zinc-500">Nenhuma transação importada ainda.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Data</th>
            <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400">Descrição</th>
            <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400">Categoria</th>
            <th className="py-2 text-right font-medium text-zinc-500 dark:text-zinc-400">Valor</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="py-3 pr-4 text-zinc-500 whitespace-nowrap">{entry.date}</td>
              <td className="py-3 pr-4 text-zinc-900 dark:text-zinc-100">{entry.description}</td>
              <td className="py-3 pr-4">
                {entry.direction === 'transfer' ? (
                  <span className="inline-block rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 dark:text-zinc-500 italic">
                    pagamento fatura
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                    {entry.category}
                  </span>
                )}
              </td>
              <td className={`py-3 text-right font-medium tabular-nums ${
                entry.direction === 'income' ? 'text-emerald-600' :
                entry.direction === 'transfer' ? 'text-zinc-400 dark:text-zinc-500' :
                'text-zinc-900 dark:text-zinc-100'
              }`}>
                {entry.direction === 'income' ? '+' : entry.direction === 'transfer' ? '' : '-'} R$ {(entry.amountCents / 100).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
