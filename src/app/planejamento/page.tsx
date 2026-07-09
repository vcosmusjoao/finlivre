'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useMonth } from '@/context/MonthContext';
import { currentMonth, formatBRL } from '@/lib/format';
import { rollupBuckets, monthExpenseCents, monthIncomeCents } from '@/lib/buckets';
import { BucketSettings } from '@/components/BucketSettings';
import { BucketsView } from '@/components/BucketsView';

export default function PlanejamentoPage() {
  const { selectedMonth } = useMonth();

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
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nenhum balde configurado ainda
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 max-w-xs">
          Baldes organizam suas categorias em grupos como Necessidades, Desejos e Metas —
          a base do método 50/30/20.
        </p>
        <BucketSettings />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Planejamento
          </h1>
          {!selectedMonth && (
            <p className="text-xs text-zinc-400 mt-0.5">Agregado de todos os meses</p>
          )}
        </div>
        <BucketSettings />
      </div>

      {/* Financial summary — gives context before the bucket visualization */}
      {selectedMonth && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Receita', value: formatBRL(income), color: 'text-emerald-600' },
            { label: 'Gastos',  value: formatBRL(expense), color: 'text-red-500' },
            {
              label: 'Saldo',
              value: (income - expense >= 0 ? '+' : '−') + formatBRL(Math.abs(income - expense)),
              color: income - expense >= 0 ? 'text-emerald-600' : 'text-red-500',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
              <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {isFuture && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
          Mês futuro — metas calculadas com base na renda projetada. Gastos reais ainda
          não existem para este mês.
        </div>
      )}

      <BucketsView
        rollup={rollup}
        incomeCents={income}
        expenseCents={expense}
      />    </>
  );
}
