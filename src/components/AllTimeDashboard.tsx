'use client';

import { SpendingChart } from '@/components/SpendingChart';
import { SpendingByAccountChart } from '@/components/SpendingByAccountChart';
import { IncomeExpenseChart } from '@/components/IncomeExpenseChart';
import { TransactionsTable } from '@/components/TransactionsTable';

export function AllTimeDashboard() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 self-start">
            Gastos por categoria
          </h2>
          <SpendingChart />
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
            Gastos por conta
          </h2>
          <SpendingByAccountChart />
        </div>
      </div>

      <IncomeExpenseChart />

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mt-6">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
          Todas as transações
        </h2>
        <TransactionsTable />
      </div>
    </>
  );
}
