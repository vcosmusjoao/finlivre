'use client';

import { useMonth } from '@/context/MonthContext';
import { currentMonth } from '@/lib/format';
import { SpendingChart } from '@/components/SpendingChart';
import { TransactionsTable } from '@/components/TransactionsTable';
import { IncomeExpenseChart } from '@/components/IncomeExpenseChart';
import { ProjectedView } from '@/components/ProjectedView';
import { AllTimeDashboard } from '@/components/AllTimeDashboard';

export function DashboardBody() {
  const { selectedMonth } = useMonth();
  const now = currentMonth();
  const isFuture = !!selectedMonth && selectedMonth > now;
  const isCurrentMonth = !!selectedMonth && selectedMonth === now;

  if (!selectedMonth) {
    return <AllTimeDashboard />;
  }

  if (isFuture) {
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Compromissos futuros</h2>
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-500 px-2 py-0.5 rounded-full">
                projeção
              </span>
            </div>
            <ProjectedView />
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <TransactionsTable />
          </div>
        </div>
        <IncomeExpenseChart />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 self-start">Gastos por categoria</h2>
          <SpendingChart />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <TransactionsTable />
        </div>
      </div>

      {isCurrentMonth && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">Previstos para este mês</h2>
          <ProjectedView hideWhenEmpty />
        </div>
      )}

      <IncomeExpenseChart />
    </>
  );
}
